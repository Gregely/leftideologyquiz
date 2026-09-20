import { describe, expect, it } from 'vitest';
import type { Answer } from '../engine/index.js';
import { rosterModel, type RosterDocs } from '../../tests/fixtures/roster.js';
import { buildResultView, confidenceText } from './result-view.js';

const a = (questionId: string, ...optionIds: string[]): Answer => ({ questionId, optionIds });

const RED_LEFT = [a('q_family', 'pick_red'), a('q_red_split', 'red_a'), a('q_eco', 'strongly_agree')];
const RED_TIE = [a('q_family', 'pick_red'), a('q_red_shared', 'shared_yes')];

function ideology(docs: RosterDocs, id: string): Record<string, unknown> {
  return docs.ideologies.ideologies.find((i) => i.id === id) as unknown as Record<string, unknown>;
}

describe('a resolved result', () => {
  const view = buildResultView(rosterModel(), RED_LEFT, 'standard', 'exhausted');

  it('names the sect, with its summary and plain-language confidence', () => {
    expect(view.kind).toBe('resolved');
    expect(view.level).toBe('sect');
    expect(view.node).toEqual({ id: 'red_left', name: 'Red left' });
    expect(view.summary).toMatch(/first side of the split/);
    expect(view.confidenceText).not.toMatch(/\d/);
    expect(view.backOffText).toBeNull();
    expect(view.candidates).toEqual([]);
  });

  it('shows earned modifier tags by their display names', () => {
    expect(view.modifiers).toEqual([{ tag: 'ecology', label: 'Ecological emphasis' }]);
  });

  it('lists the top five matches, highest first, with rough percentages', () => {
    expect(view.matches).toHaveLength(5);
    expect(view.matches[0]?.id).toBe('red_left');
    for (let i = 1; i < view.matches.length; i++) {
      expect(view.matches[i - 1]!.mass).toBeGreaterThanOrEqual(view.matches[i]!.mass);
    }
    for (const m of view.matches) expect(m.percent).toMatch(/^(<1|>99|\d{1,3})%$/);
  });

  it('explains the match with at most three answers for it', () => {
    expect(view.why?.ideology.id).toBe('red_left');
    expect(view.why?.for.length).toBeGreaterThan(0);
    expect(view.why?.for.length).toBeLessThanOrEqual(3);
    expect(view.why?.for.map((r) => r.questionId)).toContain('q_red_split');
    expect(view.why?.for.find((r) => r.questionId === 'q_red_split')?.answer).toBe('The first way.');
  });

  it('names the answer that pushed hardest against it', () => {
    const against = buildResultView(
      rosterModel(),
      [
        a('q_family', 'pick_red'),
        a('q_red_split', 'red_a'),
        a('q_red_shared', 'shared_yes'),
        a('q_eco', 'disagree'),
      ],
      'standard',
      'exhausted',
    );
    expect(against.why?.ideology.id).toBe('red_left');
    expect(against.why?.against?.questionId).toBe('q_eco');
    expect(against.why?.against?.answer).toBe('Disagree');
  });

  it('carries the stop reason, mode and count through', () => {
    expect(view.stopReason).toBe('exhausted');
    expect(view.mode).toBe('standard');
    expect(view.answeredCount).toBe(3);
  });

  it('flags nothing that is not flagged in the content', () => {
    expect(view.boundary).toEqual([]);
    expect(view.lineage).toEqual([]);
    expect(view.inseparable).toEqual([]);
  });
});

describe('an undecided result', () => {
  it('names the node it stopped at and the candidates inside it', () => {
    const view = buildResultView(rosterModel(), RED_TIE, 'quick', 'user');
    expect(view.kind).toBe('undecided');
    expect(view.node.id).toBe('red_trunk');
    // The tendency itself stays a candidate: "this, and neither sect inside it".
    expect(view.candidates.map((c) => c.id)).toEqual(expect.arrayContaining(['red_left', 'red_right']));
    expect(view.backOffText).toMatch(/Red left and Red right|Red right and Red left/);
  });

  it('calls a tendency that is its own candidate "itself"', () => {
    const view = buildResultView(rosterModel(), RED_TIE, 'quick', 'user');
    const self = view.candidates.find((c) => c.id === 'red_trunk');
    expect(self?.name).toBe('Red trunk itself');
    expect(view.candidates.find((c) => c.id === 'red_left')?.name).toBe('Red left');
  });

  it('says how many answers a sect needs when there were too few', () => {
    const view = buildResultView(rosterModel({ minAnswersForSect: 8 }), RED_LEFT, 'quick', 'budget');
    expect(view.kind).toBe('undecided');
    expect(view.backOffText).toMatch(/at least 8 answers/);
  });

  it('with no answers, reports the whole field rather than a family', () => {
    const view = buildResultView(rosterModel(), [], 'quick', 'user');
    expect(view.level).toBe('field');
    expect(view.node.name).toBe('Several families');
    // The root always holds all the mass; that must not read as confidence.
    expect(view.confidence).toBe(1);
    expect(view.confidenceText).toMatch(/do not favour one family/);
    expect(view.why).toBeNull();
    expect(view.modifiers).toEqual([]);
  });

  it('treats unsure answers as no evidence at all', () => {
    const view = buildResultView(rosterModel(), [a('q_family', 'unsure')], 'quick', 'user');
    expect(view.level).toBe('field');
    expect(view.why).toBeNull();
  });
});

describe('notices', () => {
  it('flags a boundary ideology', () => {
    const m = rosterModel({}, (d) => {
      ideology(d, 'red_left')['boundary'] = true;
    });
    const view = buildResultView(m, RED_LEFT, 'standard', 'exhausted');
    expect(view.boundary).toEqual([{ id: 'red_left', name: 'Red left' }]);
  });

  it('flags a lineage ideology held back by the lineage gate', () => {
    // Neither blue side: blue_lineage, which cleared the split stance, leads —
    // but has not shown its own shibboleth.
    const view = buildResultView(
      rosterModel(),
      [a('q_family', 'pick_blue'), a('q_blue_split', 'blue_c')],
      'standard',
      'exhausted',
    );
    expect(view.kind).toBe('undecided');
    expect(view.lineage).toEqual([{ id: 'blue_lineage', name: 'Blue lineage' }]);
    expect(view.backOffText).toMatch(/descends from/);
  });

  it('flags a lineage ideology that resolves', () => {
    const view = buildResultView(
      rosterModel(),
      [a('q_family', 'pick_blue'), a('q_blue_split', 'blue_c'), a('q_shibboleth', 'shib_yes')],
      'deep',
      'exhausted',
    );
    expect(view.node.id).toBe('blue_lineage');
    expect(view.lineage).toEqual([{ id: 'blue_lineage', name: 'Blue lineage' }]);
  });

  it('names both members of an inseparable pair, with the note', () => {
    const note = 'Same position, held by two different peoples.';
    const m = rosterModel({}, (d) => {
      ideology(d, 'red_left')['inseparable_from'] = [{ ideology: 'red_right', note }];
      ideology(d, 'red_right')['inseparable_from'] = [{ ideology: 'red_left', note }];
    });
    const view = buildResultView(m, RED_TIE, 'standard', 'exhausted');
    expect(view.inseparable).toEqual([
      {
        ideologies: [
          { id: 'red_left', name: 'Red left' },
          { id: 'red_right', name: 'Red right' },
        ],
        note,
      },
    ]);
  });
});

describe('confidenceText', () => {
  it('steps down with the evidence, and never quotes a number', () => {
    const resolved = [0.9, 0.6, 0.4, 0.1].map((c) => confidenceText(c, 'resolved'));
    expect(new Set(resolved).size).toBe(4);
    const undecided = [0.9, 0.6, 0.2].map((c) => confidenceText(c, 'undecided'));
    expect(new Set(undecided).size).toBe(3);
    for (const t of [...resolved, ...undecided]) expect(t).not.toMatch(/\d/);
  });

  it('changes exactly at its thresholds', () => {
    expect(confidenceText(0.75, 'resolved')).toBe(confidenceText(0.9, 'resolved'));
    expect(confidenceText(0.7499, 'resolved')).not.toBe(confidenceText(0.75, 'resolved'));
    expect(confidenceText(0.5, 'undecided')).not.toBe(confidenceText(0.4999, 'undecided'));
  });
});
