import io

p = 'src/engine/model.ts'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:60])
    s = s.replace(old, new)


sub(
    """export type NodeKind = 'root' | 'family' | 'ideology';

/** Where a node sits in the family > tendency > sect tree of SPEC.md §2.1. */
export type NodeLevel = 'family' | 'tendency' | 'sect';""",
    """export type NodeKind = 'root' | 'group' | 'family' | 'ideology';

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
};""",
)

sub(
    """export function familyKey(id: string): string {
  return `family:${id}`;
}""",
    """export function groupKey(id: string): string {
  return `group:${id}`;
}

export function familyKey(id: string): string {
  return `family:${id}`;
}""",
)

sub(
    """  /** Unique across the tree: `family:<id>`, `ideology:<id>`, or ROOT_ID. */
  key: string;""",
    """  /** Unique across the tree: `group:<id>`, `family:<id>`, `ideology:<id>`, or ROOT_ID. */
  key: string;""",
)

sub(
    """  level: NodeLevel;
}

export interface Tree {""",
    """  level: NodeLevel;
  /**
   * Steps from the root: group 1, family 2, an ideology under a family 3, an
   * ideology under an ideology 4 or more. Compared against
   * `REPORT_LEVEL_RANK` to decide whether a mode may name this node.
   */
  rank: number;
}

export interface Tree {""",
)

sub(
    """  for (const ideology of content.ideologies) {
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
    });
  }

  for (const family of content.families) {
    const members = content.ideologiesByFamily.get(family.id) ?? [];
    nodes.set(familyKey(family.id), {
      key: familyKey(family.id),
      id: family.id,
      kind: 'family',
      name: family.name,
      parent: ROOT_ID,
      children: members
        .filter((i) => parentIdOf(content, i.id) === null)
        .map((i) => ideologyKey(i.id)),
      level: 'family',
    });
  }

  const root: TreeNode = {
    key: ROOT_ID,
    id: ROOT_ID,
    kind: 'root',
    name: 'All ideologies',
    parent: null,
    children: content.families.map((f) => familyKey(f.id)),
    level: 'family',
  };
  nodes.set(ROOT_ID, root);

  return { nodes, root };""",
    """  for (const ideology of content.ideologies) {
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

  return { nodes, root };""",
)

sub(
    """export function nodeKeyFor(model: EngineModel, idOrKey: string): string | undefined {
  if (model.tree.nodes.has(idOrKey)) return idOrKey;
  const asIdeology = ideologyKey(idOrKey);
  if (model.tree.nodes.has(asIdeology)) return asIdeology;
  const asFamily = familyKey(idOrKey);
  if (model.tree.nodes.has(asFamily)) return asFamily;
  return undefined;
}""",
    """export function nodeKeyFor(model: EngineModel, idOrKey: string): string | undefined {
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
}""",
)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
