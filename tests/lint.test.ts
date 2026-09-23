/**
 * The design-principle lint.
 *
 * Built on the roster fixture, which carries stances — the real bank has none
 * yet, so the rules that depend on them could not be exercised against it.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseContent, type LoadResult } from '../src/content/load.js';
import { lintContent, parseWordList, type LintLists } from '../src/content/lint.js';
import { rosterDocs, type RosterDocs } from './fixtures/roster.js';
import { stringify } from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

const REAL_LISTS: LintLists = {
  namedEntities: parseWordList(read('content/lint/named-entities.txt')),
  loadedWords: parseWordList(read('content/lint/loaded-words.txt')),
  jargon: parseWordList(read('content/lint/jargon.txt')),
  tier1Banned: parseWordList(read('content/lint/tier1-banned.txt')),
  filler: parseWordList(read('content/lint/filler.txt')),
  stopwords: parseWordList(read('content/lint/stopwords.txt')),
  syllables: parseWordList(read('content/lint/syllables.txt')),
};

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

function lint(mutate?: (docs: RosterDocs) => void, lists: LintLists = REAL_LISTS) {
  const result = lintContent(load(mutate), lists);
  return {
    ...result,
    of: (code: string) => result.issues.filter((i) => i.code === code),
    codes: result.issues.map((i) => i.code),
  };
}

/** Find a question in the fixture and cast it to something mutable. */
function question(docs: RosterDocs, id: string): Record<string, unknown> {
  const found = docs.questions.questions.find((q) => q.id === id);
  if (!found) throw new Error(`no question ${id}`);
  return found as unknown as Record<string, unknown>;
}

describe('the roster fixture', () => {
  it('trips no errors against the real word lists', () => {
    // If the fixture tripped a hard rule, every test below would be measuring
    // noise rather than the rule it names.
    expect(lint().issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('trips only the discrimination rules, which it is built to trip', () => {
    // The fixture deliberately carries "neither" options nobody holds and one
    // option both red sects accept. Those are what q_red_shared exists for.
    expect([...new Set(lint().codes)].sort()).toEqual([
      'lint/option-unaccepted',
      'lint/option-universal',
    ]);
  });
});

describe('parseWordList', () => {
  it('drops comments and blank lines, keeps phrases', () => {
    expect(parseWordList('# a comment\n\nParis Commune\n  Marx  \n\n# another\nsoviet\n')).toEqual([
      'Paris Commune',
      'Marx',
      'soviet',
    ]);
  });

  it('is what the shipped lists parse through', () => {
    expect(REAL_LISTS.namedEntities.length).toBeGreaterThan(150);
    expect(REAL_LISTS.jargon.length).toBeGreaterThan(50);
    expect(REAL_LISTS.loadedWords.length).toBeGreaterThan(40);
    for (const list of Object.values(REAL_LISTS) as string[][]) {
      expect(list.every((t) => !t.startsWith('#'))).toBe(true);
    }
  });
});

describe('principle 1 — no dates, no names', () => {
  it('catches a four-digit year in a stem', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'In 1917 the question was settled. Which side?';
    });
    expect(result.of('lint/year-in-prose')[0]?.severity).toBe('error');
  });

  it('catches a year in an option label', () => {
    const result = lint((d) => {
      const options = question(d, 'q_family')['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'The answer given in 1921.';
    });
    expect(result.of('lint/year-in-prose')[0]?.path).toBe('options[0].label');
  });

  it('does not treat an ordinary number as a year', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'A firm of 400 workers votes. Which side do you take?';
    });
    expect(result.of('lint/year-in-prose')).toEqual([]);
  });

  it('catches a named person', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'Lenin and Kautsky disagreed. Which side do you take?';
    });
    const issue = result.of('lint/named-entity')[0];
    expect(issue?.severity).toBe('error');
    expect(issue?.message).toMatch(/Lenin/);
    expect(issue?.message).toMatch(/Kautsky/);
  });

  it('catches a named event and a named organisation', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'The Paris Commune and the Comintern. Which side?';
    });
    expect(result.of('lint/named-entity')[0]?.message).toMatch(/Paris Commune/);
    expect(result.of('lint/named-entity')[0]?.message).toMatch(/Comintern/);
  });

  it('matches whole words only, so "Marx" does not fire on "Marxist"', () => {
    const result = lint(
      (d) => {
        question(d, 'q_family')['text'] = 'A Marxist argument is made. Which side do you take?';
      },
      { ...REAL_LISTS, jargon: [] },
    );
    expect(result.of('lint/named-entity')).toEqual([]);
  });

  it('exempts tooltips, which is where the examples belong', () => {
    const result = lint((d) => {
      question(d, 'q_family')['tooltip'] = 'Lenin argued this in 1917; see also the Comintern.';
    });
    expect(result.of('lint/named-entity')).toEqual([]);
    expect(result.of('lint/year-in-prose')).toEqual([]);
  });

  it('exempts a self-identification question, where naming traditions is the point', () => {
    const result = lint((d) => {
      const q = question(d, 'q_family');
      q['self_id'] = true;
      q['text'] = 'Which tradition do you identify with?';
      (q['options'] as Record<string, unknown>[])[0]!['label'] = 'The Bolshevik tradition.';
    });
    expect(result.of('lint/named-entity')).toEqual([]);
  });

  it('still catches a year on a self-identification question', () => {
    // Principle 10 licenses named traditions, not dates.
    const result = lint((d) => {
      const q = question(d, 'q_family');
      q['self_id'] = true;
      q['text'] = 'Which tradition, as it stood in 1938?';
    });
    expect(result.of('lint/year-in-prose')).toHaveLength(1);
  });
});

describe('principle 4 — one position per question', () => {
  it('catches two clauses joined by "and" in the question sentence', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] =
        'Should the movement take power, and should it also abolish money?';
    });
    expect(result.of('lint/double-barrelled')[0]?.severity).toBe('warning');
  });

  it('catches a stem asking two separate questions', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'What should happen first? And what should follow?';
    });
    expect(result.of('lint/double-barrelled')[0]?.message).toMatch(/2 separate questions/);
  });

  it('does not fire on "and" inside a scenario before the question', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] =
        'A government is besieged and its supporters are divided. What should it do?';
    });
    expect(result.of('lint/double-barrelled')).toEqual([]);
  });

  it('does not fire on a list joined by "and" with one verb', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'Who should own the mines, the docks and the railways?';
    });
    expect(result.of('lint/double-barrelled')).toEqual([]);
  });
});

describe('principle 5 — loaded language', () => {
  it('warns on a loaded word in a stem', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'Obviously the state must go. Which side do you take?';
    });
    const issue = result.of('lint/loaded-word')[0];
    expect(issue?.severity).toBe('warning');
    expect(issue?.path).toBe('text');
  });

  it('warns on a loaded word in an option, naming the option', () => {
    const result = lint((d) => {
      const options = question(d, 'q_family')['options'] as Record<string, unknown>[];
      options[1]!['label'] = 'The naive answer, as its holders would put it.';
    });
    expect(result.of('lint/loaded-word')[0]?.message).toMatch(/pick_blue/);
  });

  it('never fails the build on its own', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'Clearly and obviously. Which side do you take?';
    });
    expect(result.issues.every((i) => i.severity === 'warning')).toBe(true);
  });
});

describe('principle 6 — plain stems, glossed jargon', () => {
  it('errors on jargon in a stem', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'Does the proletariat need a vanguard?';
    });
    const issue = result.of('lint/jargon-in-stem')[0];
    expect(issue?.severity).toBe('error');
    expect(issue?.message).toMatch(/proletariat/);
    expect(issue?.message).toMatch(/vanguard/);
  });

  it('errors on jargon in an option with no tooltip', () => {
    const result = lint((d) => {
      const options = question(d, 'q_family')['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'Through democratic centralism, as we would put it.';
    });
    expect(result.of('lint/jargon-without-tooltip')[0]?.severity).toBe('error');
  });

  it('accepts jargon in an option once the tooltip covers it', () => {
    const result = lint((d) => {
      const q = question(d, 'q_family');
      const options = q['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'Through democratic centralism, as we would put it.';
      q['tooltip'] = 'Democratic centralism: decisions are argued freely, then carried by all.';
    });
    expect(result.of('lint/jargon-without-tooltip')).toEqual([]);
  });

  it('does not accept a tooltip that covers a different term', () => {
    const result = lint((d) => {
      const q = question(d, 'q_family');
      const options = q['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'Through democratic centralism, as we would put it.';
      q['tooltip'] = 'A workers council is elected directly from the shop floor.';
    });
    expect(result.of('lint/jargon-without-tooltip')).toHaveLength(1);
  });
});

describe('length', () => {
  it('errors on a stem over the word cap', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = `${'word '.repeat(70)}Which side?`;
    });
    expect(result.of('lint/stem-too-long')[0]?.severity).toBe('error');
  });

  it('warns when one option is far longer than the shortest', () => {
    const result = lint((d) => {
      const options = question(d, 'q_family')['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'Yes.';
      options[1]!['label'] = `The other answer, ${'stated at length '.repeat(6)}as its holders put it.`;
    });
    const issue = result.of('lint/option-length-imbalance')[0];
    expect(issue?.severity).toBe('warning');
    expect(issue?.message).toMatch(/pick_blue/);
  });

  it('tolerates options of similar length', () => {
    expect(lint().of('lint/option-length-imbalance')).toEqual([]);
  });
});

describe('principle 7 — option count', () => {
  it('allows two options at tier 1, where a real binary is legitimate', () => {
    const result = lint((d) => {
      const q = question(d, 'q_family');
      q['options'] = (q['options'] as unknown[]).slice(0, 2);
    });
    expect(result.of('lint/option-count')).toEqual([]);
  });

  it('rejects two options at tier 2 in the schema, before the lint sees it', () => {
    // The structural minimum is 3 below tier 1, so the record never loads and
    // the lint never runs on it. What matters is that it does not pass.
    const issues = load((d) => {
      const q = question(d, 'q_red_split');
      q['options'] = (q['options'] as unknown[]).slice(0, 2);
    }).issues;
    expect(issues.some((i) => i.code === 'schema/invalid')).toBe(true);
  });

  it('errors above five options at tier 1', () => {
    const result = lint((d) => {
      const q = question(d, 'q_family');
      const options = q['options'] as Record<string, unknown>[];
      for (let i = 0; i < 3; i++) options.push({ id: `extra_${i}`, label: 'Another answer.' });
    });
    expect(result.of('lint/option-count')[0]?.message).toMatch(/tier 1 allows 2-5/);
  });

  it('exempts likert questions, which always have five', () => {
    expect(lint().of('lint/option-count')).toEqual([]);
  });
});

describe('tier language rules', () => {
  it('caps a tier-1 stem at eighteen words', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] =
        'This stem runs on and on and on and on and on and on past the cap that tier one sets for it.';
    });
    expect(result.of('lint/stem-too-long')[0]?.message).toMatch(/tier-1 cap of 18/);
  });

  it('caps a tier-1 option at eight words', () => {
    const result = lint((d) => {
      const options = question(d, 'q_family')['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'One two three four five six seven eight nine ten.';
    });
    expect(result.of('lint/option-too-long')[0]?.message).toMatch(/tier-1 cap of 8/);
  });

  it('errors on tier-1 political vocabulary', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] = 'Should the vanguard lead?';
    });
    expect(result.of('lint/tier1-vocabulary')[0]?.message).toMatch(/"vanguard"/);
  });

  it('leaves tier-3 vocabulary alone', () => {
    const result = lint((d) => {
      question(d, 'q_shibboleth')['text'] = 'Does the vanguard lead, or does the class?';
    });
    expect(result.of('lint/tier1-vocabulary')).toEqual([]);
  });

  it('errors on filler at tier 1 and warns deeper', () => {
    const atOne = lint((d) => {
      const options = question(d, 'q_family')['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'Essentially yes.';
    });
    expect(atOne.of('lint/filler')[0]?.severity).toBe('error');

    const atThree = lint((d) => {
      const options = question(d, 'q_shibboleth')['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'Essentially yes, as that tradition puts it.';
    });
    expect(atThree.of('lint/filler')[0]?.severity).toBe('warning');
  });

  it('errors on a tier-1 reading grade over seven', () => {
    const result = lint((d) => {
      question(d, 'q_family')['text'] =
        'Which constitutional arrangement facilitates optimal redistributive interventions?';
    });
    expect(result.of('lint/reading-grade')[0]?.severity).toBe('error');
  });

  it('bans a tooltip at tier 1', () => {
    const result = lint((d) => {
      question(d, 'q_family')['tooltip'] = 'An explanation the respondent should not need.';
    });
    expect(result.of('lint/tier1-tooltip')).toHaveLength(1);
  });

  it('allows a tooltip at tier 3', () => {
    const result = lint((d) => {
      question(d, 'q_shibboleth')['tooltip'] = 'Context for a term only this camp uses.';
    });
    expect(result.of('lint/tier1-tooltip')).toEqual([]);
  });

  it('flags an option that only restates the stem', () => {
    const result = lint((d) => {
      const options = question(d, 'q_family')['options'] as Record<string, unknown>[];
      options[0]!['label'] = 'The first question side taken.';
    });
    expect(result.of('lint/option-restates-stem')).toHaveLength(1);
  });

  it('does not flag a short option that shares one word', () => {
    expect(lint().of('lint/option-restates-stem')).toEqual([]);
  });
});

describe('does the question discriminate?', () => {
  it('warns about an option no ideology accepts', () => {
    const messages = lint()
      .of('lint/option-unaccepted')
      .map((i) => i.message);
    expect(messages).toContain('no ideology accepts "pick_neither"');
    expect(messages).toContain('no ideology accepts "red_c"');
  });

  it('says nothing about the unaccepted points of a likert scale', () => {
    // q_eco accepts only strongly_agree; the other four points are scale
    // positions, not camp views, and flagging them would drown the real ones.
    expect(lint().of('lint/option-unaccepted').map((i) => i.id)).not.toContain('q_eco');
  });

  it('warns once an option is genuinely orphaned', () => {
    const result = lint((d) => {
      const options = question(d, 'q_red_split')['options'] as Record<string, unknown>[];
      options.push({ id: 'red_d', label: 'A fourth way nobody holds.' });
    });
    expect(result.of('lint/option-unaccepted').map((i) => i.message)).toContain(
      'no ideology accepts "red_d"',
    );
  });

  it('warns when every ideology with a stance accepts the same option', () => {
    // q_red_shared is accepted by both red sects and by nobody else.
    const result = lint();
    const universal = result.of('lint/option-universal');
    expect(universal.map((i) => i.id)).toContain('q_red_shared');
    expect(universal[0]?.message).toMatch(/shared_yes/);
  });

  it('says nothing about a question no ideology has reached', () => {
    // q_tech has no stances at all, so neither rule can mean anything.
    const result = lint();
    expect(result.of('lint/option-unaccepted').map((i) => i.id)).not.toContain('q_tech');
    expect(result.of('lint/option-universal').map((i) => i.id)).not.toContain('q_tech');
  });

  it('warns about a follow-up whose parent option nobody accepts', () => {
    const result = lint((d) => {
      question(d, 'q_red_split')['follow_ups'] = [
        { when: { answer_in: ['red_c'] }, ask: ['q_shibboleth'], mode: 'force' },
      ];
    });
    const issue = result.of('lint/followup-dead-parent')[0];
    expect(issue?.severity).toBe('warning');
    expect(issue?.message).toMatch(/red_c/);
  });

  it('is quiet when the follow-up parent is accepted by someone', () => {
    const result = lint((d) => {
      question(d, 'q_red_split')['follow_ups'] = [
        { when: { answer_in: ['red_a'] }, ask: ['q_shibboleth'], mode: 'force' },
      ];
    });
    expect(result.of('lint/followup-dead-parent')).toEqual([]);
  });
});

describe('waivers', () => {
  it('suppresses a heuristic rule and records the reason', () => {
    const result = lint((d) => {
      const q = question(d, 'q_family');
      q['text'] = 'Should the movement take power, and should it abolish money?';
      q['lint_waiver'] = 'One question: both halves are the same decision in this scenario.';
    });
    expect(result.of('lint/double-barrelled')).toEqual([]);
    expect(result.waivers[0]?.questionId).toBe('q_family');
    expect(result.waivers[0]?.suppressed).toContain('lint/double-barrelled');
    expect(result.waivers[0]?.reason).toMatch(/same decision/);
  });

  it('does not suppress a hard rule', () => {
    const result = lint((d) => {
      const q = question(d, 'q_family');
      q['text'] = 'Does the proletariat need a vanguard in 1917?';
      q['lint_waiver'] = 'trying to wave away a year and some jargon';
    });
    expect(result.of('lint/year-in-prose')).toHaveLength(1);
    expect(result.of('lint/jargon-in-stem')).toHaveLength(1);
  });

  it('records no waiver when nothing was suppressed', () => {
    const result = lint((d) => {
      question(d, 'q_family')['lint_waiver'] = 'unnecessary';
    });
    expect(result.waivers).toEqual([]);
  });
});
