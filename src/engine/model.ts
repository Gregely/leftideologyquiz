/**
 * The scoring model: everything derived from content that does not depend on
 * anyone's answers.
 *
 * Built once per content load. Holds the ideology ordering, the prior, the
 * resolved stance table, a precomputed log-likelihood table per question, and
 * the family/tendency/sect tree the resolver walks.
 *
 * Pure. No clock, no randomness, no I/O.
 */

import { resolveStances, type Content, type NormalisedQuestion } from '../content/load.js';
import type { Stance } from '../content/schema.js';
import type { EngineConfig } from './config.js';

// -----------------------------------------------------------------------------
// Tree
// -----------------------------------------------------------------------------

export const ROOT_ID = '__root__';

export type NodeKind = 'root' | 'group' | 'family' | 'ideology';

/** Where a node sits in the group > family > tendency > sect tree (SPEC.md §2.1). */
export type NodeLevel = 'group' | 'family' | 'tendency' | 'sect';

/**
 * The deepest level a mode is allowed to report (SPEC.md §8.1).
 *
 * Ranked by *position in the tree* rather than by `NodeLevel`, because a flat
 * family's members are `sect`-level but sit directly under the family. Under
 * `'tendency'` the walk may name any ideology hanging straight off a family —
 * which is what Standard mode has always done — but not one hanging off
 * another ideology. That keeps `council_communism` reachable in Standard while
 * keeping `cliffism` a Deep-only answer, exactly as SPEC.md §4 describes.
 */
export type ReportLevel = 'group' | 'family' | 'tendency' | 'sect';

export const REPORT_LEVEL_RANK: Record<ReportLevel, number> = {
  group: 1,
  family: 2,
  tendency: 3,
  sect: Number.POSITIVE_INFINITY,
};

/**
 * Tree nodes are keyed by kind *and* id, never by id alone.
 *
 * Families and ideologies are separate namespaces in the content — the
 * Marxism–Leninism family legitimately contains an ideology of the same name,
 * and the market socialism family is a single ideology of the same name. Keying
 * one Map by bare id lets the family silently overwrite the ideology, which
 * turns `leninism -> marxism_leninism -> leninism` into an unbounded walk.
 */
export function groupKey(id: string): string {
  return `group:${id}`;
}

export function familyKey(id: string): string {
  return `family:${id}`;
}

export function ideologyKey(id: string): string {
  return `ideology:${id}`;
}

export interface TreeNode {
  /** Unique across the tree: `group:<id>`, `family:<id>`, `ideology:<id>`, or ROOT_ID. */
  key: string;
  /** The bare content id, which is what results and URLs carry. */
  id: string;
  kind: NodeKind;
  name: string;
  /** Parent node *key*. */
  parent: string | null;
  /** Child node *keys*, in content order. */
  children: string[];
  /**
   * An ideology is a `sect` when nothing descends from it and a `tendency`
   * when something does. Interior ideologies are scored like any other — they
   * just also have children to be weighed against.
   */
  level: NodeLevel;
  /**
   * Steps from the root: group 1, family 2, an ideology under a family 3, an
   * ideology under an ideology 4 or more. Compared against
   * `REPORT_LEVEL_RANK` to decide whether a mode may name this node.
   */
  rank: number;
}

export interface Tree {
  nodes: Map<string, TreeNode>;
  root: TreeNode;
}

function buildTree(content: Content): Tree {
  const nodes = new Map<string, TreeNode>();

  const childrenOf = new Map<string, string[]>();
  for (const ideology of content.ideologies) {
    if (!ideology.tendency) continue;
    // A parent in another family, or a cycle, is a validator error; ignore the
    // edge here rather than building a tree that cannot be walked.
    const parent = content.ideologyById.get(ideology.tendency);
    if (!parent || parent.family !== ideology.family) continue;
    if (hasAncestor(content, parent.id, ideology.id)) continue;
    const list = childrenOf.get(ideology.tendency);
    if (list) list.push(ideology.id);
    else childrenOf.set(ideology.tendency, [ideology.id]);
  }

  for (const ideology of content.ideologies) {
    const children = childrenOf.get(ideology.id) ?? [];
    const parent = parentIdOf(content, ideology.id);
    nodes.set(ideologyKey(ideology.id), {
      key: ideologyKey(ideology.id),
      id: ideology.id,
      kind: 'ideology',
      name: ideology.name,
      parent: parent === null ? familyKey(ideology.family) : ideologyKey(parent),
      children: children.map(ideologyKey),
      level: children.length > 0 ? 'tendency' : 'sect',
      // Filled in by the walk below, once every parent exists.
      rank: 0,
    });
  }

  for (const family of content.families) {
    const members = content.ideologiesByFamily.get(family.id) ?? [];
    nodes.set(familyKey(family.id), {
      key: familyKey(family.id),
      id: family.id,
      kind: 'family',
      name: family.name,
      // A family naming a group that does not exist is a validator error; hang
      // it off the root here rather than build a tree with a dangling edge.
      parent: content.groupById.has(family.group) ? groupKey(family.group) : ROOT_ID,
      children: members
        .filter((i) => parentIdOf(content, i.id) === null)
        .map((i) => ideologyKey(i.id)),
      level: 'family',
      rank: 2,
    });
  }

  for (const group of content.groups) {
    const members = content.familiesByGroup.get(group.id) ?? [];
    nodes.set(groupKey(group.id), {
      key: groupKey(group.id),
      id: group.id,
      kind: 'group',
      name: group.name,
      parent: ROOT_ID,
      children: members.map((f) => familyKey(f.id)),
      level: 'group',
      rank: 1,
    });
  }

  const orphanFamilies = content.families
    .filter((f) => !content.groupById.has(f.group))
    .map((f) => familyKey(f.id));

  const root: TreeNode = {
    key: ROOT_ID,
    id: ROOT_ID,
    kind: 'root',
    name: 'All ideologies',
    parent: null,
    children: [...content.groups.map((g) => groupKey(g.id)), ...orphanFamilies],
    level: 'group',
    rank: 0,
  };
  nodes.set(ROOT_ID, root);

  // Ranks below a family: one more than the parent, so a flat family's members
  // rank 3 and a sect under a tendency ranks 4.
  const setRank = (key: string, rank: number, seen: Set<string>): void => {
    if (seen.has(key)) return;
    seen.add(key);
    const node = nodes.get(key);
    if (!node) return;
    node.rank = rank;
    for (const child of node.children) setRank(child, rank + 1, seen);
  };
  setRank(ROOT_ID, 0, new Set());

  return { nodes, root };
}

/**
 * Accept either a node key or a bare content id, so callers and tests can say
 * `subtreeMass(p, 'cliffism')` without knowing about keying. A bare id that
 * names both an ideology and a family resolves to the ideology.
 */
export function nodeKeyFor(model: EngineModel, idOrKey: string): string | undefined {
  if (model.tree.nodes.has(idOrKey)) return idOrKey;
  const asIdeology = ideologyKey(idOrKey);
  if (model.tree.nodes.has(asIdeology)) return asIdeology;
  const asFamily = familyKey(idOrKey);
  if (model.tree.nodes.has(asFamily)) return asFamily;
  const asGroup = groupKey(idOrKey);
  if (model.tree.nodes.has(asGroup)) return asGroup;
  return undefined;
}

/** The group a family belongs to, or null when it names one that does not exist. */
export function groupOfFamily(model: EngineModel, familyId: string): string | null {
  const family = model.content.familyById.get(familyId);
  if (!family) return null;
  return model.content.groupById.has(family.group) ? family.group : null;
}

/** The group an ideology belongs to, through its family. */
export function groupOfIdeology(model: EngineModel, ideologyId: string): string | null {
  const ideology = model.content.ideologyById.get(ideologyId);
  if (!ideology) return null;
  return groupOfFamily(model, ideology.family);
}

/** The ideology id this one hangs off, or null when it hangs off its family. */
function parentIdOf(content: Content, ideologyId: string): string | null {
  const ideology = content.ideologyById.get(ideologyId);
  if (!ideology?.tendency) return null;
  const parent = content.ideologyById.get(ideology.tendency);
  if (!parent || parent.family !== ideology.family) return null;
  if (hasAncestor(content, parent.id, ideologyId)) return null;
  return parent.id;
}

/** Does `candidate` appear at or above `startId` in the tendency chain? */
function hasAncestor(content: Content, startId: string, candidate: string): boolean {
  const seen = new Set<string>();
  let current: string | undefined = startId;
  while (current && !seen.has(current)) {
    if (current === candidate) return true;
    seen.add(current);
    current = content.ideologyById.get(current)?.tendency;
  }
  return false;
}

// -----------------------------------------------------------------------------
// Likelihood tables
// -----------------------------------------------------------------------------

export interface QuestionLikelihood {
  questionId: string;
  /** Scorable options in presentation order; implicit options are excluded. */
  optionIds: string[];
  /**
   * Ideology indices with a weighted stance on this question. Everything else
   * is out of scope and takes the scope-average update (SPEC.md §5.3), so a
   * question written to separate one family is not evidence about whether you
   * belong to that family at all.
   */
  scope: number[];
  /** Families the scope was derived from. */
  scopeFamilies: string[];
  /** `logLik[scopePosition][optionPosition]` — log P(option | ideology). */
  logLik: Float64Array[];
}

/**
 * Raw stance weight for one option, before the softmax.
 *
 * `accept` pulls up by the stance weight, `reject` pushes down harder
 * (`rejectMultiplier`), and anything the stance does not mention sits at zero —
 * which is the whole point of sparse stances: silence means no opinion, not
 * mild disapproval.
 */
function optionWeight(
  stance: Stance,
  optionId: string,
  optionIds: string[],
  isLikert: boolean,
  config: EngineConfig,
): number {
  if (stance.reject.includes(optionId)) return -config.rejectMultiplier * stance.weight;
  if (!isLikert) return stance.accept.includes(optionId) ? stance.weight : 0;
  if (stance.accept.length === 0) return 0;

  // Likert answers are ordered, so agreement decays with distance from the
  // nearest accepted point rather than being all-or-nothing.
  const position = optionIds.indexOf(optionId);
  let nearest = Number.POSITIVE_INFINITY;
  for (const target of stance.accept) {
    const targetPosition = optionIds.indexOf(target);
    if (targetPosition === -1) continue;
    nearest = Math.min(nearest, Math.abs(position - targetPosition));
  }
  if (!Number.isFinite(nearest)) return 0;

  const sigma = config.likertSigma;
  const kernel = 2 * Math.exp(-(nearest * nearest) / (2 * sigma * sigma)) - 1;
  return stance.weight * kernel;
}

function softmax(values: readonly number[]): number[] {
  const max = Math.max(...values);
  const exponentials = values.map((v) => Math.exp(v - max));
  const total = exponentials.reduce((a, b) => a + b, 0);
  return exponentials.map((e) => e / total);
}

/**
 * Which ideologies a question is evidence *between*.
 *
 * Derived rather than authored: the scope is every member of every family that
 * contains at least one ideology with a stance on the question.
 *
 * It has to be the whole family, not just the stance-holders. Scoping to
 * stance-holders alone would make a question that exactly one ideology has a
 * position on carry no information at all — the scope average would equal that
 * ideology's own likelihood, so every ideology would get the identical update
 * and nothing would move. A question only the Bordigists answer is precisely
 * the kind that should separate them from the rest of their family, and family
 * members with no stance take the flat likelihood, which is what makes that
 * separation happen.
 */
function deriveScope(
  question: NormalisedQuestion,
  content: Content,
  ideologyIds: string[],
  stanceTable: Map<string, Map<string, Stance>>,
): { scope: number[]; families: string[] } | null {
  const families = new Set<string>();
  for (const ideology of content.ideologies) {
    const stance = stanceTable.get(ideology.id)?.get(question.id);
    if (stance && stance.weight > 0) families.add(ideology.family);
  }
  if (families.size === 0) return null;

  const scope: number[] = [];
  for (const [index, ideologyId] of ideologyIds.entries()) {
    const family = content.ideologyById.get(ideologyId)?.family;
    if (family !== undefined && families.has(family)) scope.push(index);
  }

  return { scope, families: [...families] };
}

function buildQuestionLikelihood(
  question: NormalisedQuestion,
  content: Content,
  ideologyIds: string[],
  stanceTable: Map<string, Map<string, Stance>>,
  config: EngineConfig,
): QuestionLikelihood | null {
  const optionIds = question.options.filter((o) => !o.implicit).map((o) => o.id);
  if (optionIds.length === 0) return null;

  const derived = deriveScope(question, content, ideologyIds, stanceTable);
  if (!derived) return null;

  const isLikert = question.kind === 'likert5';
  const logLik: Float64Array[] = [];

  const floor = config.respondentNoise / optionIds.length;
  const signal = 1 - config.respondentNoise;

  for (const index of derived.scope) {
    const ideologyId = ideologyIds[index] as string;
    const stance = stanceTable.get(ideologyId)?.get(question.id);

    // In scope with no stance: flat likelihood. The ideology is one this
    // question could have distinguished and did not, which is itself evidence
    // against it relative to the ones that match.
    const weights = optionIds.map((optionId) =>
      stance && stance.weight > 0
        ? optionWeight(stance, optionId, optionIds, isLikert, config)
        : 0,
    );
    const probabilities = softmax(weights.map((w) => config.beta * w));

    // The noise floor is what keeps a single atypical answer from eliminating
    // anyone: the likelihood can never fall below respondentNoise / |options|.
    const row = new Float64Array(optionIds.length);
    for (let o = 0; o < optionIds.length; o++) {
      row[o] = Math.log(signal * (probabilities[o] as number) + floor);
    }

    logLik.push(row);
  }

  return {
    questionId: question.id,
    optionIds,
    scope: derived.scope,
    scopeFamilies: derived.families,
    logLik,
  };
}

// -----------------------------------------------------------------------------
// Model
// -----------------------------------------------------------------------------

export interface EngineModel {
  content: Content;
  config: EngineConfig;
  /** Stable ideology ordering; every Float64Array in the engine uses it. */
  ideologyIds: string[];
  indexOf: Map<string, number>;
  /** Normalised prior probabilities, in `ideologyIds` order. */
  prior: Float64Array;
  logPrior: Float64Array;
  /** Effective stances after inheritance, weight 0 and cleared entries dropped. */
  stances: Map<string, Map<string, Stance>>;
  /** Questions an ideology states a position on *itself* rather than inheriting. */
  selfStanceQuestions: Map<string, Set<string>>;
  likelihood: Map<string, QuestionLikelihood>;
  tree: Tree;
  /** Question position in content order, used only for stable tie-breaking. */
  questionOrder: Map<string, number>;
}

export function buildModel(content: Content, config: EngineConfig): EngineModel {
  const ideologyIds = content.ideologies.map((i) => i.id);
  const indexOf = new Map(ideologyIds.map((id, i) => [id, i]));

  const stances = new Map<string, Map<string, Stance>>();
  const selfStanceQuestions = new Map<string, Set<string>>();

  for (const ideology of content.ideologies) {
    const resolved = resolveStances(content, ideology.id);
    const effective = new Map<string, Stance>();
    const own = new Set<string>();
    for (const [questionId, entry] of resolved.byQuestion) {
      if (entry.stance.weight === 0) continue;
      effective.set(questionId, entry.stance);
      if (entry.from.level === 'self') own.add(questionId);
    }
    stances.set(ideology.id, effective);
    selfStanceQuestions.set(ideology.id, own);
  }

  // Uniform, except that `boundary` ideologies may be held back deliberately.
  const rawPrior = content.ideologies.map((i) => (i.boundary ? config.boundaryPrior : 1));
  const priorTotal = rawPrior.reduce((a, b) => a + b, 0);
  const prior = new Float64Array(ideologyIds.length);
  const logPrior = new Float64Array(ideologyIds.length);
  for (let i = 0; i < ideologyIds.length; i++) {
    prior[i] = priorTotal > 0 ? (rawPrior[i] as number) / priorTotal : 0;
    logPrior[i] = (prior[i] as number) > 0 ? Math.log(prior[i] as number) : -Infinity;
  }

  const likelihood = new Map<string, QuestionLikelihood>();
  for (const question of content.questions) {
    const table = buildQuestionLikelihood(question, content, ideologyIds, stances, config);
    if (table) likelihood.set(question.id, table);
  }

  const questionOrder = new Map(content.questions.map((q, i) => [q.id, i]));

  return {
    content,
    config,
    ideologyIds,
    indexOf,
    prior,
    logPrior,
    stances,
    selfStanceQuestions,
    likelihood,
    tree: buildTree(content),
    questionOrder,
  };
}

/**
 * The questions that identify a `lineage: true` ideology: the ones it takes a
 * position on itself rather than inheriting from its parent or family.
 *
 * An ideology defined by a lineage rather than by separable positions can only
 * be told apart by these, so the resolver refuses to name one as a sect until a
 * respondent has actually given evidence on one of them.
 */
export function lineageShibboleths(model: EngineModel, ideologyId: string): string[] {
  const own = model.selfStanceQuestions.get(ideologyId) ?? new Set<string>();
  const stances = model.stances.get(ideologyId);
  return [...own]
    .filter((questionId) => (stances?.get(questionId)?.weight ?? 0) > 0)
    .sort((a, b) => (model.questionOrder.get(a) ?? 0) - (model.questionOrder.get(b) ?? 0));
}
