/**
 * Normalisation and stance inheritance — the parts of loading that change what
 * downstream code sees, and so must be pinned down precisely.
 */

import { describe, expect, it } from 'vitest';
import { ancestorChain, parseContent, resolveStances, type Content } from '../src/content/load.js';
import { fixture, q, ideo, type Record_ } from './fixtures/base.js';

function load(mutate?: Parameters<typeof fixture>[0]): Content {
  const result = parseContent(fixture(mutate));
  if (!result.content) throw new Error(`fixture failed to load: ${JSON.stringify(result.issues)}`);
  return result.content;
}

describe('implicit options', () => {
  it('appends unsure and unknown_term to every question', () => {
    const content = load();
    for (const question of content.questions) {
      const implicit = question.options.filter((o) => o.implicit).map((o) => o.id);
      expect(implicit).toEqual(['unsure', 'unknown_term']);
    }
  });

  it('keeps authored options first and in file order', () => {
    const content = load();
    const question = content.questionById.get('q_one');
    expect(question?.options.map((o) => o.id)).toEqual([
      'opt_first',
      'opt_second',
      'opt_third',
      'unsure',
      'unknown_term',
    ]);
  });

  it('excludes implicit options from the scorable set', () => {
    const content = load();
    expect([...(content.scorableOptionIds.get('q_one') ?? [])]).toEqual([
      'opt_first',
      'opt_second',
      'opt_third',
    ]);
    expect(content.optionIds.get('q_one')?.has('unsure')).toBe(true);
    expect(content.scorableOptionIds.get('q_one')?.has('unsure')).toBe(false);
  });

  it('injects the canonical five points into a likert5 before the implicit two', () => {
    const content = load();
    expect(content.questionById.get('q_three')?.options.map((o) => o.id)).toEqual([
      'strongly_agree',
      'agree',
      'neutral',
      'disagree',
      'strongly_disagree',
      'unsure',
      'unknown_term',
    ]);
  });

  it('leaves authored likert labels alone when they are restated', () => {
    const content = load((d) => {
      q(d, 'q_three')['options'] = [
        { id: 'strongly_agree', label: 'Could not agree more' },
        { id: 'agree', label: 'Agree' },
        { id: 'neutral', label: 'No view' },
        { id: 'disagree', label: 'Disagree' },
        { id: 'strongly_disagree', label: 'Could not disagree more' },
      ];
    });
    expect(content.questionById.get('q_three')?.options[0]?.label).toBe('Could not agree more');
  });
});

describe('ancestorChain', () => {
  it('returns ancestors outermost first, ending with the ideology itself', () => {
    const content = load();
    const { chain, cyclic } = ancestorChain(content, 'ideo_child');
    expect(chain.map((i) => i.id)).toEqual(['ideo_parent', 'ideo_child']);
    expect(cyclic).toBe(false);
  });

  it('returns just the ideology when it has no tendency', () => {
    const content = load();
    expect(ancestorChain(content, 'ideo_parent').chain.map((i) => i.id)).toEqual(['ideo_parent']);
  });

  it('stops at a repeat rather than looping forever', () => {
    const content = load((d) => {
      ideo(d, 'ideo_parent')['tendency'] = 'ideo_child';
    });
    const { cyclic } = ancestorChain(content, 'ideo_child');
    expect(cyclic).toBe(true);
  });
});

describe('resolveStances', () => {
  it('inherits family defaults', () => {
    const resolved = resolveStances(load(), 'ideo_parent');
    const stance = resolved.byQuestion.get('q_one');
    expect(stance?.stance.accept).toEqual(['opt_first']);
    expect(stance?.from).toEqual({ level: 'family', id: 'fam_a' });
  });

  it('records where each stance came from', () => {
    const resolved = resolveStances(load(), 'ideo_child');
    expect(resolved.byQuestion.get('q_one')?.from).toEqual({ level: 'family', id: 'fam_a' });
    expect(resolved.byQuestion.get('q_two')?.from).toEqual({ level: 'self', id: 'ideo_child' });
  });

  it('lets a tendency parent override a family default', () => {
    const resolved = resolveStances(
      load((d) => {
        (ideo(d, 'ideo_parent')['stances'] as Record_)['q_one'] = {
          accept: ['opt_second'],
          weight: 2,
        };
      }),
      'ideo_child',
    );
    expect(resolved.byQuestion.get('q_one')?.stance.accept).toEqual(['opt_second']);
    expect(resolved.byQuestion.get('q_one')?.from).toEqual({ level: 'tendency', id: 'ideo_parent' });
  });

  it('lets the ideology override its parent', () => {
    const resolved = resolveStances(load(), 'ideo_child');
    expect(resolved.byQuestion.get('q_two')?.stance.accept).toEqual(['two_beta']);
    expect(resolved.byQuestion.get('q_two')?.stance.weight).toBe(3);
  });

  it('replaces an inherited stance wholesale rather than merging it', () => {
    // The family rejects opt_third; the override says nothing about reject, so
    // the resolved stance must not carry the family's rejection forward.
    const resolved = resolveStances(
      load((d) => {
        (ideo(d, 'ideo_child')['stances'] as Record_)['q_one'] = {
          accept: ['opt_second'],
          weight: 1,
        };
      }),
      'ideo_child',
    );
    expect(resolved.byQuestion.get('q_one')?.stance.reject).toEqual([]);
  });

  it('drops an inherited stance on null', () => {
    const resolved = resolveStances(
      load((d) => {
        (ideo(d, 'ideo_child')['stances'] as Record_)['q_one'] = null;
      }),
      'ideo_child',
    );
    expect(resolved.byQuestion.has('q_one')).toBe(false);
    expect(resolved.cleared).toEqual(['q_one']);
    expect(resolved.clearedNothing).toEqual([]);
  });

  it('reports a null that had nothing to clear', () => {
    const resolved = resolveStances(
      load((d) => {
        (ideo(d, 'ideo_child')['stances'] as Record_)['q_three'] = null;
      }),
      'ideo_child',
    );
    expect(resolved.clearedNothing).toEqual(['q_three']);
    expect(resolved.cleared).toEqual([]);
  });

  it('does not let one ideology clearing a stance affect its sibling', () => {
    const content = load((d) => {
      (ideo(d, 'ideo_child')['stances'] as Record_)['q_one'] = null;
    });
    expect(resolveStances(content, 'ideo_parent').byQuestion.has('q_one')).toBe(true);
    expect(resolveStances(content, 'ideo_child').byQuestion.has('q_one')).toBe(false);
  });

  it('is unaffected by the order resolution is called in', () => {
    const content = load();
    const first = resolveStances(content, 'ideo_child').byQuestion.get('q_two')?.stance;
    resolveStances(content, 'ideo_parent');
    const second = resolveStances(content, 'ideo_child').byQuestion.get('q_two')?.stance;
    expect(second).toEqual(first);
  });

  it('reports a cyclic chain instead of hanging', () => {
    const content = load((d) => {
      ideo(d, 'ideo_parent')['tendency'] = 'ideo_child';
    });
    expect(resolveStances(content, 'ideo_child').cyclic).toBe(true);
  });

  it('returns nothing for an unknown ideology rather than throwing', () => {
    const resolved = resolveStances(load(), 'no_such_ideology');
    expect(resolved.byQuestion.size).toBe(0);
    expect(resolved.cyclic).toBe(false);
  });
});

describe('indexes', () => {
  it('groups ideologies by family in file order', () => {
    const content = load();
    expect(content.ideologiesByFamily.get('fam_a')?.map((i) => i.id)).toEqual([
      'ideo_parent',
      'ideo_child',
    ]);
    expect(content.ideologiesByFamily.get('fam_b')?.map((i) => i.id)).toEqual(['ideo_other']);
  });
});
