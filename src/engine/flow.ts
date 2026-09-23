/**
 * Question selection: what to ask next, and when to stop (SPEC.md §6–§7).
 *
 * Pure and replayed, like the posterior. The forced-follow-up queue, boosts,
 * unlocks and modifier coverage are all *derived* from the answer list on every
 * call rather than kept as mutable state, so going back or restoring a shared
 * URL reproduces exactly the same next question. No randomness: ties break by
 * content order.
 *
 * Precedence, highest first:
 *   1. the mode's question budget (hard stop)
 *   2. forced follow-ups, oldest first
 *   3. the modifier quota — interleaved, and blocking an early stop
 *   4. adaptive selection by expected information gain
 */

import type { NormalisedQuestion } from '../content/load.js';
import {
  IMPLICIT_OPTION_IDS,
  MODIFIER_TAGS,
  type Condition,
  type ModifierTag,
} from '../content/schema.js';
import type { EngineModel, ReportLevel } from './model.js';
import { computePosterior, familyMasses, type Answer, type Posterior } from './posterior.js';
import { resolve } from './resolve.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export type Mode = 'quick' | 'standard' | 'deep';

export interface ModeSettings {
  /** Deepest question depth the mode asks as a matter of course. */
  maxDepth: 1 | 2 | 3;
  /** Hard cap on questions asked, modifier questions included. */
  budget: number;
  /**
   * `modifier_quota`: modifier questions the mode must ask before it may
   * finish. They count toward `budget`. Without a quota, modifier-only
   * questions — which carry no stances and so have zero information gain —
   * would never be selected and the result's modifier tags would stay empty.
   */
  modifierQuota: number;
  /** Questions one level deeper that the mode may ask when they clearly win. */
  deeperAllowance: number;
  /**
   * The deepest level this mode may name (SPEC.md §8.1).
   *
   * Quick asks tier-1 questions, and tier-1 questions cannot tell four of the
   * thirteen families apart — they agree on every everyday value a respondent
   * holds. Capping the report at `group` is what stops Quick naming a family,
   * or a sect, on evidence that never supported one.
   */
  maxReportLevel: ReportLevel;
}

export interface FlowConfig {
  modes: Record<Mode, ModeSettings>;
  /** Adaptive questions asked before modifier questions start being interleaved. */
  modifierInterleaveAfter: number;
  /** A deeper question is taken only if its gain is this multiple of the best in-depth one. */
  deeperGainFactor: number;
  /** Below this expected gain, in bits, adaptive selection has nothing left to learn. */
  minInformationGain: number;
  /** Never stop as "confident" on fewer answers than this. */
  minAnswersBeforeConfidentStop: number;
  /** Forced follow-ups pending at once; extras degrade to a boost (SPEC.md §7.2). */
  forcedQueueCap: number;
}

export const DEFAULT_FLOW_CONFIG: FlowConfig = {
  modes: {
    quick: { maxDepth: 1, budget: 15, modifierQuota: 3, deeperAllowance: 3, maxReportLevel: 'group' },
    standard: { maxDepth: 2, budget: 35, modifierQuota: 6, deeperAllowance: 0, maxReportLevel: 'tendency' },
    deep: { maxDepth: 3, budget: 60, modifierQuota: 8, deeperAllowance: 0, maxReportLevel: 'sect' },
  },
  modifierInterleaveAfter: 4,
  deeperGainFactor: 1.5,
  minInformationGain: 0.02,
  minAnswersBeforeConfidentStop: 8,
  forcedQueueCap: 3,
};

// -----------------------------------------------------------------------------
// Results
// -----------------------------------------------------------------------------

export type SelectionReason =
  | { type: 'forced_follow_up'; from: string }
  | { type: 'information_gain'; eig: number; boost: number }
  /** Asked to measure a cross-cutting dimension the respondent has not yet been asked about. */
  | { type: 'modifier_coverage'; tag: ModifierTag };

export type StopReason = 'budget' | 'confident' | 'no_information' | 'exhausted';

export type FlowStep =
  | { done: false; question: NormalisedQuestion; reason: SelectionReason }
  | { done: true; stopReason: StopReason; modifierQuotaMet: boolean };

// -----------------------------------------------------------------------------
// Derived state
// -----------------------------------------------------------------------------

interface FlowState {
  asked: Set<string>;
  answerOf: Map<string, string[]>;
  /** Forced targets in order, with the question that forced each. */
  forced: { target: string; from: string }[];
  boosts: Map<string, number>;
  unlocked: Set<string>;
  measuredTags: Set<ModifierTag>;
  modifierAsked: number;
  deeperAsked: number;
  /** Primary tag of the most recent question, for the diversity penalty. */
  lastTag: string | null;
}

const MAX_BOOST = 4;

const isModifierQuestion = (q: NormalisedQuestion): boolean =>
  !!q.modifier_tags && Object.keys(q.modifier_tags).length > 0;

const tagsOf = (q: NormalisedQuestion): ModifierTag[] =>
  q.modifier_tags ? [...new Set(Object.values(q.modifier_tags))] : [];

function deriveState(
  model: EngineModel,
  answers: readonly Answer[],
  settings: ModeSettings,
  config: FlowConfig,
): FlowState {
  const state: FlowState = {
    asked: new Set(),
    answerOf: new Map(),
    forced: [],
    boosts: new Map(),
    unlocked: new Set(),
    measuredTags: new Set(),
    modifierAsked: 0,
    deeperAsked: 0,
    lastTag: null,
  };

  for (const answer of answers) {
    const question = model.content.questionById.get(answer.questionId);
    state.asked.add(answer.questionId);
    state.answerOf.set(answer.questionId, answer.optionIds);
    if (!question) continue;

    if (question.depth > settings.maxDepth) state.deeperAsked += 1;
    if (isModifierQuestion(question)) {
      state.modifierAsked += 1;
      for (const tag of tagsOf(question)) state.measuredTags.add(tag);
    }
    state.lastTag = question.tags[0] ?? null;

    for (const followUp of question.follow_ups) {
      if (!followUp.when.answer_in.some((id) => answer.optionIds.includes(id))) continue;
      for (const target of followUp.ask) {
        if (followUp.mode === 'unlock') {
          state.unlocked.add(target);
        } else if (followUp.mode === 'boost') {
          bump(state, target, followUp.boost ?? 1.5);
        } else {
          const pending = state.forced.filter((f) => !state.asked.has(f.target)).length;
          // Past the cap a force degrades to a strong boost, so no authored
          // chain can take over a whole session.
          if (pending >= config.forcedQueueCap) bump(state, target, 3);
          else state.forced.push({ target, from: question.id });
        }
      }
    }
  }
  return state;
}

function bump(state: FlowState, target: string, factor: number): void {
  state.boosts.set(target, Math.min(MAX_BOOST, (state.boosts.get(target) ?? 1) * factor));
}

// -----------------------------------------------------------------------------
// Gating
// -----------------------------------------------------------------------------

function evaluate(
  condition: Condition,
  state: FlowState,
  familyMass: Map<string, number>,
  settings: ModeSettings,
): boolean {
  if ('all' in condition) return condition.all.every((c) => evaluate(c, state, familyMass, settings));
  if ('any' in condition) return condition.any.some((c) => evaluate(c, state, familyMass, settings));
  if ('not' in condition) return !evaluate(condition.not, state, familyMass, settings);
  if ('answered' in condition) {
    return Object.entries(condition.answered).every(([questionId, options]) => {
      const chosen = state.answerOf.get(questionId);
      if (!chosen || chosen.some((id) => IMPLICIT_OPTION_IDS.includes(id))) return false;
      return chosen.some((id) => options.includes(id));
    });
  }
  if ('family_mass_gte' in condition) {
    return Object.entries(condition.family_mass_gte).every(
      ([familyId, threshold]) => (familyMass.get(familyId) ?? 0) >= threshold,
    );
  }
  return settings.maxDepth >= condition.depth_unlocked_gte;
}

function isEligible(
  question: NormalisedQuestion,
  model: EngineModel,
  state: FlowState,
  familyMass: Map<string, number>,
  settings: ModeSettings,
): boolean {
  if (state.asked.has(question.id)) return false;
  // Redundant with something already asked, in either direction.
  if (question.exclusive_with.some((id) => state.asked.has(id))) return false;
  for (const askedId of state.asked) {
    if (model.content.questionById.get(askedId)?.exclusive_with.includes(question.id)) return false;
  }
  if (state.unlocked.has(question.id)) return true;
  return !question.requires || evaluate(question.requires, state, familyMass, settings);
}

// -----------------------------------------------------------------------------
// Expected information gain (SPEC.md §6)
// -----------------------------------------------------------------------------

/**
 * Expected reduction in entropy over ideologies from asking `questionId`.
 *
 * Consistent with the within-scope update: out-of-scope ideologies take the
 * scope-average likelihood, which leaves their absolute mass unchanged by any
 * answer, so only the in-scope terms of the entropy move. Implicit options are
 * excluded — they carry no information by construction.
 */
export function expectedInformationGain(
  model: EngineModel,
  posterior: Posterior,
  questionId: string,
): number {
  const table = model.likelihood.get(questionId);
  if (!table) return 0;

  const p = posterior.probabilities;
  let scopeMass = 0;
  let before = 0;
  for (const index of table.scope) {
    const mass = p[index] as number;
    scopeMass += mass;
    if (mass > 0) before -= mass * Math.log2(mass);
  }
  if (scopeMass <= 0) return 0;

  let expectedAfter = 0;
  for (let o = 0; o < table.optionIds.length; o++) {
    let evidence = 0;
    const joint: number[] = [];
    for (const [position, index] of table.scope.entries()) {
      const value = (p[index] as number) * Math.exp((table.logLik[position] as Float64Array)[o] as number);
      joint.push(value);
      evidence += value;
    }
    const probabilityOfOption = evidence / scopeMass;
    if (probabilityOfOption <= 0) continue;

    let after = 0;
    for (const value of joint) {
      const q = value / probabilityOfOption;
      if (q > 0) after -= q * Math.log2(q);
    }
    expectedAfter += probabilityOfOption * after;
  }

  return Math.max(0, before - expectedAfter);
}

// -----------------------------------------------------------------------------
// Selection
// -----------------------------------------------------------------------------

interface Scored {
  question: NormalisedQuestion;
  eig: number;
  boost: number;
  score: number;
}

function scoreQuestion(
  question: NormalisedQuestion,
  model: EngineModel,
  posterior: Posterior,
  state: FlowState,
  answerCount: number,
): Scored {
  const eig = expectedInformationGain(model, posterior, question.id);
  const boost = state.boosts.get(question.id) ?? 1;
  // Discourage two questions in a row on the same theme, and favour depth 1
  // early so the opening narrows the field before diving into sect detail.
  const diversity = state.lastTag !== null && question.tags[0] === state.lastTag ? 0.6 : 1;
  const depthPreference = question.depth === 1 && answerCount < 5 ? 1.15 : 1;
  return { question, eig, boost, score: eig * boost * diversity * depthPreference };
}

const byScore = (model: EngineModel) => (a: Scored, b: Scored): number =>
  b.score - a.score ||
  (b.question.priority ?? 0) - (a.question.priority ?? 0) ||
  (model.questionOrder.get(a.question.id) ?? 0) - (model.questionOrder.get(b.question.id) ?? 0);

/**
 * The modifier question to ask now: one measuring a tag not yet measured
 * before any that repeats one, and among those a dual-use question — one that
 * also carries stances and so also informs the placement — before a pure one.
 */
function pickModifier(
  pool: NormalisedQuestion[],
  model: EngineModel,
  posterior: Posterior,
  state: FlowState,
): { question: NormalisedQuestion; tag: ModifierTag } | null {
  const ranked = pool
    .map((question) => {
      const fresh = tagsOf(question).filter((t) => !state.measuredTags.has(t));
      return {
        question,
        fresh,
        dualUse: model.likelihood.has(question.id) ? 1 : 0,
        eig: expectedInformationGain(model, posterior, question.id),
      };
    })
    .sort(
      (a, b) =>
        Number(b.fresh.length > 0) - Number(a.fresh.length > 0) ||
        b.dualUse - a.dualUse ||
        b.fresh.length - a.fresh.length ||
        b.eig - a.eig ||
        (model.questionOrder.get(a.question.id) ?? 0) - (model.questionOrder.get(b.question.id) ?? 0),
    );

  const best = ranked[0];
  if (!best) return null;
  const candidates = best.fresh.length > 0 ? best.fresh : tagsOf(best.question);
  // Report tags in the schema's canonical order, so the reason is stable.
  const tag = [...MODIFIER_TAGS].find((t) => candidates.includes(t)) ?? candidates[0];
  return tag ? { question: best.question, tag } : null;
}

/**
 * The next question for a respondent, or the reason the session is over.
 *
 * Deterministic: the same `(model, answers, mode, config)` always gives the
 * same step.
 */
export function nextQuestion(
  model: EngineModel,
  answers: readonly Answer[],
  mode: Mode,
  config: FlowConfig = DEFAULT_FLOW_CONFIG,
): FlowStep {
  const settings = config.modes[mode];
  const state = deriveState(model, answers, settings, config);
  const posterior = computePosterior(model, answers);
  const familyMass = new Map(familyMasses(posterior).map((f) => [f.id, f.mass]));
  const answerCount = answers.length;

  const quotaNeeded = Math.max(0, settings.modifierQuota - state.modifierAsked);
  const stop = (stopReason: StopReason, modifierPoolEmpty: boolean): FlowStep => ({
    done: true,
    stopReason,
    modifierQuotaMet: quotaNeeded === 0 || modifierPoolEmpty,
  });

  if (answerCount >= settings.budget) return stop('budget', false);

  // --- 1. forced follow-ups --------------------------------------------------
  for (const entry of state.forced) {
    const question = model.content.questionById.get(entry.target);
    if (!question || question.depth > settings.maxDepth) continue;
    if (!isEligible(question, model, state, familyMass, settings)) continue;
    return { done: false, question, reason: { type: 'forced_follow_up', from: entry.from } };
  }

  // --- pools --------------------------------------------------------------------
  const inDepth: Scored[] = [];
  const deeper: Scored[] = [];
  const modifierPool: NormalisedQuestion[] = [];
  for (const question of model.content.questions) {
    const withinDepth = question.depth <= settings.maxDepth;
    const oneDeeper =
      question.depth === settings.maxDepth + 1 && state.deeperAsked < settings.deeperAllowance;
    if (!withinDepth && !oneDeeper) continue;
    if (!isEligible(question, model, state, familyMass, settings)) continue;
    const scored = scoreQuestion(question, model, posterior, state, answerCount);
    if (withinDepth) {
      inDepth.push(scored);
      if (isModifierQuestion(question)) modifierPool.push(question);
    } else {
      deeper.push(scored);
    }
  }
  inDepth.sort(byScore(model));
  deeper.sort(byScore(model));

  // --- 2. modifier quota ----------------------------------------------------------
  const modifierStep = (): FlowStep | null => {
    const pick = pickModifier(modifierPool, model, posterior, state);
    return pick
      ? { done: false, question: pick.question, reason: { type: 'modifier_coverage', tag: pick.tag } }
      : null;
  };

  if (quotaNeeded > 0 && modifierPool.length > 0) {
    const remaining = settings.budget - answerCount;
    // Spread the quota across the session rather than bunching it at the end.
    const spacing = Math.max(
      1,
      Math.floor((settings.budget - config.modifierInterleaveAfter) / (settings.modifierQuota + 1)),
    );
    const due =
      answerCount >= config.modifierInterleaveAfter
        ? Math.floor((answerCount - config.modifierInterleaveAfter) / spacing) + 1
        : 0;
    if (remaining <= quotaNeeded || state.modifierAsked < due) {
      const step = modifierStep();
      if (step) return step;
    }
  }

  // --- 3. adaptive ------------------------------------------------------------------
  const bestIn = inDepth[0];
  const bestDeeper = deeper[0];
  const useDeeper =
    bestDeeper !== undefined &&
    bestDeeper.eig >= config.minInformationGain &&
    bestDeeper.score >= config.deeperGainFactor * (bestIn?.score ?? 0);
  const best = useDeeper ? bestDeeper : bestIn;

  // A stop is only allowed once the modifier quota is met or cannot be met.
  const quotaBlocksStop = quotaNeeded > 0 && modifierPool.length > 0;
  const tryStop = (reason: StopReason): FlowStep => {
    if (quotaBlocksStop) {
      const step = modifierStep();
      if (step) return step;
    }
    return stop(reason, modifierPool.length === 0);
  };

  if (!best) return tryStop('exhausted');
  if (best.eig < config.minInformationGain) return tryStop('no_information');

  if (answerCount >= config.minAnswersBeforeConfidentStop) {
    const result = resolve(posterior, settings.maxReportLevel);
    // SPEC.md §7.4: `confident` means the resolver reached a *sect-level*
    // answer — one it could not have made more specific. A result that stopped
    // because the mode may not report anything narrower is not that: more
    // questions could still change which group or tendency comes back, so
    // stopping on it would end Quick at eight or nine questions and call a
    // group on evidence the mode had budget left to improve.
    if (result.kind === 'resolved' && result.backOffReason === null) return tryStop('confident');
  }

  return {
    done: false,
    question: best.question,
    reason: { type: 'information_gain', eig: best.eig, boost: best.boost },
  };
}
