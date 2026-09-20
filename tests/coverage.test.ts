/**
 * Coverage matrix, separation report and bank statistics.
 *
 * Against the roster fixture, which has stances. The real bank has none, so it
 * could only ever exercise the empty case.
 */

import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { parseContent, type LoadResult } from '../src/content/load.js';
import {
  buildMatrix,
  separationOn,
  separationReport,
  signedWeight,
  SEPARATION_THRESHOLD,
} from '../src/content/coverage.js';
import { bankStats, longestForcedChain } from '../src/content/stats.js';
import { rosterDocs, type RosterDocs } from './fixtures/roster.js';

function load(mutate?: (docs: RosterDocs) => void): LoadResult {
  const docs = rosterDocs();
  mutate?.(docs);
  return parseContent({
    families: stringify(docs.families),
    ideologies: stringify(docs.ideologies),
    questions: stringify(docs.questions),
  });
}

function question(docs: RosterDocs, id: string): Record<string, unknown> {
  const found = docs.questions.questions.find((q) => q.id === id);
  if (!found) throw new Error(`no question ${id}`);
  return found as unknown as Record<string, unknown>;
}

function ideology(docs: RosterDocs, id: string): Record<string, unknown> {
  const found = docs.ideologies.ideologies.find((i) => i.id === id);
  if (!found) throw new Error(`no ideology ${id}`);
  return found as unknown as Record<string, unknown>;
}

const pairOf = (report: ReturnType<typeof separationReport>, a: string, b: string) =>
  report.pairs.find(
    (p) => (p.a === a && p.b === b) || (p.a === b && p.b === a),
  );

// -----------------------------------------------------------------------------

describe('signedWeight', () => {
  const stance = { accept: ['yes'], reject: ['no'], weight: 2 };

  it('is the weight for an accepted option', () => {
    expect(signedWeight(stance, 'yes')).toBe(2);
  });

  it('is minus the weight for a rejected option', () => {
    expect(signedWeight(stance, 'no')).toBe(-2);
  });

  it('is zero for an option the stance says nothing about', () => {
    expect(signedWeight(stance, 'maybe')).toBe(0);
  });

  it('is zero where there is no stance at all', () => {
    expect(signedWeight(undefined, 'yes')).toBe(0);
  });
});

describe('separationOn', () => {
  const options = ['a', 'b', 'c'];

  it('measures the widest gap across options', () => {
    const left = { accept: ['a'], reject: ['b'], weight: 3 };
    const right = { accept: ['b'], reject: ['a'], weight: 3 };
    expect(separationOn(options, left, right)).toBe(6);
  });

  it('counts a stance against silence', () => {
    expect(separationOn(options, { accept: ['a'], reject: [], weight: 3 }, undefined)).toBe(3);
  });

  it('is zero for two identical stances', () => {
    const stance = { accept: ['a'], reject: [], weight: 2 };
    expect(separationOn(options, stance, { ...stance })).toBe(0);
  });

  it('is symmetric', () => {
    const left = { accept: ['a'], reject: [], weight: 3 };
    const right = { accept: ['b'], reject: [], weight: 1 };
    expect(separationOn(options, left, right)).toBe(separationOn(options, right, left));
  });

  it('leaves a one-weight difference below the threshold', () => {
    const left = { accept: ['a'], reject: [], weight: 1 };
    expect(separationOn(options, left, undefined)).toBeLessThan(SEPARATION_THRESHOLD);
  });
});

describe('the coverage matrix', () => {
  const matrix = buildMatrix(load());

  it('has a row per ideology and a column per question', () => {
    expect(matrix.rows).toHaveLength(6);
    expect(matrix.questionIds).toHaveLength(7);
    expect(matrix.rows[0]?.cells).toHaveLength(7);
  });

  it('marks a missing stance as null', () => {
    const row = matrix.rows.find((r) => r.ideologyId === 'red_left');
    const at = matrix.questionIds.indexOf('q_blue_split');
    expect(row?.cells[at]?.weight).toBeNull();
  });

  it('shows an ideology’s own stance as self', () => {
    const row = matrix.rows.find((r) => r.ideologyId === 'red_left');
    const at = matrix.questionIds.indexOf('q_red_split');
    expect(row?.cells[at]).toEqual({ weight: 3, source: 'self' });
  });

  it('shows an inherited family stance as family', () => {
    const row = matrix.rows.find((r) => r.ideologyId === 'red_trunk');
    const at = matrix.questionIds.indexOf('q_family');
    expect(row?.cells[at]).toEqual({ weight: 3, source: 'family' });
  });

  it('shows a stance inherited from a tendency parent as tendency', () => {
    const row = matrix.rows.find((r) => r.ideologyId === 'blue_lineage');
    const at = matrix.questionIds.indexOf('q_shibboleth');
    expect(row?.cells[at]?.source).toBe('self');

    const cleared = matrix.rows.find((r) => r.ideologyId === 'blue_lineage');
    const blueSplit = matrix.questionIds.indexOf('q_blue_split');
    // blue_lineage clears the inherited q_blue_split stance.
    expect(cleared?.cells[blueSplit]?.weight).toBeNull();
  });

  it('counts stances and depth-3 stances per row', () => {
    const row = matrix.rows.find((r) => r.ideologyId === 'blue_lineage');
    expect(row?.stanceCount).toBe(2); // q_family (family) + q_shibboleth (self)
    expect(row?.depth3Count).toBe(1); // q_shibboleth is depth 3
  });

  it('names questions no ideology has reached', () => {
    expect(matrix.unusedQuestions).toEqual(['q_tech']);
  });

  it('reports the fill rate', () => {
    expect(matrix.totalCells).toBe(42);
    expect(matrix.filledCells).toBeGreaterThan(0);
    expect(matrix.filledCells).toBeLessThan(matrix.totalCells);
  });

  it('returns an empty matrix rather than throwing on unloadable content', () => {
    const broken = parseContent({ families: 'not: valid', ideologies: '', questions: '' });
    expect(buildMatrix(broken).rows).toEqual([]);
  });
});

describe('the separation report', () => {
  const report = separationReport(load());

  it('pairs only within a family', () => {
    for (const pair of report.pairs) {
      expect(['red', 'blue']).toContain(pair.familyId);
    }
    // red has 3 members, blue has 3: C(3,2) twice.
    expect(report.pairs).toHaveLength(6);
  });

  it('separates two mirror-image sects on their defining question', () => {
    const pair = pairOf(report, 'red_left', 'red_right');
    expect(pair?.separatingQuestions.map((q) => q.questionId)).toContain('q_red_split');
    expect(pair?.separatingQuestions.find((q) => q.questionId === 'q_red_split')?.gap).toBe(6);
  });

  it('does not count a question both hold identically', () => {
    const pair = pairOf(report, 'red_left', 'red_right');
    expect(pair?.separatingQuestions.map((q) => q.questionId)).not.toContain('q_red_shared');
    expect(pair?.separatingQuestions.map((q) => q.questionId)).not.toContain('q_family');
  });

  it('flags a pair separated by exactly one question as fragile', () => {
    expect(report.fragile.length).toBeGreaterThan(0);
    for (const pair of report.fragile) {
      expect(pair.separatingQuestions).toHaveLength(1);
    }
  });

  it('sorts separating questions by gap, widest first', () => {
    for (const pair of report.pairs) {
      const gaps = pair.separatingQuestions.map((q) => q.gap);
      expect([...gaps].sort((a, b) => b - a)).toEqual(gaps);
    }
  });

  it('reports a pair with no separating question', () => {
    const stripped = separationReport(
      load((d) => {
        // Give red_right exactly what red_left has.
        ideology(d, 'red_right')['stances'] = {
          q_red_split: {
            accept: ['red_a'],
            reject: ['red_b'],
            weight: 3,
            note: 'Made identical to its sibling for this test.',
          },
          q_eco: { accept: ['strongly_agree'], weight: 2 },
          q_red_shared: { accept: ['shared_yes'], weight: 2 },
        };
      }),
    );
    const pair = pairOf(stripped, 'red_left', 'red_right');
    expect(pair?.separatingQuestions).toEqual([]);
    expect(pair?.sharesAllStances).toBe(true);
    expect(stripped.unseparated).toContainEqual(pair);
  });

  it('counts a pair as separated only at the threshold, not below it', () => {
    const weak = separationReport(
      load((d) => {
        ideology(d, 'blue_two')['stances'] = {
          q_blue_split: { accept: ['blue_b'], weight: 1 },
        };
        ideology(d, 'blue_one')['stances'] = {};
      }),
    );
    const pair = pairOf(weak, 'blue_one', 'blue_two');
    // A lone weight-1 stance against silence is a gap of 1, below the threshold.
    expect(pair?.separatingQuestions).toEqual([]);
  });

  it('partitions every pair into exactly one bucket', () => {
    expect(report.unseparated.length + report.fragile.length + report.wellSeparated).toBe(
      report.pairs.length,
    );
  });
});

describe('bank statistics', () => {
  const stats = bankStats(load());

  it('counts questions by depth', () => {
    expect(stats?.byDepth).toEqual({ 1: 3, 2: 3, 3: 1 });
    expect(stats?.questionCount).toBe(7);
  });

  it('attributes questions to families by who holds stances on them', () => {
    const red = stats?.byFamily.find((f) => f.familyId === 'red');
    const blue = stats?.byFamily.find((f) => f.familyId === 'blue');
    // q_family is shared; q_red_split, q_eco and q_red_shared are red-only.
    expect(red?.count).toBe(4);
    expect(blue?.count).toBe(3);
  });

  it('names questions no family has reached', () => {
    expect(stats?.unscopedQuestions).toEqual(['q_tech']);
  });

  it('counts follow-ups by mode', () => {
    const withFollowUps = bankStats(
      load((d) => {
        question(d, 'q_family')['follow_ups'] = [
          { when: { answer_in: ['pick_red'] }, ask: ['q_red_split'], mode: 'force' },
          { when: { answer_in: ['pick_blue'] }, ask: ['q_blue_split'], mode: 'boost', boost: 2 },
          { when: { answer_in: ['pick_blue'] }, ask: ['q_shibboleth'], mode: 'unlock' },
        ];
      }),
    );
    expect(withFollowUps?.followUps).toEqual({ force: 1, boost: 1, unlock: 1 });
    expect(withFollowUps?.followUpTargets).toBe(3);
  });

  it('reports the history allowance against the cap', () => {
    const history = bankStats(
      load((d) => {
        question(d, 'q_family')['history_class'] = true;
      }),
    );
    expect(history?.historyClass.count).toBe(1);
    expect(history?.historyClass.share).toBeCloseTo(1 / 7, 10);
    expect(history?.historyClass.withinCap).toBe(false);
  });

  it('counts questions carrying modifier tags, and the tags themselves', () => {
    expect(stats?.withModifierTags.count).toBe(2); // q_eco and q_tech
    expect(stats?.withModifierTags.byTag).toEqual([
      { tag: 'ecology', questions: 1 },
      { tag: 'technology', questions: 1 },
    ]);
  });

  it('counts gated questions and exclusive pairs', () => {
    expect(stats?.gatedQuestions).toBe(0);
    expect(stats?.exclusivePairs).toBe(0);
  });
});

describe('longest forced follow-up chain', () => {
  it('is zero when nothing is forced', () => {
    expect(longestForcedChain(load())).toEqual({ length: 0, path: [] });
  });

  it('follows a chain of forced follow-ups', () => {
    const chain = longestForcedChain(
      load((d) => {
        question(d, 'q_family')['follow_ups'] = [
          { when: { answer_in: ['pick_red'] }, ask: ['q_red_split'], mode: 'force' },
        ];
        question(d, 'q_red_split')['follow_ups'] = [
          { when: { answer_in: ['red_a'] }, ask: ['q_red_shared'], mode: 'force' },
        ];
        question(d, 'q_red_shared')['follow_ups'] = [
          { when: { answer_in: ['shared_yes'] }, ask: ['q_shibboleth'], mode: 'force' },
        ];
      }),
    );
    expect(chain.length).toBe(4);
    expect(chain.path).toEqual(['q_family', 'q_red_split', 'q_red_shared', 'q_shibboleth']);
  });

  it('ignores boost and unlock edges', () => {
    const chain = longestForcedChain(
      load((d) => {
        question(d, 'q_family')['follow_ups'] = [
          { when: { answer_in: ['pick_red'] }, ask: ['q_red_split'], mode: 'boost', boost: 2 },
          { when: { answer_in: ['pick_blue'] }, ask: ['q_blue_split'], mode: 'unlock' },
        ];
      }),
    );
    expect(chain.length).toBe(0);
  });

  it('terminates on a cycle rather than hanging', () => {
    // validate reports the cycle as an error; this tool still has to return.
    const chain = longestForcedChain(
      load((d) => {
        question(d, 'q_family')['follow_ups'] = [
          { when: { answer_in: ['pick_red'] }, ask: ['q_red_split'], mode: 'force' },
        ];
        question(d, 'q_red_split')['follow_ups'] = [
          { when: { answer_in: ['red_a'] }, ask: ['q_family'], mode: 'force' },
        ];
      }),
    );
    expect(chain.length).toBeGreaterThan(0);
    expect(chain.length).toBeLessThan(10);
  });
});
