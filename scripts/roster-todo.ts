/**
 * Regenerates docs/roster-todo.md: every ideology with its effective stance
 * count, grouped by family.
 *
 * Read from the content rather than transcribed, so the numbers cannot drift
 * out of step with the bank. Re-run it after authoring stances:
 *
 *   npx tsx scripts/roster-todo.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseContent, resolveStances } from '../src/content/load.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

const loaded = parseContent({
  families: read('content/families.yaml'),
  ideologies: read('content/ideologies.yaml'),
  questions: read('content/questions.yaml'),
});

const content = loaded.content;
if (!content) {
  console.error('content failed to load; run `npm run validate` first');
  process.exit(1);
}

// SPEC.md §9: every leaf needs >= 15 effective stances. Depth-3 stances are
// required only for leaves in a pair that needs them (the depth rule gives most
// leaves none), so the depth-3 count is reported but not part of the target.
const STANCE_TARGET = 15;
const DEPTH3_TARGET = 0;

interface Row {
  id: string;
  name: string;
  tier: string;
  flags: string;
  parent: string;
  total: number;
  depth3: number;
}

const rowsByFamily = new Map<string, Row[]>();
let totalStances = 0;
let meetingTarget = 0;

for (const ideology of content.ideologies) {
  const resolved = resolveStances(content, ideology.id);
  let total = 0;
  let depth3 = 0;
  for (const [questionId, entry] of resolved.byQuestion) {
    if (entry.stance.weight === 0) continue;
    total += 1;
    if (content.questionById.get(questionId)?.depth === 3) depth3 += 1;
  }

  totalStances += total;
  if (total >= STANCE_TARGET && depth3 >= DEPTH3_TARGET) meetingTarget += 1;

  const flags = [ideology.lineage ? 'lineage' : '', ideology.boundary ? 'boundary' : '']
    .filter(Boolean)
    .join(', ');

  const row: Row = {
    id: ideology.id,
    name: ideology.name,
    tier: ideology.roster_tier,
    flags: flags || '—',
    parent: ideology.tendency ?? '—',
    total,
    depth3,
  };

  const list = rowsByFamily.get(ideology.family);
  if (list) list.push(row);
  else rowsByFamily.set(ideology.family, [row]);
}

const lines: string[] = [];

lines.push('# Roster to-do');
lines.push('');
lines.push('Stance coverage per ideology. **Generated — do not edit by hand.**');
lines.push('Regenerate with `npx tsx scripts/roster-todo.ts` after authoring stances.');
lines.push('');
lines.push(
  `Target from SPEC.md §9: **${STANCE_TARGET}+ effective stances per ideology.** ` +
    'Effective means after inheritance, counting only stances with weight above zero. ' +
    'The depth-3 column is for reference: by the depth rule most leaves need no depth-3 stances.',
);
lines.push('');
lines.push(
  `**${content.ideologies.length} ideologies · ${content.families.length} families · ` +
    `${content.questions.length} questions · ${totalStances} stances authored · ` +
    `${meetingTarget}/${content.ideologies.length} meeting target**`,
);
lines.push('');

if (totalStances === 0) {
  lines.push(
    '> Skeleton state: no stances are authored yet, so every ideology below is at zero and',
    '> `npm run validate` warns once per ideology. That is correct for a skeleton. The warnings',
    '> clear as stances land.',
  );
  lines.push('');
}

lines.push('---');
lines.push('');

for (const family of content.families) {
  const rows = rowsByFamily.get(family.id) ?? [];
  if (rows.length === 0) continue;

  const done = rows.filter((r) => r.total >= STANCE_TARGET && r.depth3 >= DEPTH3_TARGET).length;
  lines.push(`## ${family.name} \`${family.id}\``);
  lines.push('');
  lines.push(`${rows.length} ideologies · ${done}/${rows.length} meeting target`);
  lines.push('');
  lines.push('| Ideology | id | tier | flags | parent | stances | of which d3 |');
  lines.push('| --- | --- | --- | --- | --- | ---: | ---: |');
  for (const row of rows) {
    const parent = row.parent === '—' ? '—' : `\`${row.parent}\``;
    lines.push(
      `| ${row.name} | \`${row.id}\` | ${row.tier} | ${row.flags} | ${parent} | ${row.total} | ${row.depth3} |`,
    );
  }
  lines.push('');
}

writeFileSync(join(ROOT, 'docs/roster-todo.md'), `${lines.join('\n')}\n`, 'utf8');
console.log(
  `wrote docs/roster-todo.md — ${content.ideologies.length} ideologies, ${totalStances} stances, ${meetingTarget} meeting target`,
);
