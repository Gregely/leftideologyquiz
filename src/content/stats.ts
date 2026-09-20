/**
 * Bank statistics: the shape of the question set, measured against the budgets
 * in SPEC.md §9.
 *
 * Pure. Formatting lives in scripts/stats.ts.
 */

import type { LoadResult } from './load.js';
import { effectiveStances } from './lint.js';
import type { FollowUpMode } from './schema.js';

export interface BankStats {
  questionCount: number;
  byDepth: Record<1 | 2 | 3, number>;
  /**
   * Questions per family, derived from which families hold stances on them —
   * the same derivation the engine uses for scope. A question no family has
   * reached is `unscoped`, and counts once toward every family that has.
   */
  byFamily: { familyId: string; name: string; count: number }[];
  unscopedQuestions: string[];
  followUps: Record<FollowUpMode, number>;
  followUpTargets: number;
  historyClass: { count: number; share: number; cap: number; withinCap: boolean };
  likert: { count: number; share: number };
  selfId: { count: number; perFamily: { familyId: string; count: number }[] };
  withModifierTags: { count: number; byTag: { tag: string; questions: number }[] };
  longestForcedChain: { length: number; path: string[] };
  gatedQuestions: number;
  exclusivePairs: number;
}

/** SPEC.md §9: history-class questions are capped at ~10% of the bank. */
export const HISTORY_CLASS_CAP = 0.1;

export function bankStats(loaded: LoadResult): BankStats | null {
  const content = loaded.content;
  if (!content) return null;

  const questions = content.questions;
  const stances = effectiveStances(content);

  const byDepth: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (const question of questions) byDepth[question.depth] += 1;

  // --- family scope ----------------------------------------------------------
  const familyCounts = new Map<string, number>();
  const unscopedQuestions: string[] = [];
  for (const question of questions) {
    const families = new Set<string>();
    for (const [ideologyId, table] of stances) {
      if (!table.has(question.id)) continue;
      const family = content.ideologyById.get(ideologyId)?.family;
      if (family) families.add(family);
    }
    if (families.size === 0) unscopedQuestions.push(question.id);
    for (const familyId of families) {
      familyCounts.set(familyId, (familyCounts.get(familyId) ?? 0) + 1);
    }
  }

  const byFamily = content.families.map((family) => ({
    familyId: family.id,
    name: family.name,
    count: familyCounts.get(family.id) ?? 0,
  }));

  // --- follow-ups ------------------------------------------------------------
  const followUps: Record<FollowUpMode, number> = { force: 0, boost: 0, unlock: 0 };
  let followUpTargets = 0;
  for (const question of questions) {
    for (const followUp of question.follow_ups) {
      followUps[followUp.mode] += 1;
      followUpTargets += followUp.ask.length;
    }
  }

  // --- quotas ----------------------------------------------------------------
  const historyCount = questions.filter((q) => q.history_class).length;
  const likertCount = questions.filter((q) => q.kind === 'likert5').length;
  const total = questions.length;

  const selfIdQuestions = questions.filter((q) => q.self_id);
  const selfIdPerFamily = new Map<string, number>();
  for (const question of selfIdQuestions) {
    for (const [ideologyId, table] of stances) {
      if (!table.has(question.id)) continue;
      const family = content.ideologyById.get(ideologyId)?.family;
      if (family) selfIdPerFamily.set(family, (selfIdPerFamily.get(family) ?? 0) + 1);
    }
  }

  // --- modifier tags ---------------------------------------------------------
  const tagCounts = new Map<string, number>();
  let withModifierTags = 0;
  for (const question of questions) {
    const tags = question.modifier_tags;
    if (!tags || Object.keys(tags).length === 0) continue;
    withModifierTags += 1;
    for (const tag of new Set(Object.values(tags))) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return {
    questionCount: total,
    byDepth,
    byFamily,
    unscopedQuestions,
    followUps,
    followUpTargets,
    historyClass: {
      count: historyCount,
      share: total === 0 ? 0 : historyCount / total,
      cap: HISTORY_CLASS_CAP,
      withinCap: total === 0 || historyCount / total <= HISTORY_CLASS_CAP,
    },
    likert: { count: likertCount, share: total === 0 ? 0 : likertCount / total },
    selfId: {
      count: selfIdQuestions.length,
      perFamily: [...selfIdPerFamily.entries()]
        .map(([familyId, count]) => ({ familyId, count }))
        .sort((a, b) => b.count - a.count || a.familyId.localeCompare(b.familyId)),
    },
    withModifierTags: {
      count: withModifierTags,
      byTag: [...tagCounts.entries()]
        .map(([tag, questionCount]) => ({ tag, questions: questionCount }))
        .sort((a, b) => b.questions - a.questions || a.tag.localeCompare(b.tag)),
    },
    longestForcedChain: longestForcedChain(loaded),
    gatedQuestions: questions.filter((q) => q.requires).length,
    exclusivePairs: countExclusivePairs(loaded),
  };
}

/**
 * The longest run of forced follow-ups, which is how far a single answer can
 * dictate the rest of a session.
 *
 * SPEC.md §7.2 caps the forced queue at 3 pending, so a chain longer than that
 * is not a bug but is worth seeing: it means the authored flow, not the
 * adaptive selector, is driving.
 *
 * Cycles are a `validate` error; the visited set here stops one from hanging
 * this tool in the meantime.
 */
export function longestForcedChain(loaded: LoadResult): { length: number; path: string[] } {
  const content = loaded.content;
  if (!content) return { length: 0, path: [] };

  const edges = new Map<string, string[]>();
  for (const question of content.questions) {
    const targets: string[] = [];
    for (const followUp of question.follow_ups) {
      if (followUp.mode !== 'force') continue;
      for (const target of followUp.ask) {
        if (content.questionById.has(target)) targets.push(target);
      }
    }
    if (targets.length > 0) edges.set(question.id, targets);
  }

  let best: string[] = [];
  const memo = new Map<string, string[]>();

  const walk = (id: string, onPath: Set<string>): string[] => {
    const cached = memo.get(id);
    if (cached) return cached;
    if (onPath.has(id)) return [id];

    onPath.add(id);
    let longest: string[] = [];
    for (const next of edges.get(id) ?? []) {
      const tail = walk(next, onPath);
      if (tail.length > longest.length) longest = tail;
    }
    onPath.delete(id);

    const path = [id, ...longest];
    memo.set(id, path);
    return path;
  };

  for (const question of content.questions) {
    const path = walk(question.id, new Set());
    if (path.length > best.length) best = path;
  }

  // A single question with no forced follow-up is a chain of length 1, which is
  // not a chain. Report 0 so "longest chain" reads as "how far forcing goes".
  return best.length <= 1 ? { length: 0, path: [] } : { length: best.length, path: best };
}

function countExclusivePairs(loaded: LoadResult): number {
  const content = loaded.content;
  if (!content) return 0;
  const seen = new Set<string>();
  for (const question of content.questions) {
    for (const other of question.exclusive_with) {
      seen.add([question.id, other].sort().join('|'));
    }
  }
  return seen.size;
}
