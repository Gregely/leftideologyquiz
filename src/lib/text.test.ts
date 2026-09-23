import { describe, expect, it } from 'vitest';
import { rosterContent } from '../../tests/fixtures/roster.js';
import { seededShuffle } from './shuffle.js';
import { interpolate, quoteAnswer, roughPercent, UNQUOTABLE_ANSWER } from './text.js';

const content = rosterContent();

describe('quoteAnswer', () => {
  it('prefers the short form and falls back to the label', () => {
    const answers = [{ questionId: 'q_family', optionIds: ['pick_red'] }];
    expect(quoteAnswer(content, answers, 'q_family')).toBe('red');
    expect(quoteAnswer(content, answers, 'q_family', 'label')).toBe('The red answer.');
    const noShort = [{ questionId: 'q_family', optionIds: ['pick_neither'] }];
    expect(quoteAnswer(content, noShort, 'q_family')).toMatch(/^Neither of those/);
  });

  it('will not quote an unsure answer or a missing one', () => {
    expect(quoteAnswer(content, [{ questionId: 'q_family', optionIds: ['unsure'] }], 'q_family')).toBeNull();
    expect(quoteAnswer(content, [], 'q_family')).toBeNull();
  });
});

describe('interpolate', () => {
  it('fills both forms, and falls back when the answer is missing', () => {
    const answers = [{ questionId: 'q_family', optionIds: ['pick_blue'] }];
    expect(interpolate(content, answers, 'A {{answers.q_family.short}} / {{ answers.q_family.label }}')).toBe(
      'A blue / The blue answer.',
    );
    expect(interpolate(content, [], 'You said {{answers.q_family.short}}.')).toBe(
      `You said ${UNQUOTABLE_ANSWER}.`,
    );
  });

  it('leaves text without markers alone', () => {
    expect(interpolate(content, [], 'Plain text.')).toBe('Plain text.');
  });
});

describe('roughPercent', () => {
  it('rounds to whole numbers and never shows a false 0% or 100%', () => {
    expect(roughPercent(0.3449)).toBe('34%');
    expect(roughPercent(0.001)).toBe('<1%');
    expect(roughPercent(0)).toBe('<1%');
    expect(roughPercent(0.9996)).toBe('>99%');
    expect(roughPercent(1)).toBe('100%');
    expect(roughPercent(Number.NaN)).toBe('<1%');
  });
});

describe('seededShuffle', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('is a permutation, and leaves the input alone', () => {
    const copy = [...items];
    expect(seededShuffle(items, 3, 'q').sort()).toEqual(copy);
    expect(items).toEqual(copy);
  });

  it('is stable for the same seed and key', () => {
    expect(seededShuffle(items, 42, 'q1')).toEqual(seededShuffle(items, 42, 'q1'));
  });

  it('varies across keys within one seed', () => {
    const orders = new Set(Array.from({ length: 20 }, (_, i) => seededShuffle(items, 42, `q${i}`).join()));
    expect(orders.size).toBeGreaterThan(1);
  });
});
