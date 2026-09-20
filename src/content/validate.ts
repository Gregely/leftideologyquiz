/**
 * Cross-record content checks.
 *
 * Everything here needs a view of the whole bank: does this id exist, is that
 * option really an option of that question, can this question ever be asked.
 * Record-local rules live in the Zod schemas instead.
 *
 * Pure: takes parsed content, returns issues. `scripts/validate.ts` supplies
 * the files and prints the result.
 */

import {
  ancestorChain,
  resolveStances,
  type Content,
  type ContentFile,
  type Issue,
  type LoadResult,
  type NormalisedQuestion,
  type ResolvedStance,
  FILES,
} from './load.js';
import {
  IMPLICIT_OPTION_IDS,
  MAX_INTERPOLATED_LABEL_CHARS,
  type Condition,
  type Stance,
} from './schema.js';

/** Question kinds that yield exactly one answer, so two answer constraints can conflict. */
const SINGLE_ANSWER_KINDS = new Set(['single_choice', 'likert5', 'ranking']);

const INTERPOLATION_PATTERN = /\{\{([^}]*)\}\}/g;
const ANSWER_REFERENCE_PATTERN = /^answers\.([a-z][a-z0-9_]*)\.(label|short)$/;

// -----------------------------------------------------------------------------
// Condition traversal
// -----------------------------------------------------------------------------

type ConditionVisitor = (condition: Condition, path: string) => void;

function visitCondition(condition: Condition, path: string, visit: ConditionVisitor): void {
  visit(condition, path);
  if ('all' in condition) {
    condition.all.forEach((child, i) => visitCondition(child, `${path}.all[${i}]`, visit));
  } else if ('any' in condition) {
    condition.any.forEach((child, i) => visitCondition(child, `${path}.any[${i}]`, visit));
  } else if ('not' in condition) {
    visitCondition(condition.not, `${path}.not`, visit);
  }
}

/**
 * Questions a condition *guarantees* were answered: those reachable through
 * nested `all` branches only. Anything under `any` or `not` might not have
 * happened, so it does not count.
 */
function mandatoryAnsweredQuestions(condition: Condition | undefined): Set<string> {
  const found = new Set<string>();
  const walk = (c: Condition): void => {
    if ('all' in c) c.all.forEach(walk);
    else if ('answered' in c) Object.keys(c.answered).forEach((qid) => found.add(qid));
  };
  if (condition) walk(condition);
  return found;
}

/** Answer constraints imposed unconditionally, grouped by question. */
function collectMandatoryAnswerSets(condition: Condition, into: Map<string, Set<string>[]>): void {
  if ('all' in condition) {
    condition.all.forEach((c) => collectMandatoryAnswerSets(c, into));
  } else if ('answered' in condition) {
    for (const [qid, options] of Object.entries(condition.answered)) {
      const list = into.get(qid);
      if (list) list.push(new Set(options));
      else into.set(qid, [new Set(options)]);
    }
  }
}

// -----------------------------------------------------------------------------
// Satisfiability
// -----------------------------------------------------------------------------

/**
 * Could this condition ever hold, given which questions can actually be asked?
 *
 * Deliberately conservative: it returns true unless it can *prove* otherwise,
 * so the unreachable-question check never fails a question that is merely hard
 * to reach.
 */
function isSatisfiable(
  condition: Condition,
  content: Content,
  reachable: ReadonlySet<string>,
): boolean {
  if ('all' in condition) {
    if (!condition.all.every((c) => isSatisfiable(c, content, reachable))) return false;

    // Two unconditional constraints on the same single-answer question that
    // share no options can never both hold.
    const constraints = new Map<string, Set<string>[]>();
    collectMandatoryAnswerSets(condition, constraints);
    for (const [qid, sets] of constraints) {
      const question = content.questionById.get(qid);
      if (!question || !SINGLE_ANSWER_KINDS.has(question.kind)) continue;
      const intersection = sets.reduce((acc, set) => {
        const next = new Set<string>();
        for (const id of acc) if (set.has(id)) next.add(id);
        return next;
      });
      if (intersection.size === 0) return false;
    }

    // `all: [X, not: X]`.
    const serialised = condition.all.map((c) => JSON.stringify(c));
    for (const child of condition.all) {
      if ('not' in child && serialised.includes(JSON.stringify(child.not))) return false;
    }
    return true;
  }

  if ('any' in condition) return condition.any.some((c) => isSatisfiable(c, content, reachable));

  if ('not' in condition) return !isTautology(condition.not);

  if ('answered' in condition) {
    return Object.entries(condition.answered).every(([qid, options]) => {
      if (!reachable.has(qid)) return false;
      const scorable = content.scorableOptionIds.get(qid);
      return scorable !== undefined && options.some((o) => scorable.has(o));
    });
  }

  if ('family_mass_gte' in condition) {
    return Object.entries(condition.family_mass_gte).every(
      ([fid, threshold]) => content.familyById.has(fid) && threshold > 0 && threshold <= 1,
    );
  }

  return condition.depth_unlocked_gte >= 1 && condition.depth_unlocked_gte <= 3;
}

/** Conditions that always hold, so negating them yields something unsatisfiable. */
function isTautology(condition: Condition): boolean {
  if ('depth_unlocked_gte' in condition) return condition.depth_unlocked_gte <= 1;
  if ('family_mass_gte' in condition) {
    return Object.values(condition.family_mass_gte).every((threshold) => threshold <= 0);
  }
  return false;
}

// -----------------------------------------------------------------------------
// Validator
// -----------------------------------------------------------------------------

type IssueSink = (issue: Issue) => void;

interface Ctx {
  content: Content;
  sources: LoadResult['sources'];
  push: IssueSink;
}

function lineOf(
  ctx: Ctx,
  which: 'families' | 'ideologies' | 'questions',
  id: string,
  path: ReadonlyArray<string | number>,
): number | undefined {
  const source = ctx.sources[which];
  const index = source.indexOf(id);
  if (index === undefined) return undefined;
  return source.lineFor([index, ...path]);
}

/** Run every cross-record check. Errors fail the build; warnings do not. */
export function validateContent(loaded: LoadResult): Issue[] {
  const issues: Issue[] = [];
  if (!loaded.content) return issues;

  const ctx: Ctx = {
    content: loaded.content,
    sources: loaded.sources,
    push: (issue) => issues.push(issue),
  };

  checkIdNamespaces(ctx);
  checkInseparable(ctx);
  checkIdeologyTree(ctx);
  checkFamilyStances(ctx);
  checkIdeologyStances(ctx);
  checkInheritance(ctx);
  checkFollowUps(ctx);
  const badReferences = checkRequires(ctx);
  checkReachability(ctx, badReferences);
  checkExclusivity(ctx);
  checkInterpolation(ctx);
  checkQuestionCoverage(ctx);

  return issues;
}

// --- ideology tree -----------------------------------------------------------

/**
 * Families and ideologies are separate namespaces, so an id may legitimately
 * appear in both — the Marxism–Leninism family really does contain an ideology
 * of that name. It is a warning rather than an error because it is legal and
 * often accurate, but it is worth surfacing twice over: a reader cannot tell
 * which one a `family_mass_gte` clause means, and any code that indexes
 * families and ideologies in one map will silently lose one of them. The engine
 * keys its tree by kind for exactly this reason.
 */
function checkIdNamespaces(ctx: Ctx): void {
  for (const ideology of ctx.content.ideologies) {
    if (!ctx.content.familyById.has(ideology.id)) continue;
    ctx.push({
      severity: 'warning',
      code: 'id/family-ideology-collision',
      file: FILES.ideologies,
      id: ideology.id,
      path: 'id',
      line: lineOf(ctx, 'ideologies', ideology.id, ['id']),
      message: `"${ideology.id}" is both a family id and an ideology id`,
      hint: 'legal, and often accurate — but if it makes a `requires` clause ambiguous to read, rename the family rather than the ideology: ideology ids are the share-URL format',
    });
  }
}

/**
 * `inseparable_from` is a claim about a *pair*, so it must be made from both
 * sides; a one-sided declaration would make the result page explain the pair
 * when one member wins and stay silent when the other does.
 */
function checkInseparable(ctx: Ctx): void {
  for (const ideology of ctx.content.ideologies) {
    for (const [i, entry] of ideology.inseparable_from.entries()) {
      const path = `inseparable_from[${i}]`;
      const line = lineOf(ctx, 'ideologies', ideology.id, ['inseparable_from', i]);
      const other = ctx.content.ideologyById.get(entry.ideology);
      if (entry.ideology === ideology.id) {
        ctx.push({
          severity: 'error',
          code: 'inseparable/self',
          file: FILES.ideologies,
          id: ideology.id,
          path,
          line,
          message: 'an ideology cannot be inseparable from itself',
        });
        continue;
      }
      if (!other) {
        ctx.push({
          severity: 'error',
          code: 'inseparable/unknown-ideology',
          file: FILES.ideologies,
          id: ideology.id,
          path,
          line,
          message: `inseparable_from names "${entry.ideology}", which does not exist`,
        });
        continue;
      }
      if (!other.inseparable_from.some((e) => e.ideology === ideology.id)) {
        ctx.push({
          severity: 'error',
          code: 'inseparable/asymmetric',
          file: FILES.ideologies,
          id: ideology.id,
          path,
          line,
          message: `declares "${other.id}" inseparable, but "${other.id}" does not declare it back`,
          hint: `add an inseparable_from entry for ${ideology.id} to ${other.id}`,
        });
      }
      if (other.family !== ideology.family) {
        ctx.push({
          severity: 'warning',
          code: 'inseparable/cross-family',
          file: FILES.ideologies,
          id: ideology.id,
          path,
          line,
          message: `"${other.id}" is in family "${other.family}", not "${ideology.family}"`,
          hint: 'the resolver only lists candidates under one node, so a cross-family pair may never appear together',
        });
      }
    }
  }
}

function checkIdeologyTree(ctx: Ctx): void {
  for (const ideology of ctx.content.ideologies) {
    if (!ctx.content.familyById.has(ideology.family)) {
      ctx.push({
        severity: 'error',
        code: 'ideology/unknown-family',
        file: FILES.ideologies,
        id: ideology.id,
        path: 'family',
        line: lineOf(ctx, 'ideologies', ideology.id, ['family']),
        message: `family "${ideology.family}" is not defined`,
        hint: `known families: ${[...ctx.content.familyById.keys()].join(', ')}`,
      });
    }

    if (ideology.tendency !== undefined) {
      const parent = ctx.content.ideologyById.get(ideology.tendency);
      if (!parent) {
        ctx.push({
          severity: 'error',
          code: 'ideology/unknown-tendency',
          file: FILES.ideologies,
          id: ideology.id,
          path: 'tendency',
          line: lineOf(ctx, 'ideologies', ideology.id, ['tendency']),
          message: `tendency "${ideology.tendency}" is not a known ideology`,
          hint: '`tendency` names another ideology in the same family that acts as this one\'s parent node',
        });
      } else if (parent.family !== ideology.family) {
        ctx.push({
          severity: 'error',
          code: 'ideology/tendency-cross-family',
          file: FILES.ideologies,
          id: ideology.id,
          path: 'tendency',
          line: lineOf(ctx, 'ideologies', ideology.id, ['tendency']),
          message: `tendency "${parent.id}" is in family "${parent.family}", but this ideology is in "${ideology.family}"`,
          hint: 'a tendency parent must sit in the same family, or stance inheritance crosses families',
        });
      }
    }

    const { cyclic } = ancestorChain(ctx.content, ideology.id);
    if (cyclic) {
      ctx.push({
        severity: 'error',
        code: 'ideology/tendency-cycle',
        file: FILES.ideologies,
        id: ideology.id,
        path: 'tendency',
        line: lineOf(ctx, 'ideologies', ideology.id, ['tendency']),
        message: 'tendency chain forms a cycle, so stances cannot be resolved',
      });
    }

    if (ideology.roster_tier === 'boundary' && !ideology.boundary) {
      ctx.push({
        severity: 'warning',
        code: 'ideology/boundary-mismatch',
        file: FILES.ideologies,
        id: ideology.id,
        path: 'boundary',
        line: lineOf(ctx, 'ideologies', ideology.id, ['roster_tier']),
        message: 'roster_tier is "boundary" but boundary is false',
        hint: 'set boundary: true, or move it to roster_tier core/niche',
      });
    }
  }
}

// --- stances -----------------------------------------------------------------

function checkStanceRecord(
  ctx: Ctx,
  which: 'families' | 'ideologies',
  file: ContentFile,
  ownerId: string,
  questionId: string,
  stance: Stance,
): void {
  const question = ctx.content.questionById.get(questionId);
  if (!question) {
    ctx.push({
      severity: 'error',
      code: 'stance/unknown-question',
      file,
      id: ownerId,
      path: `stances.${questionId}`,
      line: lineOf(ctx, which, ownerId, ['stances', questionId]),
      message: `stance refers to question "${questionId}", which does not exist`,
    });
    return;
  }

  const scorable = ctx.content.scorableOptionIds.get(questionId) ?? new Set<string>();

  for (const listName of ['accept', 'reject'] as const) {
    for (const [i, optionId] of stance[listName].entries()) {
      if (scorable.has(optionId)) continue;

      const isImplicit = IMPLICIT_OPTION_IDS.includes(optionId);
      ctx.push({
        severity: 'error',
        code: isImplicit ? 'stance/implicit-option' : 'stance/unknown-option',
        file,
        id: ownerId,
        path: `stances.${questionId}.${listName}[${i}]`,
        line: lineOf(ctx, which, ownerId, ['stances', questionId, listName, i]),
        message: isImplicit
          ? `"${optionId}" never updates scores, so no stance may name it`
          : `"${optionId}" is not an option of question "${questionId}"`,
        hint: isImplicit
          ? undefined
          : `options are: ${[...scorable].join(', ')}`,
      });
    }
  }
}

function checkFamilyStances(ctx: Ctx): void {
  for (const family of ctx.content.families) {
    for (const [questionId, stance] of Object.entries(family.stances)) {
      checkStanceRecord(ctx, 'families', FILES.families, family.id, questionId, stance);
    }
  }
}

function checkIdeologyStances(ctx: Ctx): void {
  for (const ideology of ctx.content.ideologies) {
    for (const [questionId, stance] of Object.entries(ideology.stances)) {
      if (stance === null) continue;
      checkStanceRecord(ctx, 'ideologies', FILES.ideologies, ideology.id, questionId, stance);
    }
  }
}

// --- inheritance -------------------------------------------------------------

function stanceFingerprint(resolved: Map<string, ResolvedStance>): string {
  return [...resolved.entries()]
    .map(([qid, r]) => `${qid}:${r.stance.weight}:${[...r.stance.accept].sort().join('|')}:${[...r.stance.reject].sort().join('|')}`)
    .sort()
    .join('\n');
}

function checkInheritance(ctx: Ctx): void {
  // An ideology that is some other ideology's parent is an interior node of
  // the tree; it exists so results can back off to it, and needs no positions
  // of its own (SPEC.md §2.1).
  const interiorNodes = new Set(
    ctx.content.ideologies.map((i) => i.tendency).filter((id): id is string => id !== undefined),
  );

  for (const ideology of ctx.content.ideologies) {
    const resolved = resolveStances(ctx.content, ideology.id);
    if (resolved.cyclic) continue; // already reported

    for (const questionId of resolved.clearedNothing) {
      ctx.push({
        severity: 'warning',
        code: 'stance/clears-nothing',
        file: FILES.ideologies,
        id: ideology.id,
        path: `stances.${questionId}`,
        line: lineOf(ctx, 'ideologies', ideology.id, ['stances', questionId]),
        message: `\`${questionId}: null\` clears an inherited stance, but nothing was inherited for that question`,
        hint: 'remove the null, or check the question id',
      });
    }

    if (resolved.byQuestion.size === 0) {
      ctx.push({
        severity: 'warning',
        code: 'stance/none',
        file: FILES.ideologies,
        id: ideology.id,
        line: lineOf(ctx, 'ideologies', ideology.id, []),
        message: 'resolves to no stances at all, so it can never be matched',
      });
      continue;
    }

    if (interiorNodes.has(ideology.id)) continue;

    const parentId = ideology.tendency;
    const parentResolved = parentId
      ? resolveStances(ctx.content, parentId).byQuestion
      : inheritedFromFamilyOnly(ctx, ideology.family);

    if (stanceFingerprint(resolved.byQuestion) === stanceFingerprint(parentResolved)) {
      const parentLabel = parentId ? `its parent "${parentId}"` : `its family "${ideology.family}"`;
      ctx.push({
        severity: 'warning',
        code: 'inherit/no-distinguishing-stance',
        file: FILES.ideologies,
        id: ideology.id,
        line: lineOf(ctx, 'ideologies', ideology.id, ['stances']),
        message: `resolves to exactly the stances of ${parentLabel}, so nothing can tell them apart`,
        hint: ideology.lineage
          ? 'marked `lineage: true`: if no position question can separate it, record the pair in docs/inseparable.md (SPEC.md §10.4)'
          : 'add a stance that states where it actually differs, or merge it into the parent',
      });
    }
  }
}

function inheritedFromFamilyOnly(ctx: Ctx, familyId: string): Map<string, ResolvedStance> {
  const family = ctx.content.familyById.get(familyId);
  const map = new Map<string, ResolvedStance>();
  if (!family) return map;
  for (const [questionId, stance] of Object.entries(family.stances)) {
    map.set(questionId, { questionId, stance, from: { level: 'family', id: family.id } });
  }
  return map;
}

// --- follow-ups --------------------------------------------------------------

function checkFollowUps(ctx: Ctx): void {
  const forceEdges = new Map<string, string[]>();
  const allEdges = new Map<string, string[]>();

  for (const question of ctx.content.questions) {
    for (const [i, followUp] of question.follow_ups.entries()) {
      for (const [j, targetId] of followUp.ask.entries()) {
        if (!ctx.content.questionById.has(targetId)) {
          ctx.push({
            severity: 'error',
            code: 'followup/unknown-question',
            file: FILES.questions,
            id: question.id,
            path: `follow_ups[${i}].ask[${j}]`,
            line: lineOf(ctx, 'questions', question.id, ['follow_ups', i, 'ask', j]),
            message: `follow-up asks "${targetId}", which does not exist`,
          });
          continue;
        }
        pushEdge(allEdges, question.id, targetId);
        if (followUp.mode === 'force') pushEdge(forceEdges, question.id, targetId);
      }
    }
  }

  for (const cycle of findCycles(forceEdges)) {
    ctx.push({
      severity: 'error',
      code: 'followup/force-cycle',
      file: FILES.questions,
      id: cycle[0] as string,
      line: lineOf(ctx, 'questions', cycle[0] as string, ['follow_ups']),
      message: `forced follow-ups form a cycle: ${cycle.join(' -> ')} -> ${cycle[0]}`,
      hint: 'a forced chain that loops never terminates; make one of these edges mode: boost',
    });
  }

  const forceCycleMembers = new Set(findCycles(forceEdges).flat());
  for (const cycle of findCycles(allEdges)) {
    if (cycle.some((id) => forceCycleMembers.has(id))) continue;
    ctx.push({
      severity: 'warning',
      code: 'followup/cycle',
      file: FILES.questions,
      id: cycle[0] as string,
      line: lineOf(ctx, 'questions', cycle[0] as string, ['follow_ups']),
      message: `follow-ups form a cycle: ${cycle.join(' -> ')} -> ${cycle[0]}`,
      hint: 'harmless while no edge is mode: force, since a question is never asked twice — but usually a sign the authored flow is confused',
    });
  }
}

function pushEdge(edges: Map<string, string[]>, from: string, to: string): void {
  const list = edges.get(from);
  if (list) list.push(to);
  else edges.set(from, [to]);
}

/** Every distinct cycle in a directed graph, each reported once. */
function findCycles(edges: ReadonlyMap<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const seenSignatures = new Set<string>();
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];

  const visit = (node: string): void => {
    const current = state.get(node);
    if (current === 'done') return;
    if (current === 'visiting') {
      const start = stack.indexOf(node);
      if (start === -1) return;
      const cycle = stack.slice(start);
      const signature = [...cycle].sort().join(',');
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        cycles.push(cycle);
      }
      return;
    }

    state.set(node, 'visiting');
    stack.push(node);
    for (const next of edges.get(node) ?? []) visit(next);
    stack.pop();
    state.set(node, 'done');
  };

  for (const node of edges.keys()) visit(node);
  return cycles;
}

// --- requires ----------------------------------------------------------------

/** Returns question ids whose `requires` names something that does not exist. */
function checkRequires(ctx: Ctx): Set<string> {
  const bad = new Set<string>();

  for (const question of ctx.content.questions) {
    if (!question.requires) continue;

    visitCondition(question.requires, 'requires', (condition, path) => {
      if ('answered' in condition) {
        for (const [questionId, options] of Object.entries(condition.answered)) {
          const target = ctx.content.questionById.get(questionId);
          if (!target) {
            bad.add(question.id);
            ctx.push({
              severity: 'error',
              code: 'requires/unknown-question',
              file: FILES.questions,
              id: question.id,
              path: `${path}.answered.${questionId}`,
              line: lineOf(ctx, 'questions', question.id, ['requires']),
              message: `condition refers to question "${questionId}", which does not exist`,
            });
            continue;
          }
          const scorable = ctx.content.scorableOptionIds.get(questionId) ?? new Set<string>();
          for (const optionId of options) {
            if (scorable.has(optionId)) continue;
            bad.add(question.id);
            const isImplicit = IMPLICIT_OPTION_IDS.includes(optionId);
            ctx.push({
              severity: 'error',
              code: isImplicit ? 'requires/implicit-option' : 'requires/unknown-option',
              file: FILES.questions,
              id: question.id,
              path: `${path}.answered.${questionId}`,
              line: lineOf(ctx, 'questions', question.id, ['requires']),
              message: isImplicit
                ? `"${optionId}" does not count as having answered "${questionId}", so this condition can never hold`
                : `"${optionId}" is not an option of "${questionId}"`,
              hint: isImplicit ? undefined : `options are: ${[...scorable].join(', ')}`,
            });
          }
        }
      } else if ('family_mass_gte' in condition) {
        for (const [familyId, threshold] of Object.entries(condition.family_mass_gte)) {
          if (!ctx.content.familyById.has(familyId)) {
            bad.add(question.id);
            ctx.push({
              severity: 'error',
              code: 'requires/unknown-family',
              file: FILES.questions,
              id: question.id,
              path: `${path}.family_mass_gte.${familyId}`,
              line: lineOf(ctx, 'questions', question.id, ['requires']),
              message: `condition refers to family "${familyId}", which does not exist`,
            });
          }
          if (threshold <= 0 || threshold > 1) {
            bad.add(question.id);
            ctx.push({
              severity: 'error',
              code: 'requires/bad-threshold',
              file: FILES.questions,
              id: question.id,
              path: `${path}.family_mass_gte.${familyId}`,
              line: lineOf(ctx, 'questions', question.id, ['requires']),
              message: `posterior mass threshold ${threshold} is outside (0, 1]`,
              hint:
                threshold <= 0
                  ? 'a threshold of zero or less is always true, which makes the condition a no-op'
                  : 'mass is a probability, so nothing can ever exceed 1',
            });
          }
        }
      }
    });
  }

  return bad;
}

// --- reachability ------------------------------------------------------------

/**
 * Least fixpoint: start from nothing reachable and repeatedly admit any
 * question whose `requires` can be satisfied using only questions already
 * admitted, until no more can be added.
 *
 * It has to grow rather than shrink. Starting from "everything is reachable"
 * and dropping what fails would leave two questions that gate on each other in
 * place, because each one's condition is satisfied by the other still being in
 * the set — circular justification that no actual respondent could ever
 * produce, since neither could be asked first.
 *
 * A `mode: unlock` follow-up grants eligibility directly, so a question that
 * some reachable question unlocks is admitted whatever its own `requires` says.
 */
function checkReachability(ctx: Ctx, skip: ReadonlySet<string>): void {
  const unlockedBy = new Map<string, string[]>();
  for (const question of ctx.content.questions) {
    for (const followUp of question.follow_ups) {
      if (followUp.mode !== 'unlock') continue;
      for (const target of followUp.ask) pushEdge(unlockedBy, target, question.id);
    }
  }

  const reachable = new Set<string>();

  let changed = true;
  while (changed) {
    changed = false;
    for (const question of ctx.content.questions) {
      if (reachable.has(question.id)) continue;

      const admissible =
        !question.requires ||
        (unlockedBy.get(question.id) ?? []).some((id) => reachable.has(id)) ||
        isSatisfiable(question.requires, ctx.content, reachable);

      if (admissible) {
        reachable.add(question.id);
        changed = true;
      }
    }
  }

  for (const question of ctx.content.questions) {
    if (reachable.has(question.id) || skip.has(question.id)) continue;
    ctx.push({
      severity: 'error',
      code: 'question/unreachable',
      file: FILES.questions,
      id: question.id,
      path: 'requires',
      line: lineOf(ctx, 'questions', question.id, ['requires']),
      message: 'no sequence of answers can satisfy `requires`, so this question can never be asked',
      hint: 'check for a dependency loop, contradictory `answered` clauses, or a gate on a question that is itself unreachable',
    });
  }
}

// --- exclusivity -------------------------------------------------------------

function checkExclusivity(ctx: Ctx): void {
  for (const question of ctx.content.questions) {
    for (const [i, otherId] of question.exclusive_with.entries()) {
      const other = ctx.content.questionById.get(otherId);
      if (!other) {
        ctx.push({
          severity: 'error',
          code: 'exclusive/unknown-question',
          file: FILES.questions,
          id: question.id,
          path: `exclusive_with[${i}]`,
          line: lineOf(ctx, 'questions', question.id, ['exclusive_with', i]),
          message: `exclusive_with names "${otherId}", which does not exist`,
        });
        continue;
      }
      if (!other.exclusive_with.includes(question.id)) {
        ctx.push({
          severity: 'warning',
          code: 'exclusive/asymmetric',
          file: FILES.questions,
          id: question.id,
          path: `exclusive_with[${i}]`,
          line: lineOf(ctx, 'questions', question.id, ['exclusive_with', i]),
          message: `declares redundancy with "${otherId}", but "${otherId}" does not declare it back`,
          hint: `add \`exclusive_with: [${question.id}]\` to "${otherId}" — redundancy is symmetric`,
        });
      }
    }
  }
}

// --- interpolation -----------------------------------------------------------

function checkInterpolation(ctx: Ctx): void {
  for (const question of ctx.content.questions) {
    for (const field of ['text', 'tooltip'] as const) {
      const value = question[field];
      if (!value) continue;
      for (const match of value.matchAll(INTERPOLATION_PATTERN)) {
        checkInterpolationReference(ctx, question, field, (match[1] ?? '').trim());
      }
    }
  }
}

function checkInterpolationReference(
  ctx: Ctx,
  question: NormalisedQuestion,
  field: 'text' | 'tooltip',
  expression: string,
): void {
  const line = lineOf(ctx, 'questions', question.id, [field]);
  const base = { file: FILES.questions, id: question.id, path: field, line } as const;

  const match = ANSWER_REFERENCE_PATTERN.exec(expression);
  if (!match) {
    ctx.push({
      ...base,
      severity: 'error',
      code: 'interp/unsupported-expression',
      message: `{{${expression}}} is not a supported interpolation`,
      hint: 'the only supported forms are {{answers.<question_id>.label}} and {{answers.<question_id>.short}}',
    });
    return;
  }

  const targetId = match[1] as string;
  const accessor = match[2] as 'label' | 'short';

  if (targetId === question.id) {
    ctx.push({
      ...base,
      severity: 'error',
      code: 'interp/self',
      message: 'a question cannot interpolate its own answer',
    });
    return;
  }

  const target = ctx.content.questionById.get(targetId);
  if (!target) {
    ctx.push({
      ...base,
      severity: 'error',
      code: 'interp/unknown-question',
      message: `interpolates "${targetId}", which does not exist`,
    });
    return;
  }

  // The text is only correct if that answer is certain to exist by the time
  // this question is asked. Only `requires` can promise that; adaptive
  // selection makes no guarantee about what else has been asked.
  if (!mandatoryAnsweredQuestions(question.requires).has(targetId)) {
    ctx.push({
      ...base,
      severity: 'error',
      code: 'interp/not-guaranteed',
      message: `interpolates "${targetId}", but nothing guarantees it was answered first`,
      hint: `add an \`answered: { ${targetId}: [...] }\` clause to this question's \`requires\` (inside \`all\`, not \`any\` or \`not\`)`,
    });
    return;
  }

  if (target.depth > question.depth) {
    ctx.push({
      ...base,
      severity: 'warning',
      code: 'interp/deeper-source',
      message: `interpolates depth-${target.depth} question "${targetId}" into a depth-${question.depth} question`,
      hint: 'gating makes this safe, but a shallower question depending on a deeper one usually means the depths are wrong',
    });
  }

  const scorable = target.options.filter((o) => !o.implicit);

  if (accessor === 'short') {
    const missing = scorable.filter((o) => !o.short).map((o) => o.id);
    if (missing.length > 0) {
      ctx.push({
        ...base,
        severity: 'error',
        code: 'interp/missing-short',
        message: `uses {{answers.${targetId}.short}}, but these options of "${targetId}" have no \`short\`: ${missing.join(', ')}`,
        hint: 'add a `short:` to every option of the interpolated question, or switch to .label',
      });
    }
    return;
  }

  const overlong = scorable.filter((o) => o.label.length > MAX_INTERPOLATED_LABEL_CHARS);
  if (overlong.length > 0) {
    ctx.push({
      ...base,
      severity: 'warning',
      code: 'interp/long-label',
      message: `interpolates the full label of "${targetId}", and ${overlong.length} of its options run past ${MAX_INTERPOLATED_LABEL_CHARS} characters`,
      hint: `add \`short:\` to those options and use {{answers.${targetId}.short}} instead`,
    });
  }
}

// --- coverage ----------------------------------------------------------------

function checkQuestionCoverage(ctx: Ctx): void {
  const questionsWithStances = new Set<string>();
  for (const ideology of ctx.content.ideologies) {
    const resolved = resolveStances(ctx.content, ideology.id);
    for (const [questionId, entry] of resolved.byQuestion) {
      if (entry.stance.weight > 0) questionsWithStances.add(questionId);
    }
  }

  for (const question of ctx.content.questions) {
    if (questionsWithStances.has(question.id)) continue;
    // A question with modifier tags earns its place by producing a result
    // modifier, so it is allowed to move no ideology at all.
    if (question.modifier_tags && Object.keys(question.modifier_tags).length > 0) continue;

    ctx.push({
      severity: 'warning',
      code: 'question/no-stances',
      file: FILES.questions,
      id: question.id,
      line: lineOf(ctx, 'questions', question.id, []),
      message: 'no ideology holds a stance on this question, so asking it tells the test nothing',
      hint: 'add stances, give it modifier_tags, or cut it',
    });
  }
}
