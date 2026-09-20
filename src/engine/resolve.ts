/**
 * Turning a posterior into an answer, including the answer "not far enough to
 * say".
 *
 * Implements the back-off of SPEC.md §8.1: walk down the tree while the
 * evidence supports descending, and stop at the deepest node that is honestly
 * supported. A less specific true answer is a success; a more specific
 * arbitrary one is a failure.
 */

import type { NodeKind, NodeLevel } from './model.js';
import { lineageShibboleths, nodeKeyFor, ROOT_ID } from './model.js';
import {
  childMasses,
  massOfIdeology,
  subtreeMass,
  type NodeMass,
  type Posterior,
} from './posterior.js';

const EPSILON = 1e-12;

export interface ResolvedNode {
  id: string;
  name: string;
  kind: NodeKind;
}

export interface Candidate extends NodeMass {
  /** This candidate's share of the reported node's mass. */
  share: number;
}

export interface AnswerContribution {
  questionId: string;
  questionText: string;
  optionIds: string[];
  optionLabels: string[];
  /** Log-Bayes factor for the anchor ideology against the field. */
  contribution: number;
}

export type BackOffReason =
  | 'top-two-too-close'
  | 'below-absolute-floor'
  | 'too-few-answers'
  | 'lineage-not-established';

export interface Result {
  kind: 'resolved' | 'undecided';
  /** Depth of the answer being given, not of the node in the abstract. */
  level: NodeLevel;
  node: ResolvedNode;
  /** Empty when resolved; the tied siblings when undecided. */
  candidates: Candidate[];
  /** Mass of the reported node, including everything under it. */
  confidence: number;
  /** The leaf the contributions explain — the best-supported ideology under `node`. */
  anchorIdeologyId: string | null;
  contributions: AnswerContribution[];
  /** Why the walk stopped where it did, when it stopped short of a sect. */
  backOffReason: BackOffReason | null;
  scoringAnswerCount: number;
  /**
   * Pairs in this result that no position question can separate
   * (`inseparable_from`). Present so the result page can say *why* it names two
   * ideologies instead of one: same position, different people or lineage.
   */
  inseparable: InseparablePair[];
}

export interface InseparablePair {
  ideologies: [string, string];
  note: string;
}

/**
 * Inseparable pairs relevant to a result: any pair both of whose members are
 * candidates, plus the declared partners of a resolved leaf — so a respondent
 * who happens to land on one member of a pair is still told about the other.
 */
function inseparablePairs(posterior: Posterior, ids: readonly string[]): InseparablePair[] {
  const content = posterior.model.content;
  const seen = new Set<string>();
  const out: InseparablePair[] = [];
  const present = new Set(ids);

  for (const id of ids) {
    const ideology = content.ideologyById.get(id);
    if (!ideology) continue;
    for (const entry of ideology.inseparable_from) {
      // For a single resolved leaf, report its partners; for a candidate list,
      // report only pairs whose members are both on it.
      if (ids.length > 1 && !present.has(entry.ideology)) continue;
      const pair = [id, entry.ideology].sort() as [string, string];
      const key = pair.join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ideologies: pair, note: entry.note });
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Lineage gate
// -----------------------------------------------------------------------------

export interface LineageCheck {
  required: boolean;
  passed: boolean;
  shibboleths: string[];
  /** Shibboleth questions answered with positive evidence for this ideology. */
  established: string[];
}

/**
 * An ideology flagged `lineage: true` is defined by an organisational lineage
 * rather than by positions, so it shares every stance it inherits with its
 * parent. Naming one as a sect on inherited evidence alone would be asserting
 * something the answers never showed.
 *
 * The gate: the respondent must have answered at least one question the
 * ideology states a position on *itself*, and that answer must have been
 * evidence in its favour.
 */
export function checkLineage(posterior: Posterior, ideologyId: string): LineageCheck {
  const ideology = posterior.model.content.ideologyById.get(ideologyId);
  const shibboleths = lineageShibboleths(posterior.model, ideologyId);
  if (!ideology?.lineage) {
    return { required: false, passed: true, shibboleths, established: [] };
  }

  const index = posterior.model.indexOf.get(ideologyId);
  const established: string[] = [];
  if (index !== undefined) {
    for (const effect of posterior.effects) {
      if (effect.inert) continue;
      if (!shibboleths.includes(effect.questionId)) continue;
      if ((effect.contribution[index] as number) > 0) established.push(effect.questionId);
    }
  }

  return { required: true, passed: established.length > 0, shibboleths, established };
}

// -----------------------------------------------------------------------------
// Walking the tree
// -----------------------------------------------------------------------------

/**
 * The options at a node: its children, plus — for an ideology that has
 * descendants — the node itself, so "you are this tendency and not one of the
 * sects inside it" stays available as an answer.
 *
 * A leaf ideology returns nothing. It is not a choice between itself and
 * itself, and returning a single self-entry would make the caller's
 * collapse-the-chain step descend into the node it is already on.
 */
function entriesAt(posterior: Posterior, nodeKey: string): NodeMass[] {
  const node = posterior.model.tree.nodes.get(nodeKey);
  if (!node) return [];
  if (node.kind === 'ideology' && node.children.length === 0) return [];

  const entries = childMasses(posterior, nodeKey);
  if (node.kind === 'ideology') {
    entries.push({
      id: node.id,
      key: node.key,
      name: node.name,
      level: 'sect',
      ownMass: massOfIdeology(posterior, node.id),
      mass: massOfIdeology(posterior, node.id),
    });
  }
  return entries.sort((a, b) => b.mass - a.mass || a.id.localeCompare(b.id));
}

function candidatesFrom(entries: NodeMass[], parentMass: number, floor: number): Candidate[] {
  const top = entries[0];
  if (!top) return [];
  const threshold = top.mass * floor;
  const kept = entries.filter((e, i) => i < 2 || e.mass >= threshold);
  return kept.map((e) => ({ ...e, share: parentMass > 0 ? e.mass / parentMass : 0 }));
}

// -----------------------------------------------------------------------------
// Resolve
// -----------------------------------------------------------------------------

export function resolve(posterior: Posterior): Result {
  const { config } = posterior.model;

  let nodeKey = ROOT_ID;
  let backOffReason: BackOffReason | null = null;

  // The walk strictly descends, so it cannot take more steps than there are
  // nodes. The bound is belt and braces against a malformed tree: this
  // function must always terminate, whatever content it is handed.
  const maxSteps = posterior.model.tree.nodes.size + 1;

  for (let step = 0; step < maxSteps; step++) {
    const node = posterior.model.tree.nodes.get(nodeKey);
    if (!node) break;

    const entries = entriesAt(posterior, nodeKey);

    // A leaf ideology: nothing left to choose between.
    if (entries.length === 0) {
      const blocked = sectBlockedReason(posterior, node.id);
      if (!blocked) return resolved(posterior, nodeKey);
      return undecided(posterior, node.parent ?? ROOT_ID, blocked);
    }

    // A single child is not a choice; collapse the chain (SPEC.md §8.1).
    if (entries.length === 1) {
      nodeKey = (entries[0] as NodeMass).key;
      continue;
    }

    const top = entries[0] as NodeMass;
    const second = entries[1] as NodeMass;
    const parentMass = nodeKey === ROOT_ID ? 1 : subtreeMass(posterior, nodeKey);

    const share = parentMass > EPSILON ? top.mass / parentMass : 0;
    const margin = top.mass / Math.max(second.mass, EPSILON);

    if (share < config.childShareMin || margin < config.childMarginMin) {
      backOffReason = 'top-two-too-close';
      break;
    }

    // The node beat its own children: the answer is this tendency itself.
    if (top.key === nodeKey) {
      const blocked = sectBlockedReason(posterior, node.id);
      if (!blocked) return resolved(posterior, nodeKey);
      return undecided(posterior, node.parent ?? ROOT_ID, blocked);
    }

    const next = posterior.model.tree.nodes.get(top.key);
    if (!next) break;

    // About to name a sect: check it is allowed to be named before descending
    // into it, so the back-off lands on the parent rather than on the sect.
    if (next.kind === 'ideology' && next.children.length === 0) {
      const blocked = sectBlockedReason(posterior, next.id);
      if (blocked) return undecided(posterior, nodeKey, blocked);
    }

    nodeKey = top.key;
  }

  return undecided(posterior, nodeKey, backOffReason ?? 'top-two-too-close');
}

/** Why this ideology may not be returned as a sect, or null if it may. */
function sectBlockedReason(posterior: Posterior, ideologyId: string): BackOffReason | null {
  const { config } = posterior.model;

  if (posterior.scoringAnswerCount < config.minAnswersForSect) return 'too-few-answers';
  if (subtreeMass(posterior, ideologyId) < config.absoluteFloor) return 'below-absolute-floor';
  if (!checkLineage(posterior, ideologyId).passed) return 'lineage-not-established';
  return null;
}

function resolved(posterior: Posterior, nodeKey: string): Result {
  const node = posterior.model.tree.nodes.get(nodeKey);
  const ideologyId = node?.id ?? nodeKey;
  return {
    kind: 'resolved',
    level: 'sect',
    node: { id: ideologyId, name: node?.name ?? ideologyId, kind: 'ideology' },
    candidates: [],
    confidence: subtreeMass(posterior, nodeKey),
    anchorIdeologyId: ideologyId,
    contributions: contributionsFor(posterior, ideologyId),
    backOffReason: null,
    scoringAnswerCount: posterior.scoringAnswerCount,
    inseparable: inseparablePairs(posterior, [ideologyId]),
  };
}

function undecided(posterior: Posterior, nodeKey: string, reason: BackOffReason): Result {
  const node = posterior.model.tree.nodes.get(nodeKey);
  const { config } = posterior.model;

  const entries = entriesAt(posterior, nodeKey);
  const parentMass = nodeKey === ROOT_ID ? 1 : subtreeMass(posterior, nodeKey);
  const candidates = candidatesFrom(entries, parentMass, config.candidateFloor);

  const anchor = bestLeafUnder(posterior, nodeKey);

  return {
    kind: 'undecided',
    // Reporting an ideology we could not resolve past means reporting it as the
    // tendency its candidates sit inside.
    level: node?.kind === 'ideology' ? 'tendency' : 'family',
    node: {
      id: node?.id ?? nodeKey,
      name: node?.name ?? nodeKey,
      kind: node?.kind ?? 'root',
    },
    candidates,
    confidence: parentMass,
    anchorIdeologyId: anchor,
    contributions: anchor ? contributionsFor(posterior, anchor) : [],
    backOffReason: reason,
    scoringAnswerCount: posterior.scoringAnswerCount,
    inseparable: inseparablePairs(
      posterior,
      candidates.filter((c) => posterior.model.content.ideologyById.has(c.id)).map((c) => c.id),
    ),
  };
}

/** The highest-mass ideology at or beneath a node. Takes a key or a bare id. */
export function bestLeafUnder(posterior: Posterior, idOrKey: string): string | null {
  const startKey = nodeKeyFor(posterior.model, idOrKey);
  if (startKey === undefined) return null;

  let best: string | null = null;
  let bestMass = -Infinity;

  const visit = (key: string): void => {
    const current = posterior.model.tree.nodes.get(key);
    if (!current) return;
    if (current.kind === 'ideology') {
      const mass = massOfIdeology(posterior, current.id);
      if (
        mass > bestMass ||
        (mass === bestMass && best !== null && current.id.localeCompare(best) < 0)
      ) {
        best = current.id;
        bestMass = mass;
      }
    }
    for (const childKey of current.children) visit(childKey);
  };

  visit(startKey);
  return best;
}

/** Per-answer contributions for one ideology, strongest effect first. */
export function contributionsFor(posterior: Posterior, ideologyId: string): AnswerContribution[] {
  const index = posterior.model.indexOf.get(ideologyId);
  if (index === undefined) return [];

  const out: AnswerContribution[] = [];
  for (const effect of posterior.effects) {
    if (effect.inert) continue;
    const question = posterior.model.content.questionById.get(effect.questionId);
    out.push({
      questionId: effect.questionId,
      questionText: question?.text ?? '',
      optionIds: effect.optionIds,
      optionLabels: effect.optionIds.map(
        (id) => question?.options.find((o) => o.id === id)?.label ?? id,
      ),
      contribution: effect.contribution[index] as number,
    });
  }

  return out.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}
