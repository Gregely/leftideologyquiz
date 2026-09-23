import { readFileSync } from 'node:fs';
import YAML from 'yaml';
const d = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const ids = YAML.parse(readFileSync('content/ideologies.yaml', 'utf8')).ideologies;
const fams = YAML.parse(readFileSync('content/families.yaml', 'utf8')).families;
const famOf = new Map(ids.map((i) => [i.id, i.family]));
const grpOf = new Map(fams.map((f) => [f.id, f.group]));
const byId = new Map(ids.map((i) => [i.id, i]));
function ancestors(id) {
  const out = [];
  let cur = byId.get(id);
  while (cur) { out.push(cur.id); if (!cur.tendency) { out.push(cur.family); out.push(grpOf.get(cur.family)); break; } cur = byId.get(cur.tendency); }
  out.push('__root__');
  return out;
}
const n = d.outcomes.length;
const pass = d.outcomes.filter((o) => o.verdict === 'pass');
const familyCorrect = d.outcomes.filter((o) => {
  const r = o.returned.id;
  // Right family means the returned node is at or inside the true family.
  return famOf.get(r) === o.family || r === o.family;
});
const wrong = d.outcomes.filter((o) => o.returned.resolved && !ancestors(o.ideologyId).includes(o.returned.id));
console.log(`ideologies              ${n}`);
console.log(`group recovery          ${pass.length}/${n} = ${(100*pass.length/n).toFixed(1)}%`);
console.log(`family-correct          ${familyCorrect.length}/${n} = ${(100*familyCorrect.length/n).toFixed(1)}%`);
console.log(`confidently wrong       ${wrong.length}/${n} = ${(100*wrong.length/n).toFixed(1)}%`);
console.log(`no tier-1 stance        ${d.summary.withoutTier1Stance}`);
console.log(`questions mean/p95      ${d.summary.questionCount.mean.toFixed(1)} / ${d.summary.questionCount.p95}`);
console.log('\nconfidently wrong:');
for (const o of wrong) console.log(`  ${o.ideologyId} [${o.group}] -> ${o.returned.id} (${o.returned.kind})`);
console.log('\nfailures by group:');
const byGroup = new Map();
for (const o of d.outcomes.filter((x) => x.verdict === 'fail')) byGroup.set(o.group, [...(byGroup.get(o.group) ?? []), o.ideologyId]);
for (const [g, list] of byGroup) console.log(`  ${g}: ${list.join(', ')}`);
