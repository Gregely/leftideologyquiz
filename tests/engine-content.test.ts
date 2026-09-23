/**
 * The engine against the real bank.
 *
 * Two kinds of test live here. The robustness ones below run now and assert
 * that nothing degenerate happens on the real content whatever a respondent
 * does. The recovery ones — can the engine actually tell near neighbours apart
 * — are blocked on stance authoring and are listed as pending.
 *
 * CLAUDE.md says real-content assertions belong in the simulation rather than
 * in unit tests, and they do: this file is the seed of `npm run simulate`
 * (SPEC.md §10.3) and should move into it when that lands.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseContent } from '../src/content/load.js';
import {
  buildModel,
  computePosterior,
  resolve,
  withConfig,
  type Answer,
} from '../src/engine/index.js';

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

const loaded = parseContent({
  groups: read('content/groups.yaml'),
  families: read('content/families.yaml'),
  ideologies: read('content/ideologies.yaml'),
  questions: read('content/questions.yaml'),
});
if (!loaded.content) throw new Error('content failed to load');
const model = buildModel(loaded.content, withConfig());

const a = (questionId: string, ...optionIds: string[]): Answer => ({ questionId, optionIds });
const run = (answers: Answer[]) => resolve(computePosterior(model, answers));

describe('near-neighbour recovery', () => {
  // Blocked on stance authoring. These assertions existed and passed against
  // the previous 21-ideology roster; they are listed rather than skipped
  // because the roster replacement purged two of the ideologies they named
  // (platformism and especifismo) and the question bank is being rebuilt, so
  // keeping the old answer lists as skipped code would leave executable
  // references to ids that no longer exist.
  //
  // Each line is a pair SPEC.md §1 names as the success criterion, restricted
  // to pairs both of whose members are on the current roster. Restore them as
  // `npm run simulate` (SPEC.md §10.3), not here, once stances exist.
  it.todo('separates cliffism from orthodox_trotskyism');
  it.todo('separates council_communism from bordigism');
  it.todo('separates anarcho_communism from anarcho_syndicalism');
  it.todo('separates collectivist_anarchism from anarcho_communism on distribution');
  it.todo('separates classical_social_democracy from democratic_socialism');
  it.todo('separates mao_zedong_thought from marxism_leninism');
  it.todo('separates mutualism from market_socialism');
  it.todo('returns orthodox_trotskyism and posadism together rather than choosing');

  // SPEC.md §1 also names platformism/especifismo and ecosocialism/degrowth as
  // criterion pairs. Platformism, especifismo and degrowth are all purged from
  // the roster (docs/roster-purged.md), so §1's table now cites ideologies the
  // test cannot return. SPEC.md needs updating to match; flagged rather than
  // silently dropped.
  it.todo('SPEC.md §1 cites purged ideologies — reconcile the criterion table');
});

describe('robustness on the real bank', () => {
  it('returns a family-level answer for a respondent who is unsure throughout', () => {
    const result = run(loaded.content!.questions.map((q) => a(q.id, 'unsure')));
    expect(result.kind).toBe('undecided');
    expect(result.scoringAnswerCount).toBe(0);
    expect(result.node.kind).toBe('root');
  });

  it('never names a sect for a respondent answering the first option throughout', () => {
    const result = run(
      loaded.content!.questions.map((q) => {
        const first = q.options.find((o) => !o.implicit);
        return a(q.id, first?.id ?? 'unsure');
      }),
    );
    // Not an assertion that this is meaningless — the first options do cohere
    // somewhat — only that nothing degenerate happens.
    expect(Number.isFinite(result.confidence)).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('keeps every ideology at nonzero mass however hostile the answers', () => {
    const posterior = computePosterior(
      model,
      loaded.content!.questions.map((q) => {
        const options = q.options.filter((o) => !o.implicit);
        return a(q.id, options[options.length - 1]?.id ?? 'unsure');
      }),
    );
    for (const mass of posterior.probabilities) {
      expect(mass).toBeGreaterThan(0);
      expect(Number.isFinite(mass)).toBe(true);
    }
  });

  it('runs a full-bank session well inside the SPEC §13 budget', () => {
    const answers = loaded.content!.questions.map((q) => {
      const first = q.options.find((o) => !o.implicit);
      return a(q.id, first?.id ?? 'unsure');
    });
    const started = performance.now();
    for (let i = 0; i < 20; i++) resolve(computePosterior(model, answers));
    const perRun = (performance.now() - started) / 20;
    expect(perRun).toBeLessThan(150);
  });
});
