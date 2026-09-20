/**
 * `npm run validate` — schema and referential integrity over /content (SPEC.md §10.1).
 *
 * Exit code 1 on any error. Warnings are printed but do not fail the run.
 *
 * Flags:
 *   --json     machine-readable output
 *   --quiet    errors only, no warnings and no summary
 *   --strict   treat warnings as errors
 */

import { resolveStances, type Issue } from '../src/content/load.js';
import { validateContent } from '../src/content/validate.js';
import { asJson, dim, flags, loadContent, printIssues, summarise } from './report.js';

const quiet = flags.has('--quiet');
const strict = flags.has('--strict');

const loaded = loadContent();
const issues: Issue[] = [...loaded.issues, ...validateContent(loaded)];

const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'warning');

if (asJson) {
  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0 && (!strict || warnings.length === 0),
        counts: summaryCounts(),
        errors,
        warnings,
      },
      null,
      2,
    ),
  );
} else {
  printIssues(quiet ? errors : issues);
  if (!quiet) {
    const counts = summaryCounts();
    console.log('');
    if (Object.keys(counts).length > 0) {
      console.log(
        dim(
          `${counts['families']} families · ${counts['ideologies']} ideologies · ` +
            `${counts['questions']} questions ` +
            `(d1 ${counts['questionsDepth1']}, d2 ${counts['questionsDepth2']}, d3 ${counts['questionsDepth3']}) · ` +
            `${counts['resolvedStances']} resolved stances`,
        ),
      );
    }
    summarise(errors.length, warnings.length, 'content is valid: no errors, no warnings');
  }
}

process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);

// -----------------------------------------------------------------------------

function summaryCounts(): Record<string, number> {
  const content = loaded.content;
  if (!content) return {};

  let stanceCount = 0;
  for (const ideology of content.ideologies) {
    stanceCount += resolveStances(content, ideology.id).byQuestion.size;
  }

  const byDepth: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const question of content.questions) {
    byDepth[question.depth] = (byDepth[question.depth] ?? 0) + 1;
  }

  return {
    families: content.families.length,
    ideologies: content.ideologies.length,
    questions: content.questions.length,
    questionsDepth1: byDepth[1] ?? 0,
    questionsDepth2: byDepth[2] ?? 0,
    questionsDepth3: byDepth[3] ?? 0,
    resolvedStances: stanceCount,
  };
}
