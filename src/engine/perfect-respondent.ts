/**
 * The perfect respondent: an ideology answering its own effective stances,
 * run through the real flow, stopping rules and resolver.
 *
 * This is the minimal form of the ideal-type recovery in SPEC.md §10.3 — noise
 * 0, one mode at a time, pass or fail per ideology. What it shows is that the
 * encoded stances are *separable*: that the engine can get back from them to
 * the ideology that holds them. It says nothing about whether the stances are
 * *right*, and a failure is never fixed by moving a weight until it passes
 * (CLAUDE.md rule 4).
 *
 * Pure. No I/O, no randomness: the respondent is deterministic.
 */

import type { NormalisedQuestion } from '../content/load.js';
import { DEFAULT_FLOW_CONFIG, nextQuestion, type FlowConfig, type Mode, type SelectionReason, type StopReason } from './flow.js';
import {
  familyKey,
  groupKey,
  ideologyKey,
  ROOT_ID,
  type EngineModel,
  type TreeNode,
} from './model.js';
import { computePosterior, familyMasses, rankIdeologies, type Answer, type Posterior } from './posterior.js';
import { resolve, type Result } from './resolve.js';

// -----------------------------------------------------------------------------
// Answering
// -----------------------------------------------------------------------------

/**
 * What an ideology answers to one question: the accepted option it holds most
 * strongly, or `unsure` where it holds no position.
 *
 * A stance carries one weight for all of its accepted options, so "most
 * strongly" is decided by the stance's own order: the first listed accepted
 * option that is actually an option of the question. For a likert the accepted
 * target is the point itself. Deterministic by construction.
 */
export function perfectAnswer(
  model: EngineModel,
  ideologyId: string,
  question: NormalisedQuestion,
): string {
  const stance = model.stances.get(ideologyId)?.get(question.id);
  if (!stance || stance.weight <= 0) return 'unsure';
  const scorable = new Set(question.options.filter((o) => !o.implicit).map((o) => o.id));
  return stance.accept.find((id) => scorable.has(id)) ?? 'unsure';
}

export interface PerfectStep {
  questionId: string;
  depth: number;
  reason: SelectionReason;
  optionId: string;
}

export interface PerfectRun {
  ideologyId: string;
  mode: Mode;
  steps: PerfectStep[];
  answers: Answer[];
  /** `null` only if the guard tripped, which would be an engine bug. */
  stopReason: StopReason | null;
  modifierQuotaMet: boolean;
  posterior: Posterior;
  result: Result;
}

/** Hard bound on the loop: no mode's budget comes near it. */
const GUARD = 500;

export function runPerfectRespondent(
  model: EngineModel,
  ideologyId: string,
  mode: Mode,
  flowConfig: FlowConfig = DEFAULT_FLOW_CONFIG,
): PerfectRun {
  const answers: Answer[] = [];
  const steps: PerfectStep[] = [];
  let stopReason: StopReason | null = null;
  let modifierQuotaMet = false;

  for (let i = 0; i < GUARD; i++) {
    const step = nextQuestion(model, answers, mode, flowConfig);
    if (step.done) {
      stopReason = step.stopReason;
      modifierQuotaMet = step.modifierQuotaMet;
      break;
    }
    const optionId = perfectAnswer(model, ideologyId, step.question);
    answers.push({ questionId: step.question.id, optionIds: [optionId] });
    steps.push({ questionId: step.question.id, depth: step.question.depth, reason: step.reason, optionId });
  }

  const posterior = computePosterior(model, answers);
  return {
    ideologyId,
    mode,
    steps,
    answers,
    stopReason,
    modifierQuotaMet,
    posterior,
    result: resolve(posterior, flowConfig.modes[mode].maxReportLevel),
  };
}

// -----------------------------------------------------------------------------
// Judging
// -----------------------------------------------------------------------------

export type Verdict = 'pass' | 'fail' | 'unauthored';

/** How a passing run passed; `parent` and `inseparable` are reported as information. */
export type PassRoute = 'exact' | 'parent' | 'inseparable';

export interface Giveaway {
  questionId: string;
  optionId: string;
  /** How much further this answer pushed the returned ideology than the true one. */
  margin: number;
}

export interface CheckOutcome {
  ideologyId: string;
  family: string;
  /** The broad group the family sits in; what Quick mode is judged against. */
  group: string;
  mode: Mode;
  /** True when the ideology has at least one effective tier-1 stance. */
  hasTier1Stance: boolean;
  verdict: Verdict;
  route: PassRoute | null;
  /** The node the mode is judged at: the group, the tendency, or the sect. */
  expected: string;
  returned: { id: string; kind: TreeNode['kind']; resolved: boolean; candidates: string[] };
  /** The strongest alternative at the level this mode is judged at. */
  runnerUp: { id: string; mass: number } | null;
  trueMass: number;
  /** For failures only: the answers that most favoured what came back over the truth. */
  giveaways: Giveaway[];
  questionCount: number;
  stopReason: StopReason | null;
  run: PerfectRun;
}

function nodeByKey(model: EngineModel, key: string): TreeNode | undefined {
  return model.tree.nodes.get(key);
}

/** Keys from the root down to the ideology, inclusive: root, family, …, self. */
function pathTo(model: EngineModel, ideologyId: string): string[] {
  const path: string[] = [];
  let key: string | null = ideologyKey(ideologyId);
  for (let i = 0; key !== null && i <= model.tree.nodes.size; i++) {
    path.unshift(key);
    key = nodeByKey(model, key)?.parent ?? null;
  }
  return path;
}

function resultKey(result: Result): string {
  if (result.node.kind === 'root') return ROOT_ID;
  if (result.node.kind === 'group') return groupKey(result.node.id);
  return result.node.kind === 'family' ? familyKey(result.node.id) : ideologyKey(result.node.id);
}

/** The nearest ancestor of `key` of the given kind, or null. */
function ancestorOfKind(
  model: EngineModel,
  key: string,
  kind: TreeNode['kind'],
): string | null {
  let current: string | null = key;
  for (let i = 0; current !== null && i <= model.tree.nodes.size; i++) {
    const node = nodeByKey(model, current);
    if (!node) return null;
    if (node.kind === kind) return node.id;
    current = node.parent;
  }
  return null;
}

/** The family a returned node sits in, or null for the root. */
function familyOfKey(model: EngineModel, key: string): string | null {
  return ancestorOfKind(model, key, 'family');
}

/** The broad group a returned node sits in, or null for the root. */
function groupOfKey(model: EngineModel, key: string): string | null {
  return ancestorOfKind(model, key, 'group');
}

/**
 * The node a mode is judged at.
 *
 * **Quick is judged at the broad group**, not the family. Quick asks tier-1
 * questions, and tier-1 questions cannot separate the four families inside
 * `revolutionary_socialist` — they agree on every everyday value a respondent
 * holds. Judging Quick at the family would be scoring the mode against a
 * distinction its questions were never written to draw, and the only way to
 * pass would be to write tier-1 questions that presuppose the answer.
 * Standard is judged at the ideology's tendency (its parent ideology), or the
 * family where it has none; Deep at the ideology itself.
 */
function expectedKey(model: EngineModel, ideologyId: string, mode: Mode): string {
  const path = pathTo(model, ideologyId);
  // path is [root, group, family, ...] — index 1 is the group, 2 the family.
  const group = path[1] ?? ROOT_ID;
  const family = path[2] ?? group;
  if (mode === 'quick') return group;
  if (mode === 'deep') return ideologyKey(ideologyId);
  return path.length >= 4 ? (path[path.length - 2] as string) : family;
}

/**
 * Does this ideology hold any effective stance on a tier-1 question?
 *
 * Group recovery is reported over these separately, because an ideology with
 * no tier-1 stance answers "not sure" to everything Quick asks and its result
 * measures the prior, not the content. Counting it as a failure blames the
 * questions for a gap in the stances; counting it as a pass hides the gap.
 * Reporting both is the honest option.
 */
function hasTier1Stance(model: EngineModel, ideologyId: string): boolean {
  const stances = model.stances.get(ideologyId);
  if (!stances) return false;
  for (const [questionId, stance] of stances) {
    if (stance.weight <= 0) continue;
    if (model.content.questionById.get(questionId)?.depth === 1) return true;
  }
  return false;
}

/**
 * Answers ranked by how much more they raised the returned ideology than the
 * true one. Contributions are log-Bayes factors against the field, so their
 * difference is the answer's log-odds push between the two.
 */
function giveawaysFor(run: PerfectRun, returnedIdeology: string | null, limit = 3): Giveaway[] {
  const { model } = run.posterior;
  const truth = model.indexOf.get(run.ideologyId);
  const other = returnedIdeology === null ? undefined : model.indexOf.get(returnedIdeology);
  if (truth === undefined || other === undefined) return [];
  return run.posterior.effects
    .filter((e) => !e.inert)
    .map((e) => ({
      questionId: e.questionId,
      optionId: e.optionIds[0] ?? '',
      margin: (e.contribution[other] as number) - (e.contribution[truth] as number),
    }))
    .filter((g) => g.margin > 0)
    .sort((a, b) => b.margin - a.margin || a.questionId.localeCompare(b.questionId))
    .slice(0, limit);
}

export function judge(run: PerfectRun): CheckOutcome {
  const { model } = run.posterior;
  const { result, mode, ideologyId } = run;
  const ideology = model.content.ideologyById.get(ideologyId);
  const family = ideology?.family ?? '';
  const group = (family && model.content.familyById.get(family)?.group) || '';
  const path = pathTo(model, ideologyId);
  const returnedKey = resultKey(result);
  const expected = expectedKey(model, ideologyId, mode);
  const candidates = result.candidates.map((c) => c.id);
  const trueMass = run.posterior.probabilities[model.indexOf.get(ideologyId) ?? -1] ?? 0;

  const base = {
    ideologyId,
    family,
    group,
    hasTier1Stance: hasTier1Stance(model, ideologyId),
    mode,
    expected: nodeByKey(model, expected)?.id ?? expected,
    returned: { id: result.node.id, kind: result.node.kind, resolved: result.kind === 'resolved', candidates },
    trueMass,
    questionCount: run.steps.length,
    stopReason: run.stopReason,
    run,
  };

  const answeredSomething = run.answers.some((a) => !a.optionIds.includes('unsure'));
  if (!answeredSomething) {
    return { ...base, verdict: 'unauthored', route: null, runnerUp: null, giveaways: [] };
  }

  let route: PassRoute | null = null;
  const onPath = path.indexOf(returnedKey);
  const expectedDepth = path.indexOf(expected);

  if (mode === 'quick') {
    // Quick passes when the group is right. It cannot name anything narrower
    // (`maxReportLevel: 'group'`), so nothing narrower is being asked of it.
    if (groupOfKey(model, returnedKey) === group) {
      route = returnedKey === groupKey(group) ? 'exact' : 'parent';
    }
  } else if (mode === 'standard') {
    // At or below the tendency, on the ideology's own line of descent.
    if (onPath >= 0 && onPath >= expectedDepth) route = returnedKey === ideologyKey(ideologyId) ? 'exact' : 'parent';
  } else if (returnedKey === ideologyKey(ideologyId)) {
    route = 'exact';
  } else if (!base.returned.resolved && onPath > 0 && candidates.includes(ideologyId)) {
    route = 'parent';
  }

  if (route === null && mode === 'deep') {
    const partners = new Set((ideology?.inseparable_from ?? []).map((p) => p.ideology));
    const partnerReturned =
      (base.returned.resolved && partners.has(result.node.id)) ||
      (candidates.includes(ideologyId) && candidates.some((c) => partners.has(c)));
    if (partnerReturned) route = 'inseparable';
  }

  // Runner-up at the level the mode is judged at: families for Quick, leaves
  // otherwise. It names what the truth was competing with, pass or fail.
  let runnerUp: CheckOutcome['runnerUp'] = null;
  if (mode === 'quick') {
    const families = familyMasses(run.posterior);
    const winner = familyOfKey(model, returnedKey) ?? families[0]?.id;
    const alt = families.find((f) => f.id !== winner);
    runnerUp = alt ? { id: alt.id, mass: alt.mass } : null;
  } else {
    const winner = route ? ideologyId : result.anchorIdeologyId;
    const alt = rankIdeologies(run.posterior).find((r) => r.id !== winner);
    runnerUp = alt ? { id: alt.id, mass: alt.mass } : null;
  }

  if (route !== null) {
    return { ...base, verdict: 'pass', route, runnerUp, giveaways: [] };
  }

  // Measured against the best leaf of whatever came back. If that is the truth
  // itself (a root result it happens to top), against the strongest other leaf.
  const against =
    result.anchorIdeologyId !== null && result.anchorIdeologyId !== ideologyId
      ? result.anchorIdeologyId
      : (rankIdeologies(run.posterior).find((r) => r.id !== ideologyId)?.id ?? null);
  return { ...base, verdict: 'fail', route: null, runnerUp, giveaways: giveawaysFor(run, against) };
}

/** Run and judge every listed ideology, in the order given. */
export function checkIdeologies(
  model: EngineModel,
  ideologyIds: readonly string[],
  mode: Mode,
  flowConfig: FlowConfig = DEFAULT_FLOW_CONFIG,
): CheckOutcome[] {
  return ideologyIds.map((id) => judge(runPerfectRespondent(model, id, mode, flowConfig)));
}
