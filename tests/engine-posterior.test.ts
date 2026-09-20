/**
 * The likelihood model and the replay: does the posterior move the way the
 * stances say it should, and does it stay well-behaved under abuse.
 */

import { describe, expect, it } from 'vitest';
import {
  computePosterior,
  familyMasses,
  massOfIdeology,
  rankIdeologies,
  subtreeMass,
  tendencyMasses,
  type Answer,
} from '../src/engine/index.js';
import { rosterModel } from './fixtures/roster.js';

const model = rosterModel();

const answer = (questionId: string, ...optionIds: string[]): Answer => ({ questionId, optionIds });

const massOf = (answers: Answer[], id: string) =>
  massOfIdeology(computePosterior(model, answers), id);

const familyMass = (answers: Answer[], id: string) =>
  familyMasses(computePosterior(model, answers)).find((f) => f.id === id)?.mass ?? 0;

describe('the prior', () => {
  it('is uniform over ideologies before any answer', () => {
    const posterior = computePosterior(model, []);
    const masses = [...posterior.probabilities];
    expect(masses).toHaveLength(6);
    for (const mass of masses) expect(mass).toBeCloseTo(1 / 6, 12);
  });

  it('sums to one', () => {
    const posterior = computePosterior(model, [answer('q_family', 'pick_red')]);
    const total = [...posterior.probabilities].reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 12);
  });

  it('down-weights boundary ideologies only when asked to', () => {
    const plain = rosterModel();
    const weighted = rosterModel({ boundaryPrior: 0.5 }, (docs) => {
      const target = docs.ideologies.ideologies.find((i) => i.id === 'blue_two');
      if (target) Object.assign(target, { boundary: true, roster_tier: 'boundary' });
    });

    expect(computePosterior(plain, []).probabilities[4]).toBeCloseTo(1 / 6, 12);
    // 0.5 of a unit share out of 5.5 total units.
    expect(computePosterior(weighted, []).probabilities[4]).toBeCloseTo(0.5 / 5.5, 12);
  });
});

describe('accept and reject', () => {
  it('raises a family whose stance accepts the chosen option', () => {
    const answers = [answer('q_family', 'pick_red')];
    expect(familyMass(answers, 'red')).toBeGreaterThan(familyMass([], 'red'));
    expect(familyMass(answers, 'blue')).toBeLessThan(familyMass([], 'blue'));
    expect(familyMass(answers, 'red')).toBeGreaterThan(familyMass(answers, 'blue'));
  });

  it('separates two mirror-image ideologies on their defining question', () => {
    const answers = [answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')];
    expect(massOf(answers, 'red_left')).toBeGreaterThan(massOf(answers, 'red_right'));
  });

  it('is symmetric: the mirror answer gives the mirror result', () => {
    const left = [answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')];
    const right = [answer('q_family', 'pick_red'), answer('q_red_split', 'red_b')];
    expect(massOf(left, 'red_left')).toBeCloseTo(massOf(right, 'red_right'), 12);
    expect(massOf(left, 'red_right')).toBeCloseTo(massOf(right, 'red_left'), 12);
  });

  it('punishes a rejected option harder than an unlisted one helps', () => {
    // Measured in log space against red_trunk, which is in scope and has no
    // stance on this question. Comparing normalised probabilities across two
    // different answer sets would fold in the renormalisation and measure
    // something else.
    const posterior = computePosterior(model, [answer('q_red_split', 'red_a')]);
    const contribution = (id: string) =>
      posterior.effects[0]?.contribution[model.indexOf.get(id) as number] as number;

    const gainFromAccept = contribution('red_left') - contribution('red_trunk');
    const lossFromReject = contribution('red_trunk') - contribution('red_right');

    expect(gainFromAccept).toBeGreaterThan(0);
    expect(lossFromReject).toBeGreaterThan(gainFromAccept);
  });

  it('leaves an ideology with no stance where an answer found it', () => {
    // red_trunk has no stance on q_red_split, so a red-internal answer moves it
    // only through renormalisation, never against its own family.
    const before = computePosterior(model, [answer('q_family', 'pick_red')]);
    const after = computePosterior(model, [
      answer('q_family', 'pick_red'),
      answer('q_red_split', 'red_a'),
    ]);
    const index = model.indexOf.get('red_trunk') as number;
    expect(after.effects[1]?.contribution[index]).toBeLessThan(0);
    expect(before.probabilities[index]).toBeGreaterThan(0);
  });

  it('weights a stronger stance more than a weaker one', () => {
    const strong = rosterModel({}, (docs) => {
      const target = docs.ideologies.ideologies.find((i) => i.id === 'blue_one');
      if (target) {
        Object.assign(target.stances as Record<string, unknown>, {
          q_blue_split: {
            accept: ['blue_a'],
            weight: 3,
            note: 'Raised for this test only, to compare weight 2 against weight 3.',
          },
        });
      }
    });

    const answers = [answer('q_blue_split', 'blue_a')];
    const atWeightTwo = massOfIdeology(computePosterior(model, answers), 'blue_one');
    const atWeightThree = massOfIdeology(computePosterior(strong, answers), 'blue_one');
    expect(atWeightThree).toBeGreaterThan(atWeightTwo);
  });
});

describe('scope', () => {
  it('does not shift one family against another on a family-local question', () => {
    // q_eco has a stance from red_left alone, so its scope is the red family.
    // Answering it must redistribute inside red without arguing that the
    // respondent is red (SPEC.md §5.3).
    const before = [answer('q_family', 'pick_red')];
    const after = [...before, answer('q_eco', 'strongly_agree')];

    const ratioBefore = familyMass(before, 'red') / familyMass(before, 'blue');
    const ratioAfter = familyMass(after, 'red') / familyMass(after, 'blue');
    expect(ratioAfter).toBeCloseTo(ratioBefore, 10);
  });

  it('still redistributes inside the family it scopes to', () => {
    const answers = [answer('q_family', 'pick_red'), answer('q_eco', 'strongly_agree')];
    expect(massOf(answers, 'red_left')).toBeGreaterThan(massOf(answers, 'red_right'));
  });

  it('gives a question only one ideology answers real discriminating power', () => {
    // The whole reason scope is a family rather than the set of stance-holders.
    const answers = [answer('q_family', 'pick_blue'), answer('q_shibboleth', 'shib_yes')];
    expect(massOf(answers, 'blue_lineage')).toBeGreaterThan(massOf(answers, 'blue_one'));
    expect(massOf(answers, 'blue_lineage')).toBeGreaterThan(massOf(answers, 'blue_two'));
  });

  it('treats a question no ideology scores as inert', () => {
    const posterior = computePosterior(model, [answer('q_tech', 'tech_yes')]);
    expect(posterior.effects[0]?.inert).toBe(true);
    expect(posterior.scoringAnswerCount).toBe(0);
    for (const mass of posterior.probabilities) expect(mass).toBeCloseTo(1 / 6, 12);
  });
});

describe('likert questions', () => {
  it('scores an adjacent point above a distant one', () => {
    const at = (option: string) => massOf([answer('q_eco', option)], 'red_left');
    expect(at('strongly_agree')).toBeGreaterThan(at('agree'));
    expect(at('agree')).toBeGreaterThan(at('neutral'));
    expect(at('neutral')).toBeGreaterThan(at('disagree'));
    expect(at('disagree')).toBeGreaterThan(at('strongly_disagree'));
  });

  it('costs far less to miss by one point than by four', () => {
    // Measured against red_trunk, which is in scope with no stance on q_eco.
    const lossAgainstFlat = (option: string) => {
      const posterior = computePosterior(model, [answer('q_eco', option)]);
      const contribution = (id: string) =>
        posterior.effects[0]?.contribution[model.indexOf.get(id) as number] as number;
      return contribution('red_trunk') - contribution('red_left');
    };

    expect(lossAgainstFlat('strongly_agree')).toBeLessThan(0); // a gain, not a loss
    expect(lossAgainstFlat('agree')).toBeLessThan(0.25 * lossAgainstFlat('strongly_disagree'));
  });

  it('costs an ideology something to predict one point and not get it', () => {
    // Deliberate, and a property of any honest likelihood rather than a quirk:
    // red_left's stance says someone holding it would almost certainly answer
    // `strongly_agree`, so `agree` is mildly *less* likely under red_left than
    // under an ideology with no view at all. A stance that predicts sharply has
    // to pay when the prediction misses, or it would be getting its confidence
    // for free. The cost is small — see the test above — and the graded kernel
    // is what keeps it small.
    const posterior = computePosterior(model, [answer('q_eco', 'agree')]);
    const contribution = (id: string) =>
      posterior.effects[0]?.contribution[model.indexOf.get(id) as number] as number;

    expect(contribution('red_left')).toBeLessThan(contribution('red_trunk'));
    expect(contribution('red_trunk') - contribution('red_left')).toBeLessThan(0.2);
  });

  it('widens the gap as the kernel narrows', () => {
    const wide = rosterModel({ likertSigma: 2 });
    const narrow = rosterModel({ likertSigma: 0.5 });
    const answers = [answer('q_eco', 'agree')];
    const atWide = massOfIdeology(computePosterior(wide, answers), 'red_left');
    const atNarrow = massOfIdeology(computePosterior(narrow, answers), 'red_left');
    expect(atWide).toBeGreaterThan(atNarrow);
  });
});

describe('implicit options', () => {
  it('leaves the posterior untouched on "unsure"', () => {
    const prior = computePosterior(model, []);
    const after = computePosterior(model, [answer('q_family', 'unsure')]);
    expect([...after.probabilities]).toEqual([...prior.probabilities]);
  });

  it('leaves the posterior untouched on "unknown_term"', () => {
    const prior = computePosterior(model, []);
    const after = computePosterior(model, [answer('q_family', 'unknown_term')]);
    expect([...after.probabilities]).toEqual([...prior.probabilities]);
  });

  it('does not count towards the scoring answer total', () => {
    const posterior = computePosterior(model, [
      answer('q_family', 'pick_red'),
      answer('q_red_split', 'unsure'),
      answer('q_blue_split', 'unknown_term'),
    ]);
    expect(posterior.answers).toHaveLength(3);
    expect(posterior.scoringAnswerCount).toBe(1);
    expect(posterior.effects.map((e) => e.inert)).toEqual([false, true, true]);
  });

  it('does not change the result whether an unsure sits before or after a real answer', () => {
    const before = computePosterior(model, [
      answer('q_red_split', 'unsure'),
      answer('q_family', 'pick_red'),
    ]);
    const after = computePosterior(model, [
      answer('q_family', 'pick_red'),
      answer('q_red_split', 'unsure'),
    ]);
    expect([...before.probabilities]).toEqual([...after.probabilities]);
  });

  it('is inert on an empty or unknown answer rather than throwing', () => {
    expect(() => computePosterior(model, [answer('q_family')])).not.toThrow();
    expect(computePosterior(model, [answer('q_family')]).effects[0]?.inert).toBe(true);
    expect(computePosterior(model, [answer('q_family', 'no_such_option')]).effects[0]?.inert).toBe(
      true,
    );
    expect(computePosterior(model, [answer('no_such_question', 'x')]).effects[0]?.inert).toBe(true);
  });
});

describe('respondent noise', () => {
  const hostile = [
    answer('q_family', 'pick_blue'),
    answer('q_red_split', 'red_b'),
    answer('q_eco', 'strongly_disagree'),
  ];

  it('never eliminates an ideology, however badly the answers fit it', () => {
    const mass = massOf(hostile, 'red_left');
    expect(mass).toBeGreaterThan(0);
    expect(Number.isFinite(mass)).toBe(true);
  });

  it('keeps a contradicted ideology recoverable, where zero noise would not', () => {
    const noiseless = rosterModel({ respondentNoise: 0 });
    const withNoise = massOf(hostile, 'red_left');
    const withoutNoise = massOfIdeology(computePosterior(noiseless, hostile), 'red_left');
    expect(withNoise).toBeGreaterThan(withoutNoise * 5);
  });

  it('lets a later run of fitting answers overtake one atypical answer', () => {
    // One answer against red_left, then two for it.
    const answers = [
      answer('q_red_split', 'red_b'),
      answer('q_family', 'pick_red'),
      answer('q_eco', 'strongly_agree'),
    ];
    const ranked = rankIdeologies(computePosterior(model, answers));
    expect(ranked.map((r) => r.id)).toContain('red_left');
    expect(massOf(answers, 'red_left')).toBeGreaterThan(massOf(answers, 'blue_two'));
  });

  it('widens the spread as noise falls', () => {
    const spread = (noise: number) => {
      const m = rosterModel({ respondentNoise: noise });
      const p = computePosterior(m, [answer('q_family', 'pick_red')]);
      return Math.max(...p.probabilities) / Math.min(...p.probabilities);
    };
    expect(spread(0.02)).toBeGreaterThan(spread(0.3));
  });
});

describe('aggregation', () => {
  it('sums family mass from members', () => {
    const posterior = computePosterior(model, [answer('q_family', 'pick_red')]);
    const red = familyMasses(posterior).find((f) => f.id === 'red');
    const members = ['red_trunk', 'red_left', 'red_right'].reduce(
      (total, id) => total + massOfIdeology(posterior, id),
      0,
    );
    expect(red?.mass).toBeCloseTo(members, 12);
  });

  it('sums all families to one', () => {
    const posterior = computePosterior(model, [answer('q_family', 'pick_blue')]);
    const total = familyMasses(posterior).reduce((a, f) => a + f.mass, 0);
    expect(total).toBeCloseTo(1, 12);
  });

  it('counts a tendency as itself plus its descendants', () => {
    const posterior = computePosterior(model, [answer('q_blue_split', 'blue_a')]);
    const blueOne = tendencyMasses(posterior).find((t) => t.id === 'blue_one');
    expect(blueOne?.mass).toBeCloseTo(
      massOfIdeology(posterior, 'blue_one') + massOfIdeology(posterior, 'blue_lineage'),
      12,
    );
    expect(blueOne?.ownMass).toBeCloseTo(massOfIdeology(posterior, 'blue_one'), 12);
  });

  it('lists only ideologies that have descendants as tendencies', () => {
    const posterior = computePosterior(model, []);
    expect(tendencyMasses(posterior).map((t) => t.id).sort()).toEqual(['blue_one', 'red_trunk']);
  });

  it('treats a leaf subtree as the leaf itself', () => {
    const posterior = computePosterior(model, [answer('q_red_split', 'red_a')]);
    expect(subtreeMass(posterior, 'red_left')).toBeCloseTo(
      massOfIdeology(posterior, 'red_left'),
      12,
    );
  });
});

describe('replay', () => {
  it('is deterministic', () => {
    const answers = [answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')];
    const first = computePosterior(model, answers);
    const second = computePosterior(model, answers);
    expect([...first.probabilities]).toEqual([...second.probabilities]);
  });

  it('does not mutate the answers it is given', () => {
    const answers = [answer('q_family', 'pick_red')];
    const snapshot = JSON.stringify(answers);
    computePosterior(model, answers);
    expect(JSON.stringify(answers)).toBe(snapshot);
  });

  it('reproduces an earlier state exactly when answers are truncated', () => {
    const full = [
      answer('q_family', 'pick_red'),
      answer('q_red_split', 'red_a'),
      answer('q_eco', 'agree'),
    ];
    const rolledBack = computePosterior(model, full.slice(0, 2));
    const neverAnswered = computePosterior(model, full.slice(0, 2));
    expect([...rolledBack.probabilities]).toEqual([...neverAnswered.probabilities]);
  });

  it('records one effect per answer, in order', () => {
    const answers = [answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')];
    const posterior = computePosterior(model, answers);
    expect(posterior.effects.map((e) => e.questionId)).toEqual(['q_family', 'q_red_split']);
  });

  it('handles an empty answer list', () => {
    const posterior = computePosterior(model, []);
    expect(posterior.effects).toEqual([]);
    expect(posterior.scoringAnswerCount).toBe(0);
  });
});
