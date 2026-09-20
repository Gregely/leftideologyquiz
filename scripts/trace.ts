/**
 * `npm run trace` — step through one simulated session and show why each
 * question was chosen.
 *
 * A debugging view of `nextQuestion`: every step prints the question, its
 * depth, the selection reason (`forced_follow_up`, `information_gain` or
 * `modifier_coverage`) and the answer the simulated respondent gave. Reports;
 * never fails.
 *
 * Flags:
 *   --mode quick|standard|deep   default standard
 *   --as <ideology_id>           answer as that ideology would: its accepted
 *                                option, and "unsure" where it has no stance —
 *                                the same respondent `npm run check` runs
 *   --json                       machine-readable output
 */

import {
  buildModel,
  computePosterior,
  modifierTags,
  nextQuestion,
  perfectAnswer,
  resolve,
  withConfig,
  type Answer,
  type Mode,
  type SelectionReason,
} from '../src/engine/index.js';
import { asJson, bold, dim, flagValue, loadContent, red, table, yellow } from './report.js';

const loaded = loadContent();
const content = loaded.content;
if (!content) {
  console.error(red('content failed to load; run `npm run validate` first'));
  process.exit(1);
}

const mode = (flagValue('mode') ?? 'standard') as Mode;
if (!['quick', 'standard', 'deep'].includes(mode)) {
  console.error(red(`unknown mode "${mode}"`));
  process.exit(1);
}

const as = flagValue('as');
if (as && !content.ideologyById.has(as)) {
  console.error(red(`no ideology "${as}"`));
  process.exit(1);
}

const model = buildModel(content, withConfig());

const answers: Answer[] = [];
const steps: { id: string; depth: number; reason: SelectionReason; answer: string }[] = [];
let stop: { stopReason: string; modifierQuotaMet: boolean } | null = null;

for (let guard = 0; guard < 500 && !stop; guard++) {
  const step = nextQuestion(model, answers, mode);
  if (step.done) {
    stop = { stopReason: step.stopReason, modifierQuotaMet: step.modifierQuotaMet };
    break;
  }
  // With `--as`, answer exactly as `npm run check` does: the ideology's own
  // accepted option, and "unsure" where it holds no position. Answering the
  // first option instead would put positions into its mouth and make the two
  // tools disagree about the same session.
  const choice = as
    ? perfectAnswer(model, as, step.question)
    : (step.question.options.find((o) => !o.implicit)?.id ?? 'unsure');
  answers.push({ questionId: step.question.id, optionIds: [choice] });
  steps.push({ id: step.question.id, depth: step.question.depth, reason: step.reason, answer: choice });
}

const posterior = computePosterior(model, answers);
const result = resolve(posterior);
const tags = modifierTags(posterior);

if (asJson) {
  console.log(JSON.stringify({ mode, as: as ?? null, steps, stop, result, tags }, null, 2));
  process.exit(0);
}

const describe = (r: SelectionReason): string => {
  if (r.type === 'forced_follow_up') return `forced_follow_up  ${dim(`from ${r.from}`)}`;
  if (r.type === 'modifier_coverage') return `${yellow('modifier_coverage')}  ${dim(`tag ${r.tag}`)}`;
  return `information_gain  ${dim(`${r.eig.toFixed(3)} bits${r.boost !== 1 ? ` ×${r.boost}` : ''}`)}`;
};

console.log(bold(`\ntrace — ${mode} mode${as ? `, answering as ${as}` : ', answering the first option'}\n`));
for (const line of table(
  ['#', 'question', 'd', 'reason', 'answer'],
  steps.map((s, i) => [String(i + 1), s.id, String(s.depth), describe(s.reason), dim(s.answer)]),
  ['r', 'l', 'r', 'l', 'l'],
)) {
  console.log(line);
}

console.log(
  `\n  stopped: ${bold(stop?.stopReason ?? 'guard')}` +
    dim(`  (modifier quota ${stop?.modifierQuotaMet ? 'met' : 'not met'})`),
);
console.log(
  `  result: ${result.kind} at ${result.level} ${bold(result.node.id)}` +
    (result.candidates.length ? dim(`  candidates ${result.candidates.map((c) => c.id).join(', ')}`) : ''),
);
console.log(
  `  modifier tags: ${tags.length ? tags.map((t) => `${t.label} (${t.earned}/${t.available})`).join(', ') : dim('none')}\n`,
);
