/**
 * Cross-record checks. Each case breaks the valid fixture in exactly one way
 * and asserts the specific code that should catch it — plus, where it matters,
 * that nothing else fires, so a check that over-reports is caught too.
 */

import { describe, expect, it } from 'vitest';
import { parseContent, type Issue } from '../src/content/load.js';
import { validateContent } from '../src/content/validate.js';
import { fixture, q, ideo, fam, type Json, type Record_ } from './fixtures/base.js';

function check(mutate?: Parameters<typeof fixture>[0]) {
  const loaded = parseContent(fixture(mutate));
  const issues: Issue[] = [...loaded.issues, ...validateContent(loaded)];
  return {
    issues,
    codes: issues.map((i) => i.code),
    errors: issues.filter((i) => i.severity === 'error'),
    warnings: issues.filter((i) => i.severity === 'warning'),
    of: (code: string) => issues.filter((i) => i.code === code),
    text: issues.map((i) => `${i.id} [${i.code}] ${i.message}`).join('\n'),
  };
}

describe('the valid fixture', () => {
  it('produces no errors and no warnings', () => {
    const result = check();
    expect(result.issues).toEqual([]);
  });
});

describe('the ideology tree', () => {
  it('catches a family that does not exist', () => {
    const result = check((d) => {
      ideo(d, 'ideo_other')['family'] = 'fam_missing';
    });
    expect(result.of('ideology/unknown-family')[0]?.id).toBe('ideo_other');
  });

  it('catches a tendency that does not exist', () => {
    const result = check((d) => {
      ideo(d, 'ideo_child')['tendency'] = 'ideo_missing';
    });
    expect(result.of('ideology/unknown-tendency')[0]?.id).toBe('ideo_child');
  });

  it('catches a tendency parent in another family', () => {
    const result = check((d) => {
      ideo(d, 'ideo_child')['tendency'] = 'ideo_other';
    });
    expect(result.of('ideology/tendency-cross-family')[0]?.id).toBe('ideo_child');
  });

  it('catches a cycle in the tendency chain', () => {
    const result = check((d) => {
      ideo(d, 'ideo_parent')['tendency'] = 'ideo_child';
    });
    expect(result.of('ideology/tendency-cycle').length).toBeGreaterThan(0);
  });

  it('warns when roster_tier is boundary but the boundary flag is not set', () => {
    const result = check((d) => {
      ideo(d, 'ideo_other')['roster_tier'] = 'boundary';
    });
    expect(result.of('ideology/boundary-mismatch')[0]?.severity).toBe('warning');
  });
});

describe('stance references', () => {
  it('catches a stance on a question that does not exist', () => {
    const result = check((d) => {
      (ideo(d, 'ideo_parent')['stances'] as Record_)['q_nonexistent'] = {
        accept: ['whatever'],
        weight: 1,
      };
    });
    const issue = result.of('stance/unknown-question')[0];
    expect(issue?.id).toBe('ideo_parent');
    expect(issue?.path).toBe('stances.q_nonexistent');
    expect(issue?.line).toBeGreaterThan(0);
  });

  it('catches a stance on an option belonging to a different question', () => {
    const result = check((d) => {
      (ideo(d, 'ideo_parent')['stances'] as Record_)['q_two'] = {
        accept: ['opt_first'],
        weight: 1,
      };
    });
    const issue = result.of('stance/unknown-option')[0];
    expect(issue?.message).toMatch(/"opt_first" is not an option of question "q_two"/);
    expect(issue?.hint).toMatch(/two_alpha/);
  });

  it('catches a rejected option that does not exist', () => {
    const result = check((d) => {
      (ideo(d, 'ideo_parent')['stances'] as Record_)['q_two'] = {
        accept: ['two_alpha'],
        reject: ['two_omega'],
        weight: 1,
      };
    });
    expect(result.of('stance/unknown-option')[0]?.path).toBe('stances.q_two.reject[0]');
  });

  it('catches the same problem in a family default', () => {
    const result = check((d) => {
      (fam(d, 'fam_a')['stances'] as Record_)['q_one'] = { accept: ['opt_wrong'], weight: 1 };
    });
    const issue = result.of('stance/unknown-option')[0];
    expect(issue?.file).toBe('content/families.yaml');
    expect(issue?.id).toBe('fam_a');
  });

  it('validates a likert stance against the injected points', () => {
    const result = check((d) => {
      (ideo(d, 'ideo_other')['stances'] as Record_)['q_three'] = {
        accept: ['sort_of_agree'],
        weight: 1,
      };
    });
    expect(result.of('stance/unknown-option')[0]?.hint).toMatch(/strongly_agree/);
  });
});

describe('inheritance reporting', () => {
  it('warns about a null override that clears nothing', () => {
    const result = check((d) => {
      (ideo(d, 'ideo_child')['stances'] as Record_)['q_three'] = null;
    });
    expect(result.of('stance/clears-nothing')[0]?.id).toBe('ideo_child');
  });

  it('warns when a sect resolves to exactly its parent stances', () => {
    const result = check((d) => {
      ideo(d, 'ideo_child')['stances'] = {};
    });
    const issue = result.of('inherit/no-distinguishing-stance')[0];
    expect(issue?.id).toBe('ideo_child');
    expect(issue?.message).toMatch(/its parent "ideo_parent"/);
  });

  it('points a lineage ideology at docs/inseparable.md', () => {
    const result = check((d) => {
      ideo(d, 'ideo_child')['stances'] = {};
      ideo(d, 'ideo_child')['lineage'] = true;
    });
    expect(result.of('inherit/no-distinguishing-stance')[0]?.hint).toMatch(/inseparable\.md/);
  });

  it('does not warn about an interior node that only carries family stances', () => {
    // ideo_parent is ideo_child's tendency, so it exists to be backed off to.
    const result = check((d) => {
      ideo(d, 'ideo_parent')['stances'] = {};
    });
    expect(result.of('inherit/no-distinguishing-stance').map((i) => i.id)).not.toContain(
      'ideo_parent',
    );
  });

  it('warns when an ideology resolves to no stances at all', () => {
    const result = check((d) => {
      ideo(d, 'ideo_other')['stances'] = {};
      fam(d, 'fam_b')['stances'] = {};
    });
    expect(result.of('stance/none')[0]?.id).toBe('ideo_other');
  });
});

describe('follow-ups', () => {
  it('catches a follow-up asking a question that does not exist', () => {
    const result = check((d) => {
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['opt_first'] }, ask: ['q_ghost'], mode: 'force' },
      ];
    });
    expect(result.of('followup/unknown-question')[0]?.message).toMatch(/"q_ghost"/);
  });

  it('treats a cycle of forced follow-ups as an error', () => {
    const result = check((d) => {
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['opt_first'] }, ask: ['q_two'], mode: 'force' },
      ];
      q(d, 'q_two')['follow_ups'] = [
        { when: { answer_in: ['two_alpha'] }, ask: ['q_one'], mode: 'force' },
      ];
    });
    const issue = result.of('followup/force-cycle')[0];
    expect(issue?.severity).toBe('error');
    expect(issue?.message).toMatch(/q_one -> q_two|q_two -> q_one/);
  });

  it('treats a cycle of boosts as a warning, not an error', () => {
    const result = check((d) => {
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['opt_first'] }, ask: ['q_two'], mode: 'boost', boost: 1.5 },
      ];
      q(d, 'q_two')['follow_ups'] = [
        { when: { answer_in: ['two_alpha'] }, ask: ['q_one'], mode: 'boost', boost: 1.5 },
      ];
    });
    expect(result.of('followup/force-cycle')).toEqual([]);
    expect(result.of('followup/cycle')[0]?.severity).toBe('warning');
    expect(result.errors).toEqual([]);
  });

  it('reports a force cycle once, not once per member', () => {
    const result = check((d) => {
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['opt_first'] }, ask: ['q_two'], mode: 'force' },
      ];
      q(d, 'q_two')['follow_ups'] = [
        { when: { answer_in: ['two_alpha'] }, ask: ['q_one'], mode: 'force' },
      ];
    });
    expect(result.of('followup/force-cycle')).toHaveLength(1);
  });

  it('accepts a chain of forced follow-ups that does not loop', () => {
    const result = check((d) => {
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['opt_first'] }, ask: ['q_two'], mode: 'force' },
      ];
      q(d, 'q_two')['follow_ups'] = [
        { when: { answer_in: ['two_alpha'] }, ask: ['q_three'], mode: 'force' },
      ];
    });
    expect(result.errors).toEqual([]);
  });
});

describe('requires', () => {
  it('catches a condition on a question that does not exist', () => {
    const result = check((d) => {
      q(d, 'q_three')['requires'] = { answered: { q_ghost: ['whatever'] } };
    });
    expect(result.of('requires/unknown-question')[0]?.id).toBe('q_three');
  });

  it('catches a condition on an option the question does not have', () => {
    const result = check((d) => {
      q(d, 'q_two')['requires'] = { answered: { q_one: ['opt_nope'] } };
    });
    expect(result.of('requires/unknown-option')[0]?.hint).toMatch(/opt_first/);
  });

  it('catches a condition that waits for an implicit answer', () => {
    const result = check((d) => {
      q(d, 'q_two')['requires'] = { answered: { q_one: ['unsure'] } };
    });
    expect(result.of('requires/implicit-option')[0]?.message).toMatch(/can never hold/);
  });

  it('catches a condition on a family that does not exist', () => {
    const result = check((d) => {
      q(d, 'q_three')['requires'] = { family_mass_gte: { fam_ghost: 0.2 } };
    });
    expect(result.of('requires/unknown-family')[0]?.id).toBe('q_three');
  });

  it('catches a mass threshold above 1', () => {
    const result = check((d) => {
      q(d, 'q_three')['requires'] = { family_mass_gte: { fam_b: 1.5 } };
    });
    expect(result.of('requires/bad-threshold')[0]?.hint).toMatch(/nothing can ever exceed 1/);
  });

  it('catches a mass threshold of zero, which is a no-op', () => {
    const result = check((d) => {
      q(d, 'q_three')['requires'] = { family_mass_gte: { fam_b: 0 } };
    });
    expect(result.of('requires/bad-threshold')[0]?.hint).toMatch(/always true/);
  });

  it('finds conditions nested inside all/any/not', () => {
    const result = check((d) => {
      q(d, 'q_three')['requires'] = {
        all: [{ any: [{ not: { answered: { q_ghost: ['x'] } } }] }],
      };
    });
    expect(result.of('requires/unknown-question')[0]?.path).toBe(
      'requires.all[0].any[0].not.answered.q_ghost',
    );
  });
});

describe('reachability', () => {
  it('catches two questions that gate on each other', () => {
    const result = check((d) => {
      q(d, 'q_two')['requires'] = { answered: { q_three: ['agree'] } };
      q(d, 'q_three')['requires'] = { answered: { q_two: ['two_alpha'] } };
      // q_two no longer interpolates a guaranteed answer.
      q(d, 'q_two')['text'] = 'A stem with no interpolation.';
    });
    const unreachable = result.of('question/unreachable').map((i) => i.id).sort();
    expect(unreachable).toEqual(['q_three', 'q_two']);
  });

  it('catches a question that depends on an unreachable question', () => {
    const result = check((d) => {
      q(d, 'q_two')['requires'] = {
        all: [{ answered: { q_one: ['opt_first'] } }, { answered: { q_one: ['opt_second'] } }],
      };
      q(d, 'q_two')['text'] = 'A stem with no interpolation.';
      q(d, 'q_three')['requires'] = { answered: { q_two: ['two_alpha'] } };
    });
    expect(result.of('question/unreachable').map((i) => i.id).sort()).toEqual(['q_three', 'q_two']);
  });

  it('catches contradictory answer constraints on one single-answer question', () => {
    const result = check((d) => {
      q(d, 'q_two')['requires'] = {
        all: [{ answered: { q_one: ['opt_first'] } }, { answered: { q_one: ['opt_third'] } }],
      };
      q(d, 'q_two')['text'] = 'A stem with no interpolation.';
    });
    expect(result.of('question/unreachable')[0]?.id).toBe('q_two');
  });

  it('allows the same constraints when the question accepts several answers', () => {
    const result = check((d) => {
      q(d, 'q_one')['kind'] = 'multi';
      q(d, 'q_two')['requires'] = {
        all: [{ answered: { q_one: ['opt_first'] } }, { answered: { q_one: ['opt_third'] } }],
      };
      q(d, 'q_two')['text'] = 'A stem with no interpolation.';
    });
    expect(result.of('question/unreachable')).toEqual([]);
  });

  it('catches a condition and its own negation', () => {
    const result = check((d) => {
      q(d, 'q_three')['requires'] = {
        all: [{ depth_unlocked_gte: 3 }, { not: { depth_unlocked_gte: 3 } }],
      };
    });
    expect(result.of('question/unreachable')[0]?.id).toBe('q_three');
  });

  it('treats a mode: unlock follow-up as granting eligibility', () => {
    const result = check((d) => {
      // Unsatisfiable on its own terms...
      q(d, 'q_three')['requires'] = {
        all: [{ answered: { q_one: ['opt_first'] } }, { answered: { q_one: ['opt_third'] } }],
      };
      // ...but something reachable unlocks it.
      q(d, 'q_one')['follow_ups'] = [
        { when: { answer_in: ['opt_second'] }, ask: ['q_three'], mode: 'unlock' },
      ];
    });
    expect(result.of('question/unreachable')).toEqual([]);
  });

  it('does not report unreachability when the reference is simply unknown', () => {
    // That is already a requires/unknown-question error; reporting both would
    // send the author looking for a second, non-existent problem.
    const result = check((d) => {
      q(d, 'q_three')['requires'] = { answered: { q_ghost: ['x'] } };
    });
    expect(result.of('question/unreachable')).toEqual([]);
  });

  it('does not flag a satisfiable any-branch as unreachable', () => {
    const result = check((d) => {
      q(d, 'q_three')['requires'] = {
        any: [{ answered: { q_one: ['opt_first'] } }, { family_mass_gte: { fam_ghost_ok: 0.5 } }],
      };
      fam(d, 'fam_a')['id'] = 'fam_a';
    });
    expect(result.of('question/unreachable')).toEqual([]);
  });
});

describe('exclusive_with', () => {
  it('catches a reference to a question that does not exist', () => {
    const result = check((d) => {
      q(d, 'q_one')['exclusive_with'] = ['q_ghost'];
    });
    expect(result.of('exclusive/unknown-question')[0]?.id).toBe('q_one');
  });

  it('warns when the relationship is only declared on one side', () => {
    const result = check((d) => {
      q(d, 'q_one')['exclusive_with'] = ['q_two'];
    });
    const issue = result.of('exclusive/asymmetric')[0];
    expect(issue?.severity).toBe('warning');
    expect(issue?.hint).toMatch(/exclusive_with: \[q_one\]/);
  });

  it('is quiet when both sides declare it', () => {
    const result = check((d) => {
      q(d, 'q_one')['exclusive_with'] = ['q_two'];
      q(d, 'q_two')['exclusive_with'] = ['q_one'];
    });
    expect(result.of('exclusive/asymmetric')).toEqual([]);
  });
});

describe('answer interpolation', () => {
  it('accepts a reference the requires clause guarantees', () => {
    expect(check().of('interp/not-guaranteed')).toEqual([]);
  });

  it('catches an unsupported expression', () => {
    const result = check((d) => {
      q(d, 'q_one')['text'] = 'A stem mentioning {{respondent.name}}.';
    });
    expect(result.of('interp/unsupported-expression')[0]?.hint).toMatch(/answers\.<question_id>/);
  });

  it('catches a reference to a question that does not exist', () => {
    const result = check((d) => {
      q(d, 'q_two')['text'] = 'You said "{{answers.q_ghost.short}}". And?';
    });
    expect(result.of('interp/unknown-question')[0]?.id).toBe('q_two');
  });

  it('catches a question interpolating itself', () => {
    const result = check((d) => {
      q(d, 'q_two')['text'] = 'You said "{{answers.q_two.short}}". And?';
    });
    expect(result.of('interp/self')[0]?.id).toBe('q_two');
  });

  it('catches a reference nothing guarantees was answered', () => {
    const result = check((d) => {
      delete q(d, 'q_two')['requires'];
    });
    const issue = result.of('interp/not-guaranteed')[0];
    expect(issue?.severity).toBe('error');
    expect(issue?.hint).toMatch(/answered: \{ q_one: \[\.\.\.\] \}/);
  });

  it('does not accept a guarantee that sits under any', () => {
    const result = check((d) => {
      q(d, 'q_two')['requires'] = {
        any: [{ answered: { q_one: ['opt_first'] } }, { depth_unlocked_gte: 2 }],
      };
    });
    expect(result.of('interp/not-guaranteed')[0]?.id).toBe('q_two');
  });

  it('accepts a guarantee nested inside all', () => {
    const result = check((d) => {
      q(d, 'q_two')['requires'] = {
        all: [{ depth_unlocked_gte: 2 }, { all: [{ answered: { q_one: ['opt_first'] } }] }],
      };
    });
    expect(result.of('interp/not-guaranteed')).toEqual([]);
  });

  it('catches .short on a question whose options do not all have one', () => {
    const result = check((d) => {
      delete (q(d, 'q_one')['options'] as Json[]).map((o) => o as Record_)[1]?.['short'];
    });
    const issue = result.of('interp/missing-short')[0];
    expect(issue?.message).toMatch(/opt_second/);
  });

  it('warns when .label is interpolated and some labels are long', () => {
    const result = check((d) => {
      q(d, 'q_two')['text'] = 'You said "{{answers.q_one.label}}". And?';
      (q(d, 'q_one')['options'] as Json[]).forEach((o) => {
        (o as Record_)['label'] = 'x'.repeat(100);
      });
    });
    const issue = result.of('interp/long-label')[0];
    expect(issue?.severity).toBe('warning');
    expect(issue?.hint).toMatch(/\.short/);
  });

  it('accepts .label when every label is short', () => {
    const result = check((d) => {
      q(d, 'q_two')['text'] = 'You said "{{answers.q_one.label}}". And?';
      (q(d, 'q_one')['options'] as Json[]).forEach((o) => {
        (o as Record_)['label'] = 'A short one.';
      });
    });
    expect(result.of('interp/long-label')).toEqual([]);
  });

  it('checks tooltips as well as stems', () => {
    const result = check((d) => {
      q(d, 'q_one')['tooltip'] = 'See {{answers.q_ghost.label}}.';
    });
    expect(result.of('interp/unknown-question')[0]?.path).toBe('tooltip');
  });
});

describe('question coverage', () => {
  it('warns about a question no ideology holds a stance on', () => {
    const result = check((d) => {
      (q(d, 'q_one')['options'] as Json[]).push({ id: 'opt_fourth', label: 'A fourth position.' });
      fam(d, 'fam_a')['stances'] = {};
      fam(d, 'fam_b')['stances'] = {};
    });
    expect(result.of('question/no-stances').map((i) => i.id)).toContain('q_one');
  });

  it('exempts a question that carries modifier tags', () => {
    const result = check((d) => {
      fam(d, 'fam_a')['stances'] = {};
      fam(d, 'fam_b')['stances'] = {};
      q(d, 'q_one')['modifier_tags'] = { opt_first: 'ecology' };
    });
    expect(result.of('question/no-stances').map((i) => i.id)).not.toContain('q_one');
  });

  it('does not count a weight-0 stance as coverage', () => {
    const result = check((d) => {
      fam(d, 'fam_a')['stances'] = { q_one: { accept: [], weight: 0 } };
      fam(d, 'fam_b')['stances'] = {};
    });
    expect(result.of('question/no-stances').map((i) => i.id)).toContain('q_one');
  });
});
