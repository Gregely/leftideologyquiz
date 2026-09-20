/**
 * Engine tunables.
 *
 * Every number here changes what the test tells someone, so each one is
 * documented with what it does and why it defaults where it does. Nothing in
 * the engine reads a global: a config is passed in, so a test can vary one
 * parameter and hold the rest.
 */

export interface EngineConfig {
  // --- likelihood ------------------------------------------------------------

  /**
   * Scales stance weight into log-odds before the softmax. Higher means a
   * single weight-3 stance moves the posterior further. SPEC.md §5.3.
   */
  beta: number;

  /**
   * How much harder a `reject` counts than an `accept` helps. Rejecting a
   * position is a stronger claim than merely preferring another one: a camp
   * that repudiates an option is saying its members would not choose it, where
   * an unlisted option is only one it has no view on.
   */
  rejectMultiplier: number;

  /**
   * Probability that any given answer is atypical for the respondent's actual
   * politics — a misread stem, a bad day, a genuine idiosyncrasy. Mixed into
   * every likelihood as a uniform floor, so no single answer can drive an
   * ideology to zero and no ideology is ever eliminated outright.
   */
  respondentNoise: number;

  /**
   * Width of the distance kernel on likert questions, in scale points. At 1.0
   * an adjacent point still counts as partial agreement and two points away
   * counts against.
   */
  likertSigma: number;

  // --- prior -----------------------------------------------------------------

  /**
   * Prior multiplier for ideologies flagged `boundary: true`.
   *
   * Defaults to 1.0 — no down-weighting. SPEC.md §5.4 restricts priors to
   * encoding answer-space breadth, and "sits at the edge of the left" is not
   * that: a boundary ideology is not compatible with fewer answer patterns, it
   * is just further out. Set it below 1 deliberately if you want the test to
   * prefer an interior answer when the evidence is level, and say so in the
   * methodology page.
   */
  boundaryPrior: number;

  // --- resolver --------------------------------------------------------------

  /** Top child must hold this share of its parent's mass before descending. */
  childShareMin: number;

  /** ...and must beat the runner-up by this ratio. */
  childMarginMin: number;

  /** Candidates listed on an undecided result: those within this ratio of the top. */
  candidateFloor: number;

  /** Never name a sect on fewer scoring answers than this. */
  minAnswersForSect: number;

  /** A node below this absolute mass is never reported, even if it wins its parent. */
  absoluteFloor: number;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  beta: 0.9,
  rejectMultiplier: 1.6,
  respondentNoise: 0.1,
  likertSigma: 1.0,
  boundaryPrior: 1.0,
  childShareMin: 0.5,
  childMarginMin: 1.6,
  candidateFloor: 0.45,
  minAnswersForSect: 8,
  absoluteFloor: 0.12,
};

export function withConfig(overrides: Partial<EngineConfig> = {}): EngineConfig {
  return { ...DEFAULT_ENGINE_CONFIG, ...overrides };
}
