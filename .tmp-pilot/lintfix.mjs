import { readFileSync } from 'node:fs';
import { stringify } from 'yaml';
import { parseContent } from '../src/content/load.ts';
import { lintContent, parseWordList } from '../src/content/lint.ts';
import { rosterDocs } from '../tests/fixtures/roster.ts';
const read = (p) => readFileSync(p, 'utf8');
const lists = {
  namedEntities: parseWordList(read('content/lint/named-entities.txt')),
  loadedWords: parseWordList(read('content/lint/loaded-words.txt')),
  jargon: parseWordList(read('content/lint/jargon.txt')),
  tier1Banned: parseWordList(read('content/lint/tier1-banned.txt')),
  filler: parseWordList(read('content/lint/filler.txt')),
  stopwords: parseWordList(read('content/lint/stopwords.txt')),
  syllables: parseWordList(read('content/lint/syllables.txt')),
};
const docs = rosterDocs();
const loaded = parseContent({
  groups: stringify(docs.groups), families: stringify(docs.families),
  ideologies: stringify(docs.ideologies), questions: stringify(docs.questions),
});
const { issues } = lintContent(loaded, lists);
for (const i of issues) console.log(`${i.severity} ${i.id} [${i.code}] ${i.path ?? ''} :: ${i.message}`);
