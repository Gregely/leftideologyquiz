/**
 * Turning content prose into what the respondent reads.
 */

import type { Content } from '../content/load.js';
import { IMPLICIT_OPTION_IDS } from '../content/schema.js';
import type { Answer } from '../engine/index.js';

const INTERPOLATION = /\{\{\s*answers\.([a-z][a-z0-9_]*)\.(short|label)\s*\}\}/g;

/** Said in place of an earlier answer that cannot be quoted. */
export const UNQUOTABLE_ANSWER = 'your earlier answer';

/**
 * How an earlier answer is quoted back: the option's `short` where there is one,
 * its label otherwise. Several options of a multi-select are joined.
 */
export function quoteAnswer(
  content: Content,
  answers: readonly Answer[],
  questionId: string,
  form: 'short' | 'label' = 'short',
): string | null {
  const answer = answers.find((a) => a.questionId === questionId);
  const question = content.questionById.get(questionId);
  if (!answer || !question || answer.optionIds.length === 0) return null;
  // "Because you answered 'not sure'" is not a reason anyone was asked anything.
  if (answer.optionIds.some((id) => IMPLICIT_OPTION_IDS.includes(id))) return null;

  const parts = answer.optionIds.map((id) => {
    const option = question.options.find((o) => o.id === id);
    if (!option) return id;
    return form === 'short' ? (option.short ?? option.label) : option.label;
  });
  return parts.join('; ');
}

/**
 * Fill `{{answers.<qid>.short}}` and `{{answers.<qid>.label}}` from the answers
 * given so far. `validate` guarantees a question that interpolates is gated on
 * the one it quotes, so the fallback is for a malformed or stale session only.
 */
export function interpolate(content: Content, answers: readonly Answer[], text: string): string {
  return text.replace(INTERPOLATION, (_match, questionId: string, form: 'short' | 'label') =>
    quoteAnswer(content, answers, questionId, form) ?? UNQUOTABLE_ANSWER,
  );
}

/** Label for one option, or its id if the content no longer has it. */
export function optionLabel(content: Content, questionId: string, optionId: string): string {
  return (
    content.questionById.get(questionId)?.options.find((o) => o.id === optionId)?.label ?? optionId
  );
}

/** Rough percentage for display: whole numbers, and never a false "0%". */
export function roughPercent(mass: number): string {
  if (!Number.isFinite(mass) || mass <= 0) return '<1%';
  const percent = Math.round(mass * 100);
  if (percent < 1) return '<1%';
  if (percent > 99 && mass < 1) return '>99%';
  return `${percent}%`;
}
