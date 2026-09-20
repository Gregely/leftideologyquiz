/**
 * The one session store (CLAUDE.md § Svelte).
 *
 * Holds the quiz state and nothing derived from it: the screen, the next
 * question and the posterior are all computed from the state by the pure
 * functions in quiz.ts, which in turn delegate every answer operation to the
 * engine's session helpers.
 *
 * Memory only. Progress is deliberately not written to localStorage or the URL:
 * a refresh starts over.
 */

import type { EngineModel, Mode } from '../engine/index.js';
import * as quiz from './quiz.js';

export type QuizStore = ReturnType<typeof createQuizStore>;

export function createQuizStore(model: EngineModel, newSeed: () => number) {
  // Raw, not deep state: every transition returns a new object, so there is
  // nothing inside it to track and proxying it would only cost.
  let state = $state.raw<quiz.QuizState>(quiz.initialState());
  const view = $derived(quiz.currentView(model, state));

  return {
    get state() {
      return state;
    },
    get view() {
      return view;
    },
    start(mode: Mode) {
      state = quiz.start(mode, newSeed());
    },
    answer(questionId: string, optionIds: string[]) {
      state = quiz.answer(state, questionId, optionIds);
    },
    back() {
      state = quiz.back(state);
    },
    enterStage(depth: 2 | 3) {
      state = quiz.enterStage(state, depth);
    },
    escalate() {
      state = quiz.escalate(state);
    },
    finish() {
      state = quiz.finish(state);
    },
    restart() {
      state = quiz.initialState();
    },
  };
}
