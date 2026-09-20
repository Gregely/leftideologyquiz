/**
 * Stance coverage and pairwise separation (SPEC.md §10.4, §10.5).
 *
 * Two questions, both about whether the content can do its job:
 *   - which ideologies have nothing to say about which questions
 *   - which near neighbours the bank cannot currently tell apart
 *
 * The second is the one that matters. SPEC.md §1 makes near-neighbour
 * discrimination the success criterion, and a pair with no separating question
 * is a pair the test will always return together — which is either a gap to
 * author or a fact to record in docs/inseparable.md.
 *
 * Pure. Formatting lives in scripts/coverage.ts.
 */

import type { LoadResult } from './load.js';
import { effectiveStances } from './lint.js';
import { resolveStances } from './load.js';
import type { Stance } from './schema.js';

/**
 * A stance's signed weight for one option: accept pulls up, reject pushes down,
 * silence is zero.
 *
 * Raw stance weight, not the engine's `rejectMultiplier`-scaled version. This
 * is a question about the content — how far apart two ideologies were authored
 * — and it should not move when an engine tunable is retuned.
 */
export function signedWeight(stance: Stance | undefined, optionId: string): number {
  if (!stance) return 0;
  if (stance.accept.includes(optionId)) return stance.weight;
  if (stance.reject.includes(optionId)) return -stance.weight;
  return 0;
}

/** How far apart two ideologies are on one question: the widest option gap. */
export function separationOn(
  optionIds: readonly string[],
  a: Stance | undefined,
  b: Stance | undefined,
): number {
  let widest = 0;
  for (const optionId of optionIds) {
    const gap = Math.abs(signedWeight(a, optionId) - signedWeight(b, optionId));
    if (gap > widest) widest = gap;
  }
  return widest;
}

/** A pair is separated by a question when their stances differ by this much. */
export const SEPARATION_THRESHOLD = 2;

// -----------------------------------------------------------------------------
// Matrix
// -----------------------------------------------------------------------------

export interface CoverageCell {
  /** Effective stance weight, or null where the ideology has no position. */
  weight: number | null;
  /** Where the stance came from, for the legend. */
  source: 'self' | 'tendency' | 'family' | null;
}

export interface CoverageRow {
  ideologyId: string;
  name: string;
  familyId: string;
  tier: string;
  cells: CoverageCell[];
  stanceCount: number;
  depth3Count: number;
}

export interface CoverageMatrix {
  questionIds: string[];
  rows: CoverageRow[];
  /** Questions no ideology anywhere holds a stance on. */
  unusedQuestions: string[];
  totalCells: number;
  filledCells: number;
}

export function buildMatrix(loaded: LoadResult): CoverageMatrix {
  const content = loaded.content;
  if (!content) {
    return { questionIds: [], rows: [], unusedQuestions: [], totalCells: 0, filledCells: 0 };
  }

  const questionIds = content.questions.map((q) => q.id);
  const stances = effectiveStances(content);

  // Provenance is resolved separately: effectiveStances drops it, and the
  // matrix wants to show inherited cells differently from authored ones.
  const provenance = new Map<string, Map<string, CoverageCell['source']>>();
  for (const ideology of content.ideologies) {
    const table = new Map<string, CoverageCell['source']>();
    const resolved = resolveProvenance(loaded, ideology.id);
    for (const [questionId, level] of resolved) table.set(questionId, level);
    provenance.set(ideology.id, table);
  }

  const rows: CoverageRow[] = [];
  let filledCells = 0;

  for (const ideology of content.ideologies) {
    const table = stances.get(ideology.id) ?? new Map<string, Stance>();
    const sources = provenance.get(ideology.id) ?? new Map();
    const cells: CoverageCell[] = [];
    let depth3Count = 0;

    for (const questionId of questionIds) {
      const stance = table.get(questionId);
      if (stance) {
        filledCells += 1;
        if (content.questionById.get(questionId)?.depth === 3) depth3Count += 1;
      }
      cells.push({
        weight: stance ? stance.weight : null,
        source: stance ? (sources.get(questionId) ?? null) : null,
      });
    }

    rows.push({
      ideologyId: ideology.id,
      name: ideology.name,
      familyId: ideology.family,
      tier: ideology.roster_tier,
      cells,
      stanceCount: table.size,
      depth3Count,
    });
  }

  const unusedQuestions = questionIds.filter((questionId) =>
    [...stances.values()].every((table) => !table.has(questionId)),
  );

  return {
    questionIds,
    rows,
    unusedQuestions,
    totalCells: rows.length * questionIds.length,
    filledCells,
  };
}

function resolveProvenance(
  loaded: LoadResult,
  ideologyId: string,
): Map<string, CoverageCell['source']> {
  const out = new Map<string, CoverageCell['source']>();
  const content = loaded.content;
  if (!content) return out;

  // Re-derive rather than import resolveStances' internals, so the matrix
  // cannot drift from what the engine scores.
  const ideology = content.ideologyById.get(ideologyId);
  if (!ideology) return out;

  const family = content.familyById.get(ideology.family);
  if (family) {
    for (const [questionId, stance] of Object.entries(family.stances)) {
      if (stance.weight > 0) out.set(questionId, 'family');
    }
  }

  const chain: string[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined = ideologyId;
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    chain.unshift(cursor);
    cursor = content.ideologyById.get(cursor)?.tendency;
  }

  for (const nodeId of chain) {
    const node = content.ideologyById.get(nodeId);
    if (!node) continue;
    for (const [questionId, stance] of Object.entries(node.stances)) {
      if (stance === null) {
        out.delete(questionId);
      } else if (stance.weight > 0) {
        out.set(questionId, nodeId === ideologyId ? 'self' : 'tendency');
      } else {
        out.delete(questionId);
      }
    }
  }

  return out;
}

// -----------------------------------------------------------------------------
// Separation
// -----------------------------------------------------------------------------

export interface PairSeparation {
  familyId: string;
  a: string;
  b: string;
  /** Questions on which their stances differ by at least the threshold. */
  separatingQuestions: { questionId: string; gap: number }[];
  /** True when one of the two inherits everything the other has. */
  sharesAllStances: boolean;
}

export interface SeparationReport {
  pairs: PairSeparation[];
  unseparated: PairSeparation[];
  fragile: PairSeparation[];
  wellSeparated: number;
}

/**
 * Every same-family pair, and what separates them.
 *
 * Same-family only: two ideologies in different families are separated by the
 * depth-1 questions that place the families, and pairing all 93 against each
 * other would bury the pairs that actually matter under four thousand rows that
 * never needed checking.
 */
export function separationReport(loaded: LoadResult): SeparationReport {
  const content = loaded.content;
  if (!content) return { pairs: [], unseparated: [], fragile: [], wellSeparated: 0 };

  const stances = effectiveStances(content);
  const optionsByQuestion = new Map(
    content.questions.map((q) => [q.id, q.options.filter((o) => !o.implicit).map((o) => o.id)]),
  );

  const pairs: PairSeparation[] = [];

  for (const family of content.families) {
    const members = content.ideologiesByFamily.get(family.id) ?? [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i]!;
        const b = members[j]!;
        const tableA = stances.get(a.id) ?? new Map<string, Stance>();
        const tableB = stances.get(b.id) ?? new Map<string, Stance>();

        const separatingQuestions: { questionId: string; gap: number }[] = [];
        for (const question of content.questions) {
          const options = optionsByQuestion.get(question.id) ?? [];
          const gap = separationOn(options, tableA.get(question.id), tableB.get(question.id));
          if (gap >= SEPARATION_THRESHOLD) {
            separatingQuestions.push({ questionId: question.id, gap });
          }
        }

        separatingQuestions.sort((x, y) => y.gap - x.gap || x.questionId.localeCompare(y.questionId));

        pairs.push({
          familyId: family.id,
          a: a.id,
          b: b.id,
          separatingQuestions,
          sharesAllStances: identicalStances(tableA, tableB),
        });
      }
    }
  }

  return {
    pairs,
    unseparated: pairs.filter((p) => p.separatingQuestions.length === 0),
    fragile: pairs.filter((p) => p.separatingQuestions.length === 1),
    wellSeparated: pairs.filter((p) => p.separatingQuestions.length >= 2).length,
  };
}

function identicalStances(a: Map<string, Stance>, b: Map<string, Stance>): boolean {
  if (a.size !== b.size) return false;
  for (const [questionId, stance] of a) {
    const other = b.get(questionId);
    if (!other) return false;
    if (other.weight !== stance.weight) return false;
    if ([...stance.accept].sort().join('|') !== [...other.accept].sort().join('|')) return false;
    if ([...stance.reject].sort().join('|') !== [...other.reject].sort().join('|')) return false;
  }
  return true;
}

// -----------------------------------------------------------------------------
// Family default fitness
// -----------------------------------------------------------------------------

/**
 * Warn when this share of a family's members override one of its defaults.
 *
 * The 75% rule (SPEC.md §5.2a) says a default is only written when about three
 * quarters of the family would give that answer with conviction, so a quarter
 * overriding is the point at which the default has stopped describing the
 * family. 30% leaves a little room before the warning fires.
 */
export const DEFAULT_OVERRIDE_WARN = 0.3;

/**
 * Warn when a member overrides this share of its family's defaults.
 *
 * Past roughly two fifths, the member is being described mostly by exceptions,
 * which is what being in the wrong family looks like from the inside.
 */
export const MEMBER_OVERRIDE_WARN = 0.4;

export interface DefaultFitness {
  questionId: string;
  /**
   * Members that take a different *position* — a different accept or reject
   * set, or no stance at all. These are the disagreements.
   */
  overriddenBy: string[];
  /** Members that dropped it outright with `null`. */
  clearedBy: string[];
  /**
   * Members that hold the same position at a different weight. Reported, but
   * not counted as overrides: restating a family position at weight 3 to make
   * it a shibboleth is agreement, emphasised.
   */
  weightOnlyBy: string[];
  /** Position overrides as a share of members. Weight-only is excluded. */
  overrideShare: number;
  warn: boolean;
}

export interface MemberFitness {
  ideologyId: string;
  name: string;
  /** Defaults this member takes a different position on. */
  overrides: number;
  /** Defaults it agrees with but weights differently. */
  weightOnly: number;
  ofDefaults: number;
  overrideShare: number;
  /** Over MEMBER_OVERRIDE_WARN: probably in the wrong family. */
  candidateMisfiling: boolean;
}

export interface FamilyFitness {
  familyId: string;
  name: string;
  memberCount: number;
  defaultCount: number;
  defaults: DefaultFitness[];
  members: MemberFitness[];
}

export interface FitnessReport {
  /** Families that declare at least one default. Others have nothing to fit. */
  families: FamilyFitness[];
  /** Families with no defaults at all, which is the correct skeleton state. */
  familiesWithoutDefaults: string[];
  flaggedDefaults: number;
  flaggedMembers: number;
}

const asKey = (ids: readonly string[]): string => [...ids].sort().join('|');

/** Same position: the same options accepted and the same rejected. */
function samePosition(a: Stance, b: Stance): boolean {
  return asKey(a.accept) === asKey(b.accept) && asKey(a.reject) === asKey(b.reject);
}

type Agreement = 'agrees' | 'weight-only' | 'position-override';

/**
 * How a member's effective stance relates to its family's default.
 *
 * The distinction that matters is position versus weight. A member that accepts
 * and rejects exactly what the family default does, but at weight 3 rather than
 * 2, is not disagreeing — it is saying the shared position is *defining* for it,
 * which is how a shibboleth gets written. Counting that as an override would
 * penalise a family default for being correct enough that a member built its
 * identity on it, and would push authors to weaken defaults that are working.
 *
 * A cleared stance is a position difference: the member holds no position where
 * the family holds one.
 */
function agreementWith(
  familyStance: Stance,
  effective: Stance | undefined,
): Agreement {
  if (!effective) return 'position-override';
  if (!samePosition(effective, familyStance)) return 'position-override';
  return effective.weight === familyStance.weight ? 'agrees' : 'weight-only';
}

/**
 * How well each family's defaults actually describe its members.
 *
 * A default is inherited by everyone who does not override it, so a default the
 * family disagrees with does not merely go unused — it is attributed to every
 * member that never said it. This is the report that catches that, and the one
 * that catches the mirror problem: a member defined mostly by its exceptions,
 * which is what a misfiled ideology looks like.
 *
 * Silent until stances exist. With an empty skeleton there are no defaults to
 * fit and nothing worth saying.
 */
export function fitnessReport(loaded: LoadResult): FitnessReport {
  const content = loaded.content;
  if (!content) {
    return { families: [], familiesWithoutDefaults: [], flaggedDefaults: 0, flaggedMembers: 0 };
  }

  const families: FamilyFitness[] = [];
  const familiesWithoutDefaults: string[] = [];

  for (const family of content.families) {
    const defaultEntries = Object.entries(family.stances).filter(([, s]) => s.weight > 0);
    const members = content.ideologiesByFamily.get(family.id) ?? [];

    if (defaultEntries.length === 0 || members.length === 0) {
      familiesWithoutDefaults.push(family.id);
      continue;
    }

    // Effective stances once, reused for both halves of the report.
    const effective = new Map(
      members.map((m) => [m.id, resolveStances(content, m.id).byQuestion] as const),
    );

    const defaults: DefaultFitness[] = defaultEntries.map(([questionId, familyStance]) => {
      const overriddenBy: string[] = [];
      const clearedBy: string[] = [];
      const weightOnlyBy: string[] = [];

      for (const member of members) {
        const entry = effective.get(member.id)?.get(questionId);
        const agreement = agreementWith(familyStance, entry?.stance);
        if (agreement === 'position-override') {
          overriddenBy.push(member.id);
          if (!entry) clearedBy.push(member.id);
        } else if (agreement === 'weight-only') {
          weightOnlyBy.push(member.id);
        }
      }

      // Only position overrides count. A weight-only difference is the member
      // agreeing with the default and saying how much it matters to it.
      const overrideShare = overriddenBy.length / members.length;
      return {
        questionId,
        overriddenBy,
        clearedBy,
        weightOnlyBy,
        overrideShare,
        warn: overrideShare > DEFAULT_OVERRIDE_WARN,
      };
    });

    const memberFitness: MemberFitness[] = members.map((member) => {
      let overrides = 0;
      let weightOnly = 0;
      for (const [questionId, familyStance] of defaultEntries) {
        const entry = effective.get(member.id)?.get(questionId);
        const agreement = agreementWith(familyStance, entry?.stance);
        if (agreement === 'position-override') overrides += 1;
        else if (agreement === 'weight-only') weightOnly += 1;
      }
      const overrideShare = overrides / defaultEntries.length;
      return {
        ideologyId: member.id,
        name: member.name,
        overrides,
        weightOnly,
        ofDefaults: defaultEntries.length,
        overrideShare,
        candidateMisfiling: overrideShare > MEMBER_OVERRIDE_WARN,
      };
    });

    families.push({
      familyId: family.id,
      name: family.name,
      memberCount: members.length,
      defaultCount: defaultEntries.length,
      defaults: defaults.sort((a, b) => b.overrideShare - a.overrideShare || a.questionId.localeCompare(b.questionId)),
      members: memberFitness.sort(
        (a, b) => b.overrideShare - a.overrideShare || a.ideologyId.localeCompare(b.ideologyId),
      ),
    });
  }

  return {
    families,
    familiesWithoutDefaults,
    flaggedDefaults: families.reduce((n, f) => n + f.defaults.filter((d) => d.warn).length, 0),
    flaggedMembers: families.reduce(
      (n, f) => n + f.members.filter((m) => m.candidateMisfiling).length,
      0,
    ),
  };
}
