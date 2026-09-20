/**
 * Record-local rules: what a single YAML entry can be wrong about on its own.
 * Exercised through `parseContent` because that is where the schemas are
 * applied and where ids and line numbers get attached to failures.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseContent } from '../src/content/load.js';
import { fixture, q, ideo, fam, type Record_, type Json } from './fixtures/base.js';

const BROKEN_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/broken');
const broken = (name: string) => readFileSync(join(BROKEN_DIR, name), 'utf8');

/** Issue codes and messages produced by parsing a (possibly broken) fixture. */
function parse(mutate?: Parameters<typeof fixture>[0]) {
  const result = parseContent(fixture(mutate));
  return {
    ...result,
    codes: result.issues.map((i) => i.code),
    find: (code: string) => result.issues.filter((i) => i.code === code),
    text: result.issues.map((i) => `${i.id} ${i.code} ${i.message}`).join('\n'),
  };
}

describe('the base fixture', () => {
  it('parses with no issues at all', () => {
    const result = parse();
    expect(result.issues).toEqual([]);
    expect(result.content).not.toBeNull();
  });
});

describe('file roots', () => {
  it('rejects a root that is not a list under the expected key', () => {
    const result = parseContent({
      ...fixture(),
      questions: broken('wrong-root.yaml'),
    });
    expect(result.issues.map((i) => i.code)).toContain('schema/root-shape');
    expect(result.content).toBeNull();
  });

  it('reports a YAML syntax error with a line number', () => {
    const result = parseContent({ ...fixture(), questions: broken('bad-yaml.yaml') });
    const issue = result.issues.find((i) => i.code === 'yaml/parse');
    expect(issue).toBeDefined();
    expect(issue?.line).toBeGreaterThan(0);
    expect(result.content).toBeNull();
  });

  it('rejects an unknown field and names the record and line', () => {
    const result = parseContent({ ...fixture(), questions: broken('unknown-field.yaml') });
    const issue = result.issues.find((i) => i.code === 'schema/invalid');
    expect(issue?.id).toBe('q_typo_field');
    expect(issue?.line).toBeGreaterThan(0);
  });

  it('rejects duplicate ids within a file', () => {
    const result = parseContent({ ...fixture(), questions: broken('duplicate-id.yaml') });
    const issue = result.issues.find((i) => i.code === 'schema/duplicate-id');
    expect(issue?.id).toBe('q_same');
    expect(issue?.line).toBeGreaterThan(0);
  });
});

describe('question shape', () => {
  it('rejects fewer than three options on a single_choice', () => {
    const result = parse((d) => {
      (q(d, 'q_one')['options'] as Json[]).pop();
      (q(d, 'q_one')['options'] as Json[]).pop();
    });
    expect(result.text).toMatch(/single_choice needs 3-6 options/);
  });

  it('rejects more than six options on a single_choice', () => {
    const result = parse((d) => {
      const options = q(d, 'q_one')['options'] as Json[];
      for (let i = 0; i < 5; i++) options.push({ id: `extra_${i}`, label: `Extra ${i}.` });
    });
    expect(result.text).toMatch(/single_choice needs 3-6 options/);
  });

  it('caps a multi at six options like every other kind', () => {
    // Principle 7 says 3-6 except likert, and it means every kind. An earlier
    // version of the schema allowed multi up to 8 — an invention that quietly
    // contradicted a binding principle, caught by `npm run lint:content`.
    const result = parse((d) => {
      const question = q(d, 'q_one');
      question['kind'] = 'multi';
      const options = question['options'] as Json[];
      for (let i = 0; i < 5; i++) options.push({ id: `extra_${i}`, label: `Extra ${i}.` });
    });
    expect(result.text).toMatch(/multi needs 3-6 options/);
  });

  it('allows a multi at exactly six options', () => {
    const result = parse((d) => {
      const question = q(d, 'q_one');
      question['kind'] = 'multi';
      const options = question['options'] as Json[];
      for (let i = 0; i < 3; i++) options.push({ id: `extra_${i}`, label: `Extra ${i}.` });
    });
    expect(result.find('schema/invalid')).toEqual([]);
  });

  it('rejects duplicate option ids', () => {
    const result = parse((d) => {
      (q(d, 'q_one')['options'] as Json[]).push({ id: 'opt_first', label: 'A repeat.' });
    });
    expect(result.text).toMatch(/duplicate option id "opt_first"/);
  });

  it('rejects an authored option that shadows an implicit one', () => {
    const result = parse((d) => {
      (q(d, 'q_one')['options'] as Json[])[0] = { id: 'unsure', label: 'Not sure.' };
    });
    expect(result.text).toMatch(/injected on every question and must not be authored/);
  });

  it('rejects an id that is not snake_case', () => {
    const result = parse((d) => {
      q(d, 'q_one')['id'] = 'Q-One';
    });
    expect(result.text).toMatch(/lowercase snake_case/);
  });

  it('rejects a depth outside 1-3', () => {
    const result = parse((d) => {
      q(d, 'q_one')['depth'] = 4;
    });
    expect(result.find('schema/invalid').length).toBeGreaterThan(0);
  });
});

describe('likert5 questions', () => {
  it('fills in the canonical five points when options are omitted', () => {
    const result = parse();
    const question = result.content?.questionById.get('q_three');
    expect(question?.options.filter((o) => !o.implicit).map((o) => o.id)).toEqual([
      'strongly_agree',
      'agree',
      'neutral',
      'disagree',
      'strongly_disagree',
    ]);
  });

  it('rejects authored likert options that are not the canonical five', () => {
    const result = parse((d) => {
      q(d, 'q_three')['options'] = [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ];
    });
    expect(result.text).toMatch(/likert5 options must be omitted, or be exactly/);
  });
});

describe('follow-ups', () => {
  it('rejects a follow-up gated on an option the question does not have', () => {
    const result = parse((d) => {
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['nope'] }, ask: ['q_two'], mode: 'force' },
      ];
    });
    expect(result.text).toMatch(/"nope" is not an option of this question/);
  });

  it('rejects a question following up to itself', () => {
    const result = parse((d) => {
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['opt_first'] }, ask: ['q_one'], mode: 'force' },
      ];
    });
    expect(result.text).toMatch(/cannot follow up to itself/);
  });

  it('rejects a boost value on a non-boost follow-up', () => {
    const result = parse((d) => {
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['opt_first'] }, ask: ['q_two'], mode: 'force', boost: 2 },
      ];
    });
    expect(result.text).toMatch(/only meaningful with mode: boost/);
  });
});

describe('modifier tags', () => {
  it('rejects a tag outside the closed vocabulary', () => {
    const result = parse((d) => {
      q(d, 'q_one')['modifier_tags'] = { opt_first: 'ecologyy' };
    });
    expect(result.find('schema/invalid').length).toBeGreaterThan(0);
  });

  it('rejects a tag keyed on an option the question does not have', () => {
    const result = parse((d) => {
      q(d, 'q_one')['modifier_tags'] = { not_an_option: 'ecology' };
    });
    expect(result.text).toMatch(/is not an option of this question/);
  });

  it('accepts a tag on a likert point of a likert5 question', () => {
    const result = parse((d) => {
      q(d, 'q_three')['modifier_tags'] = { strongly_agree: 'ecology' };
    });
    expect(result.find('schema/invalid')).toEqual([]);
  });
});

describe('stances', () => {
  it('requires a note at weight 3', () => {
    const result = parse((d) => {
      delete (((ideo(d, 'ideo_child')['stances'] as Record_)['q_two']) as Record_)['note'];
    });
    expect(result.text).toMatch(/weight 3 is reserved for what defines an ideology/);
  });

  it('does not require a note below weight 3', () => {
    const result = parse((d) => {
      const stance = (ideo(d, 'ideo_child')['stances'] as Record_)['q_two'] as Record_;
      stance['weight'] = 2;
      delete stance['note'];
    });
    expect(result.find('schema/invalid')).toEqual([]);
  });

  it('rejects an option that is both accepted and rejected', () => {
    const result = parse((d) => {
      const stance = (ideo(d, 'ideo_child')['stances'] as Record_)['q_two'] as Record_;
      stance['reject'] = ['two_beta'];
    });
    expect(result.text).toMatch(/both accepted and rejected: two_beta/);
  });

  it('rejects a weighted stance that accepts nothing', () => {
    const result = parse((d) => {
      const stance = (ideo(d, 'ideo_child')['stances'] as Record_)['q_two'] as Record_;
      stance['accept'] = [];
      stance['weight'] = 2;
      delete stance['note'];
    });
    expect(result.text).toMatch(/must accept at least one option/);
  });

  it('rejects a stance on an implicit option', () => {
    const result = parse((d) => {
      (fam(d, 'fam_a')['stances'] as Record_)['q_one'] = { accept: ['unsure'], weight: 1 };
    });
    expect(result.text).toMatch(/never updates scores/);
  });

  it('rejects a weight above 3', () => {
    const result = parse((d) => {
      const stance = (ideo(d, 'ideo_child')['stances'] as Record_)['q_two'] as Record_;
      stance['weight'] = 4;
    });
    expect(result.find('schema/invalid').length).toBeGreaterThan(0);
  });

  it('allows null to clear an inherited stance', () => {
    const result = parse((d) => {
      (ideo(d, 'ideo_child')['stances'] as Record_)['q_one'] = null;
    });
    expect(result.find('schema/invalid')).toEqual([]);
  });

  it('rejects null in a family default, which has nothing to clear', () => {
    const result = parse((d) => {
      (fam(d, 'fam_a')['stances'] as Record_)['q_one'] = null;
    });
    expect(result.find('schema/invalid').length).toBeGreaterThan(0);
  });
});

describe('conditions', () => {
  it('rejects an unknown condition atom', () => {
    const result = parse((d) => {
      q(d, 'q_two')['requires'] = { answered_by_someone: { q_one: ['opt_first'] } };
    });
    expect(result.find('schema/invalid').length).toBeGreaterThan(0);
  });

  it('rejects depth_unlocked_gte outside 1-3', () => {
    const result = parse((d) => {
      q(d, 'q_three')['requires'] = { depth_unlocked_gte: 4 };
    });
    expect(result.find('schema/invalid').length).toBeGreaterThan(0);
  });

  it('accepts nested all/any/not', () => {
    const result = parse((d) => {
      q(d, 'q_three')['requires'] = {
        all: [
          { depth_unlocked_gte: 3 },
          { any: [{ family_mass_gte: { fam_a: 0.2 } }, { family_mass_gte: { fam_b: 0.2 } }] },
          { not: { answered: { q_one: ['opt_third'] } } },
        ],
      };
    });
    expect(result.find('schema/invalid')).toEqual([]);
  });
});
