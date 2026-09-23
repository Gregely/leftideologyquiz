import io

p = 'src/content/lint.ts'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


sub("""export interface LintLists {
  namedEntities: string[];
  loadedWords: string[];
  jargon: string[];
}""",
    """export interface LintLists {
  namedEntities: string[];
  loadedWords: string[];
  jargon: string[];
  /** Political vocabulary banned outright at tier 1 (docs/redesign.md §2.2). */
  tier1Banned: string[];
  /** Phrases that add words without adding a position. */
  filler: string[];
  /** Removed before comparing an option with its stem. */
  stopwords: string[];
  /** `word count` lines correcting the syllable estimator. */
  syllables: string[];
}""")

sub("""    checkLengths(question, authored, push, lineOf);
    checkOptionCount(question, authored, push, lineOf);""",
    """    checkLengths(question, authored, push, lineOf);
    checkReadingGrade(question, authored, syllableExceptions, push, lineOf);
    checkTier1Vocabulary(question, authored, tier1Banned, push, lineOf);
    checkFiller(question, authored, filler, push, lineOf);
    checkOptionRestatesStem(question, authored, stopwords, push, lineOf);
    checkTier1Form(question, push, lineOf);
    checkOptionCount(question, authored, push, lineOf);""")

sub("""  const namedEntities = new Map(lists.namedEntities.map((t) => [t, termPattern(t)]));
  const loadedWords = new Map(lists.loadedWords.map((t) => [t, termPattern(t)]));
  const jargon = new Map(lists.jargon.map((t) => [t, termPattern(t)]));""",
    """  const namedEntities = new Map(lists.namedEntities.map((t) => [t, termPattern(t)]));
  const loadedWords = new Map(lists.loadedWords.map((t) => [t, termPattern(t)]));
  const jargon = new Map(lists.jargon.map((t) => [t, termPattern(t)]));
  const tier1Banned = new Map(lists.tier1Banned.map((t) => [t, termPattern(t)]));
  const filler = new Map(lists.filler.map((t) => [t, termPattern(t)]));
  const stopwords = new Set(lists.stopwords.map((t) => t.toLowerCase()));
  const syllableExceptions = parseSyllableList(lists.syllables);""")

# --- the rules themselves ---------------------------------------------------
sub("""// --- principle 7: 3-6 options ------------------------------------------------""",
    """// --- reading grade -----------------------------------------------------------

function checkReadingGrade(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  exceptions: Map<string, number>,
  push: Push,
  lineOf: LineOf,
): void {
  const limits = TIER_LIMITS[question.depth];
  if (limits.readingGrade === null) return;

  const text = [question.text, ...authored.map((o) => o.label)].join(' ');
  const grade = readingGrade(text, exceptions);
  if (grade <= limits.readingGrade) return;

  push({
    severity: limits.readingGradeSeverity,
    code: 'lint/reading-grade',
    path: 'text',
    line: lineOf(['text']),
    message: `reads at grade ${grade.toFixed(1)}, over the tier-${question.depth} ceiling of ${limits.readingGrade}`,
    hint: 'shorter sentences and shorter words, in that order. A long word in a short sentence costs more here than the other way round',
  });
}

// --- tier-1 vocabulary -------------------------------------------------------

function checkTier1Vocabulary(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  banned: Map<string, RegExp>,
  push: Push,
  lineOf: LineOf,
): void {
  if (question.depth !== 1) return;

  const fields: { text: string; path: string; line: ReadonlyArray<string | number> }[] = [
    { text: question.text, path: 'text', line: ['text'] },
  ];
  for (const [i, option] of authored.entries()) {
    fields.push({ text: option.label, path: `options[${i}].label`, line: ['options', i, 'label'] });
  }

  for (const field of fields) {
    const found = findTerms(field.text, banned);
    if (found.length === 0) continue;
    push({
      severity: 'error',
      code: 'lint/tier1-vocabulary',
      path: field.path,
      line: lineOf(field.line),
      message: `tier 1 uses ${found.map((t) => `"${t}"`).join(', ')}`,
      hint: 'say it in words someone with no political education already uses, or move the question to tier 2. A tooltip is not a fix at tier 1',
    });
  }

  const settings = findTerms(question.text, new Map(TIER1_FORBIDDEN_SETTINGS.map((t) => [t, termPattern(t)])));
  if (settings.length > 0) {
    push({
      severity: 'warning',
      code: 'lint/tier1-setting',
      path: 'text',
      line: lineOf(['text']),
      message: `tier-1 stem is set in ${settings.map((t) => `"${t}"`).join(', ')}`,
      hint: 'tier 1 uses situations from a life — a job, a landlord, a hospital, a police stop, a will. Not an invented revolution',
    });
  }
}

// --- filler ------------------------------------------------------------------

function checkFiller(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  filler: Map<string, RegExp>,
  push: Push,
  lineOf: LineOf,
): void {
  const severity: Severity = question.depth === 1 ? 'error' : 'warning';
  const fields: { text: string; path: string; line: ReadonlyArray<string | number> }[] = [
    { text: question.text, path: 'text', line: ['text'] },
  ];
  for (const [i, option] of authored.entries()) {
    fields.push({ text: option.label, path: `options[${i}].label`, line: ['options', i, 'label'] });
  }

  for (const field of fields) {
    const found = findTerms(field.text, filler);
    if (found.length === 0) continue;
    push({
      severity,
      code: 'lint/filler',
      path: field.path,
      line: lineOf(field.line),
      message: `filler: ${found.map((t) => `"${t}"`).join(', ')}`,
      hint: 'every one of these can be deleted without changing what the sentence claims. Deleting it buys words back against the cap',
    });
  }
}

// --- an option that restates the stem ----------------------------------------

/**
 * The pattern this catches: the stem does the work, and the option is "yes,
 * exactly that" in different words. Such an option carries no position of its
 * own, so choosing it tells the test nothing, and it crowds out one that would.
 */
function checkOptionRestatesStem(
  question: NormalisedQuestion,
  authored: NormalisedQuestion['options'],
  stopwords: Set<string>,
  push: Push,
  lineOf: LineOf,
): void {
  if (question.kind === 'likert5') return;

  const stemWords = contentWords(question.text, stopwords);
  if (stemWords.length === 0) return;
  const stemSet = new Set(stemWords);
  const stemTrigrams = new Set<string>();
  for (let i = 0; i + 2 < stemWords.length; i++) {
    stemTrigrams.add(stemWords.slice(i, i + 3).join(' '));
  }

  const severity: Severity = question.depth === 1 ? 'error' : 'warning';

  for (const [i, option] of authored.entries()) {
    const words = contentWords(option.label, stopwords);
    if (words.length === 0) continue;

    const shared = words.filter((w) => stemSet.has(w)).length;
    const overlap = shared / words.length;

    let trigram: string | null = null;
    for (let j = 0; j + 2 < words.length; j++) {
      const candidate = words.slice(j, j + 3).join(' ');
      if (stemTrigrams.has(candidate)) {
        trigram = candidate;
        break;
      }
    }

    if (overlap < 0.5 && trigram === null) continue;

    push({
      severity,
      code: 'lint/option-restates-stem',
      path: `options[${i}].label`,
      line: lineOf(['options', i, 'label']),
      message:
        trigram === null
          ? `option "${option.id}" is ${Math.round(overlap * 100)}% the stem's own words`
          : `option "${option.id}" repeats the stem's "${trigram}"`,
      hint: 'an option should state a position the stem does not; if it only echoes the stem, it separates nobody',
    });
  }
}

// --- tier-1 form -------------------------------------------------------------

function checkTier1Form(question: NormalisedQuestion, push: Push, lineOf: LineOf): void {
  if (question.depth !== 1) return;
  if (question.tooltip === undefined) return;

  push({
    severity: 'error',
    code: 'lint/tier1-tooltip',
    path: 'tooltip',
    line: lineOf(['tooltip']),
    message: 'tier-1 questions may not carry a tooltip',
    hint: 'a tooltip at tier 1 is an admission that the question needs vocabulary the respondent does not have. Say it plainly, or move it to tier 2 where a term may be glossed inline in under 8 words',
  });
}

// --- principle 7: 3-6 options ------------------------------------------------""")

# --- make the existing length and option-count rules tier-aware -------------
sub("""  const stemWords = wordCount(question.text);
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

  if (ratio >= OPTION_LENGTH_RATIO && gap >= OPTION_LENGTH_ABSOLUTE_GAP) {""",
    """  const limits = TIER_LIMITS[question.depth];

  const stemWords = wordCount(question.text);
  if (stemWords > limits.stemWords) {
    push({
      severity: 'error',
      code: 'lint/stem-too-long',
      path: 'text',
      line: lineOf(['text']),
      message: `stem is ${stemWords} words, over the tier-${question.depth} cap of ${limits.stemWords}`,
      hint: 'a scenario people have to re-read is a scenario they answer by vibe',
    });
  }

  for (const [i, option] of authored.entries()) {
    const words = wordCount(option.label);
    if (words <= limits.optionWords) continue;
    push({
      severity: 'error',
      code: 'lint/option-too-long',
      path: `options[${i}].label`,
      line: lineOf(['options', i, 'label']),
      message: `option "${option.id}" is ${words} words, over the tier-${question.depth} cap of ${limits.optionWords}`,
      hint: 'state the position and stop. The argument for it belongs at tier 3, if anywhere',
    });
  }

  if (authored.length < 2) return;
  const lengths = authored.map((o) => ({ id: o.id, words: wordCount(o.label) }));
  const shortest = lengths.reduce((a, b) => (a.words <= b.words ? a : b));
  const longest = lengths.reduce((a, b) => (a.words >= b.words ? a : b));

  const gap = longest.words - shortest.words;
  const ratio = shortest.words === 0 ? Infinity : longest.words / shortest.words;

  if (ratio >= limits.optionLengthRatio && gap >= limits.optionLengthGap) {""")

sub("""  if (question.kind === 'likert5') return;
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
  });""",
    """  if (question.kind === 'likert5') return;
  const limits = optionCountLimits(question.kind, question.depth);
  if (authored.length >= limits.min && authored.length <= limits.max) return;

  push({
    severity: 'error',
    code: 'lint/option-count',
    path: 'options',
    line: lineOf(['options']),
    message: `${authored.length} options; tier ${question.depth} allows ${limits.min}-${limits.max}`,
    hint:
      authored.length > limits.max
        ? 'too many to hold in mind at once. Split the question, or merge options that are the same position in different words'
        : 'too few to be a real choice',
  });""")

sub("""import type { Issue, LoadResult, NormalisedQuestion } from './load.js';
import { FILES, resolveStances } from './load.js';
import type { Stance } from './schema.js';""",
    """import type { Issue, LoadResult, NormalisedQuestion, Severity } from './load.js';
import { FILES, resolveStances } from './load.js';
import { optionCountLimits, type Stance } from './schema.js';

/** `word count` lines from content/lint/syllables.txt. */
export function parseSyllableList(lines: readonly string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of lines) {
    const [word, count] = line.split(/\\s+/);
    const n = Number(count);
    if (word && Number.isInteger(n) && n > 0) out.set(word.toLowerCase(), n);
  }
  return out;
}""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
