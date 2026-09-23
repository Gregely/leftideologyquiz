/**
 * The scoring engine.
 *
 * Pure throughout: no I/O, no clock, no randomness, no mutation of inputs.
 * Given the same content, answers and config it returns the same result, every
 * time — which is what lets a shared URL reproduce someone's result exactly and
 * what lets the tests assert on numbers rather than on ranges.
 *
 * Typical use:
 *
 *   const model = buildModel(content, withConfig());
 *   let session = emptySession();
 *   session = answerQuestion(session, 'd1_state_role', ['smash_and_replace']);
 *   const posterior = computePosterior(model, session.answers);
 *   const result = resolve(posterior);
 */

export { DEFAULT_ENGINE_CONFIG, withConfig, type EngineConfig } from './config.js';

export {
  buildModel,
  groupOfFamily,
  groupOfIdeology,
  lineageShibboleths,
  REPORT_LEVEL_RANK,
  ROOT_ID,
  familyKey,
  groupKey,
  ideologyKey,
  nodeKeyFor,
  type EngineModel,
  type NodeKind,
  type NodeLevel,
  type QuestionLikelihood,
  type ReportLevel,
  type Tree,
  type TreeNode,
} from './model.js';

export {
  childMasses,
  computePosterior,
  familyMasses,
  groupMasses,
  massOfIdeology,
  rankIdeologies,
  subtreeMass,
  tendencyMasses,
  type Answer,
  type AnswerEffect,
  type NodeMass,
  type Posterior,
  type RankedIdeology,
} from './posterior.js';

export {
  bestLeafUnder,
  checkLineage,
  contributionsFor,
  resolve,
  type AnswerContribution,
  type BackOffReason,
  type Candidate,
  type InseparablePair,
  type LineageCheck,
  type ResolvedNode,
  type Result,
} from './resolve.js';

export {
  explainMatch,
  modifierTags,
  modifierTagsFromAnswers,
  type EarnedModifierTag,
  type MatchExplanation,
} from './explain.js';

export {
  answerQuestion,
  answersById,
  deserialiseSession,
  emptySession,
  goBack,
  hasAnswered,
  scoringAnswers,
  serialiseSession,
  truncate,
  type DeserialiseResult,
  type Session,
} from './session.js';

export {
  DEFAULT_FLOW_CONFIG,
  expectedInformationGain,
  nextQuestion,
  type FlowConfig,
  type FlowStep,
  type Mode,
  type ModeSettings,
  type SelectionReason,
  type StopReason,
} from './flow.js';

export {
  checkIdeologies,
  judge,
  perfectAnswer,
  runPerfectRespondent,
  type CheckOutcome,
  type Giveaway,
  type PassRoute,
  type PerfectRun,
  type PerfectStep,
  type Verdict,
} from './perfect-respondent.js';
