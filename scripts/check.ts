/**
 * `npm run check` — perfect-respondent recovery, one mode at a time.
 *
 * For each ideology, a respondent answers every question the real flow asks
 * with that ideology's own accepted option ("unsure" where it has no stance),
 * and the result is judged at the level the mode targets:
 *
 *   quick     the family returned is the ideology's
 *   standard  the tendency returned is the ideology's (its family if it has none)
 *   deep      the ideology is returned as the sect; or its tendency or family
 *             is returned with it among the candidates; or its inseparable
 *             partner is returned with it
 *
 * Exits non-zero if any run fails. Ideologies that answered "unsure" to every
 * question they were asked are reported as unauthored, not as failures.
 *
 * This shows the stances are separable, not that they are right. A failure is
 * a question to investigate — a wrong stance, a missing question, or an engine
 * bug — never a weight to nudge (CLAUDE.md rule 4).
 *
 * Flags:
 *   --mode quick|standard|deep   default deep
 *   --family <id>                only this family's members
 *   --ideology <id>              only this ideology
 *   --json                       machine-readable output
 */

import {
  buildModel,
  checkIdeologies,
  withConfig,
  type CheckOutcome,
  type Mode,
} from '../src/engine/index.js';
import { asJson, bold, dim, flagValue, green, loadContent, red, table, yellow } from './report.js';

const DISCLAIMER = 'This shows the encoded stances are separable, not that they are correct.';

const loaded = loadContent();
const content = loaded.content;
if (!content) {
  console.error(red('content failed to load; run `npm run validate` first'));
  process.exit(1);
}

const mode = (flagValue('mode') ?? 'deep') as Mode;
if (!['quick', 'standard', 'deep'].includes(mode)) {
  console.error(red(`unknown mode "${mode}"; use quick, standard or deep`));
  process.exit(1);
}

const familyFilter = flagValue('family');
const ideologyFilter = flagValue('ideology');
if (familyFilter && !content.familyById.has(familyFilter)) {
  console.error(red(`no family "${familyFilter}"`));
  process.exit(1);
}
if (ideologyFilter && !content.ideologyById.has(ideologyFilter)) {
  console.error(red(`no ideology "${ideologyFilter}"`));
  process.exit(1);
}

const ids = content.ideologies
  .filter((i) => !familyFilter || i.family === familyFilter)
  .filter((i) => !ideologyFilter || i.id === ideologyFilter)
  .map((i) => i.id);

const model = buildModel(content, withConfig());
const outcomes = checkIdeologies(model, ids, mode);

const failures = outcomes.filter((o) => o.verdict === 'fail');
const unauthored = outcomes.filter((o) => o.verdict === 'unauthored');
const passes = outcomes.filter((o) => o.verdict === 'pass');
const viaParent = passes.filter((o) => o.route === 'parent');
const viaPartner = passes.filter((o) => o.route === 'inseparable');

/**
 * Quick is judged at the broad group, and an ideology with no tier-1 stance
 * answers "not sure" to everything Quick asks — its result measures the prior,
 * not the content. Reporting one rate over everything would hide that; these
 * two rates, side by side, say what the questions did and what the stances did
 * not (docs/redesign.md §3.3).
 */
const scored = outcomes.filter((o) => o.hasTier1Stance);
const silent = outcomes.filter((o) => !o.hasTier1Stance);
const scoredPasses = scored.filter((o) => o.verdict === 'pass');
const groupRecovery = scored.length ? scoredPasses.length / scored.length : 0;

const silentByGroup = new Map<string, string[]>();
for (const o of silent) {
  silentByGroup.set(o.group || '(none)', [...(silentByGroup.get(o.group || '(none)') ?? []), o.ideologyId]);
}

const counts = outcomes.map((o) => o.questionCount).sort((a, b) => a - b);
const mean = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
const p95 = counts.length ? (counts[Math.min(counts.length - 1, Math.ceil(0.95 * counts.length) - 1)] as number) : 0;

if (asJson) {
  const strip = ({ run, ...rest }: CheckOutcome) => ({
    ...rest,
    answers: run.steps.map((s) => ({ questionId: s.questionId, optionId: s.optionId, reason: s.reason.type })),
  });
  console.log(
    JSON.stringify(
      {
        mode,
        disclaimer: DISCLAIMER,
        summary: {
          ideologies: outcomes.length,
          pass: passes.length,
          fail: failures.length,
          unauthored: unauthored.length,
          returnedAsParent: viaParent.length,
          returnedWithPartner: viaPartner.length,
          questionCount: { mean, p95, min: counts[0] ?? 0, max: counts[counts.length - 1] ?? 0 },
          withTier1Stance: scored.length,
          withoutTier1Stance: silent.length,
          groupRecovery,
          noTier1StanceByGroup: Object.fromEntries(silentByGroup),
        },
        outcomes: outcomes.map(strip),
      },
      null,
      2,
    ),
  );
  process.exit(failures.length > 0 ? 1 : 0);
}

const fmt = (x: number) => x.toFixed(3);
const returnedText = (o: CheckOutcome): string => {
  const r = o.returned;
  if (r.kind === 'root') return `no group (undecided at root: ${r.candidates.join(', ')})`;
  const kind = r.resolved ? 'resolved' : 'undecided';
  return `${r.id} ${dim(`(${r.kind}, ${kind}${r.candidates.length ? `; candidates ${r.candidates.join(', ')}` : ''})`)}`;
};

console.log(bold(`\ncheck — perfect respondent, ${mode} mode, ${outcomes.length} ${outcomes.length === 1 ? 'ideology' : 'ideologies'}`));
console.log(dim(DISCLAIMER));

if (failures.length > 0) {
  console.log(bold(`\n${red('failures')} (${failures.length})`));
  for (const o of failures) {
    console.log(
      `\n  ${bold(o.ideologyId)} ${dim(`[${o.group} / ${o.family}] expected ${o.expected}`)}` +
        (o.hasTier1Stance ? '' : yellow('  (no tier-1 stance)')),
    );
    console.log(`    returned   ${returnedText(o)}`);
    console.log(
      `    runner-up  ${o.runnerUp ? `${o.runnerUp.id} ${dim(fmt(o.runnerUp.mass))}` : dim('none')}` +
        dim(`   true mass ${fmt(o.trueMass)}, ${o.questionCount} asked, stop ${o.stopReason ?? 'guard'}`),
    );
    if (o.giveaways.length === 0) {
      console.log(dim('    no single answer favoured the returned node over the truth'));
    }
    for (const g of o.giveaways) {
      console.log(`    gave away  ${g.questionId} = ${g.optionId} ${dim(`(+${g.margin.toFixed(2)} log-odds)`)}`);
    }
  }
}

if (unauthored.length > 0) {
  console.log(bold(`\n${yellow('unauthored')} (${unauthored.length}) ${dim('— no stance on any question asked')}`));
  console.log(`  ${unauthored.map((o) => o.ideologyId).join(', ')}`);
}

if (silent.length > 0) {
  console.log(
    bold(`\n${yellow('no tier-1 stance')} (${silent.length}) `) +
      dim('— answers "not sure" to everything Quick asks, so its result is the prior'),
  );
  for (const line of table(
    ['group', 'n', 'ideologies'],
    [...silentByGroup.entries()]
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .map(([group, list]) => [group, String(list.length), list.join(', ')]),
    ['l', 'r', 'l'],
  )) {
    console.log(`  ${line}`);
  }
}

if (viaParent.length > 0 || viaPartner.length > 0) {
  console.log(bold(`\nreturned only as a parent node ${dim('(passes; information)')}`));
  const byNode = new Map<string, string[]>();
  for (const o of viaParent) {
    const key = o.returned.resolved ? o.returned.id : `${o.returned.id} (undecided)`;
    byNode.set(key, [...(byNode.get(key) ?? []), o.ideologyId]);
  }
  for (const line of table(
    ['returned', 'n', 'ideologies'],
    [...byNode.entries()].map(([node, list]) => [node, String(list.length), list.join(', ')]),
    ['l', 'r', 'l'],
  )) {
    console.log(`  ${line}`);
  }
  for (const o of viaPartner) {
    console.log(`  ${o.ideologyId} ${dim(`returned with its inseparable partner: ${returnedText(o)}`)}`);
  }
}

console.log(
  `\n  questions asked: mean ${mean.toFixed(1)}, 95th percentile ${p95}, range ${counts[0] ?? 0}-${counts[counts.length - 1] ?? 0}`,
);
if (mode === 'quick') {
  console.log(
    `  group recovery: ${scoredPasses.length}/${scored.length} ` +
      `(${(100 * groupRecovery).toFixed(1)}%) ` +
      dim(`over the ideologies with a tier-1 stance; ${silent.length} have none`),
  );
}
const line = `  ${passes.length} pass, ${failures.length} fail, ${unauthored.length} unauthored`;
console.log(failures.length > 0 ? red(line) : green(line));
console.log(dim(`  ${DISCLAIMER}\n`));

process.exit(failures.length > 0 ? 1 : 0);
