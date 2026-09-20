/**
 * `npm run lint:content` — design-principle lint over question prose (SPEC.md §10.2).
 *
 * Exits non-zero on errors. Warnings are printed and do not fail.
 *
 * Flags:
 *   --json     machine-readable output
 *   --quiet    errors only
 *   --strict   treat warnings as errors
 *   --rule <code>  only report this rule (e.g. --rule lint/named-entity)
 */

import { lintContent, parseWordList, type LintLists } from '../src/content/lint.js';
import {
  asJson,
  bold,
  dim,
  flagValue,
  flags,
  green,
  loadContent,
  plural,
  printIssues,
  readFile,
  summarise,
  yellow,
} from './report.js';

const quiet = flags.has('--quiet');
const strict = flags.has('--strict');
const onlyRule = flagValue('rule');

const loaded = loadContent();

const lists: LintLists = {
  namedEntities: parseWordList(readFile('content/lint/named-entities.txt')),
  loadedWords: parseWordList(readFile('content/lint/loaded-words.txt')),
  jargon: parseWordList(readFile('content/lint/jargon.txt')),
};

const { issues: allIssues, waivers } = lintContent(loaded, lists);
const issues = onlyRule ? allIssues.filter((i) => i.code === onlyRule) : allIssues;

const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'warning');

if (asJson) {
  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0 && (!strict || warnings.length === 0),
        lists: {
          namedEntities: lists.namedEntities.length,
          loadedWords: lists.loadedWords.length,
          jargon: lists.jargon.length,
        },
        byRule: countByRule(),
        waivers,
        errors,
        warnings,
      },
      null,
      2,
    ),
  );
} else {
  printIssues(quiet ? errors : issues);
  if (!quiet) printSummary();
}

process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);

// -----------------------------------------------------------------------------

function countByRule(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const issue of issues) counts[issue.code] = (counts[issue.code] ?? 0) + 1;
  return counts;
}

function printSummary(): void {
  const byRule = Object.entries(countByRule()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (byRule.length > 0) {
    console.log(`\n${bold('by rule')}`);
    for (const [code, count] of byRule) {
      const severity = issues.find((i) => i.code === code)?.severity;
      const mark = severity === 'error' ? ' ' : dim(' (warning)');
      console.log(`  ${String(count).padStart(4)}  ${code}${mark}`);
    }
  }

  if (waivers.length > 0) {
    // SPEC.md §10.2 requires the census: a waiver is only acceptable while
    // someone is still reading them.
    console.log(`\n${bold('waivers')} ${dim(`(${plural(waivers.length, 'question')})`)}`);
    for (const waiver of waivers) {
      console.log(`  ${yellow(waiver.questionId)} ${dim(waiver.suppressed.join(', '))}`);
      console.log(`    ${dim(waiver.reason)}`);
    }
  }

  console.log(
    `\n${dim(
      `${loaded.content?.questions.length ?? 0} questions linted against ` +
        `${lists.namedEntities.length} named entities, ${lists.jargon.length} jargon terms, ` +
        `${lists.loadedWords.length} loaded words`,
    )}`,
  );

  summarise(errors.length, warnings.length, 'content lint clean');

  if (errors.length === 0 && warnings.length === 0 && (loaded.content?.questions.length ?? 0) > 0) {
    console.log(dim('note: rules that depend on stances stay quiet until stances are authored'));
  } else if (errors.length > 0) {
    console.log(dim(green('fix the errors; warnings need a judgement call or a `lint_waiver`')));
  }
}
