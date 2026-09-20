/**
 * The fixture roster as app content, for `vite --mode fixture` and the
 * end-to-end test. Same six ideologies the engine tests use.
 */

import { stringify } from 'yaml';
import type { RawContent } from '../../src/content/load.js';
import { rosterDocs } from './roster.js';

const docs = rosterDocs();

export const rawContent: RawContent = {
  families: stringify(docs.families),
  ideologies: stringify(docs.ideologies),
  questions: stringify(docs.questions),
};
