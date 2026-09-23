/**
 * Shared terminal output for the content tools.
 *
 * Node-only: colours, argv, file reading, exit codes. Nothing under /src may do
 * any of it (CLAUDE.md § Folder layout), so every script funnels through here
 * and the pure modules stay testable.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseContent, type Issue, type LoadResult, type Severity } from '../src/content/load.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const flags = new Set(process.argv.slice(2));
export const asJson = flags.has('--json');
export const showAll = flags.has('--all');

/** Value of a `--name=value` or `--name value` argument. */
export function flagValue(name: string): string | undefined {
  const argv = process.argv.slice(2);
  const prefixed = argv.find((a) => a.startsWith(`--${name}=`));
  if (prefixed) return prefixed.slice(name.length + 3);
  const at = argv.indexOf(`--${name}`);
  if (at >= 0 && argv[at + 1] && !argv[at + 1]!.startsWith('--')) return argv[at + 1];
  return undefined;
}

const useColour = !asJson && process.stdout.isTTY === true && process.env['NO_COLOR'] === undefined;

const ESC = '\u001b';
const paint = (code: string, text: string): string =>
  useColour ? `${ESC}[${code}m${text}${ESC}[0m` : text;

export const red = (t: string) => paint('31', t);
export const yellow = (t: string) => paint('33', t);
export const green = (t: string) => paint('32', t);
export const blue = (t: string) => paint('36', t);
export const dim = (t: string) => paint('2', t);
export const bold = (t: string) => paint('1', t);

export function readFile(relativePath: string): string {
  try {
    return readFileSync(join(ROOT, relativePath), 'utf8');
  } catch (err) {
    console.error(red(`cannot read ${relativePath}: ${err instanceof Error ? err.message : err}`));
    process.exit(1);
  }
}

/** Load and parse the three content files. */
export function loadContent(): LoadResult {
  return parseContent({
    groups: readFile('content/groups.yaml'),
    families: readFile('content/families.yaml'),
    ideologies: readFile('content/ideologies.yaml'),
    questions: readFile('content/questions.yaml'),
  });
}

export function severityLabel(severity: Severity): string {
  return severity === 'error' ? red('error') : yellow('warning');
}

/** Print issues grouped by file, ordered by line. */
export function printIssues(issues: Issue[]): void {
  const byFile = new Map<string, Issue[]>();
  for (const issue of issues) {
    const list = byFile.get(issue.file);
    if (list) list.push(issue);
    else byFile.set(issue.file, [issue]);
  }

  for (const [file, fileIssues] of byFile) {
    console.log(`\n${bold(file)}`);
    const sorted = [...fileIssues].sort(
      (a, b) => (a.line ?? 0) - (b.line ?? 0) || a.code.localeCompare(b.code),
    );
    for (const issue of sorted) {
      const where = issue.line === undefined ? '' : dim(`:${issue.line}`);
      const path = issue.path ? dim(` ${issue.path}`) : '';
      console.log(
        `  ${severityLabel(issue.severity)} ${bold(issue.id)}${where}${path}  ${dim(`[${issue.code}]`)}`,
      );
      console.log(`    ${issue.message}`);
      if (issue.hint) console.log(dim(`    → ${issue.hint}`));
    }
  }
}

export function summarise(errors: number, warnings: number, cleanMessage: string): void {
  console.log('');
  if (errors === 0 && warnings === 0) {
    console.log(green(cleanMessage));
  } else if (errors === 0) {
    console.log(`${green('no errors')} ${dim(`(${plural(warnings, 'warning')})`)}`);
  } else {
    console.log(
      red(plural(errors, 'error')) + (warnings > 0 ? dim(`, ${plural(warnings, 'warning')}`) : ''),
    );
  }
}

export function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/** A right-aligned percentage, for tables. */
export function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Render a simple table with aligned columns. */
export function table(headers: string[], rows: string[][], align: ('l' | 'r')[] = []): string[] {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)),
  );
  const pad = (text: string, i: number): string =>
    (align[i] ?? 'l') === 'r' ? text.padStart(widths[i] ?? 0) : text.padEnd(widths[i] ?? 0);

  const out = [headers.map((h, i) => dim(pad(h, i))).join('  ')];
  out.push(dim(widths.map((w) => '─'.repeat(w)).join('  ')));
  for (const row of rows) out.push(row.map((cell, i) => pad(cell ?? '', i)).join('  '));
  return out;
}
