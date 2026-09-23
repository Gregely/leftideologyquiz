/**
 * Formatting a result for the result page.
 *
 * Reads only what the engine computed — `resolve`, `explainMatch`,
 * `modifierTags`, `rankIdeologies` — and turns it into words. No scoring
 * happens here, and nothing is shown that the engine cannot point at
 * (SPEC.md §8.4).
 */

import type { Content } from '../content/load.js';
import {
  computePosterior,
  DEFAULT_FLOW_CONFIG,
  explainMatch,
  modifierTags,
  rankIdeologies,
  resolve,
  type Answer,
  type AnswerContribution,
  type BackOffReason,
  type EngineModel,
  type Mode,
  type Result,
  type StopReason,
} from '../engine/index.js';
import { interpolate, roughPercent } from './text.js';

export interface NamedRef {
  id: string;
  name: string;
}

export interface MatchRow extends NamedRef {
  mass: number;
  percent: string;
}

export interface EvidenceRow {
  questionId: string;
  /** The question as it was shown, earlier answers quoted in. */
  question: string;
  /** What the respondent chose. */
  answer: string;
}

export interface ResultView {
  kind: 'resolved' | 'undecided';
  /** What the result names: a sect, a tendency, a family, or the whole field. */
  level: 'sect' | 'tendency' | 'family' | 'group' | 'field';
  node: NamedRef;
  summary: string | null;
  /** Share of the evidence on the reported node. */
  confidence: number;
  /** The same thing in words. */
  confidenceText: string;
  /** Why the result stopped above a single sect, in plain words; null when resolved. */
  backOffText: string | null;
  /** When undecided: the tied options inside the node, with their share of it. */
  candidates: MatchRow[];
  modifiers: { tag: string; label: string }[];
  /** Top five ideologies overall. */
  matches: MatchRow[];
  /** Why the leading ideology matched: up to three answers for, one against. */
  why: { ideology: NamedRef; for: EvidenceRow[]; against: EvidenceRow | null } | null;
  boundary: NamedRef[];
  lineage: NamedRef[];
  inseparable: { ideologies: [NamedRef, NamedRef]; note: string }[];
  mode: Mode;
  answeredCount: number;
  stopReason: StopReason | 'user';
}

// -----------------------------------------------------------------------------
// Words
// -----------------------------------------------------------------------------

/**
 * Plain-language confidence. Deliberately coarse: the percentages are a model's
 * arithmetic over sparse stances, and a sentence carries that honestly where a
 * precise number would imply a precision the method does not have.
 */
export function confidenceText(
  confidence: number,
  kind: Result['kind'],
  level: ResultView['level'] = 'sect',
): string {
  // The whole field always holds all the mass; that is not confidence in anything.
  if (level === 'field') return 'Your answers so far do not favour one part of the left over the others.';
  if (level === 'group' && kind === 'resolved') {
    if (confidence >= 0.6) return 'Your answers point clearly to this part of the left.';
    if (confidence >= 0.4) return 'This is the part of the left your answers fit best.';
    return 'This is where your answers lean, though not by much.';
  }
  if (kind === 'undecided') {
    if (confidence >= 0.75) return 'Your answers sit firmly here.';
    if (confidence >= 0.5) return 'Most of the weight of your answers sits here.';
    return 'This is where your answers lean most, though not by much.';
  }
  if (confidence >= 0.75) return 'A strong fit: your answers point clearly here.';
  if (confidence >= 0.5) return 'A good fit, with some room for doubt.';
  if (confidence >= 0.3) return 'The best fit, but a tentative one — close neighbours are not far behind.';
  return 'The best fit available, but a weak one.';
}

/**
 * A tendency can be a candidate inside itself — "this, and none of its
 * narrower branches". Under a heading that already names it, it needs saying.
 */
function candidateName(result: Result, candidate: { id: string; name: string }): string {
  return result.node.kind === 'ideology' && candidate.id === result.node.id
    ? `${candidate.name} itself`
    : candidate.name;
}

function backOffText(reason: BackOffReason | null, result: Result, model: EngineModel): string | null {
  if (result.kind === 'resolved' || reason === null) return null;
  const [a, b] = result.candidates.map((c) => ({ ...c, name: candidateName(result, c) }));
  const within = result.node.kind === 'root' ? 'Your answers' : 'Within that, your answers';
  switch (reason) {
    case 'top-two-too-close':
      return a && b
        ? `${within} fit ${a.name} and ${b.name} about equally, so the test is not naming either.`
        : `${within} do not favour one option clearly enough to name it.`;
    case 'below-absolute-floor':
      return 'No single tradition within it holds enough of the evidence to name.';
    case 'too-few-answers':
      return `Naming a specific tradition takes at least ${model.config.minAnswersForSect} answers that count, and this run has ${result.scoringAnswerCount}.`;
    case 'lineage-not-established':
      return 'The closest tradition is defined by who it descends from as much as by what it holds, and nothing you answered yet speaks to that.';
    case 'mode-reports-no-deeper':
      // Only reachable on a resolved result, which returns above. Kept so the
      // switch stays exhaustive if that ever changes.
      return null;
  }
}

/**
 * What a respondent is told about where the answer stops.
 *
 * A group result is not a back-off — the evidence supported it — but it is not
 * the whole story either, and saying so is the point of stopping there.
 */
function nextStepText(result: Result, model: EngineModel): string | null {
  if (result.backOffReason !== 'mode-reports-no-deeper') return null;
  const names = result.candidates.slice(0, 3).map((c) => c.name);
  if (names.length === 0) return null;
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const deeper = model.content.groupById.has(result.node.id)
    ? 'These traditions agree on most of what this mode asked about.'
    : 'The traditions inside it are close on what this mode asked about.';
  return `Closest within it: ${list}. ${deeper} Going further takes more questions.`;
}

function levelOf(result: Result): ResultView['level'] {
  if (result.node.kind === 'root') return 'field';
  if (result.node.kind === 'group') return 'group';
  if (result.node.kind === 'family') return 'family';
  return result.kind === 'resolved' && result.candidates.length === 0 ? 'sect' : 'tendency';
}

// -----------------------------------------------------------------------------
// Build
// -----------------------------------------------------------------------------

function evidenceRow(content: Content, answers: readonly Answer[], c: AnswerContribution): EvidenceRow {
  return {
    questionId: c.questionId,
    question: interpolate(content, answers, c.questionText),
    answer: c.optionLabels.join('; '),
  };
}

function ideologyRef(content: Content, id: string): NamedRef {
  return { id, name: content.ideologyById.get(id)?.name ?? id };
}

export function buildResultView(
  model: EngineModel,
  answers: readonly Answer[],
  mode: Mode,
  stopReason: StopReason | 'user',
): ResultView {
  const { content } = model;
  const posterior = computePosterior(model, answers);
  const result = resolve(posterior, DEFAULT_FLOW_CONFIG.modes[mode].maxReportLevel);

  const summary =
    result.node.kind === 'ideology'
      ? (content.ideologyById.get(result.node.id)?.summary ?? null)
      : result.node.kind === 'family'
        ? (content.familyById.get(result.node.id)?.summary ?? null)
        : result.node.kind === 'group'
          ? (content.groupById.get(result.node.id)?.description ?? null)
          : null;

  const candidates = result.candidates.map((c) => ({
    id: c.id,
    name: candidateName(result, c),
    mass: c.share,
    percent: roughPercent(c.share),
  }));

  const matches = rankIdeologies(posterior)
    .slice(0, 5)
    .map((r) => ({ id: r.id, name: r.name, mass: r.mass, percent: roughPercent(r.mass) }));

  let why: ResultView['why'] = null;
  if (result.anchorIdeologyId) {
    const explained = explainMatch(posterior, result.anchorIdeologyId, 3);
    if (explained.raised.length > 0 || explained.lowered.length > 0) {
      const against = explained.lowered[0];
      why = {
        ideology: { id: explained.ideologyId, name: explained.name },
        for: explained.raised.slice(0, 3).map((c) => evidenceRow(content, answers, c)),
        against: against ? evidenceRow(content, answers, against) : null,
      };
    }
  }

  // Ideologies the result is about: the one named, or the ones it could not
  // choose between, plus the leaf the lineage gate held back.
  const involved = new Set<string>();
  if (result.node.kind === 'ideology') involved.add(result.node.id);
  for (const c of result.candidates) if (content.ideologyById.has(c.id)) involved.add(c.id);
  if (result.backOffReason === 'lineage-not-established' && result.anchorIdeologyId) {
    involved.add(result.anchorIdeologyId);
  }
  const flagged = (flag: 'boundary' | 'lineage'): NamedRef[] =>
    [...involved]
      .filter((id) => content.ideologyById.get(id)?.[flag] === true)
      .map((id) => ideologyRef(content, id));

  return {
    kind: result.kind,
    level: levelOf(result),
    node: {
      id: result.node.id,
      name: result.node.kind === 'root' ? 'Several parts of the left' : result.node.name,
    },
    summary,
    confidence: result.confidence,
    confidenceText: confidenceText(result.confidence, result.kind, levelOf(result)),
    backOffText: backOffText(result.backOffReason, result, model) ?? nextStepText(result, model),
    candidates,
    modifiers: modifierTags(posterior).map((t) => ({ tag: t.tag, label: t.label })),
    matches,
    why,
    boundary: flagged('boundary'),
    lineage: flagged('lineage'),
    inseparable: result.inseparable.map((pair) => ({
      ideologies: [ideologyRef(content, pair.ideologies[0]), ideologyRef(content, pair.ideologies[1])],
      note: pair.note,
    })),
    mode,
    answeredCount: answers.length,
    stopReason,
  };
}
