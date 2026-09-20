import { describe, expect, it } from 'vitest';
import { computePosterior, type EngineModel } from '../engine/index.js';
import { rosterModel } from '../../tests/fixtures/roster.js';
import {
  answer,
  back,
  currentMode,
  currentView,
  DEFAULT_QUIZ_OPTIONS,
  enterStage,
  escalate,
  finish,
  initialState,
  isFinished,
  start,
  type QuizOptions,
  type QuizState,
  type View,
} from './quiz.js';

/** Stage interstitials after one answer, so the six-ideology roster can reach them. */
const EAGER: QuizOptions = { ...DEFAULT_QUIZ_OPTIONS, stageInterstitialMinAnswers: 1 };

const model = rosterModel();

function view(state: QuizState, m: EngineModel = model, options: QuizOptions = EAGER): View {
  return currentView(m, state, options);
}

function questionOf(v: View) {
  if (v.screen !== 'question') throw new Error(`expected a question, got ${v.screen}`);
  return v;
}

const firstOption = (v: { options: { id: string }[] }): string => (v.options[0] as { id: string }).id;

/** Answer each question with its first listed option until a non-question screen. */
function runUntilStop(state: QuizState, m: EngineModel = model): QuizState {
  let s = state;
  for (let i = 0; i < 80; i++) {
    const v = view(s, m);
    if (v.screen !== 'question') return s;
    s = answer(s, v.questionId, [firstOption(v)]);
  }
  throw new Error('session never stopped');
}

describe('start', () => {
  it('shows the start screen before a mode is chosen', () => {
    expect(view(initialState())).toEqual({ screen: 'start' });
  });

  it('opens on the first question in the chosen mode', () => {
    const v = questionOf(view(start('standard', 1)));
    expect(v.mode).toBe('standard');
    expect(v.number).toBe(1);
    expect(v.depth).toBe(1);
    expect(v.stageLabel).toBe('Broad questions');
  });

  it('ignores answers before a session has started', () => {
    expect(answer(initialState(), 'q_family', ['pick_red'])).toEqual(initialState());
  });

  it('ignores an empty answer', () => {
    const s = start('quick', 1);
    expect(answer(s, 'q_family', [])).toBe(s);
  });
});

describe('question view', () => {
  it('lists authored options only; unsure and unknown-term are separate controls', () => {
    const v = questionOf(view(start('quick', 1)));
    expect(v.options.map((o) => o.id).sort()).toEqual(['pick_blue', 'pick_neither', 'pick_red']);
  });

  it('shuffles options per session, and the order depends on the seed', () => {
    const orders = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      orders.add(questionOf(view(start('quick', seed))).options.map((o) => o.id).join());
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  it('keeps an ordered scale in its authored order whatever the seed', () => {
    for (const seed of [1, 2, 3, 99]) {
      let s = answer(start('quick', seed), 'q_family', ['pick_red']);
      s = answer(s, 'q_red_split', ['red_a']);
      s = answer(s, 'q_red_shared', ['shared_yes']);
      const v = questionOf(view(s));
      expect(v.questionId).toBe('q_eco');
      expect(v.ordered).toBe(true);
      expect(v.options.map((o) => o.id)).toEqual([
        'strongly_agree',
        'agree',
        'neutral',
        'disagree',
        'strongly_disagree',
      ]);
    }
  });

  it('counts questions without claiming a total', () => {
    const v = questionOf(view(answer(start('quick', 1), 'q_family', ['pick_red'])));
    expect(v.number).toBe(2);
    expect(v).not.toHaveProperty('total');
  });

  it('gives no reason line for adaptive or modifier questions', () => {
    let s = start('quick', 1);
    for (let i = 0; i < 5; i++) {
      const v = questionOf(view(s));
      expect(v.reasonLine).toBeNull();
      s = answer(s, v.questionId, [firstOption(v)]);
    }
  });

  it('quotes the earlier answer on a forced follow-up', () => {
    const m = rosterModel({}, (docs) => {
      const q = docs.questions.questions.find((x) => x.id === 'q_family') as Record<string, unknown>;
      q['follow_ups'] = [{ when: { answer_in: ['pick_blue'] }, ask: ['q_shibboleth'], mode: 'force' }];
    });
    // Deep, so the depth-3 target is within the depth cap.
    const s = enterStage(enterStage(answer(start('deep', 1), 'q_family', ['pick_blue']), 2), 3);
    const v = questionOf(view(s, m));
    expect(v.questionId).toBe('q_shibboleth');
    expect(v.reasonLine).toBe('Because you answered “blue” earlier');
  });

  it('interpolates an earlier answer into the question text', () => {
    const m = rosterModel({}, (docs) => {
      const q = docs.questions.questions.find((x) => x.id === 'q_red_split') as Record<string, unknown>;
      q['text'] = 'You said "{{answers.q_family.short}}". Inside the red family, which way?';
    });
    const s = answer(start('quick', 1), 'q_family', ['pick_red']);
    expect(questionOf(view(s, m)).text).toBe('You said "red". Inside the red family, which way?');
  });

  it('presents a multi-select as multi and a single-choice as single', () => {
    const m = rosterModel({}, (docs) => {
      const q = docs.questions.questions.find((x) => x.id === 'q_family') as Record<string, unknown>;
      q['kind'] = 'multi';
    });
    expect(questionOf(view(start('quick', 1), m)).input).toBe('multi');
    expect(questionOf(view(start('quick', 1))).input).toBe('single');
  });
});

describe('back', () => {
  it('replays state: the same question comes back, in the same order', () => {
    const s0 = start('quick', 7);
    const first = questionOf(view(s0));
    const again = questionOf(view(back(answer(s0, first.questionId, ['pick_red']))));
    expect(again.questionId).toBe(first.questionId);
    expect(again.options).toEqual(first.options);
  });

  it('takes the answer back through the engine, so the posterior is recomputed from what is left', () => {
    const s = back(
      answer(answer(start('quick', 1), 'q_family', ['pick_red']), 'q_red_split', ['red_a']),
    );
    const kept = [{ questionId: 'q_family', optionIds: ['pick_red'] }];
    expect(s.session.answers).toEqual(kept);
    expect([...computePosterior(model, s.session.answers).probabilities]).toEqual([
      ...computePosterior(model, kept).probabilities,
    ]);
  });

  it('pre-selects the answer that was taken back', () => {
    const s = back(answer(start('quick', 1), 'q_family', ['pick_blue']));
    expect(questionOf(view(s)).preselected).toEqual(['pick_blue']);
  });

  it('forgets the pre-selection once the question is answered again', () => {
    const s = answer(back(answer(start('quick', 1), 'q_family', ['pick_blue'])), 'q_family', ['pick_red']);
    expect(s.recalled).toEqual([]);
  });

  it('never pre-selects an implicit answer as if it were an option', () => {
    const s = back(answer(start('quick', 1), 'q_family', ['unsure']));
    expect(questionOf(view(s)).preselected).toEqual([]);
  });

  it('returns to the start screen from the first question', () => {
    expect(view(back(start('deep', 1)))).toEqual({ screen: 'start' });
  });

  it('undoes a stage entry before it undoes an answer', () => {
    const s = enterStage(answer(start('standard', 1), 'q_family', ['pick_red']), 2);
    expect(view(s).screen).toBe('question');
    const undone = back(s);
    expect(view(undone)).toMatchObject({ screen: 'interstitial', reason: 'stage' });
    expect(undone.session.answers).toHaveLength(1);
  });

  it('from a result the respondent asked for, returns to the screen they asked from', () => {
    const atEnd = runUntilStop(start('quick', 1));
    expect(view(atEnd)).toMatchObject({ screen: 'interstitial', reason: 'mode_end' });
    const done = finish(atEnd);
    expect(view(done).screen).toBe('result');
    expect(view(back(done))).toMatchObject({ screen: 'interstitial', reason: 'mode_end' });
  });

  it('undoes an escalation, restoring the mode without touching the answers', () => {
    const atEnd = runUntilStop(start('quick', 1));
    const undone = back(escalate(atEnd));
    expect(currentMode(escalate(atEnd))).toBe('standard');
    expect(currentMode(undone)).toBe('quick');
    expect(undone.session).toEqual(atEnd.session);
  });
});

describe('stage interstitial', () => {
  it('appears before the first question of a deeper stage, naming the leading family', () => {
    const v = view(answer(start('standard', 1), 'q_family', ['pick_red']));
    expect(v).toMatchObject({
      screen: 'interstitial',
      reason: 'stage',
      completedDepth: 1,
      nextDepth: 2,
      family: { id: 'red', name: 'The red family' },
    });
  });

  it('names no family when nothing answered so far carried evidence', () => {
    // q_tech has no stances: answering it moves nothing, so there is no leader.
    const m = rosterModel({}, (docs) => {
      const q = docs.questions.questions.find((x) => x.id === 'q_tech') as Record<string, unknown>;
      q['follow_ups'] = [{ when: { answer_in: ['tech_yes'] }, ask: ['q_red_split'], mode: 'force' }];
    });
    const s = answer(answer(start('standard', 1), 'q_family', ['unsure']), 'q_tech', ['tech_yes']);
    expect(view(s, m)).toMatchObject({ screen: 'interstitial', reason: 'stage', family: null });
  });

  it('continuing enters the stage and shows the deeper question', () => {
    const v = questionOf(view(enterStage(answer(start('standard', 1), 'q_family', ['pick_red']), 2)));
    expect(v.depth).toBe(2);
    expect(v.stageLabel).toBe('Within a family');
  });

  it('is skipped when the deeper stage arrives before there is enough to report', () => {
    const s = answer(start('standard', 1), 'q_family', ['pick_red']);
    expect(currentView(model, s, DEFAULT_QUIZ_OPTIONS).screen).toBe('question');
  });

  it('is not shown for Quick mode’s occasional deeper question', () => {
    expect(questionOf(view(answer(start('quick', 1), 'q_family', ['pick_red']))).depth).toBe(2);
  });

  it('is not shown after escalating: choosing to go deeper already answered it', () => {
    // No deeper allowance, so Quick asks depth 1 only and Standard's first
    // depth-2 question would otherwise open a new stage.
    const flow = structuredClone(DEFAULT_QUIZ_OPTIONS.flow);
    flow.modes.quick.deeperAllowance = 0;
    const options: QuizOptions = { ...EAGER, flow };

    let s = start('quick', 1);
    for (let i = 0; i < 20; i++) {
      const v = currentView(model, s, options);
      if (v.screen !== 'question') break;
      expect(v.depth).toBe(1);
      s = answer(s, v.questionId, [firstOption(v)]);
    }
    expect(currentView(model, s, options)).toMatchObject({ screen: 'interstitial', reason: 'mode_end' });

    const v = currentView(model, escalate(s), options);
    expect(v).toMatchObject({ screen: 'question', depth: 2 });
  });

  it('seeing the result early finishes with a user stop', () => {
    const s = finish(answer(start('standard', 1), 'q_family', ['pick_red']));
    expect(isFinished(s)).toBe(true);
    expect(view(s)).toMatchObject({ screen: 'result', stopReason: 'user', canGoDeeperTo: 'deep' });
  });

  it('finishing twice is the same as finishing once', () => {
    const s = finish(answer(start('standard', 1), 'q_family', ['pick_red']));
    expect(finish(s)).toBe(s);
  });
});

describe('mode end and escalation', () => {
  it('Quick ends on an interstitial offering Standard', () => {
    expect(view(runUntilStop(start('quick', 1)))).toMatchObject({
      screen: 'interstitial',
      reason: 'mode_end',
      completedDepth: 1,
      nextMode: 'standard',
    });
  });

  it('Deep ends directly on a result, with nowhere deeper to go', () => {
    let s = start('deep', 1);
    for (let i = 0; i < 80; i++) {
      const v = view(s);
      if (v.screen === 'interstitial' && v.nextDepth) s = enterStage(s, v.nextDepth);
      else if (v.screen === 'question') s = answer(s, v.questionId, [firstOption(v)]);
      else break;
    }
    expect(view(s)).toMatchObject({ screen: 'result', mode: 'deep', canGoDeeperTo: null });
  });

  it('escalating keeps every answer and never re-asks one', () => {
    const quick = runUntilStop(start('quick', 1));
    const asked = new Set(quick.session.answers.map((a) => a.questionId));
    let s = escalate(quick);
    expect(s.session.answers).toEqual(quick.session.answers);
    for (let i = 0; i < 80; i++) {
      const v = view(s);
      if (v.screen === 'interstitial' && v.nextDepth) {
        s = enterStage(s, v.nextDepth);
        continue;
      }
      if (v.screen !== 'question') break;
      expect(asked.has(v.questionId)).toBe(false);
      asked.add(v.questionId);
      s = answer(s, v.questionId, [firstOption(v)]);
    }
  });

  it('Go deeper from a result resumes the same session in the next mode', () => {
    const done = finish(runUntilStop(start('quick', 1)));
    const resumed = escalate(done);
    expect(isFinished(resumed)).toBe(false);
    expect(currentMode(resumed)).toBe('standard');
    expect(resumed.session).toEqual(done.session);
  });

  it('escalating from Deep does nothing', () => {
    const s = start('deep', 1);
    expect(escalate(s)).toBe(s);
  });
});

describe('determinism', () => {
  it('the same state always gives the same view', () => {
    const s = answer(answer(start('quick', 3), 'q_family', ['pick_red']), 'q_red_split', ['red_b']);
    expect(view(s)).toEqual(view(s));
  });

  it('does not mutate the state it is given', () => {
    const s = answer(start('quick', 3), 'q_family', ['pick_red']);
    const snapshot = structuredClone(s);
    view(s);
    back(s);
    escalate(s);
    finish(s);
    enterStage(s, 2);
    expect(s).toEqual(snapshot);
  });
});
