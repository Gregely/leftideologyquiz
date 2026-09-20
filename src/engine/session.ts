/**
 * Session state: the answers, and nothing else.
 *
 * The posterior is never stored or transported — it is recomputed from the
 * answers by `computePosterior`. That is what makes going back, editing an
 * earlier answer, restoring a refresh and opening a shared URL the same
 * operation, with no separate undo path that could drift out of step.
 *
 * Every function here is immutable: they return a new session.
 */

import type { Content } from '../content/load.js';
import { IMPLICIT_OPTION_IDS } from '../content/schema.js';
import type { Answer } from './posterior.js';

export interface Session {
  /** In the order they were given. Order matters: replay is sequential. */
  answers: Answer[];
}

export function emptySession(): Session {
  return { answers: [] };
}

/**
 * Record an answer. Answering a question that was already answered replaces it
 * in place, keeping its original position, so editing an earlier answer does
 * not reorder the replay.
 */
export function answerQuestion(
  session: Session,
  questionId: string,
  optionIds: string[],
): Session {
  const entry: Answer = { questionId, optionIds: [...optionIds] };
  const existing = session.answers.findIndex((a) => a.questionId === questionId);
  if (existing === -1) return { answers: [...session.answers, entry] };

  const answers = [...session.answers];
  answers[existing] = entry;
  return { answers };
}

/** Drop the most recent answer. */
export function goBack(session: Session): Session {
  return { answers: session.answers.slice(0, -1) };
}

/** Keep the first `count` answers and drop the rest. */
export function truncate(session: Session, count: number): Session {
  return { answers: session.answers.slice(0, Math.max(0, count)) };
}

export function answersById(session: Session): Map<string, string[]> {
  return new Map(session.answers.map((a) => [a.questionId, a.optionIds]));
}

export function hasAnswered(session: Session, questionId: string): boolean {
  return session.answers.some((a) => a.questionId === questionId);
}

/** Answers that will move the posterior — implicit options never do. */
export function scoringAnswers(session: Session): Answer[] {
  return session.answers.filter(
    (a) => a.optionIds.length > 0 && !a.optionIds.some((id) => IMPLICIT_OPTION_IDS.includes(id)),
  );
}

// -----------------------------------------------------------------------------
// Serialisation
// -----------------------------------------------------------------------------

const FORMAT_VERSION = 'v1';

/**
 * Compact, URL-fragment-safe encoding: `v1~qid:opt,opt~qid:opt`.
 *
 * Ids rather than indices, deliberately. An index-based encoding would silently
 * decode into different answers the moment the bank is reordered; an id-based
 * one decodes into the same answers or reports that it cannot.
 */
export function serialiseSession(session: Session): string {
  const parts = session.answers.map(
    (a) => `${a.questionId}:${a.optionIds.join(',')}`,
  );
  return [FORMAT_VERSION, ...parts].join('~');
}

export interface DeserialiseResult {
  session: Session;
  /** Answers that were dropped, with the reason. Never throws. */
  dropped: { raw: string; reason: string }[];
  /** True when the string was not in a format this version understands. */
  unreadable: boolean;
}

/**
 * Decode a session, discarding anything that no longer refers to real content.
 *
 * Never throws: a mangled or stale URL has to degrade to "start over" rather
 * than to a blank screen, and a partial restore is more useful than none.
 */
export function deserialiseSession(content: Content, encoded: string): DeserialiseResult {
  const dropped: { raw: string; reason: string }[] = [];
  const trimmed = encoded.trim().replace(/^#/, '');

  if (trimmed === '') return { session: emptySession(), dropped, unreadable: false };

  const [version, ...parts] = trimmed.split('~');
  if (version !== FORMAT_VERSION) {
    return { session: emptySession(), dropped, unreadable: true };
  }

  const answers: Answer[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    if (part === '') continue;

    const separator = part.indexOf(':');
    if (separator === -1) {
      dropped.push({ raw: part, reason: 'not in question:options form' });
      continue;
    }

    const questionId = part.slice(0, separator);
    const optionIds = part
      .slice(separator + 1)
      .split(',')
      .filter((id) => id !== '');

    const question = content.questionById.get(questionId);
    if (!question) {
      dropped.push({ raw: part, reason: `no question "${questionId}"` });
      continue;
    }
    if (seen.has(questionId)) {
      dropped.push({ raw: part, reason: `question "${questionId}" answered twice` });
      continue;
    }
    if (optionIds.length === 0) {
      dropped.push({ raw: part, reason: `no options given for "${questionId}"` });
      continue;
    }

    const known = content.optionIds.get(questionId) ?? new Set<string>();
    const unknown = optionIds.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      dropped.push({ raw: part, reason: `no option(s) ${unknown.join(', ')} on "${questionId}"` });
      continue;
    }
    if (question.kind !== 'multi' && question.kind !== 'ranking' && optionIds.length > 1) {
      dropped.push({ raw: part, reason: `"${questionId}" takes one answer, got ${optionIds.length}` });
      continue;
    }

    seen.add(questionId);
    answers.push({ questionId, optionIds });
  }

  return { session: { answers }, dropped, unreadable: false };
}
