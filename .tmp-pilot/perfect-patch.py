import io

p = 'src/engine/perfect-respondent.ts'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


sub("""    posterior,
    result: resolve(posterior),
  };
}""",
    """    posterior,
    result: resolve(posterior, flowConfig.modes[mode].maxReportLevel),
  };
}""")

sub("""export interface CheckOutcome {
  ideologyId: string;
  family: string;
  mode: Mode;""",
    """export interface CheckOutcome {
  ideologyId: string;
  family: string;
  /** The broad group the family sits in; what Quick mode is judged against. */
  group: string;
  mode: Mode;
  /** True when the ideology has at least one effective tier-1 stance. */
  hasTier1Stance: boolean;""")

sub("""  /** The node the mode is judged at: the family, the tendency, or the sect. */
  expected: string;""",
    """  /** The node the mode is judged at: the group, the tendency, or the sect. */
  expected: string;""")

sub("""function resultKey(result: Result): string {
  if (result.node.kind === 'root') return ROOT_ID;
  return result.node.kind === 'family' ? familyKey(result.node.id) : ideologyKey(result.node.id);
}

/** The family a returned node sits in, or null for the root. */
function familyOfKey(model: EngineModel, key: string): string | null {
  let current: string | null = key;
  for (let i = 0; current !== null && i <= model.tree.nodes.size; i++) {
    const node = nodeByKey(model, current);
    if (!node) return null;
    if (node.kind === 'family') return node.id;
    current = node.parent;
  }
  return null;
}""",
    """function resultKey(result: Result): string {
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
}""")

sub("""/**
 * The node a mode is judged at, per the brief: Quick at the family; Standard
 * at the ideology's tendency (its parent ideology), or the family where it has
 * none; Deep at the ideology itself.
 */
function expectedKey(model: EngineModel, ideologyId: string, mode: Mode): string {
  const path = pathTo(model, ideologyId);
  const family = path[1] ?? ROOT_ID;
  if (mode === 'quick') return family;
  if (mode === 'deep') return ideologyKey(ideologyId);
  return path.length >= 3 ? (path[path.length - 2] as string) : family;
}""",
    """/**
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
}""")

sub("""  const ideology = model.content.ideologyById.get(ideologyId);
  const family = ideology?.family ?? '';
  const path = pathTo(model, ideologyId);""",
    """  const ideology = model.content.ideologyById.get(ideologyId);
  const family = ideology?.family ?? '';
  const group = (family && model.content.familyById.get(family)?.group) || '';
  const path = pathTo(model, ideologyId);""")

sub("""  const base = {
    ideologyId,
    family,
    mode,""",
    """  const base = {
    ideologyId,
    family,
    group,
    hasTier1Stance: hasTier1Stance(model, ideologyId),
    mode,""")

sub("""  if (mode === 'quick') {
    if (familyOfKey(model, returnedKey) === family) route = returnedKey === ideologyKey(ideologyId) ? 'exact' : 'parent';
  } else if (mode === 'standard') {""",
    """  if (mode === 'quick') {
    // Quick passes when the group is right. It cannot name anything narrower
    // (`maxReportLevel: 'group'`), so nothing narrower is being asked of it.
    if (groupOfKey(model, returnedKey) === group) {
      route = returnedKey === groupKey(group) ? 'exact' : 'parent';
    }
  } else if (mode === 'standard') {""")

sub("""import { familyKey, ideologyKey, ROOT_ID, type EngineModel, type TreeNode } from './model.js';""",
    """import {
  familyKey,
  groupKey,
  ideologyKey,
  ROOT_ID,
  type EngineModel,
  type TreeNode,
} from './model.js';""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
