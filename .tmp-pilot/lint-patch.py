import io

p = 'src/content/lint.ts'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


# --- tunables ---------------------------------------------------------------
sub("""/** SPEC.md §10.2 caps stems at 55 words; the brief for this tool says 60. */
export const MAX_STEM_WORDS = 60;

/** Options this much longer than the shortest signal which one is "right". */
export const OPTION_LENGTH_RATIO = 2.5;

/** ...but only once the absolute gap is big enough to be visible on screen. */
export const OPTION_LENGTH_ABSOLUTE_GAP = 12;

/** SPEC.md §11 principle 7. Applies to every kind except likert. */
export const MIN_OPTIONS = 3;
export const MAX_OPTIONS = 6;""",
    """/**
 * Per-tier language limits (docs/redesign.md §2.1, SPEC.md §11).
 *
 * Tier 1 must be answerable by someone with no political education, so its
 * limits are the tight ones: a stem you can hold in your head and options that
 * state a position rather than argue for it. Tier 3 keeps the limits the bank
 * was written to.
 */
export interface TierLimits {
  /** Maximum words in a stem. */
  stemWords: number;
  /** Maximum words in any one authored option. */
  optionWords: number;
  /** Flesch-Kincaid grade ceiling for stem plus options; null means unchecked. */
  readingGrade: number | null;
  /** Severity of a reading-grade miss. */
  readingGradeSeverity: Severity;
  /** Longest option may be this multiple of the shortest... */
  optionLengthRatio: number;
  /** ...but only once the absolute gap is this many words. */
  optionLengthGap: number;
}

export const TIER_LIMITS: Record<1 | 2 | 3, TierLimits> = {
  1: {
    stemWords: 18,
    optionWords: 8,
    readingGrade: 7,
    readingGradeSeverity: 'error',
    optionLengthRatio: 2,
    optionLengthGap: 4,
  },
  2: {
    stemWords: 30,
    optionWords: 14,
    readingGrade: 9,
    readingGradeSeverity: 'warning',
    optionLengthRatio: 2.5,
    optionLengthGap: 12,
  },
  3: {
    stemWords: 60,
    optionWords: 40,
    readingGrade: null,
    readingGradeSeverity: 'warning',
    optionLengthRatio: 2.5,
    optionLengthGap: 12,
  },
};

/** Kept for callers that predate the tier table; tier 3's stem cap. */
export const MAX_STEM_WORDS = TIER_LIMITS[3].stemWords;

/** Options this much longer than the shortest signal which one is "right". */
export const OPTION_LENGTH_RATIO = TIER_LIMITS[3].optionLengthRatio;

/** ...but only once the absolute gap is big enough to be visible on screen. */
export const OPTION_LENGTH_ABSOLUTE_GAP = TIER_LIMITS[3].optionLengthGap;

/** SPEC.md §11 principle 7. Applies to every kind except likert. */
export const MIN_OPTIONS = 3;
export const MAX_OPTIONS = 6;

/**
 * Settings a tier-1 stem may not invent (docs/redesign.md §2.5).
 *
 * Softer than the banned list and kept separate from it so the message can say
 * *why*: the problem is not the word, it is that the question is asking the
 * respondent to imagine a situation they have never been in. Tier 1 uses
 * situations from a life — a job, a landlord, a hospital, a police stop — and
 * never an invented revolution.
 */
export const TIER1_FORBIDDEN_SETTINGS = [
  'revolution',
  'revolutionary',
  'the movement',
  'a movement',
  'the party',
  'a party',
  'the state',
  'regime',
  'transition',
  'colonial',
  'colony',
  'seize power',
  'take power',
  'comes to power',
];""")

# --- reading grade ----------------------------------------------------------
sub("""function wordCount(text: string): number {
  return text.trim().split(/\\s+/).filter(Boolean).length;
}""",
    """function wordCount(text: string): number {
  return text.trim().split(/\\s+/).filter(Boolean).length;
}

/**
 * Syllables in one word, by vowel-group count.
 *
 * Deterministic and dependency-free on purpose: `src/` must run in a browser
 * with no polyfills, and a reading-grade number that moved when a library
 * updated would be worse than no number at all. Predictable misses are
 * corrected by `content/lint/syllables.txt` rather than by making the rule
 * cleverer.
 */
export function syllables(word: string, exceptions: Map<string, number> = new Map()): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  const known = exceptions.get(clean);
  if (known !== undefined) return known;
  if (clean.length <= 3) return 1;
  const trimmed = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

function sentenceCount(text: string): number {
  const marks = text.match(/[.!?]+(\\s|$)/g);
  return marks && marks.length > 0 ? marks.length : 1;
}

/**
 * Flesch-Kincaid grade level: roughly the US school year needed to read it.
 *
 * `0.39 · (words / sentences) + 11.8 · (syllables / words) − 15.59`, exactly as
 * docs/redesign.md §2.1 fixes it, so the lint and the plan agree on every
 * number either of them quotes.
 */
export function readingGrade(text: string, exceptions: Map<string, number> = new Map()): number {
  const words = text.trim().split(/\\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const syllableTotal = words.reduce((a, w) => a + syllables(w, exceptions), 0);
  return (
    0.39 * (words.length / sentenceCount(text)) +
    11.8 * (syllableTotal / words.length) -
    15.59
  );
}

/** Content words: everything that is not a stopword, lower-cased. */
function contentWords(text: string, stopwords: Set<string>): string[] {
  return text
    .toLowerCase()
    .replace(/\\{\\{[^}]*\\}\\}/g, ' ')
    .split(/[^a-z']+/)
    .filter((w) => w.length > 0 && !stopwords.has(w));
}""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
