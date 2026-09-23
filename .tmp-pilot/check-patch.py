import io

p = 'scripts/check.ts'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


sub("""const counts = outcomes.map((o) => o.questionCount).sort((a, b) => a - b);""",
    """/**
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

const counts = outcomes.map((o) => o.questionCount).sort((a, b) => a - b);""")

sub("""          returnedAsParent: viaParent.length,
          returnedWithPartner: viaPartner.length,
          questionCount: { mean, p95, min: counts[0] ?? 0, max: counts[counts.length - 1] ?? 0 },
        },""",
    """          returnedAsParent: viaParent.length,
          returnedWithPartner: viaPartner.length,
          questionCount: { mean, p95, min: counts[0] ?? 0, max: counts[counts.length - 1] ?? 0 },
          withTier1Stance: scored.length,
          withoutTier1Stance: silent.length,
          groupRecovery,
          noTier1StanceByGroup: Object.fromEntries(silentByGroup),
        },""")

sub("""if (unauthored.length > 0) {
  console.log(bold(`\\n${yellow('unauthored')} (${unauthored.length}) ${dim('— no stance on any question asked')}`));
  console.log(`  ${unauthored.map((o) => o.ideologyId).join(', ')}`);
}""",
    """if (unauthored.length > 0) {
  console.log(bold(`\\n${yellow('unauthored')} (${unauthored.length}) ${dim('— no stance on any question asked')}`));
  console.log(`  ${unauthored.map((o) => o.ideologyId).join(', ')}`);
}

if (silent.length > 0) {
  console.log(
    bold(`\\n${yellow('no tier-1 stance')} (${silent.length}) `) +
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
}""")

sub("""const line = `  ${passes.length} pass, ${failures.length} fail, ${unauthored.length} unauthored`;
console.log(failures.length > 0 ? red(line) : green(line));""",
    """if (mode === 'quick') {
  console.log(
    `  group recovery: ${scoredPasses.length}/${scored.length} ` +
      `(${(100 * groupRecovery).toFixed(1)}%) ` +
      dim(`over the ideologies with a tier-1 stance; ${silent.length} have none`),
  );
}
const line = `  ${passes.length} pass, ${failures.length} fail, ${unauthored.length} unauthored`;
console.log(failures.length > 0 ? red(line) : green(line));""")

sub("""  if (r.kind === 'root') return `no family (undecided at root: ${r.candidates.join(', ')})`;""",
    """  if (r.kind === 'root') return `no group (undecided at root: ${r.candidates.join(', ')})`;""")

sub("""    console.log(`\\n  ${bold(o.ideologyId)} ${dim(`[${o.family}] expected ${o.expected}`)}`);""",
    """    console.log(
      `\\n  ${bold(o.ideologyId)} ${dim(`[${o.group} / ${o.family}] expected ${o.expected}`)}` +
        (o.hasTier1Stance ? '' : yellow('  (no tier-1 stance)')),
    );""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
