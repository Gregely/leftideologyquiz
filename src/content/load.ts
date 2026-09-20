/**
 * Parsing, normalisation and indexing for /content.
 *
 * Takes raw YAML text rather than file paths: nothing in /src may touch the
 * filesystem (CLAUDE.md § Folder layout), so reading files is the caller's job.
 * `scripts/validate.ts` does it for the CLI; tests pass strings directly.
 *
 * What happens here is everything that can be done with one file in view:
 * parse, per-record schema check, inject implicit options, build indexes, and
 * resolve stance inheritance. Cross-record checks live in `validate.ts`.
 */

import { LineCounter, parseDocument, isNode, type Document } from 'yaml';
import type { ZodType } from 'zod';
import {
  FamiliesFileSchema,
  FamilySchema,
  IdeologiesFileSchema,
  IdeologySchema,
  IMPLICIT_OPTIONS,
  LIKERT5_OPTIONS,
  QuestionSchema,
  QuestionsFileSchema,
  type Family,
  type Ideology,
  type Option,
  type Question,
  type Stance,
} from './schema.js';

// -----------------------------------------------------------------------------
// Issues
// -----------------------------------------------------------------------------

export type Severity = 'error' | 'warning';

export type ContentFile = 'content/families.yaml' | 'content/ideologies.yaml' | 'content/questions.yaml';

export interface Issue {
  severity: Severity;
  /** Stable machine-readable code, e.g. `stance/unknown-option`. */
  code: string;
  file: ContentFile;
  /** The record the problem belongs to; `<root>` for whole-file problems. */
  id: string;
  message: string;
  /** Dotted path inside the record, e.g. `stances.d1_ownership.accept[1]`. */
  path?: string;
  /** 1-based line in `file`, when it can be resolved. */
  line?: number;
  /** What to do about it. */
  hint?: string;
}

export const FILES = {
  families: 'content/families.yaml',
  ideologies: 'content/ideologies.yaml',
  questions: 'content/questions.yaml',
} as const satisfies Record<string, ContentFile>;

// -----------------------------------------------------------------------------
// Normalised content
// -----------------------------------------------------------------------------

export interface NormalisedOption extends Option {
  /** True for `unsure`/`unknown_term` and for injected likert points. */
  implicit: boolean;
}

export interface NormalisedQuestion extends Omit<Question, 'options'> {
  options: NormalisedOption[];
}

export interface Content {
  families: Family[];
  ideologies: Ideology[];
  questions: NormalisedQuestion[];
  familyById: Map<string, Family>;
  ideologyById: Map<string, Ideology>;
  questionById: Map<string, NormalisedQuestion>;
  /** Question id -> every option id, implicit ones included. */
  optionIds: Map<string, Set<string>>;
  /** Question id -> option ids a stance or condition may legitimately name. */
  scorableOptionIds: Map<string, Set<string>>;
  /** Family id -> ideologies in it, in file order. */
  ideologiesByFamily: Map<string, Ideology[]>;
}

export interface SourceMap {
  file: ContentFile;
  /** Line of the value at `path`, or of its nearest resolvable ancestor. */
  lineFor(path: ReadonlyArray<string | number>): number | undefined;
  /** Index of a record in its top-level list, by id. */
  indexOf(id: string): number | undefined;
}

export interface LoadResult {
  /** Null only when a file could not be parsed or its root shape was wrong. */
  content: Content | null;
  issues: Issue[];
  sources: Record<'families' | 'ideologies' | 'questions', SourceMap>;
}

export interface RawContent {
  families: string;
  ideologies: string;
  questions: string;
}

// -----------------------------------------------------------------------------
// Source maps
// -----------------------------------------------------------------------------

function makeSourceMap(
  file: ContentFile,
  doc: Document.Parsed | null,
  lineCounter: LineCounter,
  rootKey: string,
  indexById: Map<string, number>,
): SourceMap {
  return {
    file,
    indexOf: (id) => indexById.get(id),
    lineFor(path) {
      if (!doc) return undefined;
      // Walk back up the path until something resolves, so a line is reported
      // even when the exact leaf is missing (which is often the complaint).
      for (let i = path.length; i >= 0; i--) {
        const node = doc.getIn([rootKey, ...path.slice(0, i)], true);
        if (isNode(node) && node.range) {
          const pos = lineCounter.linePos(node.range[0]);
          return pos.line;
        }
      }
      return undefined;
    },
  };
}

const EMPTY_SOURCE_MAP = (file: ContentFile): SourceMap => ({
  file,
  indexOf: () => undefined,
  lineFor: () => undefined,
});

// -----------------------------------------------------------------------------
// Per-file parsing
// -----------------------------------------------------------------------------

interface ParsedFile<T> {
  records: T[];
  doc: Document.Parsed | null;
  lineCounter: LineCounter;
  indexById: Map<string, number>;
}

function formatZodPath(path: ReadonlyArray<PropertyKey>): string {
  let out = '';
  for (const segment of path) {
    if (typeof segment === 'number') out += `[${segment}]`;
    else out += out === '' ? String(segment) : `.${String(segment)}`;
  }
  return out;
}

/**
 * Parse one content file into records, reporting per-record rather than
 * per-file so a single bad entry does not hide everything after it.
 */
function parseFile<T extends { id: string }>(
  file: ContentFile,
  source: string,
  rootKey: string,
  rootSchema: ZodType<Record<string, unknown[]>>,
  recordSchema: ZodType<T>,
  issues: Issue[],
): ParsedFile<T> {
  const lineCounter = new LineCounter();
  const indexById = new Map<string, number>();
  let doc: Document.Parsed;

  try {
    doc = parseDocument(source, { lineCounter, prettyErrors: true });
  } catch (err) {
    issues.push({
      severity: 'error',
      code: 'yaml/parse',
      file,
      id: '<root>',
      message: err instanceof Error ? err.message : String(err),
    });
    return { records: [], doc: null, lineCounter, indexById };
  }

  for (const err of doc.errors) {
    issues.push({
      severity: 'error',
      code: 'yaml/parse',
      file,
      id: '<root>',
      message: err.message,
      line: lineCounter.linePos(err.pos[0]).line,
    });
  }
  if (doc.errors.length > 0) return { records: [], doc: null, lineCounter, indexById };

  const root = rootSchema.safeParse(doc.toJS());
  if (!root.success) {
    issues.push({
      severity: 'error',
      code: 'schema/root-shape',
      file,
      id: '<root>',
      message: `file must be a mapping with a single \`${rootKey}:\` list`,
      hint: root.error.issues.map((i) => `${formatZodPath(i.path)}: ${i.message}`).join('; '),
    });
    return { records: [], doc: null, lineCounter, indexById };
  }

  const entries = root.data[rootKey] ?? [];
  const records: T[] = [];
  const seen = new Set<string>();

  for (const [index, entry] of entries.entries()) {
    const declaredId =
      entry && typeof entry === 'object' && 'id' in entry && typeof entry.id === 'string'
        ? entry.id
        : `<${rootKey}[${index}]>`;

    const parsed = recordSchema.safeParse(entry);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = formatZodPath(issue.path);
        const node = doc.getIn([rootKey, index, ...issue.path], true);
        issues.push({
          severity: 'error',
          code: 'schema/invalid',
          file,
          id: declaredId,
          path: path || undefined,
          message: issue.message,
          line:
            isNode(node) && node.range
              ? lineCounter.linePos(node.range[0]).line
              : lineCounter.linePos(
                  (() => {
                    const rec = doc.getIn([rootKey, index], true);
                    return isNode(rec) && rec.range ? rec.range[0] : 0;
                  })(),
                ).line,
        });
      }
      continue;
    }

    if (seen.has(parsed.data.id)) {
      issues.push({
        severity: 'error',
        code: 'schema/duplicate-id',
        file,
        id: parsed.data.id,
        message: `duplicate id "${parsed.data.id}"; ids must be unique within a file`,
        line: (() => {
          const node = doc.getIn([rootKey, index, 'id'], true);
          return isNode(node) && node.range ? lineCounter.linePos(node.range[0]).line : undefined;
        })(),
      });
      continue;
    }

    seen.add(parsed.data.id);
    indexById.set(parsed.data.id, index);
    records.push(parsed.data);
  }

  return { records, doc, lineCounter, indexById };
}

// -----------------------------------------------------------------------------
// Normalisation
// -----------------------------------------------------------------------------

/**
 * Give every question its full option list: the authored options (or the
 * canonical likert points), followed by the two implicit ones. Implicit options
 * are flagged rather than held separately so display code can iterate one list
 * and scoring code can filter on `implicit`.
 */
export function normaliseQuestion(question: Question): NormalisedQuestion {
  const authored: NormalisedOption[] =
    question.kind === 'likert5' && question.options.length === 0
      ? LIKERT5_OPTIONS.map((o) => ({ id: o.id, label: o.label, implicit: false }))
      : question.options.map((o) => ({ ...o, implicit: false }));

  const implicit: NormalisedOption[] = IMPLICIT_OPTIONS.map((o) => ({
    id: o.id,
    label: o.label,
    short: o.short,
    implicit: true,
  }));

  return { ...question, options: [...authored, ...implicit] };
}

// -----------------------------------------------------------------------------
// Stance inheritance
// -----------------------------------------------------------------------------

export interface StanceSource {
  level: 'family' | 'tendency' | 'self';
  /** Family id for `family`, ideology id for the others. */
  id: string;
}

export interface ResolvedStance {
  questionId: string;
  stance: Stance;
  from: StanceSource;
}

export interface ResolvedStances {
  byQuestion: Map<string, ResolvedStance>;
  /** Questions where a `null` override dropped an inherited stance. */
  cleared: string[];
  /** `null` overrides that had nothing to clear — almost always a mistake. */
  clearedNothing: string[];
  /** True when the tendency chain loops; resolution stops at the repeat. */
  cyclic: boolean;
}

/**
 * Ancestors of an ideology, outermost first, ending with the ideology itself.
 * Stops at a repeat rather than looping; `validate.ts` reports the cycle.
 */
export function ancestorChain(
  content: Pick<Content, 'ideologyById'>,
  ideologyId: string,
): { chain: Ideology[]; cyclic: boolean } {
  const chain: Ideology[] = [];
  const seen = new Set<string>();
  let current = content.ideologyById.get(ideologyId);
  let cyclic = false;

  while (current) {
    if (seen.has(current.id)) {
      cyclic = true;
      break;
    }
    seen.add(current.id);
    chain.unshift(current);
    current = current.tendency ? content.ideologyById.get(current.tendency) : undefined;
  }

  return { chain, cyclic };
}

/**
 * Resolve an ideology's effective stances: family defaults first, then each
 * ancestor from the outermost in, then the ideology's own. A later level
 * replaces an earlier one wholesale for that question — stances are not deep
 * merged, because a half-inherited stance would be nobody's actual position.
 * A `null` value drops the inherited stance instead.
 */
export function resolveStances(
  content: Pick<Content, 'ideologyById' | 'familyById'>,
  ideologyId: string,
): ResolvedStances {
  const { chain, cyclic } = ancestorChain(content, ideologyId);
  const byQuestion = new Map<string, ResolvedStance>();
  const cleared: string[] = [];
  const clearedNothing: string[] = [];

  const ideology = content.ideologyById.get(ideologyId);
  const family = ideology ? content.familyById.get(ideology.family) : undefined;

  if (family) {
    for (const [questionId, stance] of Object.entries(family.stances)) {
      byQuestion.set(questionId, {
        questionId,
        stance,
        from: { level: 'family', id: family.id },
      });
    }
  }

  for (const node of chain) {
    const level: StanceSource['level'] = node.id === ideologyId ? 'self' : 'tendency';
    for (const [questionId, stance] of Object.entries(node.stances)) {
      if (stance === null) {
        if (byQuestion.delete(questionId)) cleared.push(questionId);
        else clearedNothing.push(questionId);
        continue;
      }
      byQuestion.set(questionId, { questionId, stance, from: { level, id: node.id } });
    }
  }

  return { byQuestion, cleared, clearedNothing, cyclic };
}

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

/** Parse, normalise and index the three content files. */
export function parseContent(raw: RawContent): LoadResult {
  const issues: Issue[] = [];

  const familiesFile = parseFile<Family>(
    FILES.families,
    raw.families,
    'families',
    FamiliesFileSchema as unknown as ZodType<Record<string, unknown[]>>,
    FamilySchema,
    issues,
  );
  const ideologiesFile = parseFile<Ideology>(
    FILES.ideologies,
    raw.ideologies,
    'ideologies',
    IdeologiesFileSchema as unknown as ZodType<Record<string, unknown[]>>,
    IdeologySchema,
    issues,
  );
  const questionsFile = parseFile<Question>(
    FILES.questions,
    raw.questions,
    'questions',
    QuestionsFileSchema as unknown as ZodType<Record<string, unknown[]>>,
    QuestionSchema,
    issues,
  );

  const sources = {
    families: familiesFile.doc
      ? makeSourceMap(
          FILES.families,
          familiesFile.doc,
          familiesFile.lineCounter,
          'families',
          familiesFile.indexById,
        )
      : EMPTY_SOURCE_MAP(FILES.families),
    ideologies: ideologiesFile.doc
      ? makeSourceMap(
          FILES.ideologies,
          ideologiesFile.doc,
          ideologiesFile.lineCounter,
          'ideologies',
          ideologiesFile.indexById,
        )
      : EMPTY_SOURCE_MAP(FILES.ideologies),
    questions: questionsFile.doc
      ? makeSourceMap(
          FILES.questions,
          questionsFile.doc,
          questionsFile.lineCounter,
          'questions',
          questionsFile.indexById,
        )
      : EMPTY_SOURCE_MAP(FILES.questions),
  };

  // A file that failed to parse leaves nothing worth cross-checking.
  if (!familiesFile.doc || !ideologiesFile.doc || !questionsFile.doc) {
    return { content: null, issues, sources };
  }

  const questions = questionsFile.records.map(normaliseQuestion);

  const familyById = new Map(familiesFile.records.map((f) => [f.id, f]));
  const ideologyById = new Map(ideologiesFile.records.map((i) => [i.id, i]));
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const optionIds = new Map<string, Set<string>>();
  const scorableOptionIds = new Map<string, Set<string>>();
  for (const q of questions) {
    optionIds.set(q.id, new Set(q.options.map((o) => o.id)));
    scorableOptionIds.set(
      q.id,
      new Set(q.options.filter((o) => !o.implicit).map((o) => o.id)),
    );
  }

  const ideologiesByFamily = new Map<string, Ideology[]>();
  for (const ideology of ideologiesFile.records) {
    const list = ideologiesByFamily.get(ideology.family);
    if (list) list.push(ideology);
    else ideologiesByFamily.set(ideology.family, [ideology]);
  }

  return {
    content: {
      families: familiesFile.records,
      ideologies: ideologiesFile.records,
      questions,
      familyById,
      ideologyById,
      questionById,
      optionIds,
      scorableOptionIds,
      ideologiesByFamily,
    },
    issues,
    sources,
  };
}
