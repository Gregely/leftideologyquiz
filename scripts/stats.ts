/**
 * `npm run stats` — the shape of the question bank, against the budgets in
 * SPEC.md §9.
 *
 * Reports; never fails. Quotas that are exceeded are flagged, not enforced —
 * `lint:content` is where a hard rule belongs.
 *
 * Flags:
 *   --json     machine-readable output
 */

import { MODIFIER_TAGS } from '../src/content/schema.js';
import { bankStats } from '../src/content/stats.js';
import {
  asJson,
  bold,
  dim,
  green,
  loadContent,
  pct,
  red,
  table,
  yellow,
} from './report.js';

const loaded = loadContent();
const stats = bankStats(loaded);

if (!stats) {
  console.error(red('content failed to load; run `npm run validate` first'));
  process.exit(1);
}

if (asJson) {
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
}

const content = loaded.content!;

// --- depth ---------------------------------------------------------------------

console.log(bold('\nquestions by depth'));
console.log(
  dim('ranges from SPEC.md §9 (set from docs/question-inventory.md): 42-52 at depth 1, 50-60 at depth 2, 25-31 at depth 3'),
);
console.log('');
for (const line of table(
  ['depth', 'count', 'share', 'target', ''],
  [
    ['1  family split', String(stats.byDepth[1]), sharePct(stats.byDepth[1]), '42-52', mark(stats.byDepth[1], 42, 52)],
    ['2  within family', String(stats.byDepth[2]), sharePct(stats.byDepth[2]), '50-60', mark(stats.byDepth[2], 50, 60)],
    ['3  near neighbours', String(stats.byDepth[3]), sharePct(stats.byDepth[3]), '25-31', mark(stats.byDepth[3], 25, 31)],
    [dim('total'), String(stats.questionCount), '', '117-143', mark(stats.questionCount, 117, 143)],
  ],
  ['l', 'r', 'r', 'r', 'l'],
)) {
  console.log(line);
}

// --- family --------------------------------------------------------------------

console.log(bold('\n\nquestions by family'));
console.log(
  dim(
    'derived from which families hold a stance on each question — the same scope the engine uses. ' +
      'A question counts once per family that has reached it.',
  ),
);
console.log('');
for (const line of table(
  ['family', 'questions', ''],
  stats.byFamily.map((f) => [
    f.familyId,
    String(f.count),
    f.count === 0 ? yellow('no stances yet') : '',
  ]),
  ['l', 'r', 'l'],
)) {
  console.log(line);
}

if (stats.unscopedQuestions.length > 0) {
  console.log(
    `\n  ${yellow(`${stats.unscopedQuestions.length} of ${stats.questionCount} questions have no stances at all`)}`,
  );
  console.log(dim(`  ${stats.unscopedQuestions.join(', ')}`));
}

// --- flow ----------------------------------------------------------------------

console.log(bold('\n\nflow'));
console.log('');
for (const line of table(
  ['mechanism', 'count', ''],
  [
    ['follow-ups: force', String(stats.followUps.force), dim('asked next, ahead of selection')],
    ['follow-ups: boost', String(stats.followUps.boost), dim('multiplies the selection score')],
    ['follow-ups: unlock', String(stats.followUps.unlock), dim('grants eligibility past `requires`')],
    [dim('follow-up targets'), String(stats.followUpTargets), dim('questions named across all follow-ups')],
    ['gated (`requires`)', String(stats.gatedQuestions), sharePct(stats.gatedQuestions)],
    ['exclusive pairs', String(stats.exclusivePairs), dim('declared redundant with each other')],
  ],
  ['l', 'r', 'l'],
)) {
  console.log(line);
}

const chain = stats.longestForcedChain;
console.log(
  `\n  longest forced follow-up chain: ${bold(String(chain.length))}` +
    (chain.length > 0 ? dim(`  ${chain.path.join(' → ')}`) : dim('  (no forced follow-ups)')),
);
if (chain.length > 3) {
  console.log(
    yellow(
      `  SPEC.md §7.2 caps the forced queue at 3 pending; a chain of ${chain.length} means the authored flow drives the session, not the selector`,
    ),
  );
}

// --- quotas --------------------------------------------------------------------

console.log(bold('\n\nquotas'));
console.log('');
for (const line of table(
  ['quota', 'count', 'share', 'cap', ''],
  [
    [
      'history allowance (principle 3)',
      String(stats.historyClass.count),
      pct(stats.historyClass.share),
      pct(stats.historyClass.cap),
      stats.historyClass.withinCap ? green('ok') : red('over'),
    ],
    [
      'likert (SPEC.md §3.2)',
      String(stats.likert.count),
      pct(stats.likert.share),
      '15.0%',
      stats.likert.share <= 0.15 ? green('ok') : red('over'),
    ],
    [
      'self-identification (principle 10)',
      String(stats.selfId.count),
      '',
      '1 per family',
      stats.selfId.perFamily.every((f) => f.count <= 1) ? green('ok') : red('over'),
    ],
  ],
  ['l', 'r', 'r', 'r', 'l'],
)) {
  console.log(line);
}

if (stats.questionCount < 40) {
  console.log(
    dim(
      `\n  note: shares are against a ${stats.questionCount}-question bank. The history cap is a ` +
        'property of the finished ~130-question bank; below about 40 questions it is not meaningful.',
    ),
  );
}

for (const family of stats.selfId.perFamily.filter((f) => f.count > 1)) {
  console.log(red(`  ${family.familyId} has ${family.count} self-identification questions (max 1)`));
}

// --- modifier tags ---------------------------------------------------------------

console.log(bold('\n\nmodifier tags'));
console.log(
  dim('cross-cutting dimensions; these never move the posterior (SPEC.md §1.2)'),
);
console.log('');
console.log(
  `  ${stats.withModifierTags.count} of ${stats.questionCount} questions carry modifier tags` +
    dim(` (${sharePct(stats.withModifierTags.count)})`),
);
if (stats.withModifierTags.byTag.length > 0) {
  console.log('');
  for (const line of table(
    ['tag', 'questions'],
    stats.withModifierTags.byTag.map((t) => [t.tag, String(t.questions)]),
    ['l', 'r'],
  )) {
    console.log(line);
  }
}

const declared = new Set<string>(MODIFIER_TAGS);
const used = new Set(stats.withModifierTags.byTag.map((t) => t.tag));
const unused = [...declared].filter((t) => !used.has(t));
if (unused.length > 0) {
  console.log(
    `\n  ${yellow(`declared but unused: ${unused.join(', ')}`)}` +
      dim('  — author a question that awards it, or drop it from MODIFIER_TAGS'),
  );
}

console.log(
  `\n${dim(`${content.families.length} families · ${content.ideologies.length} ideologies · ${stats.questionCount} questions`)}\n`,
);

// -----------------------------------------------------------------------------

function sharePct(n: number): string {
  return stats!.questionCount === 0 ? '—' : pct(n / stats!.questionCount);
}

function mark(value: number, low: number, high: number): string {
  if (value === 0) return dim('not started');
  if (value < low) return yellow(`${low - value} short`);
  if (value > high) return red(`${value - high} over`);
  return green('ok');
}
