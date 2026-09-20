/**
 * Question selection and the modifier quota.
 *
 * The fixture is the six-ideology roster plus seven modifier-only questions,
 * one per remaining tag, so every mode's quota is reachable. q_eco (ecology,
 * with a stance) is the one dual-use modifier question; q_tech (technology,
 * no stances) is modifier-only.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FLOW_CONFIG,
  computePosterior,
  expectedInformationGain,
  nextQuestion,
  type Answer,
  type FlowConfig,
  type FlowStep,
  type Mode,
  type SelectionReason,
} from '../src/engine/index.js';
import type { EngineModel } from '../src/engine/index.js';
import { rosterModel, type RosterDocs } from './fixtures/roster.js';

const EXTRA_TAGS = ['gender', 'race', 'caste', 'nation', 'religion', 'anti_colonial', 'ecology'];

function addModifierQuestions(d: RosterDocs, tags: string[] = EXTRA_TAGS): void {
  const questions = d.questions.questions as unknown as Record<string, unknown>[];
  for (const tag of tags) {
    questions.push({
      id: `q_mod_${tag}`,
      depth: 1,
      kind: 'single_choice',
      tags: [`mod_${tag}`],
      text: `A question measuring the ${tag} dimension only.`,
      options: [
        { id: `${tag}_yes`, label: 'The answer that carries the emphasis.' },
        { id: `${tag}_no`, label: 'The answer that does not.' },
        { id: `${tag}_depends`, label: 'It depends on the case.' },
      ],
      modifier_tags: { [`${tag}_yes`]: tag },
    });
  }
}

const withModifiers = (mutate?: (d: RosterDocs) => void) =>
  rosterModel({}, (d) => {
    addModifierQuestions(d);
    mutate?.(d);
  });

interface Run {
  asked: string[];
  reasons: SelectionReason[];
  final: Extract<FlowStep, { done: true }>;
  answers: Answer[];
}

/** Answer the first authored option of every question, to completion. */
function run(model: EngineModel, mode: Mode, config: FlowConfig = DEFAULT_FLOW_CONFIG): Run {
  const answers: Answer[] = [];
  const asked: string[] = [];
  const reasons: SelectionReason[] = [];
  for (let guard = 0; guard < 500; guard++) {
    const step = nextQuestion(model, answers, mode, config);
    if (step.done) return { asked, reasons, final: step, answers };
    const first = step.question.options.find((o) => !o.implicit);
    answers.push({ questionId: step.question.id, optionIds: [first?.id ?? 'unsure'] });
    asked.push(step.question.id);
    reasons.push(step.reason);
  }
  throw new Error('flow did not terminate');
}

const isModifier = (model: EngineModel, id: string): boolean => {
  const tags = model.content.questionById.get(id)?.modifier_tags;
  return !!tags && Object.keys(tags).length > 0;
};

describe('the modifier quota', () => {
  const model = withModifiers();

  for (const mode of ['quick', 'standard', 'deep'] as const) {
    it(`is met in ${mode} mode`, () => {
      const result = run(model, mode);
      const modifiersAsked = result.asked.filter((id) => isModifier(model, id)).length;
      expect(modifiersAsked).toBeGreaterThanOrEqual(DEFAULT_FLOW_CONFIG.modes[mode].modifierQuota);
      expect(result.final.modifierQuotaMet).toBe(true);
    });
  }

  it('counts toward the mode budget', () => {
    const tight: FlowConfig = {
      ...DEFAULT_FLOW_CONFIG,
      modes: {
        ...DEFAULT_FLOW_CONFIG.modes,
        quick: { ...DEFAULT_FLOW_CONFIG.modes.quick, budget: 5, modifierQuota: 3 },
      },
    };
    const result = run(model, 'quick', tight);
    expect(result.asked.length).toBeLessThanOrEqual(5);
    expect(result.asked.filter((id) => isModifier(model, id)).length).toBeGreaterThanOrEqual(3);
    expect(result.final.stopReason).toBe('budget');
  });

  it('blocks an early stop until the quota is met', () => {
    // With interleaving pushed past the end, the only thing that can bring in
    // modifier questions is the rule that a mode may not finish without them.
    const late: FlowConfig = { ...DEFAULT_FLOW_CONFIG, modifierInterleaveAfter: 1000 };
    const result = run(model, 'deep', late);
    expect(result.asked.filter((id) => isModifier(model, id)).length).toBeGreaterThanOrEqual(8);
    expect(result.final.stopReason).not.toBe('budget');
  });

  it('still terminates when the modifier pool is exhausted', () => {
    const sparse = rosterModel({}, (d) => addModifierQuestions(d, ['gender']));
    const result = run(sparse, 'deep');
    // q_eco, q_tech and q_mod_gender are the whole pool: three, against a quota of 8.
    expect(result.asked.filter((id) => isModifier(sparse, id)).length).toBe(3);
    expect(result.final.done).toBe(true);
    expect(result.final.modifierQuotaMet).toBe(true);
  });
});

describe('choosing a modifier question', () => {
  const model = withModifiers();

  it('covers every tag once before measuring any tag twice', () => {
    const result = run(model, 'deep');
    const tags = result.reasons
      .filter((r): r is Extract<SelectionReason, { type: 'modifier_coverage' }> => r.type === 'modifier_coverage')
      .map((r) => r.tag);
    const distinctAvailable = 8; // ecology twice, technology once, six others once
    const leading = tags.slice(0, Math.min(tags.length, distinctAvailable));
    expect(new Set(leading).size).toBe(leading.length);
  });

  it('prefers a dual-use question when one covers an unmeasured tag', () => {
    const now: FlowConfig = { ...DEFAULT_FLOW_CONFIG, modifierInterleaveAfter: 0 };
    const step = nextQuestion(model, [], 'deep', now);
    expect(step.done).toBe(false);
    if (!step.done) {
      expect(step.question.id).toBe('q_eco');
      expect(step.reason).toEqual({ type: 'modifier_coverage', tag: 'ecology' });
    }
  });

  it('is never used to re-ask a question', () => {
    const result = run(model, 'deep');
    expect(new Set(result.asked).size).toBe(result.asked.length);
  });

  it('never moves the posterior with a modifier-only answer', () => {
    const before = computePosterior(model, []);
    const after = computePosterior(model, [{ questionId: 'q_mod_gender', optionIds: ['gender_yes'] }]);
    expect([...after.probabilities]).toEqual([...before.probabilities]);
    expect(expectedInformationGain(model, before, 'q_mod_gender')).toBe(0);
  });
});

describe('selection', () => {
  const model = withModifiers();

  it('is deterministic', () => {
    for (const mode of ['quick', 'standard', 'deep'] as const) {
      expect(run(model, mode).asked).toEqual(run(model, mode).asked);
    }
  });

  it('opens with the most informative question, not a modifier one', () => {
    const step = nextQuestion(model, [], 'standard');
    expect(step.done).toBe(false);
    if (!step.done) expect(step.reason.type).toBe('information_gain');
  });

  it('asks a forced follow-up next', () => {
    const forced = withModifiers((d) => {
      const q = d.questions.questions.find((x) => x.id === 'q_family') as unknown as Record<string, unknown>;
      q['follow_ups'] = [{ when: { answer_in: ['pick_red'] }, ask: ['q_red_split'], mode: 'force' }];
    });
    const step = nextQuestion(forced, [{ questionId: 'q_family', optionIds: ['pick_red'] }], 'standard');
    expect(step.done).toBe(false);
    if (!step.done) {
      expect(step.question.id).toBe('q_red_split');
      expect(step.reason).toEqual({ type: 'forced_follow_up', from: 'q_family' });
    }
  });

  it('never asks a question whose gate is unmet', () => {
    const gated = withModifiers((d) => {
      const q = d.questions.questions.find((x) => x.id === 'q_shibboleth') as unknown as Record<string, unknown>;
      q['requires'] = { family_mass_gte: { blue: 0.99 } };
    });
    expect(run(gated, 'deep').asked).not.toContain('q_shibboleth');
  });

  it('keeps quick mode at depth 1 apart from its small deeper allowance', () => {
    const result = run(model, 'quick');
    const deeper = result.asked.filter((id) => (model.content.questionById.get(id)?.depth ?? 1) > 1);
    expect(deeper.length).toBeLessThanOrEqual(DEFAULT_FLOW_CONFIG.modes.quick.deeperAllowance);
  });

  it('never exceeds the mode budget', () => {
    for (const mode of ['quick', 'standard', 'deep'] as const) {
      expect(run(model, mode).asked.length).toBeLessThanOrEqual(DEFAULT_FLOW_CONFIG.modes[mode].budget);
    }
  });
});

describe('expected information gain', () => {
  const model = withModifiers();

  it('is positive for a question that separates ideologies', () => {
    expect(expectedInformationGain(model, computePosterior(model, []), 'q_family')).toBeGreaterThan(0);
  });

  it('stays positive for a question that still separates what an earlier answer left tied', () => {
    // q_red_shared raises red_left and red_right together; q_red_split is the
    // question that can still tell them apart, so it must keep its value.
    const informed = expectedInformationGain(
      model,
      computePosterior(model, [{ questionId: 'q_red_shared', optionIds: ['shared_yes'] }]),
      'q_red_split',
    );
    expect(informed).toBeGreaterThan(0);
  });

  it('is lower for a question once its answer is already implied', () => {
    // After pick_red, the family question's information is spent: a second
    // family-level question gains less than it would have from the prior.
    const prior = expectedInformationGain(model, computePosterior(model, []), 'q_eco');
    const afterBlue = expectedInformationGain(
      model,
      computePosterior(model, [{ questionId: 'q_family', optionIds: ['pick_blue'] }]),
      'q_eco',
    );
    // q_eco is scoped to the red family; once mass has moved to blue there is
    // little left in its scope to redistribute.
    expect(afterBlue).toBeLessThan(prior);
  });

  it('is zero for a question with no stances', () => {
    expect(expectedInformationGain(model, computePosterior(model, []), 'q_tech')).toBe(0);
  });
});
