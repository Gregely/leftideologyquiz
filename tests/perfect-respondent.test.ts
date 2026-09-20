/**
 * The perfect respondent behind `npm run check`, on the hand-built roster.
 *
 * Three fixture variations beyond the base roster:
 *  - `grey_blank`, alone in a family with no defaults, holds no stance on
 *    anything: it must come back as unauthored, never as a failure.
 *  - `q_lean`, a question red_left and red_right both accept the same option
 *    of, but red_right at weight 3 and red_left at 1. A red_left respondent
 *    answering it pushes mass to red_right — honestly, since the answer is
 *    more typical of red_right — which is how a perfect respondent can be
 *    returned as its neighbour.
 *  - the same pair declared `inseparable_from`, which turns that result from a
 *    failure into a pass by the inseparable route.
 */

import { describe, expect, it } from 'vitest';
import {
  checkIdeologies,
  judge,
  perfectAnswer,
  runPerfectRespondent,
  type EngineModel,
} from '../src/engine/index.js';
import { rosterModel, type RosterDocs } from './fixtures/roster.js';

type Docs = RosterDocs;
const families = (d: Docs) => d.families.families as unknown as Record<string, unknown>[];
const ideologies = (d: Docs) => d.ideologies.ideologies as unknown as Record<string, unknown>[];
const questions = (d: Docs) => d.questions.questions as unknown as Record<string, unknown>[];
const stancesOf = (d: Docs, id: string) =>
  ideologies(d).find((i) => i.id === id)!.stances as Record<string, unknown>;

function addBlank(d: Docs): void {
  families(d).push({ id: 'grey', name: 'The grey family', summary: 'Holds no position on anything asked.', stances: {} });
  ideologies(d).push({
    id: 'grey_blank',
    name: 'Grey blank',
    family: 'grey',
    roster_tier: 'niche',
    summary: 'An ideology with no stances at all.',
    stances: {},
  });
}

function addLean(d: Docs): void {
  questions(d).push({
    id: 'q_lean',
    depth: 2,
    kind: 'single_choice',
    tags: ['lean'],
    text: 'A question both red sects answer alike, one far more characteristically.',
    options: [
      { id: 'lean_a', label: 'The answer both give.' },
      { id: 'lean_b', label: 'An answer neither gives.' },
      { id: 'lean_c', label: 'Another answer neither gives.' },
    ],
  });
  // red_left's defining split and its ecology stance are removed, so the lean
  // is all that separates it.
  delete stancesOf(d, 'red_left').q_red_split;
  delete stancesOf(d, 'red_left').q_eco;
  delete stancesOf(d, 'red_right').q_red_split;
  stancesOf(d, 'red_left').q_lean = { accept: ['lean_a'], weight: 1 };
  stancesOf(d, 'red_right').q_lean = {
    accept: ['lean_a'],
    reject: ['lean_b', 'lean_c'],
    weight: 3,
    note: 'Defining for the fixture: the answer red_left only leans towards.',
  };
}

function declareInseparable(d: Docs): void {
  const note = 'Same positions; differ only in where they came from.';
  ideologies(d).find((i) => i.id === 'red_left')!.inseparable_from = [{ ideology: 'red_right', note }];
  ideologies(d).find((i) => i.id === 'red_right')!.inseparable_from = [{ ideology: 'red_left', note }];
}

const outcome = (model: EngineModel, id: string, mode: 'quick' | 'standard' | 'deep') =>
  judge(runPerfectRespondent(model, id, mode));

describe('perfectAnswer', () => {
  const model = rosterModel();
  const q = (id: string) => model.content.questionById.get(id)!;

  it('answers the first accepted option of the effective stance', () => {
    expect(perfectAnswer(model, 'red_left', q('q_red_split'))).toBe('red_a');
    expect(perfectAnswer(model, 'red_right', q('q_red_split'))).toBe('red_b');
  });

  it('answers an inherited stance: a family default is the ideology’s own answer', () => {
    expect(perfectAnswer(model, 'red_left', q('q_family'))).toBe('pick_red');
    expect(perfectAnswer(model, 'blue_lineage', q('q_family'))).toBe('pick_blue');
  });

  it('answers the accepted point on a likert', () => {
    expect(perfectAnswer(model, 'red_left', q('q_eco'))).toBe('strongly_agree');
  });

  it('is unsure where the ideology holds no position, including one it cleared', () => {
    expect(perfectAnswer(model, 'red_right', q('q_eco'))).toBe('unsure');
    expect(perfectAnswer(model, 'red_left', q('q_tech'))).toBe('unsure');
    expect(perfectAnswer(model, 'blue_lineage', q('q_blue_split'))).toBe('unsure');
  });
});

describe('runPerfectRespondent', () => {
  it('runs the real flow to a real stop, answering only what it was asked', () => {
    const run = runPerfectRespondent(rosterModel(), 'red_left', 'deep');
    expect(run.stopReason).not.toBeNull();
    expect(run.steps.length).toBe(run.answers.length);
    expect(new Set(run.steps.map((s) => s.questionId)).size).toBe(run.steps.length);
  });

  it('is deterministic', () => {
    const model = rosterModel();
    const a = runPerfectRespondent(model, 'blue_two', 'standard');
    const b = runPerfectRespondent(model, 'blue_two', 'standard');
    expect(b.answers).toEqual(a.answers);
    expect(b.result.node).toEqual(a.result.node);
  });
});

describe('judge', () => {
  it('passes every roster ideology in every mode on the base fixture', () => {
    const model = rosterModel();
    for (const mode of ['quick', 'standard', 'deep'] as const) {
      const verdicts = checkIdeologies(model, model.ideologyIds, mode).map((o) => [o.ideologyId, o.verdict]);
      expect(verdicts.filter(([, v]) => v !== 'pass'), mode).toEqual([]);
    }
  });

  it('distinguishes an exact sect from a pass through a parent node', () => {
    const model = rosterModel();
    expect(outcome(model, 'red_left', 'deep').route).toBe('exact');
    // blue_two's split is weight 2 against blue_one's interior node, and the
    // fixture's blue family never gets far enough to name it; it is still a
    // pass, because the family comes back with it among the candidates.
    const blueTwo = outcome(model, 'blue_two', 'deep');
    expect(blueTwo.verdict).toBe('pass');
    expect(blueTwo.route).toBe('parent');
    expect(blueTwo.returned.candidates).toContain('blue_two');
  });

  it('judges Quick at the family: any node in the right family passes', () => {
    const model = rosterModel();
    const o = outcome(model, 'blue_lineage', 'quick');
    expect(o.verdict).toBe('pass');
    expect(o.expected).toBe('blue');
  });

  it('judges Standard at the tendency: the parent ideology, not the family', () => {
    const model = rosterModel();
    expect(outcome(model, 'red_left', 'standard').expected).toBe('red_trunk');
    expect(outcome(model, 'blue_two', 'standard').expected).toBe('blue');
  });

  it('reports an ideology with no stances as unauthored, not as a failure', () => {
    const model = rosterModel({}, addBlank);
    const o = outcome(model, 'grey_blank', 'deep');
    expect(o.verdict).toBe('unauthored');
    expect(o.run.answers.every((a) => a.optionIds[0] === 'unsure')).toBe(true);
    // Everyone else is unaffected by its presence.
    const rest = checkIdeologies(model, ['red_left', 'red_right', 'blue_one'], 'deep');
    expect(rest.every((r) => r.verdict === 'pass')).toBe(true);
  });

  it('fails a respondent returned as its neighbour, and names the answer that did it', () => {
    const model = rosterModel({}, addLean);
    const o = outcome(model, 'red_left', 'deep');
    expect(o.verdict).toBe('fail');
    expect(o.returned).toMatchObject({ id: 'red_right', resolved: true });
    expect(o.giveaways[0]?.questionId).toBe('q_lean');
    expect(o.giveaways[0]?.margin).toBeGreaterThan(0);
    expect(o.giveaways.length).toBeLessThanOrEqual(3);
  });

  it('passes the same result when the pair is declared inseparable', () => {
    const model = rosterModel({}, (d) => {
      addLean(d);
      declareInseparable(d);
    });
    const o = outcome(model, 'red_left', 'deep');
    expect(o.returned).toMatchObject({ id: 'red_right', resolved: true });
    expect(o.verdict).toBe('pass');
    expect(o.route).toBe('inseparable');
  });

  it('does not let an inseparable declaration rescue a wrong family', () => {
    // The inseparable route is Deep-only and needs the partner returned; a
    // Quick run is judged by family and the declaration does not enter into it.
    const model = rosterModel({}, (d) => {
      addLean(d);
      declareInseparable(d);
    });
    expect(outcome(model, 'red_left', 'quick').route).not.toBe('inseparable');
  });
});
