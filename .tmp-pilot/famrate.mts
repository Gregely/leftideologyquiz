import { readFileSync } from 'node:fs';
import { parseContent } from '../src/content/load.js';
import { buildModel, withConfig, runPerfectRespondent, resolve, familyKey } from '../src/engine/index.js';

const read = (p: string) => readFileSync(p, 'utf8');
const loaded = parseContent({
  groups: read('content/groups.yaml'),
  families: read('content/families.yaml'),
  ideologies: read('content/ideologies.yaml'),
  questions: read('content/questions.yaml'),
});
if (!loaded.content) throw new Error('content failed to load');
const model = buildModel(loaded.content, withConfig());

let familyRight = 0;
let wrong = 0;
const total = loaded.content.ideologies.length;
const wrongList: string[] = [];

for (const ideology of loaded.content.ideologies) {
  const run = runPerfectRespondent(model, ideology.id, 'quick');
  // Same answers, same flow — only the report cap differs.
  const atFamily = resolve(run.posterior, 'family');
  const key = atFamily.node.kind === 'family' ? familyKey(atFamily.node.id) : null;
  if (key === familyKey(ideology.family)) familyRight += 1;
  else {
    wrong += 1;
    wrongList.push(`${ideology.id} [${ideology.family}] -> ${atFamily.node.id} (${atFamily.node.kind}, ${atFamily.kind})`);
  }
}
console.log(`family-correct (resolved at family level, same Quick answers): ${familyRight}/${total} = ${((100 * familyRight) / total).toFixed(1)}%`);
console.log(`not family-correct: ${wrong}`);
for (const line of wrongList) console.log('  ' + line);
