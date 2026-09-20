/**
 * The quiz view-model: what the respondent has done, and what to show them.
 *
 * The state is a log of the respondent's own actions plus the engine session
 * (the answers). Everything else — the mode, which screen is up, which question
 * comes next, whether an interstitial is due — is derived from those on every
 * render, the same way the engine derives the posterior from the answers. So
 * Back is not a separate undo path that could drift: it removes the last action
 * and the screen that follows is whatever the remaining actions imply.
 *
 * Pure: no clock, no randomness, no storage. The shuffle seed is passed in.
 */

import type { NormalisedQuestion } from '../content/load.js';
import {
  answerQuestion,
  computePosterior,
  DEFAULT_FLOW_CONFIG,
  emptySession,
  familyMasses,
  goBack,
  nextQuestion,
  type Answer,
  type EngineModel,
  type FlowConfig,
  type Mode,
  type Session,
  type StopReason,
} from '../engine/index.js';
import { seededShuffle } from './shuffle.js';
import { interpolate, quoteAnswer } from './text.js';

// -----------------------------------------------------------------------------
// Modes
// -----------------------------------------------------------------------------

export const MODES: readonly Mode[] = ['quick', 'standard', 'deep'];

export const MODE_INFO: Record<Mode, { name: string; blurb: string }> = {
  quick: {
    name: 'Quick',
    blurb: 'About 15 broad questions. Finds your family of the left, sometimes more.',
  },
  standard: {
    name: 'Standard',
    blurb: 'Up to 35 questions. Places you within a family, often down to a tendency.',
  },
  deep: {
    name: 'Deep',
    blurb: 'Up to 60 questions. Separates near neighbours, and says so when it cannot.',
  },
};

/** The next mode up, or null from Deep. */
export function deeperMode(mode: Mode): Mode | null {
  return MODES[MODES.indexOf(mode) + 1] ?? null;
}

// -----------------------------------------------------------------------------
// Stages
// -----------------------------------------------------------------------------

export const STAGE_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Broad questions',
  2: 'Within a family',
  3: 'Fine distinctions',
};

export interface QuizOptions {
  flow: FlowConfig;
  /**
   * A stage interstitial ("you look like…, go deeper?") needs something to
   * report. If the engine reaches for a deeper question before this many
   * answers, the stage is entered without one rather than announcing a family
   * on the strength of one or two answers.
   */
  stageInterstitialMinAnswers: number;
}

export const DEFAULT_QUIZ_OPTIONS: QuizOptions = {
  flow: DEFAULT_FLOW_CONFIG,
  stageInterstitialMinAnswers: 5,
};

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------

/** Something the respondent did. Back undoes the most recent one. */
export type Action =
  | { type: 'answer'; questionId: string }
  /** Chose to continue past a stage interstitial into this depth. */
  | { type: 'enter_stage'; depth: 2 | 3 }
  | { type: 'escalate'; from: Mode; to: Mode }
  /** Chose to see a result now rather than go on. */
  | { type: 'finish' };

export interface QuizState {
  started: boolean;
  /** The mode chosen on the start screen; escalations are in the log. */
  startMode: Mode;
  /** The answers. Only ever changed through the engine's session helpers. */
  session: Session;
  /** Seeds the per-session option shuffle. */
  seed: number;
  log: Action[];
  /**
   * Answers taken back with Back, kept only so that if the same question comes
   * up again its previous choice is pre-selected. Never scored.
   */
  recalled: Answer[];
}

export function initialState(seed = 0): QuizState {
  return {
    started: false,
    startMode: 'quick',
    session: emptySession(),
    seed,
    log: [],
    recalled: [],
  };
}

/** A fresh session in the chosen mode. Nothing from any earlier run survives. */
export function start(mode: Mode, seed: number): QuizState {
  return { ...initialState(seed), started: true, startMode: mode };
}

export function currentMode(state: QuizState): Mode {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const action = state.log[i] as Action;
    if (action.type === 'escalate') return action.to;
  }
  return state.startMode;
}

/** True once the respondent has asked to see a result and not gone deeper since. */
export function isFinished(state: QuizState): boolean {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const type = (state.log[i] as Action).type;
    if (type === 'finish') return true;
    if (type === 'escalate') return false;
  }
  return false;
}

/**
 * Depths the respondent has already agreed to go into: every stage they
 * continued past, plus everything up to the depth of any mode they escalated
 * into — choosing "go deeper" is itself the answer to the interstitial.
 */
function enteredStages(state: QuizState, flow: FlowConfig): Set<number> {
  // Starting in a mode does not pre-enter its stages: the interstitial is how
  // someone who chose Standard finds out where the broad questions left them.
  const entered = new Set<number>([1]);
  for (const action of state.log) {
    if (action.type === 'enter_stage') entered.add(action.depth);
    if (action.type === 'escalate') {
      for (let d = 1; d <= flow.modes[action.to].maxDepth; d++) entered.add(d);
    }
  }
  return entered;
}

// -----------------------------------------------------------------------------
// Transitions
// -----------------------------------------------------------------------------

export function answer(state: QuizState, questionId: string, optionIds: string[]): QuizState {
  if (!state.started || optionIds.length === 0) return state;
  return {
    ...state,
    session: answerQuestion(state.session, questionId, optionIds),
    log: [...state.log, { type: 'answer', questionId }],
    recalled: state.recalled.filter((a) => a.questionId !== questionId),
  };
}

export function enterStage(state: QuizState, depth: 2 | 3): QuizState {
  return { ...state, log: [...state.log, { type: 'enter_stage', depth }] };
}

export function finish(state: QuizState): QuizState {
  if (isFinished(state)) return state;
  return { ...state, log: [...state.log, { type: 'finish' }] };
}

/**
 * Raise the mode and carry on from exactly where the session is. The answers
 * are untouched: escalating must never discard what was already asked
 * (SPEC.md §4), and nothing already asked is asked again because the engine
 * never re-selects an answered question.
 */
export function escalate(state: QuizState): QuizState {
  const from = currentMode(state);
  const to = deeperMode(from);
  if (!to) return state;
  return { ...state, log: [...state.log, { type: 'escalate', from, to }] };
}

/**
 * Undo the respondent's most recent action. Taking back an answer goes through
 * the engine's `goBack`; the posterior is then recomputed from what is left.
 * With nothing left to undo, Back returns to the start screen.
 */
export function back(state: QuizState): QuizState {
  const last = state.log[state.log.length - 1];
  if (!last) return initialState(state.seed);

  const log = state.log.slice(0, -1);
  if (last.type !== 'answer') return { ...state, log };

  const taken = state.session.answers[state.session.answers.length - 1];
  return {
    ...state,
    session: goBack(state.session),
    log,
    recalled: taken
      ? [...state.recalled.filter((a) => a.questionId !== taken.questionId), taken]
      : state.recalled,
  };
}

// -----------------------------------------------------------------------------
// Views
// -----------------------------------------------------------------------------

export interface OptionView {
  id: string;
  label: string;
}

export interface QuestionView {
  screen: 'question';
  mode: Mode;
  questionId: string;
  depth: 1 | 2 | 3;
  stageLabel: string;
  /** 1-based position in this session. There is no total to show: it is adaptive. */
  number: number;
  /** Question text with earlier answers quoted in. */
  text: string;
  tooltip: string | null;
  /** `multi` takes several options and a confirm; everything else takes one. */
  input: 'single' | 'multi';
  /** Authored options only, in session order. The implicit ones are separate controls. */
  options: OptionView[];
  /** True for scales, which keep their authored order. */
  ordered: boolean;
  /** "Because you answered …" for a follow-up; null for everything else. */
  reasonLine: string | null;
  /** Options to pre-select because they were chosen before the respondent went back. */
  preselected: string[];
}

export interface InterstitialView {
  screen: 'interstitial';
  mode: Mode;
  /** `stage`: a deeper stage is next in this mode. `mode_end`: this mode has nothing left. */
  reason: 'stage' | 'mode_end';
  /** The depth just finished. */
  completedDepth: 1 | 2 | 3;
  /** Depth the respondent would go into (stage) — null at a mode end. */
  nextDepth: 2 | 3 | null;
  /** The mode "go deeper" escalates to at a mode end. */
  nextMode: Mode | null;
  family: { id: string; name: string; share: number } | null;
  answeredCount: number;
}

export interface ResultScreen {
  screen: 'result';
  mode: Mode;
  /** `user` when the respondent chose to stop; otherwise the engine's reason. */
  stopReason: StopReason | 'user';
  answers: Answer[];
  canGoDeeperTo: Mode | null;
}

export interface StartView {
  screen: 'start';
}

export type View = StartView | QuestionView | InterstitialView | ResultScreen;

function reasonLine(
  model: EngineModel,
  answers: readonly Answer[],
  reason: { type: string; from?: string },
): string | null {
  if (reason.type !== 'forced_follow_up' || !reason.from) return null;
  const quoted = quoteAnswer(model.content, answers, reason.from);
  return quoted ? `Because you answered “${quoted}” earlier` : null;
}

function questionView(
  model: EngineModel,
  state: QuizState,
  mode: Mode,
  question: NormalisedQuestion,
  line: string | null,
): QuestionView {
  const answers = state.session.answers;
  const authored = question.options.filter((o) => !o.implicit).map((o) => ({ id: o.id, label: o.label }));
  // Only likert scales are marked as ordered in the schema. A single-choice
  // question whose options happen to form a scale would be shuffled: the
  // content has no way to say so yet.
  const ordered = question.kind === 'likert5';
  const recalled = state.recalled.find((a) => a.questionId === question.id);

  return {
    screen: 'question',
    mode,
    questionId: question.id,
    depth: question.depth,
    stageLabel: STAGE_LABELS[question.depth],
    number: answers.length + 1,
    text: interpolate(model.content, answers, question.text),
    tooltip: question.tooltip ?? null,
    input: question.kind === 'multi' || question.kind === 'ranking' ? 'multi' : 'single',
    options: ordered ? authored : seededShuffle(authored, state.seed, question.id),
    ordered,
    reasonLine: line,
    preselected: recalled ? recalled.optionIds.filter((id) => authored.some((o) => o.id === id)) : [],
  };
}

/** Deepest depth among the questions answered so far. */
function deepestAsked(model: EngineModel, answers: readonly Answer[]): number {
  let deepest = 0;
  for (const a of answers) {
    deepest = Math.max(deepest, model.content.questionById.get(a.questionId)?.depth ?? 0);
  }
  return deepest;
}

/**
 * The family with the most mass, or null when no answer has moved anything.
 * Without that check, a run of "not sure" answers would be told it looks like
 * whichever family simply has the most members.
 */
export function leadingFamily(
  model: EngineModel,
  answers: readonly Answer[],
): { id: string; name: string; share: number } | null {
  const posterior = computePosterior(model, answers);
  if (posterior.scoringAnswerCount === 0) return null;
  const top = familyMasses(posterior)[0];
  return top ? { id: top.id, name: top.name, share: top.mass } : null;
}

/** What to show for this state. Pure, and cheap enough to call on every render. */
export function currentView(
  model: EngineModel,
  state: QuizState,
  options: QuizOptions = DEFAULT_QUIZ_OPTIONS,
): View {
  if (!state.started) return { screen: 'start' };

  const mode = currentMode(state);
  const answers = state.session.answers;
  const settings = options.flow.modes[mode];
  const resultScreen = (stopReason: StopReason | 'user'): ResultScreen => ({
    screen: 'result',
    mode,
    stopReason,
    answers,
    canGoDeeperTo: deeperMode(mode),
  });

  if (isFinished(state)) {
    const step = nextQuestion(model, answers, mode, options.flow);
    return resultScreen(step.done ? step.stopReason : 'user');
  }

  const step = nextQuestion(model, answers, mode, options.flow);

  if (step.done) {
    const next = deeperMode(mode);
    // Deep has nowhere further to go, so its end is the result itself.
    if (!next) return resultScreen(step.stopReason);
    return {
      screen: 'interstitial',
      mode,
      reason: 'mode_end',
      completedDepth: settings.maxDepth,
      nextDepth: null,
      nextMode: next,
      family: leadingFamily(model, answers),
      answeredCount: answers.length,
    };
  }

  const { question, reason } = step;
  const deepest = deepestAsked(model, answers);
  const entersStage =
    question.depth > 1 &&
    question.depth > deepest &&
    // Quick's occasional depth-2 question is an allowance, not a stage.
    question.depth <= settings.maxDepth &&
    answers.length >= options.stageInterstitialMinAnswers &&
    !enteredStages(state, options.flow).has(question.depth);

  if (entersStage) {
    return {
      screen: 'interstitial',
      mode,
      reason: 'stage',
      completedDepth: (question.depth - 1) as 1 | 2,
      nextDepth: question.depth as 2 | 3,
      nextMode: null,
      family: leadingFamily(model, answers),
      answeredCount: answers.length,
    };
  }

  return questionView(model, state, mode, question, reasonLine(model, answers, reason));
}
