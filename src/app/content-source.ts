/**
 * The content the app ships with: the three YAML files, inlined at build time.
 *
 * Imported through the `$content-source` alias, which `vite --mode fixture`
 * points at tests/fixtures/content-source.ts instead.
 */

import type { RawContent } from '../content/load.js';
import families from '../../content/families.yaml?raw';
import ideologies from '../../content/ideologies.yaml?raw';
import questions from '../../content/questions.yaml?raw';

export const rawContent: RawContent = { families, ideologies, questions };
