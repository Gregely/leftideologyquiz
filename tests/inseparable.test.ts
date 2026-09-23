/**
 * `inseparable_from`: pairs no position question can separate. The result has
 * to name both and say why, rather than looking undecided for no reason.
 */

import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { parseContent } from '../src/content/load.js';
import { validateContent } from '../src/content/validate.js';
import { computePosterior, resolve, type Answer } from '../src/engine/index.js';
import { rosterDocs, rosterModel, type RosterDocs } from './fixtures/roster.js';

const NOTE = 'Same position, held by two different peoples.';

function declarePair(d: RosterDocs, a: string, b: string, both = true): void {
  const find = (id: string) =>
    d.ideologies.ideologies.find((i) => i.id === id) as unknown as Record<string, unknown>;
  find(a)['inseparable_from'] = [{ ideology: b, note: NOTE }];
  if (both) find(b)['inseparable_from'] = [{ ideology: a, note: NOTE }];
}

function issuesFor(mutate: (d: RosterDocs) => void) {
  const docs = rosterDocs();
  mutate(docs);
  const loaded = parseContent({
    groups: stringify(docs.groups),
    families: stringify(docs.families),
    ideologies: stringify(docs.ideologies),
    questions: stringify(docs.questions),
  });
  return [...loaded.issues, ...validateContent(loaded)];
}

const answer = (questionId: string, ...optionIds: string[]): Answer => ({ questionId, optionIds });

describe('validation', () => {
  it('accepts a pair declared on both sides', () => {
    const issues = issuesFor((d) => declarePair(d, 'red_left', 'red_right'));
    expect(issues.filter((i) => i.code.startsWith('inseparable/'))).toEqual([]);
  });

  it('rejects a one-sided declaration', () => {
    const issues = issuesFor((d) => declarePair(d, 'red_left', 'red_right', false));
    expect(issues.map((i) => i.code)).toContain('inseparable/asymmetric');
  });

  it('rejects an unknown partner and a self-reference', () => {
    const unknown = issuesFor((d) => declarePair(d, 'red_left', 'no_such_ideology', false));
    expect(unknown.map((i) => i.code)).toContain('inseparable/unknown-ideology');
    const self = issuesFor((d) => declarePair(d, 'red_left', 'red_left', false));
    expect(self.map((i) => i.code)).toContain('inseparable/self');
  });

  it('warns when the pair crosses families', () => {
    const issues = issuesFor((d) => declarePair(d, 'red_left', 'blue_two'));
    const cross = issues.find((i) => i.code === 'inseparable/cross-family');
    expect(cross?.severity).toBe('warning');
  });
});

describe('the resolver', () => {
  const tied = [answer('q_family', 'pick_red'), answer('q_red_shared', 'shared_yes')];

  it('names both members of a tied inseparable pair and carries the note', () => {
    const model = rosterModel({}, (d) => declarePair(d, 'red_left', 'red_right'));
    const result = resolve(computePosterior(model, tied));
    expect(result.kind).toBe('undecided');
    expect(result.candidates.map((c) => c.id)).toEqual(
      expect.arrayContaining(['red_left', 'red_right']),
    );
    expect(result.inseparable).toEqual([{ ideologies: ['red_left', 'red_right'], note: NOTE }]);
  });

  it('still names the partner when the result resolves to one member', () => {
    const model = rosterModel({}, (d) => declarePair(d, 'red_left', 'red_right'));
    const result = resolve(
      computePosterior(model, [answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')]),
    );
    expect(result.kind).toBe('resolved');
    expect(result.node.id).toBe('red_left');
    expect(result.inseparable[0]?.ideologies).toEqual(['red_left', 'red_right']);
  });

  it('reports nothing for ideologies with no declared partner', () => {
    const result = resolve(computePosterior(rosterModel(), tied));
    expect(result.inseparable).toEqual([]);
  });
});
