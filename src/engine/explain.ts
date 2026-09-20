/**
 * Explaining a result, and the modifier tags that sit alongside it.
 *
 * Both read only what the replay already recorded. There is no separate
 * explanation model and no narrative layer: if the engine cannot point at the
 * answers that produced a result, the result should not be shown (SPEC.md §8.4).
 */

import type { Content } from '../content/load.js';
import type { ModifierTag } from '../content/schema.js';
import { IMPLICIT_OPTION_IDS, MODIFIER_TAG_LABELS } from '../content/schema.js';
import type { Answer, Posterior } from './posterior.js';
import { massOfIdeology } from './posterior.js';
import { contributionsFor, type AnswerContribution } from './resolve.js';

// -----------------------------------------------------------------------------
// explainMatch
// -----------------------------------------------------------------------------

export interface MatchExplanation {
  ideologyId: string;
  name: string;
  mass: number;
  /** Answers that argued for this ideology, strongest first. */
  raised: AnswerContribution[];
  /** Answers that argued against it, strongest first. */
  lowered: AnswerContribution[];
  /** Every scoring answer, by absolute effect. */
  all: AnswerContribution[];
}

/**
 * Which answers moved this ideology, and by how much.
 *
 * Contributions are log-Bayes factors against the field: positive means the
 * answer made this ideology more likely than the average ideology, negative
 * less. An answer nobody in scope distinguishes on scores near zero.
 */
export function explainMatch(
  posterior: Posterior,
  ideologyId: string,
  limit = 5,
): MatchExplanation {
  const all = contributionsFor(posterior, ideologyId);

  return {
    ideologyId,
    name: posterior.model.content.ideologyById.get(ideologyId)?.name ?? ideologyId,
    mass: massOfIdeology(posterior, ideologyId),
    raised: all
      .filter((c) => c.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, limit),
    lowered: all
      .filter((c) => c.contribution < 0)
      .sort((a, b) => a.contribution - b.contribution)
      .slice(0, limit),
    all,
  };
}

// -----------------------------------------------------------------------------
// modifierTags
// -----------------------------------------------------------------------------

export interface EarnedModifierTag {
  tag: ModifierTag;
  /** Display name from MODIFIER_TAG_LABELS. */
  label: string;
  /** Answers that awarded this tag. */
  earned: number;
  /** Answered questions that could have awarded it. */
  available: number;
  /** earned / available, in [0, 1]. */
  strength: number;
  questionIds: string[];
}

/**
 * Cross-cutting dimensions earned from the answers themselves.
 *
 * Deliberately computed from answers and `modifier_tags` alone — no stances, no
 * posterior, no ideologies. An ecological or decolonial emphasis is a fact
 * about what someone answered, and it should read the same whether the test
 * placed them among anarchists or social democrats.
 */
export function modifierTagsFromAnswers(
  content: Content,
  answers: readonly Answer[],
): EarnedModifierTag[] {
  const earned = new Map<ModifierTag, { count: number; questionIds: string[] }>();
  const available = new Map<ModifierTag, number>();

  for (const answer of answers) {
    const question = content.questionById.get(answer.questionId);
    const tags = question?.modifier_tags;
    if (!question || !tags) continue;
    if (answer.optionIds.length === 0) continue;
    if (answer.optionIds.some((id) => IMPLICIT_OPTION_IDS.includes(id))) continue;

    // Answering at all makes every tag this question can award available,
    // so strength reads as "of the chances you had, how many you took".
    for (const tag of new Set(Object.values(tags))) {
      available.set(tag, (available.get(tag) ?? 0) + 1);
    }

    for (const optionId of answer.optionIds) {
      const tag = tags[optionId];
      if (!tag) continue;
      const entry = earned.get(tag) ?? { count: 0, questionIds: [] };
      if (!entry.questionIds.includes(question.id)) {
        entry.count += 1;
        entry.questionIds.push(question.id);
      }
      earned.set(tag, entry);
    }
  }

  return [...earned.entries()]
    .map(([tag, entry]) => {
      const chances = available.get(tag) ?? entry.count;
      return {
        tag,
        label: MODIFIER_TAG_LABELS[tag],
        earned: entry.count,
        available: chances,
        strength: chances > 0 ? entry.count / chances : 0,
        questionIds: entry.questionIds,
      };
    })
    .sort((a, b) => b.strength - a.strength || b.earned - a.earned || a.tag.localeCompare(b.tag));
}

/** Modifier tags for a computed state. Reads only its answers. */
export function modifierTags(posterior: Posterior): EarnedModifierTag[] {
  return modifierTagsFromAnswers(posterior.model.content, posterior.answers);
}
