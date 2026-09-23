import io

p = 'src/engine/resolve.ts'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:60])
    s = s.replace(old, new)


sub(
    """import type { NodeKind, NodeLevel } from './model.js';
import { lineageShibboleths, nodeKeyFor, ROOT_ID } from './model.js';""",
    """import type { NodeKind, NodeLevel, ReportLevel } from './model.js';
import { lineageShibboleths, nodeKeyFor, REPORT_LEVEL_RANK, ROOT_ID } from './model.js';""",
)

sub(
    """export type BackOffReason =
  | 'top-two-too-close'
  | 'below-absolute-floor'
  | 'too-few-answers'
  | 'lineage-not-established';""",
    """export type BackOffReason =
  | 'top-two-too-close'
  | 'below-absolute-floor'
  | 'too-few-answers'
  | 'lineage-not-established'
  /** The evidence supported going deeper; the mode is not allowed to. */
  | 'mode-reports-no-deeper';""",
)

sub(
    """export function resolve(posterior: Posterior): Result {
  const { config } = posterior.model;

  let nodeKey = ROOT_ID;
  let backOffReason: BackOffReason | null = null;""",
    """/**
 * Walk the tree to the deepest node the evidence — and the mode — support.
 *
 * `maxReportLevel` caps how specific an answer may be. Quick mode passes
 * `'group'` because tier-1 questions cannot tell four of the thirteen families
 * apart, and naming one anyway is the false precision SPEC.md §1.1 forbids.
 * The default is `'sect'`, so a caller that does not care about modes behaves
 * exactly as before.
 */
export function resolve(posterior: Posterior, maxReportLevel: ReportLevel = 'sect'): Result {
  const { config } = posterior.model;
  const maxRank = REPORT_LEVEL_RANK[maxReportLevel];

  let nodeKey = ROOT_ID;
  let backOffReason: BackOffReason | null = null;""",
)

sub(
    """    const entries = entriesAt(posterior, nodeKey);

    // A leaf ideology: nothing left to choose between.
    if (entries.length === 0) {""",
    """    // As deep as this mode may report. Stop here and say so: the answer is
    // this node, resolved if the walk got here on the thresholds' say-so.
    if (node.rank >= maxRank) {
      return backOffReason === null
        ? resolvedAt(posterior, nodeKey)
        : undecided(posterior, nodeKey, backOffReason);
    }

    const entries = entriesAt(posterior, nodeKey);

    // A leaf ideology: nothing left to choose between.
    if (entries.length === 0) {""",
)

sub(
    """    const next = posterior.model.tree.nodes.get(top.key);
    if (!next) break;""",
    """    const next = posterior.model.tree.nodes.get(top.key);
    if (!next) break;

    // Descending would name something deeper than this mode reports. The
    // evidence is there, so this is a resolved answer at the current node
    // rather than a tie — but say why it stopped.
    if (next.rank > maxRank) {
      return resolvedAt(posterior, nodeKey, 'mode-reports-no-deeper');
    }""",
)

sub(
    """function resolved(posterior: Posterior, nodeKey: string): Result {
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
}""",
    """function resolved(posterior: Posterior, nodeKey: string): Result {
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

/**
 * A resolved answer at a node that is not a leaf: the mode's report cap stopped
 * the walk. Candidates are still listed, because "you are in this group, and
 * these are the families inside it that fit" is the whole point of stopping —
 * the result page needs somewhere to point the respondent next.
 */
function resolvedAt(
  posterior: Posterior,
  nodeKey: string,
  reason: BackOffReason | null = null,
): Result {
  const node = posterior.model.tree.nodes.get(nodeKey);
  if (!node || (node.kind === 'ideology' && node.children.length === 0)) {
    return resolved(posterior, nodeKey);
  }

  const { config } = posterior.model;
  const entries = entriesAt(posterior, nodeKey);
  const parentMass = nodeKey === ROOT_ID ? 1 : subtreeMass(posterior, nodeKey);

  return {
    kind: 'resolved',
    level: node.level,
    node: { id: node.id, name: node.name, kind: node.kind },
    candidates: candidatesFrom(entries, parentMass, config.candidateFloor),
    confidence: parentMass,
    anchorIdeologyId: bestLeafUnder(posterior, nodeKey),
    contributions: (() => {
      const anchor = bestLeafUnder(posterior, nodeKey);
      return anchor ? contributionsFor(posterior, anchor) : [];
    })(),
    backOffReason: reason,
    scoringAnswerCount: posterior.scoringAnswerCount,
    inseparable: [],
  };
}""",
)

sub(
    """    // Reporting an ideology we could not resolve past means reporting it as the
    // tendency its candidates sit inside.
    level: node?.kind === 'ideology' ? 'tendency' : 'family',""",
    """    // Reporting an ideology we could not resolve past means reporting it as the
    // tendency its candidates sit inside.
    level: node?.kind === 'ideology' ? 'tendency' : (node?.level ?? 'group'),""",
)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
