/**
 * The posterior over ideologies, and the replay that produces it.
 *
 * Answers are the state. The posterior is always recomputed from the full
 * answer list, never patched incrementally — that is what makes going back,
 * changing an earlier answer, and restoring a shared URL all the same
 * operation, and it is why the engine has no undo logic at all.
 */

import { IMPLICIT_OPTION_IDS } from '../content/schema.js';
import type { EngineModel, NodeLevel } from './model.js';
import { familyKey, groupKey, nodeKeyFor, ROOT_ID } from './model.js';

/** One recorded answer. `optionIds` holds one id except on multi/ranking. */
export interface Answer {
  questionId: string;
  optionIds: string[];
}

export interface AnswerEffect {
  questionId: string;
  optionIds: string[];
  /** True for `unsure` / `unknown_term`, or a question no ideology scores. */
  inert: boolean;
  /**
   * Per-ideology log-Bayes-factor against the field, in `ideologyIds` order:
   * how much this answer raised or lowered each ideology relative to the
   * average ideology under the posterior at the time it was applied. Positive
   * is evidence for, negative against, zero is no information.
   */
  contribution: Float64Array;
}

export interface Posterior {
  model: EngineModel;
  answers: Answer[];
  /** Normalised probabilities over ideologies, in `ideologyIds` order. */
  probabilities: Float64Array;
  logPosterior: Float64Array;
  /** One entry per answer, in the order they were given. */
  effects: AnswerEffect[];
  /** Answers that actually moved the posterior. */
  scoringAnswerCount: number;
}

// -----------------------------------------------------------------------------
// Numerics
// -----------------------------------------------------------------------------

function normalise(logValues: Float64Array): Float64Array {
  let max = -Infinity;
  for (const v of logValues) if (v > max) max = v;
  if (!Number.isFinite(max)) return new Float64Array(logValues.length);

  const out = new Float64Array(logValues.length);
  let total = 0;
  for (let i = 0; i < logValues.length; i++) {
    const e = Math.exp((logValues[i] as number) - max);
    out[i] = e;
    total += e;
  }
  if (total === 0) return out;
  for (let i = 0; i < out.length; i++) out[i] = (out[i] as number) / total;
  return out;
}

// -----------------------------------------------------------------------------
// One answer
// -----------------------------------------------------------------------------

/**
 * Combine several chosen options into one log-likelihood.
 *
 * `multi` averages the chosen options, so picking four does not count four
 * times as hard as picking one. `ranking` weights by position, highest first.
 * Both are provisional: SPEC.md §3.2 puts richer handling of these kinds out of
 * scope for v1, and no content uses `ranking` yet.
 */
function combinedLogLikelihood(
  row: Float64Array,
  optionPositions: number[],
  kind: string,
): number {
  if (optionPositions.length === 1) return row[optionPositions[0] as number] as number;

  if (kind === 'ranking') {
    const n = optionPositions.length;
    let weighted = 0;
    let totalWeight = 0;
    for (const [rank, position] of optionPositions.entries()) {
      const weight = n - rank;
      weighted += weight * (row[position] as number);
      totalWeight += weight;
    }
    return totalWeight === 0 ? 0 : weighted / totalWeight;
  }

  let sum = 0;
  for (const position of optionPositions) sum += row[position] as number;
  return sum / optionPositions.length;
}

/**
 * Apply one answer to a log-posterior, in place, returning what it contributed.
 *
 * Ideologies outside the question's scope — those with no weighted stance on it
 * — take the scope-average likelihood rather than nothing. That leaves the
 * in-scope versus out-of-scope mass ratio untouched and redistributes only
 * within scope (SPEC.md §5.3), so a question written to separate Trotskyist
 * tendencies tells the test which Trotskyist you are without also arguing that
 * you are one.
 */
function applyAnswer(model: EngineModel, logPosterior: Float64Array, answer: Answer): AnswerEffect {
  const size = model.ideologyIds.length;
  const inert: AnswerEffect = {
    questionId: answer.questionId,
    optionIds: answer.optionIds,
    inert: true,
    contribution: new Float64Array(size),
  };

  if (answer.optionIds.length === 0) return inert;
  if (answer.optionIds.some((id) => IMPLICIT_OPTION_IDS.includes(id))) return inert;

  const question = model.content.questionById.get(answer.questionId);
  const table = model.likelihood.get(answer.questionId);
  if (!question || !table) return inert;

  const optionPositions = answer.optionIds.map((id) => table.optionIds.indexOf(id));
  if (optionPositions.some((p) => p === -1)) return inert;

  // Current posterior, needed to weight the scope average.
  const probabilities = normalise(logPosterior);

  const delta = new Float64Array(size);
  const inScope = new Uint8Array(size);

  let scopeMass = 0;
  let scopeEvidence = 0;
  for (const [position, ideologyIndex] of table.scope.entries()) {
    const logLikelihood = combinedLogLikelihood(
      table.logLik[position] as Float64Array,
      optionPositions,
      question.kind,
    );
    delta[ideologyIndex] = logLikelihood;
    inScope[ideologyIndex] = 1;
    const mass = probabilities[ideologyIndex] as number;
    scopeMass += mass;
    scopeEvidence += mass * Math.exp(logLikelihood);
  }

  // With no mass left in scope the weighted average is undefined; fall back to
  // an unweighted one so the update stays finite and order-independent.
  let scopeAverage: number;
  if (scopeMass > 0) {
    scopeAverage = Math.log(scopeEvidence / scopeMass);
  } else {
    let sum = 0;
    for (const ideologyIndex of table.scope) sum += Math.exp(delta[ideologyIndex] as number);
    scopeAverage = Math.log(sum / table.scope.length);
  }

  for (let i = 0; i < size; i++) {
    if (!inScope[i]) delta[i] = scopeAverage;
  }

  // Centre on the total evidence so the reported contribution is the log-Bayes
  // factor for each ideology against the field, not a shift shared by everyone.
  let evidence = 0;
  for (let i = 0; i < size; i++) evidence += (probabilities[i] as number) * Math.exp(delta[i] as number);
  const logEvidence = evidence > 0 ? Math.log(evidence) : 0;

  const contribution = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    logPosterior[i] = (logPosterior[i] as number) + (delta[i] as number);
    contribution[i] = (delta[i] as number) - logEvidence;
  }

  return { questionId: answer.questionId, optionIds: answer.optionIds, inert: false, contribution };
}

// -----------------------------------------------------------------------------
// Replay
// -----------------------------------------------------------------------------

/** Replay an answer list from the prior. Deterministic: same input, same output. */
export function computePosterior(model: EngineModel, answers: readonly Answer[]): Posterior {
  const logPosterior = Float64Array.from(model.logPrior);
  const effects: AnswerEffect[] = [];

  for (const answer of answers) {
    effects.push(applyAnswer(model, logPosterior, answer));
  }

  return {
    model,
    answers: [...answers],
    probabilities: normalise(logPosterior),
    logPosterior,
    effects,
    scoringAnswerCount: effects.filter((e) => !e.inert).length,
  };
}

// -----------------------------------------------------------------------------
// Reading the posterior
// -----------------------------------------------------------------------------

export function massOfIdeology(posterior: Posterior, ideologyId: string): number {
  const index = posterior.model.indexOf.get(ideologyId);
  return index === undefined ? 0 : (posterior.probabilities[index] as number);
}

export interface RankedIdeology {
  id: string;
  name: string;
  mass: number;
}

/** Every ideology by its own mass, highest first; ties broken by content order. */
export function rankIdeologies(posterior: Posterior): RankedIdeology[] {
  return posterior.model.ideologyIds
    .map((id, index) => ({
      id,
      name: posterior.model.content.ideologyById.get(id)?.name ?? id,
      mass: posterior.probabilities[index] as number,
    }))
    .sort((a, b) => b.mass - a.mass || a.id.localeCompare(b.id));
}

/**
 * Mass of a tree node including everything below it: a family sums its members,
 * a tendency sums itself and its descendants, a sect is just itself.
 *
 * Takes a node key or a bare id. Walking is by key, so a family and an ideology
 * sharing an id cannot be confused for one another.
 */
export function subtreeMass(posterior: Posterior, idOrKey: string): number {
  const key = nodeKeyFor(posterior.model, idOrKey);
  return key === undefined ? 0 : subtreeMassByKey(posterior, key);
}

function subtreeMassByKey(posterior: Posterior, key: string): number {
  const node = posterior.model.tree.nodes.get(key);
  if (!node) return 0;

  let total = node.kind === 'ideology' ? massOfIdeology(posterior, node.id) : 0;
  for (const childKey of node.children) total += subtreeMassByKey(posterior, childKey);
  return total;
}

export interface NodeMass {
  /** Bare content id — what results and share URLs carry. */
  id: string;
  /** Tree key, unique across families and ideologies. */
  key: string;
  name: string;
  level: NodeLevel;
  /** Mass of this node alone; zero for families, which hold none of their own. */
  ownMass: number;
  /** Mass of this node plus everything beneath it. */
  mass: number;
}

function nodeMassByKey(posterior: Posterior, key: string): NodeMass | null {
  const node = posterior.model.tree.nodes.get(key);
  if (!node) return null;
  return {
    id: node.id,
    key: node.key,
    name: node.name,
    level: node.level,
    ownMass: node.kind === 'ideology' ? massOfIdeology(posterior, node.id) : 0,
    mass: subtreeMassByKey(posterior, node.key),
  };
}

/** Aggregate mass per broad group, highest first. */
export function groupMasses(posterior: Posterior): NodeMass[] {
  return posterior.model.content.groups
    .map((group) => nodeMassByKey(posterior, groupKey(group.id)))
    .filter((m): m is NodeMass => m !== null)
    .sort((a, b) => b.mass - a.mass || a.id.localeCompare(b.id));
}

/** Aggregate mass per family, highest first. */
export function familyMasses(posterior: Posterior): NodeMass[] {
  return posterior.model.content.families
    .map((family) => nodeMassByKey(posterior, familyKey(family.id)))
    .filter((m): m is NodeMass => m !== null)
    .sort((a, b) => b.mass - a.mass || a.id.localeCompare(b.id));
}

/** Aggregate mass per tendency — ideologies that have descendants — highest first. */
export function tendencyMasses(posterior: Posterior): NodeMass[] {
  const out: NodeMass[] = [];
  for (const node of posterior.model.tree.nodes.values()) {
    if (node.kind !== 'ideology' || node.level !== 'tendency') continue;
    const mass = nodeMassByKey(posterior, node.key);
    if (mass) out.push(mass);
  }
  return out.sort((a, b) => b.mass - a.mass || a.id.localeCompare(b.id));
}

/** Aggregate mass for the children of any node, highest first. */
export function childMasses(posterior: Posterior, idOrKey: string = ROOT_ID): NodeMass[] {
  const key = nodeKeyFor(posterior.model, idOrKey);
  const node = key === undefined ? undefined : posterior.model.tree.nodes.get(key);
  if (!node) return [];
  return node.children
    .map((childKey) => nodeMassByKey(posterior, childKey))
    .filter((m): m is NodeMass => m !== null)
    .sort((a, b) => b.mass - a.mass || a.id.localeCompare(b.id));
}
