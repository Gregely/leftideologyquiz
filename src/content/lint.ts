/**
 * Design-principle lint over question prose and stance metadata (SPEC.md §10.2).
 *
 * `validate.ts` asks whether the content is *coherent* — do the ids resolve, can
 * the questions be reached. This asks whether it is *good*: does it follow the
 * ten principles in SPEC.md §11 that make a question answerable by someone who
 * does not already know the answer.
 *
 * Pure: takes parsed content plus the word lists, returns issues. The word
 * lists live in content/lint/ and are read by the script, not from here.
 *
 * Severity is assigned by how certain the rule is. A four-digit year in a stem
 * is an error because principle 1 admits no exceptions. A loaded word is a
 * warning because an option written in a camp's own voice may legitimately
 * contain one. Heuristic rules can be waived per question with `lint_waiver`.
 */

import type { Issue, LoadResult, NormalisedQuestion } from './load.js';
import { FILES, resolveStances } from './load.js';
import type { Stance } from './schema.js';

// -----------------------------------------------------------------------------
// Tunables
// -----------------------------------------------------------------------------

/** SPEC.md §10.2 caps stems at 55 words; the brief for this tool says 60. */
export const MAX_STEM_WORDS = 60;

/** Options this much longer than the shortest signal which one is "right". */
export const OPTION_LENGTH_RATIO = 2.5;

/** ...but only once the absolute gap is big enough to be visible on screen. */
export const OPTION_LENGTH_ABSOLUTE_GAP = 12;

/** SPEC.md §11 principle 7. Applies to every kind except likert. */
export const MIN_OPTIONS = 3;
export const MAX_OPTIONS = 6;

/** Years from here on are treated as dates rather than as quantities. */
const YEAR_PATTERN = /\b(1[5-9]\d{2}|20\d{2})\b/g;

/** Rules a `lint_waiver` may switch off — the heuristic ones only. */
export const WAIVABLE_CODES = new Set([
  'lint/named-entity',
  'lint/double-barrelled',
  'lint/loaded-word',
  'lint/option-length-imbalance',
]);

export interface LintLists {
  namedEntities: string[];
  loadedWords: string[];
  jargon: string[];
}

// -----------------------------------------------------------------------------
// Text helpers
// -----------------------------------------------------------------------------

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whole-word, case-insensitive match. The boundary is only applied where the
 * term actually starts or ends with a word character, so "Kim Il-sung" and
 * "occupancy and use" match as phrases without the boundary swallowing them.
 */
function termPattern(term: string): RegExp {
  const escaped = escapeRegExp(term);
  const left = /^\w/.test(term) ? '\\b' : '';
  const right = /\w$/.test(term) ? '\\b' : '';
  return new RegExp(`${left}${escaped}${right}`, 'gi');
}

function findTerms(text: string, patterns: Map<string, RegExp>): string[] {
  const found: string[] = [];
  for (const [term, pattern] of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) found.push(term);
  }
  return found;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** The sentences of a stem that actually ask something. */
function interrogativeSentences(stem: string): string[] {
  return stem
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.endsWith('?'));
}

const FINITE_VERB =
  /\b(should|must|is|are|was|were|does|do|did|can|could|will|would|ought|has|have|had|may|might)\b/i;

/**
 * Two claims joined into one question. Genuine parsing is out of scope, so the
 * test is deliberately narrow: an interrogative sentence whose "and"/"or" has a
 * finite verb on both sides is asking two things, and two question marks is
 * asking two things outright.
 */
function looksDoubleBarrelled(stem: string): string | null {
  const questions = interrogativeSentences(stem);
  if (questions.length > 1) {
    return `the stem asks ${questions.length} separate questions`;
  }

  const question = questions[0];
  if (!question) return null;

  for (const match of question.matchAll(/\s\b(and|or)\b\s/gi)) {
    const at = match.index ?? -1;
    if (at < 0) continue;
    const before = question.slice(0, at);
    const after = question.slice(at + match[0].length);
    if (FINITE_VERB.test(before) && FINITE_VERB.test(after)) {
      return `"${match[1]}" joins two clauses that each carry a verb`;
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Stance helpers
// -----------------------------------------------------------------------------

/**
 * Effective stances per ideology, weight-0 and cleared entries dropped. The
 * same resolution the engine uses, so the lint reports on what would actually
 * be scored rather than on what happens to be written in one file.
 */
export function effectiveStances(
  content: NonNullable<LoadResult['content']>,
): Map<string, Map<string, Stance>> {
  const out = new Map<string, Map<string, Stance>>();
  for (const ideology of content.ideologies) {
    const resolved = resolveStances(content, ideology.id);
    const table = new Map<string, Stance>();
    for (const [questionId, entry] of resolved.byQuestion) {
      if (entry.stance.weight > 0) table.set(questionId, entry.stance);
    }
    out.set(ideology.id, table);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Lint
// -----------------------------------------------------------------------------

export interface LintResult {
  issues: Issue[];
  /** Questions whose `lint_waiver` suppressed at least one finding. */
  waivers: { questionId: string; reason: string; suppressed: string[] }[];
}

export function lintContent(loaded: LoadResult, lists: LintLists): LintResult {
  const issues: Issue[] = [];
  const waivers: LintResult['waivers'] = [];
  const content = loaded.content;
  if (!content) return { issues, waivers };

  const namedEntities = new Map(lists.namedEntities.map((t) => [t, termPattern(t)]));
  const loadedWords = new Map(lists.loadedWords.map((t) => [t, termPattern(t)]));
  const jargon = new Map(lists.jargon.map((t) => [t, termPattern(t)]));

  const stances = effectiveStances(content);
  const source = loaded.sources.questions;

  for (const question of content.questions) {
    const raw: Issue[] = [];
    const push = (issue: Omit<Issue, 'file' | 'id'>): void => {
      raw.push({ ...issue, file: FILES.questions, id: question.id });
    };

    const index = source.indexOf(question.id);
    const lineOf = (path: ReadonlyArray<string | number>): number | undefined =>
      index === undefined ? undefined : source.lineFor([index, ...path]);

    const authored = question.options.filter((o) => !o.implicit);

    checkHistoryLeaks(question, authored, namedEntities, push, lineOf);
    checkDoubleBarrelled(question, push, lineOf);
    checkLoadedWords(question, authored, loadedWords, push, lineOf);
    checkJargon(question, authored, jargon, push, lineOf);
    checkLengths(question, authored, push, lineOf);
    checkOptionCount(question, authored, push, lineOf);
    checkOptionDiscrimination(question, authored, stances, push, lineOf);
    checkFollowUpParents(question, stances, push, lineOf);

    // A waiver suppresses only the heuristic rules, and only on the question
    // that carries it. It is a visible line in the YAML precisely so that the
    // reasoning is reviewable rather than invisible.
    if (question.lint_waiver) {
      const suppressed = raw.filter((i) => WAIVABLE_CODES.has(i.code));
      if (suppressed.length > 0) {
        waivers.push({
          questionId: question.id,
          reason: question.lint_waiver,
          suppressed: suppressed.map((i) => i.code),
        });
      }
      issues.push(...raw.filter((i) => !WAIVABLE_CODES.has(i.code)));
    } else {
      issues.push(...raw);
    }
  }

  checkWeightThreeNotes(content, issues);

  return { issues, waivers };
}

type Push = (issue: Omit<Issue, 'file' | 'id'>) => void;
type LineOf = (path: ReadonlyArray<string | number>) => number | undefined;

// --- principle 1 and 3: no dates, no names -----------------------------------

function checkHistoryLeaks(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  namedEntities: Map<string, RegExp>,
  push: Push,
  lineOf: LineOf,
): void {
  const fields: { text: string; path: string; line: ReadonlyArray<string | number> }[] = [
    { text: question.text, path: 'text', line: ['text'] },
  ];
  for (const [i, option] of authored.entries()) {
    fields.push({ text: option.label, path: `options[${i}].label`, line: ['options', i, 'label'] });
    if (option.short) {
      fields.push({
        text: option.short,
        path: `options[${i}].short`,
        line: ['options', i, 'short'],
      });
    }
  }

  for (const field of fields) {
    YEAR_PATTERN.lastIndex = 0;
    const years = [...field.text.matchAll(YEAR_PATTERN)].map((m) => m[0]);
    if (years.length > 0) {
      push({
        severity: 'error',
        code: 'lint/year-in-prose',
        path: field.path,
        line: lineOf(field.line),
        message: `contains the year ${[...new Set(years)].join(', ')}`,
        hint: 'principle 1: dates belong in the tooltip, as optional context',
      });
    }

    // Naming traditions is the whole point of a self-identification question.
    if (question.self_id) continue;

    const entities = findTerms(field.text, namedEntities);
    if (entities.length > 0) {
      push({
        severity: 'error',
        code: 'lint/named-entity',
        path: field.path,
        line: lineOf(field.line),
        message: `names ${entities.map((e) => `"${e}"`).join(', ')}`,
        hint: 'principle 1: a person, event or organisation may appear only in the tooltip. Describe the position in plain words instead',
      });
    }
  }
}

// --- principle 4: one position per question ----------------------------------

function checkDoubleBarrelled(question: NormalisedQuestion, push: Push, lineOf: LineOf): void {
  const reason = looksDoubleBarrelled(question.text);
  if (!reason) return;
  push({
    severity: 'warning',
    code: 'lint/double-barrelled',
    path: 'text',
    line: lineOf(['text']),
    message: `may be double-barrelled: ${reason}`,
    hint: 'principle 4: split it, or add a `lint_waiver` saying why it is one question',
  });
}

// --- principle 5: no option is the obviously reasonable one -------------------

function checkLoadedWords(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  loadedWords: Map<string, RegExp>,
  push: Push,
  lineOf: LineOf,
): void {
  const inStem = findTerms(question.text, loadedWords);
  if (inStem.length > 0) {
    push({
      severity: 'warning',
      code: 'lint/loaded-word',
      path: 'text',
      line: lineOf(['text']),
      message: `stem uses ${inStem.map((w) => `"${w}"`).join(', ')}`,
      hint: 'principle 5: a stem is the author speaking, so loaded language there tilts every option at once',
    });
  }

  for (const [i, option] of authored.entries()) {
    const found = findTerms(option.label, loadedWords);
    if (found.length === 0) continue;
    push({
      severity: 'warning',
      code: 'lint/loaded-word',
      path: `options[${i}].label`,
      line: lineOf(['options', i, 'label']),
      message: `option "${option.id}" uses ${found.map((w) => `"${w}"`).join(', ')}`,
      hint: 'legitimate if this camp would use the word about its own position; otherwise the author is leaking in',
    });
  }
}

// --- principle 6: plain stems, glossed jargon --------------------------------

function checkJargon(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  jargon: Map<string, RegExp>,
  push: Push,
  lineOf: LineOf,
): void {
  if (question.self_id) return;

  const inStem = findTerms(question.text, jargon);
  if (inStem.length > 0) {
    push({
      severity: 'error',
      code: 'lint/jargon-in-stem',
      path: 'text',
      line: lineOf(['text']),
      message: `stem uses ${inStem.map((t) => `"${t}"`).join(', ')}`,
      hint: 'principle 6: the stem must be answerable without the vocabulary. Say it in plain words and put the term in the tooltip',
    });
  }

  const tooltip = (question.tooltip ?? '').toLowerCase();
  for (const [i, option] of authored.entries()) {
    const found = findTerms(option.label, jargon).filter(
      (term) => !tooltip.includes(term.toLowerCase()),
    );
    if (found.length === 0) continue;
    push({
      severity: 'error',
      code: 'lint/jargon-without-tooltip',
      path: `options[${i}].label`,
      line: lineOf(['options', i, 'label']),
      message: `option "${option.id}" uses ${found.map((t) => `"${t}"`).join(', ')} with no tooltip covering it`,
      hint: 'principle 6: an option may use a camp\'s own words, but the reader has to be able to look them up',
    });
  }
}

// --- length ------------------------------------------------------------------

function checkLengths(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  push: Push,
  lineOf: LineOf,
): void {
  const stemWords = wordCount(question.text);
  if (stemWords > MAX_STEM_WORDS) {
    push({
      severity: 'error',
      code: 'lint/stem-too-long',
      path: 'text',
      line: lineOf(['text']),
      message: `stem is ${stemWords} words, over the ${MAX_STEM_WORDS}-word cap`,
      hint: 'a scenario people have to re-read is a scenario they answer by vibe',
    });
  }

  if (authored.length < 2) return;
  const lengths = authored.map((o) => ({ id: o.id, words: wordCount(o.label) }));
  const shortest = lengths.reduce((a, b) => (a.words <= b.words ? a : b));
  const longest = lengths.reduce((a, b) => (a.words >= b.words ? a : b));

  const gap = longest.words - shortest.words;
  const ratio = shortest.words === 0 ? Infinity : longest.words / shortest.words;

  if (ratio >= OPTION_LENGTH_RATIO && gap >= OPTION_LENGTH_ABSOLUTE_GAP) {
    push({
      severity: 'warning',
      code: 'lint/option-length-imbalance',
      path: 'options',
      line: lineOf(['options']),
      message: `"${longest.id}" is ${longest.words} words against ${shortest.words} for "${shortest.id}"`,
      hint: 'length reads as effort, and effort reads as the intended answer. Even the options up, or waive it if the argument genuinely needs the room',
    });
  }
}

// --- principle 7: 3-6 options ------------------------------------------------

function checkOptionCount(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  push: Push,
  lineOf: LineOf,
): void {
  if (question.kind === 'likert5') return;
  if (authored.length >= MIN_OPTIONS && authored.length <= MAX_OPTIONS) return;

  push({
    severity: 'error',
    code: 'lint/option-count',
    path: 'options',
    line: lineOf(['options']),
    message: `${authored.length} options; principle 7 allows ${MIN_OPTIONS}-${MAX_OPTIONS}`,
    hint:
      authored.length > MAX_OPTIONS
        ? 'too many to hold in mind at once. Split the question, or merge options that are the same position in different words'
        : 'too few to be a real choice',
  });
}

// --- does the question discriminate? -----------------------------------------

function checkOptionDiscrimination(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  stances: Map<string, Map<string, Stance>>,
  push: Push,
  lineOf: LineOf,
): void {
  // A likert's five points are positions on a scale, not options someone wrote
  // to state a camp's view. "No ideology accepts `disagree`" is not a strawman
  // finding, it is just what a one-sided proposition looks like, and reporting
  // it would bury the real findings four deep on every likert question.
  if (question.kind === 'likert5') return;

  const holders: { ideologyId: string; stance: Stance }[] = [];
  for (const [ideologyId, table] of stances) {
    const stance = table.get(question.id);
    if (stance) holders.push({ ideologyId, stance });
  }

  // Nothing to say about a question no ideology has reached yet.
  if (holders.length === 0) return;

  for (const [i, option] of authored.entries()) {
    const accepting = holders.filter((h) => h.stance.accept.includes(option.id));

    if (accepting.length === 0) {
      push({
        severity: 'warning',
        code: 'lint/option-unaccepted',
        path: `options[${i}]`,
        line: lineOf(['options', i]),
        message: `no ideology accepts "${option.id}"`,
        hint: 'principle 5: if nobody would choose it, it is a strawman. Either it belongs to a camp not yet on the roster, or it should be cut',
      });
      continue;
    }

    if (holders.length >= 2 && accepting.length === holders.length) {
      push({
        severity: 'warning',
        code: 'lint/option-universal',
        path: `options[${i}]`,
        line: lineOf(['options', i]),
        message: `every ideology with a stance here accepts "${option.id}" (${holders.length} of them)`,
        hint: 'an option everyone takes separates nobody; it costs a question slot and tells the test nothing',
      });
    }
  }
}

function checkFollowUpParents(
  question: NormalisedQuestion,
  stances: Map<string, Map<string, Stance>>,
  push: Push,
  lineOf: LineOf,
): void {
  const holders = [...stances.values()]
    .map((table) => table.get(question.id))
    .filter((s): s is Stance => s !== undefined);
  if (holders.length === 0) return;

  for (const [i, followUp] of question.follow_ups.entries()) {
    const reachable = followUp.when.answer_in.filter((optionId) =>
      holders.some((s) => s.accept.includes(optionId)),
    );
    if (reachable.length > 0) continue;

    push({
      severity: 'warning',
      code: 'lint/followup-dead-parent',
      path: `follow_ups[${i}].when.answer_in`,
      line: lineOf(['follow_ups', i]),
      message: `fires on ${followUp.when.answer_in.map((o) => `"${o}"`).join(', ')}, which no ideology accepts`,
      hint: `the follow-up asks ${followUp.ask.join(', ')} — but nobody the test can return would take the answer that triggers it`,
    });
  }
}

// --- weight 3 ------------------------------------------------------------------

/**
 * Belt and braces: `StanceSchema` already rejects a weight-3 stance with no
 * note at parse time, so this cannot normally fire. It is here because the rule
 * matters more than any one enforcement point — if the schema is ever relaxed,
 * the lint still catches it.
 */
function checkWeightThreeNotes(
  content: NonNullable<LoadResult['content']>,
  issues: Issue[],
): void {
  const check = (
    ownerId: string,
    file: Issue['file'],
    entries: [string, Stance | null][],
  ): void => {
    for (const [questionId, stance] of entries) {
      if (!stance || stance.weight !== 3 || stance.note) continue;
      issues.push({
        severity: 'error',
        code: 'lint/weight-3-without-note',
        file,
        id: ownerId,
        path: `stances.${questionId}`,
        message: 'weight 3 with no `note`',
        hint: 'the note says what would change about the ideology if the position reversed. If you cannot write that sentence, it is not a 3',
      });
    }
  };

  for (const family of content.families) {
    check(family.id, FILES.families, Object.entries(family.stances));
  }
  for (const ideology of content.ideologies) {
    check(ideology.id, FILES.ideologies, Object.entries(ideology.stances));
  }
}

// -----------------------------------------------------------------------------
// Word list parsing
// -----------------------------------------------------------------------------

/** One term per line; `#` comments and blank lines ignored. */
export function parseWordList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}
