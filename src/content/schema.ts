/**
 * Zod schemas for everything under /content.
 *
 * These are the single source of truth for content shape: every TypeScript type
 * in the app is `z.infer` of a schema here, never hand-written alongside one.
 *
 * Schemas enforce only what a single record can know about itself. Anything
 * needing cross-record knowledge — does this question id exist, does this
 * option belong to that question, is this question reachable — lives in
 * `validate.ts`, because the schema has no view of the rest of the content.
 */

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------

/** All content ids are lowercase snake_case: `d3_dissent_after_revolution`. */
export const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const Id = z
  .string()
  .regex(ID_PATTERN, 'must be lowercase snake_case, starting with a letter');

const Tag = z.string().regex(ID_PATTERN, 'tags must be lowercase snake_case');

/**
 * Injected onto every question by the loader; never authored. Selecting one
 * records the answer and consumes budget but produces no posterior update, so
 * no ideology may hold a stance on either (SPEC.md §3.1).
 */
export const IMPLICIT_OPTIONS = [
  { id: 'unsure', label: "I'm not sure", short: 'not sure' },
  { id: 'unknown_term', label: "I don't know this term", short: "don't know the term" },
] as const;

export const IMPLICIT_OPTION_IDS: readonly string[] = IMPLICIT_OPTIONS.map((o) => o.id);

/**
 * The five points of a `likert5` question, injected by the loader. Stances on a
 * likert question target these ids.
 */
export const LIKERT5_OPTIONS = [
  { id: 'strongly_agree', label: 'Strongly agree' },
  { id: 'agree', label: 'Agree' },
  { id: 'neutral', label: 'Neither agree nor disagree' },
  { id: 'disagree', label: 'Disagree' },
  { id: 'strongly_disagree', label: 'Strongly disagree' },
] as const;

export const LIKERT5_OPTION_IDS: readonly string[] = LIKERT5_OPTIONS.map((o) => o.id);

/**
 * Cross-cutting dimensions. These produce result modifier tags ("eco-socialist
 * leaning", "decolonial emphasis") and are deliberately independent of ideology
 * matching — a modifier tag never moves the posterior.
 *
 * Closed on purpose: a free-text tag means a typo silently invents a dimension.
 * Adding one is a deliberate edit here plus a line in docs/content-log.md.
 */
export const MODIFIER_TAGS = [
  'ecology',
  'gender',
  'race',
  'caste',
  'technology',
  'religion',
  'nation',
  'anti_colonial',
] as const;

export type ModifierTag = (typeof MODIFIER_TAGS)[number];

/**
 * How each tag is shown on the result page.
 *
 * `race` and `caste` are separate on purpose. Ambedkarite writers distinguish
 * caste from race, and principle 5 requires every camp to recognise its own
 * view; folding one into the other would describe caste in someone else's
 * terms. `nation` avoids "nationalist", which several families on this roster
 * would read as an accusation rather than a description.
 */
export const MODIFIER_TAG_LABELS: Record<ModifierTag, string> = {
  ecology: 'Ecological emphasis',
  gender: 'Feminist emphasis',
  race: 'Anti-racist emphasis',
  caste: 'Anti-caste emphasis',
  technology: 'Technologically optimistic',
  religion: 'Religiously grounded',
  nation: 'Emphasis on national self-determination',
  anti_colonial: 'Anti-colonial emphasis',
};

export const QUESTION_KINDS = ['single_choice', 'likert5', 'multi', 'ranking'] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

/**
 * What a respondent has to know to answer a question (SPEC.md §3.3).
 *
 * The numeric `depth` field carries this: 1 needs no political knowledge,
 * 2 needs to have thought about politics, 3 needs to know left debates. The
 * field kept its name and its role in mode gating when the meaning changed
 * from "how fine an ideology distinction this draws"; `Tier` exists so code
 * that reasons about the new meaning does not have to say `depth` and hope the
 * reader knows which sense is meant.
 */
export type Tier = 1 | 2 | 3;

export const ROSTER_TIERS = ['core', 'niche', 'boundary'] as const;

export const FOLLOW_UP_MODES = ['force', 'boost', 'unlock'] as const;
export type FollowUpMode = (typeof FOLLOW_UP_MODES)[number];

/**
 * How many authored options each kind may carry.
 *
 * SPEC.md §11 principle 7 says 3-6 for every kind except likert, and it means
 * every kind: an earlier version of this table allowed multi up to 8, which was
 * an invention that quietly contradicted a binding principle. A multi-select
 * with eight options is harder to hold in mind than a single-choice with six,
 * not easier.
 */
export const OPTION_COUNT_LIMITS: Record<QuestionKind, { min: number; max: number }> = {
  single_choice: { min: 3, max: 6 },
  multi: { min: 3, max: 6 },
  ranking: { min: 3, max: 6 },
  likert5: { min: 0, max: 5 },
};

/**
 * Tier 1 allows 2-5 options instead of 3-6.
 *
 * Two is a legitimate tier-1 question (a genuine binary), and six short options
 * is still six positions to hold in mind — which is the thing a respondent with
 * no political education cannot do. SPEC.md §11 principle 7.
 */
export const TIER1_OPTION_COUNT_LIMITS: Record<QuestionKind, { min: number; max: number }> = {
  single_choice: { min: 2, max: 5 },
  multi: { min: 2, max: 5 },
  ranking: { min: 2, max: 5 },
  likert5: { min: 0, max: 5 },
};

/** The design limits, enforced by `lint:content`. */
export function optionCountLimits(kind: QuestionKind, tier: Tier): { min: number; max: number } {
  return (tier === 1 ? TIER1_OPTION_COUNT_LIMITS : OPTION_COUNT_LIMITS)[kind];
}

/**
 * What the *schema* will accept, which is deliberately looser than the design
 * limits above.
 *
 * A schema error drops the whole record, so a question one option over the
 * tier-1 cap would vanish from the bank and take its stances' referents with
 * it — 450 cascading `stance/unknown-question` errors that say nothing about
 * the actual problem. The structural rule is therefore only "enough options to
 * be a choice, few enough to render"; the real 2-5 cap is a lint error, which
 * fails CI just as hard while leaving the question loadable and the diagnosis
 * readable.
 */
export function schemaOptionCountLimits(
  kind: QuestionKind,
  tier: Tier,
): { min: number; max: number } {
  const limits = OPTION_COUNT_LIMITS[kind];
  return tier === 1 && kind !== 'likert5' ? { min: 2, max: limits.max } : limits;
}

/** `.label` longer than this reads badly interpolated into another stem. */
export const MAX_INTERPOLATED_LABEL_CHARS = 70;

// -----------------------------------------------------------------------------
// Conditions (`requires`)
// -----------------------------------------------------------------------------

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  /** Every listed question must have been answered with one of its listed options (AND across keys). */
  | { answered: Record<string, string[]> }
  /** Aggregate posterior mass of each listed family is at least the given value. */
  | { family_mass_gte: Record<string, number> }
  /** The session has unlocked at least this question depth. */
  | { depth_unlocked_gte: number };

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ any: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ not: ConditionSchema }).strict(),
    z
      .object({ answered: z.record(Id, z.array(Id).min(1)) })
      .strict()
      .refine((c) => Object.keys(c.answered).length > 0, {
        message: '`answered` must name at least one question',
      }),
    z
      .object({ family_mass_gte: z.record(Id, z.number()) })
      .strict()
      .refine((c) => Object.keys(c.family_mass_gte).length > 0, {
        message: '`family_mass_gte` must name at least one family',
      }),
    z.object({ depth_unlocked_gte: z.number().int().min(1).max(3) }).strict(),
  ]),
);

// -----------------------------------------------------------------------------
// Questions
// -----------------------------------------------------------------------------

export const OptionSchema = z
  .object({
    id: Id,
    /** Phrased the way a committed member of that camp would phrase it (SPEC.md §11.5). */
    label: z.string().min(1),
    /**
     * Compact noun phrase used when another question interpolates this answer,
     * and on the result page. Required only on options of questions that are
     * actually interpolated with `.short` — `validate.ts` checks that.
     */
    short: z.string().min(1).optional(),
  })
  .strict();

export const FollowUpSchema = z
  .object({
    when: z
      .object({
        answer_in: z.array(Id).min(1),
      })
      .strict(),
    ask: z.array(Id).min(1),
    mode: z.enum(FOLLOW_UP_MODES),
    /** Multiplier applied to the target's selection score; `mode: boost` only. */
    boost: z.number().min(1.1).max(3).optional(),
  })
  .strict()
  .superRefine((fu, ctx) => {
    if (fu.mode !== 'boost' && fu.boost !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['boost'],
        message: `\`boost\` is only meaningful with mode: boost (this one is mode: ${fu.mode})`,
      });
    }
  });

export const QuestionSchema = z
  .object({
    id: Id,
    depth: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    /** May interpolate an earlier answer as {{answers.<qid>.short}} or .label. */
    text: z.string().min(1),
    tooltip: z.string().min(1).optional(),
    kind: z.enum(QUESTION_KINDS),
    tags: z.array(Tag).default([]),
    options: z.array(OptionSchema).default([]),
    requires: ConditionSchema.optional(),
    follow_ups: z.array(FollowUpSchema).default([]),
    /** Questions that ask the same thing another way; never ask both. */
    exclusive_with: z.array(Id).default([]),
    /** Tiebreak when selection scores are equal; higher wins. */
    priority: z.number().optional(),
    /** Option id -> cross-cutting dimension. Never affects the posterior. */
    modifier_tags: z.record(Id, z.enum(MODIFIER_TAGS)).optional(),
    /** A verdict on a historical class of cases; capped at ~10% of the bank. */
    history_class: z.boolean().default(false),
    /** Optional named-tradition question; max one per family at depth 3. */
    self_id: z.boolean().default(false),
    /** Documented reason for skipping a heuristic content-lint rule. */
    lint_waiver: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((q, ctx) => {
    const limits = schemaOptionCountLimits(q.kind, q.depth);

    if (q.kind === 'likert5') {
      // Either omit options entirely and take the canonical five, or restate
      // them exactly (to customise labels). Nothing in between.
      if (q.options.length > 0) {
        const ids = q.options.map((o) => o.id);
        const matches =
          ids.length === LIKERT5_OPTION_IDS.length &&
          ids.every((id, i) => id === LIKERT5_OPTION_IDS[i]);
        if (!matches) {
          ctx.addIssue({
            code: 'custom',
            path: ['options'],
            message: `likert5 options must be omitted, or be exactly [${LIKERT5_OPTION_IDS.join(', ')}] in that order`,
          });
        }
      }
    } else if (q.options.length < limits.min || q.options.length > limits.max) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: `${q.kind} needs ${limits.min}-${limits.max} options, found ${q.options.length}`,
      });
    }

    const seen = new Set<string>();
    for (const [i, opt] of q.options.entries()) {
      if (seen.has(opt.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['options', i, 'id'],
          message: `duplicate option id "${opt.id}"`,
        });
      }
      seen.add(opt.id);

      if (IMPLICIT_OPTION_IDS.includes(opt.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['options', i, 'id'],
          message: `"${opt.id}" is injected on every question and must not be authored`,
        });
      }
    }

    // Everything below is option-local, so it belongs here rather than in
    // validate.ts. `authored` is empty for a likert5 that omitted its options;
    // the loader fills those in, so skip the check rather than false-alarm.
    const authored = q.kind === 'likert5' && q.options.length === 0 ? null : seen;
    const knownOption = (id: string) =>
      authored === null ? LIKERT5_OPTION_IDS.includes(id) : authored.has(id);

    for (const [key, tag] of Object.entries(q.modifier_tags ?? {})) {
      if (!knownOption(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['modifier_tags', key],
          message: `modifier_tags key "${key}" (tagged ${tag}) is not an option of this question`,
        });
      }
    }

    for (const [i, fu] of q.follow_ups.entries()) {
      for (const [j, optId] of fu.when.answer_in.entries()) {
        if (!knownOption(optId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['follow_ups', i, 'when', 'answer_in', j],
            message: `"${optId}" is not an option of this question`,
          });
        }
      }
      if (fu.ask.includes(q.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['follow_ups', i, 'ask'],
          message: 'a question cannot follow up to itself',
        });
      }
    }

    if (q.exclusive_with.includes(q.id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['exclusive_with'],
        message: 'a question cannot be exclusive with itself',
      });
    }
  });

// -----------------------------------------------------------------------------
// Stances
// -----------------------------------------------------------------------------

/**
 * One ideology's position on one question.
 *
 * `accept` are the options someone holding this ideology would choose; `reject`
 * are ones they would positively repudiate. Options in neither list are ones
 * the ideology has no view on. Weight is how much the position defines the
 * ideology, not how strongly it is held.
 */
export const StanceSchema = z
  .object({
    accept: z.array(Id).default([]),
    reject: z.array(Id).default([]),
    weight: z.number().int().min(0).max(3),
    /** Required at weight 3: what changes about the ideology if this reverses. */
    note: z.string().min(1).optional(),
    /**
     * The underlying doctrine this stance expresses. **Inert: the engine never
     * reads it and scoring does not change.**
     *
     * It exists for one validator check. An ideology that states the same
     * doctrine on two questions is counted twice by the likelihood, which is
     * how `mutualism` came to carry occupancy-and-use at weight 3 on both
     * `d1_ownership` and `d1_land`, and how `democratic_confederalism` came to
     * state its answer to the national question at weight 3 twice. Tagging both
     * stances with the same issue lets `validate` say so instead of waiting for
     * someone to notice (docs/redesign.md §10.2).
     */
    issue: Id.optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.weight === 3 && !s.note) {
      ctx.addIssue({
        code: 'custom',
        path: ['note'],
        message:
          'weight 3 is reserved for what defines an ideology and requires a note saying what would change if the position reversed',
      });
    }
    if (s.weight > 0 && s.accept.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['accept'],
        message: 'a stance with weight above 0 must accept at least one option',
      });
    }
    const overlap = s.accept.filter((a) => s.reject.includes(a));
    if (overlap.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['reject'],
        message: `option(s) both accepted and rejected: ${overlap.join(', ')}`,
      });
    }
    for (const list of [s.accept, s.reject]) {
      for (const id of list) {
        if (IMPLICIT_OPTION_IDS.includes(id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['accept'],
            message: `"${id}" never updates scores, so no ideology can hold a stance on it`,
          });
        }
      }
    }
  });

// -----------------------------------------------------------------------------
// Ideologies and families
// -----------------------------------------------------------------------------

export const IdeologySchema = z
  .object({
    id: Id,
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)).default([]),
    family: Id,
    /** Another ideology in the same family acting as this one's parent node. */
    tendency: Id.optional(),
    roster_tier: z.enum(ROSTER_TIERS),
    /** Defined by an organisational lineage rather than by separable positions. */
    lineage: z.boolean().default(false),
    /** Sits at the edge of the left rather than inside it. */
    boundary: z.boolean().default(false),
    summary: z.string().min(1),
    reading: z.array(z.string().min(1)).default([]),
    /** `null` drops a stance inherited from the family or a parent tendency. */
    stances: z.record(Id, StanceSchema.nullable()).default({}),
    /**
     * Ideologies this one cannot be told apart from by any position question
     * (docs/inseparable.md). The resolver names both and shows the note, so the
     * result explains *why* it stopped rather than looking undecided for no
     * reason. Must be declared on both sides.
     */
    inseparable_from: z
      .array(
        z
          .object({
            ideology: Id,
            /** Shown to the respondent: what is the same, and what differs. */
            note: z.string().min(1),
          })
          .strict(),
      )
      .default([]),
  })
  .strict()
  .superRefine((i, ctx) => {
    if (i.tendency === i.id) {
      ctx.addIssue({
        code: 'custom',
        path: ['tendency'],
        message: 'an ideology cannot be its own parent',
      });
    }
  });

export const FamilySchema = z
  .object({
    id: Id,
    name: z.string().min(1),
    order: z.number().int().optional(),
    summary: z.string().min(1),
    /** The broad group this family sits in (`content/groups.yaml`). */
    group: Id,
    /** Defaults every member ideology inherits and may override. */
    stances: z.record(Id, StanceSchema).default({}),
  })
  .strict();

/**
 * A broad group: the level above family, and the deepest answer Quick mode is
 * allowed to give (SPEC.md §2.1, §8.1).
 *
 * Groups exist because tier-1 questions cannot separate 13 families — four of
 * them agree on every everyday value a respondent holds — and returning a
 * family on evidence that does not support one is the failure SPEC.md §1.1
 * exists to prevent.
 */
export const GroupSchema = z
  .object({
    id: Id,
    name: z.string().min(1),
    order: z.number().int().optional(),
    /**
     * Shown to a Quick respondent as their result, so it is held to the tier-1
     * language rules: plain words, nothing from the tier-1 banned list, and a
     * reading grade the lint checks.
     */
    description: z.string().min(1),
  })
  .strict();

// -----------------------------------------------------------------------------
// File roots
// -----------------------------------------------------------------------------

export const QuestionsFileSchema = z.object({ questions: z.array(z.unknown()) }).strict();
export const IdeologiesFileSchema = z.object({ ideologies: z.array(z.unknown()) }).strict();
export const FamiliesFileSchema = z.object({ families: z.array(z.unknown()) }).strict();
export const GroupsFileSchema = z.object({ groups: z.array(z.unknown()) }).strict();

// -----------------------------------------------------------------------------
// Inferred types
// -----------------------------------------------------------------------------

export type Option = z.infer<typeof OptionSchema>;
export type FollowUp = z.infer<typeof FollowUpSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Stance = z.infer<typeof StanceSchema>;
export type Ideology = z.infer<typeof IdeologySchema>;
export type Family = z.infer<typeof FamilySchema>;
export type Group = z.infer<typeof GroupSchema>;
