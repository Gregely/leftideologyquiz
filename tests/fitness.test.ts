/**
 * Family default fitness.
 *
 * The real bank declares no family defaults — that is the correct skeleton
 * state — so every case here builds its own: a family whose defaults describe
 * it, and a family whose defaults do not.
 */

import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { parseContent, type LoadResult } from '../src/content/load.js';
import {
  fitnessReport,
  DEFAULT_OVERRIDE_WARN,
  MEMBER_OVERRIDE_WARN,
} from '../src/content/coverage.js';
import { rosterDocs, type RosterDocs } from './fixtures/roster.js';

function load(mutate?: (docs: RosterDocs) => void): LoadResult {
  const docs = rosterDocs();
  mutate?.(docs);
  return parseContent({
    groups: stringify(docs.groups),
    families: stringify(docs.families),
    ideologies: stringify(docs.ideologies),
    questions: stringify(docs.questions),
  });
}

const familyRecord = (docs: RosterDocs, id: string): Record<string, unknown> => {
  const found = docs.families.families.find((f) => f.id === id);
  if (!found) throw new Error(`no family ${id}`);
  return found as unknown as Record<string, unknown>;
};

const ideologyRecord = (docs: RosterDocs, id: string): Record<string, unknown> => {
  const found = docs.ideologies.ideologies.find((i) => i.id === id);
  if (!found) throw new Error(`no ideology ${id}`);
  return found as unknown as Record<string, unknown>;
};

/**
 * The fixture ships a `q_family` default on both families, so the empty case
 * has to be built rather than assumed.
 */
function withoutDefaults(mutate?: (docs: RosterDocs) => void): LoadResult {
  return load((d) => {
    familyRecord(d, 'red')['stances'] = {};
    familyRecord(d, 'blue')['stances'] = {};
    mutate?.(d);
  });
}

/** The red family with three defaults, two of which its members mostly keep. */
function withDefaults(mutate?: (docs: RosterDocs) => void): LoadResult {
  return load((d) => {
    familyRecord(d, 'red')['stances'] = {
      q_family: {
        accept: ['pick_red'],
        reject: ['pick_blue'],
        weight: 3,
        note: 'Defining for the family: reverse it and its members are in the other family.',
      },
      q_red_shared: { accept: ['shared_yes'], weight: 2 },
      q_red_split: { accept: ['red_a'], weight: 2 },
    };
    mutate?.(d);
  });
}

const redFitness = (loaded: LoadResult) =>
  fitnessReport(loaded).families.find((f) => f.familyId === 'red');

describe('thresholds', () => {
  it('matches the 75% rule: a quarter overriding is roughly where a default stops fitting', () => {
    expect(DEFAULT_OVERRIDE_WARN).toBeGreaterThanOrEqual(0.25);
    expect(DEFAULT_OVERRIDE_WARN).toBeLessThan(0.5);
    expect(MEMBER_OVERRIDE_WARN).toBeGreaterThan(DEFAULT_OVERRIDE_WARN);
  });
});

describe('with no defaults authored', () => {
  it('reports nothing at all', () => {
    const report = fitnessReport(withoutDefaults());
    expect(report.families).toEqual([]);
    expect(report.flaggedDefaults).toBe(0);
    expect(report.flaggedMembers).toBe(0);
  });

  it('lists every family as having no defaults', () => {
    const report = fitnessReport(withoutDefaults());
    expect([...report.familiesWithoutDefaults].sort()).toEqual(['blue', 'red']);
  });

  it('is silent on the real bank, which is a stanceless skeleton', () => {
    // The state this tool has to be quiet in: 93 ideologies, no stances.
    const report = fitnessReport(withoutDefaults());
    expect(report.families).toHaveLength(0);
  });

  it('ignores a weight-0 default, which states no position', () => {
    const report = fitnessReport(
      withoutDefaults((d) => {
        familyRecord(d, 'red')['stances'] = { q_family: { accept: [], weight: 0 } };
      }),
    );
    expect(report.families.find((f) => f.familyId === 'red')).toBeUndefined();
    expect(report.familiesWithoutDefaults).toContain('red');
  });

  it('returns an empty report rather than throwing on unloadable content', () => {
    const broken = parseContent({ groups: '', families: 'not: valid', ideologies: '', questions: '' });
    expect(fitnessReport(broken).families).toEqual([]);
    expect(fitnessReport(broken).familiesWithoutDefaults).toEqual([]);
  });
});

describe('which members count as overriding a default', () => {
  it('counts a member whose stance differs', () => {
    // red_right accepts red_b where the default accepts red_a.
    const split = redFitness(withDefaults())?.defaults.find((d) => d.questionId === 'q_red_split');
    expect(split?.overriddenBy).toContain('red_right');
  });

  it('does not count a member that simply inherits it', () => {
    const shared = redFitness(withDefaults())?.defaults.find(
      (d) => d.questionId === 'q_red_shared',
    );
    expect(shared?.overriddenBy).not.toContain('red_trunk');
  });

  it('does not count a member that restates it verbatim', () => {
    // Redundant, but not a disagreement — what matters is the position held.
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: { accept: ['shared_yes'], weight: 2 },
      };
    });
    const shared = redFitness(loaded)?.defaults.find((d) => d.questionId === 'q_red_shared');
    expect(shared?.overriddenBy).not.toContain('red_trunk');
  });

  it('treats a different weight on the same position as weight-only, not an override', () => {
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: { accept: ['shared_yes'], weight: 1 },
      };
    });
    const shared = redFitness(loaded)?.defaults.find((d) => d.questionId === 'q_red_shared');
    expect(shared?.overriddenBy).not.toContain('red_trunk');
    expect(shared?.weightOnlyBy).toContain('red_trunk');
  });

  it('treats a shibboleth — the family position restated at weight 3 — as agreement', () => {
    // The case the distinction exists for. A defining ideology restating a
    // family position at weight 3 is saying the position is load-bearing for
    // it, which means the default describes it *well*, not badly.
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: {
          accept: ['shared_yes'],
          weight: 3,
          note: 'Defining for this sect: the family position, held as its shibboleth.',
        },
      };
    });
    const shared = redFitness(loaded)?.defaults.find((d) => d.questionId === 'q_red_shared');
    expect(shared?.weightOnlyBy).toEqual(['red_trunk']);
    expect(shared?.overriddenBy).toEqual([]);
    expect(shared?.overrideShare).toBe(0);
    expect(shared?.warn).toBe(false);
  });

  it('counts a different accept set as a real position override', () => {
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: { accept: ['shared_no'], weight: 2 },
      };
    });
    const shared = redFitness(loaded)?.defaults.find((d) => d.questionId === 'q_red_shared');
    expect(shared?.overriddenBy).toContain('red_trunk');
    expect(shared?.weightOnlyBy).not.toContain('red_trunk');
  });

  it('counts a different reject set as a real position override, even at the same accept', () => {
    // Rejecting an option the family is silent on is a position the default
    // does not state.
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: { accept: ['shared_yes'], reject: ['shared_no'], weight: 2 },
      };
    });
    const shared = redFitness(loaded)?.defaults.find((d) => d.questionId === 'q_red_shared');
    expect(shared?.overriddenBy).toContain('red_trunk');
  });

  it('counts a position change that also changes weight as a position override only', () => {
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: {
          accept: ['shared_no'],
          weight: 3,
          note: 'Defining: the opposite of the family position on this question.',
        },
      };
    });
    const shared = redFitness(loaded)?.defaults.find((d) => d.questionId === 'q_red_shared');
    expect(shared?.overriddenBy).toContain('red_trunk');
    expect(shared?.weightOnlyBy).not.toContain('red_trunk');
  });

  it('counts a member that clears it outright, and says so separately', () => {
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = { q_red_shared: null };
    });
    const shared = redFitness(loaded)?.defaults.find((d) => d.questionId === 'q_red_shared');
    expect(shared?.clearedBy).toContain('red_trunk');
    expect(shared?.overriddenBy).toContain('red_trunk');
  });
});

describe('warning on a default that stops fitting', () => {
  it('warns above the override threshold', () => {
    // red has 3 members. The default accepts red_a at weight 2 with no reject.
    // red_right accepts red_b, and red_left accepts red_a but at weight 3 and
    // rejecting red_b — a different position, so both count. red_trunk alone
    // inherits it: 2 of 3.
    const split = redFitness(withDefaults())?.defaults.find((d) => d.questionId === 'q_red_split');
    expect(split?.overriddenBy.sort()).toEqual(['red_left', 'red_right']);
    expect(split?.overrideShare).toBeCloseTo(2 / 3, 10);
    expect(split?.warn).toBe(true);
  });

  it('stays quiet on a default the family keeps', () => {
    const family = redFitness(withDefaults())?.defaults.find((d) => d.questionId === 'q_family');
    expect(family?.overrideShare).toBe(0);
    expect(family?.warn).toBe(false);
  });

  it('counts the flagged defaults across all families', () => {
    expect(fitnessReport(withDefaults()).flaggedDefaults).toBeGreaterThan(0);
  });

  it('reports a default every member disagrees with as fully overridden', () => {
    const loaded = withDefaults((d) => {
      familyRecord(d, 'red')['stances'] = {
        q_red_split: { accept: ['red_c'], weight: 2 },
      };
      // red_trunk would otherwise inherit it silently.
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_split: { accept: ['red_a'], weight: 1 },
      };
    });
    const split = redFitness(loaded)?.defaults.find((d) => d.questionId === 'q_red_split');
    expect(split?.overrideShare).toBe(1);
    expect(split?.warn).toBe(true);
  });
});

describe('candidate misfiling', () => {
  it('flags a member defined mostly by its exceptions', () => {
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: { accept: ['shared_no'], weight: 2 },
        q_red_split: { accept: ['red_c'], weight: 2 },
      };
    });
    const trunk = redFitness(loaded)?.members.find((m) => m.ideologyId === 'red_trunk');
    expect(trunk?.overrides).toBe(2);
    expect(trunk?.ofDefaults).toBe(3);
    expect(trunk?.overrideShare).toBeCloseTo(2 / 3, 10);
    expect(trunk?.candidateMisfiling).toBe(true);
    expect(fitnessReport(loaded).flaggedMembers).toBeGreaterThan(0);
  });

  it('does not flag a member that mostly agrees', () => {
    const left = redFitness(withDefaults())?.members.find((m) => m.ideologyId === 'red_left');
    expect(left?.overrideShare).toBeLessThanOrEqual(MEMBER_OVERRIDE_WARN);
    expect(left?.candidateMisfiling).toBe(false);
  });

  it('does not flag a member whose differences are all weight-only', () => {
    // red_trunk restates two of the three defaults at weight 3. Counting that
    // as overriding would make it a 67% "misfiling" for agreeing emphatically.
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: {
          accept: ['shared_yes'],
          weight: 3,
          note: 'Defining: the family position, held as a shibboleth.',
        },
        q_red_split: {
          accept: ['red_a'],
          weight: 3,
          note: 'Defining: the family position, held as a shibboleth.',
        },
      };
    });
    const trunk = redFitness(loaded)?.members.find((m) => m.ideologyId === 'red_trunk');
    expect(trunk?.weightOnly).toBe(2);
    expect(trunk?.overrides).toBe(0);
    expect(trunk?.overrideShare).toBe(0);
    expect(trunk?.candidateMisfiling).toBe(false);
  });

  it('counts only position overrides toward misfiling when a member has both', () => {
    const loaded = withDefaults((d) => {
      ideologyRecord(d, 'red_trunk')['stances'] = {
        q_red_shared: {
          accept: ['shared_yes'],
          weight: 3,
          note: 'Defining: the family position, held as a shibboleth.',
        },
        q_red_split: { accept: ['red_c'], weight: 2 },
      };
    });
    const trunk = redFitness(loaded)?.members.find((m) => m.ideologyId === 'red_trunk');
    expect(trunk?.overrides).toBe(1);
    expect(trunk?.weightOnly).toBe(1);
    expect(trunk?.overrideShare).toBeCloseTo(1 / 3, 10);
    // 33% is under the 40% line: the weight-only difference would have pushed
    // it to 67% under the old rule.
    expect(trunk?.candidateMisfiling).toBe(false);
  });

  it('carries the member name for the report', () => {
    const trunk = redFitness(withDefaults())?.members.find((m) => m.ideologyId === 'red_trunk');
    expect(trunk?.name).toBe('Red trunk');
  });
});

describe('report shape', () => {
  it('sorts defaults and members worst-fitting first', () => {
    for (const family of fitnessReport(withDefaults()).families) {
      const defaults = family.defaults.map((d) => d.overrideShare);
      const members = family.members.map((m) => m.overrideShare);
      expect([...defaults].sort((a, b) => b - a)).toEqual(defaults);
      expect([...members].sort((a, b) => b - a)).toEqual(members);
    }
  });

  it('never reports a share outside 0..1', () => {
    for (const family of fitnessReport(withDefaults()).families) {
      for (const d of family.defaults) {
        expect(d.overrideShare).toBeGreaterThanOrEqual(0);
        expect(d.overrideShare).toBeLessThanOrEqual(1);
      }
      for (const m of family.members) {
        expect(m.overrideShare).toBeGreaterThanOrEqual(0);
        expect(m.overrideShare).toBeLessThanOrEqual(1);
      }
    }
  });

  it('covers every member of a family that has defaults', () => {
    const red = redFitness(withDefaults());
    expect(red?.memberCount).toBe(3);
    expect(red?.members).toHaveLength(3);
    expect(red?.defaultCount).toBe(3);
  });

  it('leaves a family with no defaults out of the fitted list', () => {
    const report = fitnessReport(
      withDefaults((d) => {
        familyRecord(d, 'blue')['stances'] = {};
      }),
    );
    expect(report.families.map((f) => f.familyId)).toEqual(['red']);
    expect(report.familiesWithoutDefaults).toContain('blue');
  });
});
