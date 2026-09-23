/**
 * The resolver: descending while the evidence supports it, and stepping up a
 * level rather than guessing when it does not.
 */

import { describe, expect, it } from 'vitest';
import {
  checkLineage,
  computePosterior,
  familyKey,
  ideologyKey,
  massOfIdeology,
  lineageShibboleths,
  resolve,
  subtreeMass,
  type Answer,
} from '../src/engine/index.js';
import { rosterModel } from './fixtures/roster.js';

const model = rosterModel();

const answer = (questionId: string, ...optionIds: string[]): Answer => ({ questionId, optionIds });
const resultOf = (answers: Answer[], m = model) => resolve(computePosterior(m, answers));

describe('descending', () => {
  it('names a sect when one clearly wins its siblings', () => {
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')]);
    expect(result.kind).toBe('resolved');
    expect(result.level).toBe('sect');
    expect(result.node.id).toBe('red_left');
    expect(result.candidates).toEqual([]);
    expect(result.backOffReason).toBeNull();
  });

  it('gives the mirror sect for the mirror answer', () => {
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_b')]);
    expect(result.node.id).toBe('red_right');
  });

  it('collapses a family with a single child rather than stopping there', () => {
    // The red family's only direct child is red_trunk, which is not a choice.
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')]);
    expect(result.node.id).not.toBe('red');
  });

  it('reports confidence as the reported node’s mass', () => {
    const answers = [answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')];
    const posterior = computePosterior(model, answers);
    const result = resolve(posterior);
    const index = model.indexOf.get('red_left') as number;
    expect(result.confidence).toBeCloseTo(posterior.probabilities[index] as number, 12);
  });
});

describe('stepping up on a tie', () => {
  it('returns the tendency and lists both siblings when they are level', () => {
    // q_red_shared is answered the same way by both sects, so it raises them
    // together and separates neither: the near-neighbour case of SPEC.md §1.
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_shared', 'shared_yes')]);

    expect(result.kind).toBe('undecided');
    expect(result.level).toBe('tendency');
    expect(result.node.id).toBe('red_trunk');
    expect(result.backOffReason).toBe('top-two-too-close');

    const ids = result.candidates.map((c) => c.id);
    expect(ids).toContain('red_left');
    expect(ids).toContain('red_right');
  });

  it('gives the tied candidates equal mass', () => {
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_shared', 'shared_yes')]);
    const left = result.candidates.find((c) => c.id === 'red_left');
    const right = result.candidates.find((c) => c.id === 'red_right');
    expect(left?.mass).toBeCloseTo(right?.mass as number, 12);
  });

  it('separates the same pair again once a distinguishing question is answered', () => {
    const result = resultOf([
      answer('q_family', 'pick_red'),
      answer('q_red_shared', 'shared_yes'),
      answer('q_red_split', 'red_a'),
    ]);
    expect(result.kind).toBe('resolved');
    expect(result.node.id).toBe('red_left');
  });

  it('names the tendency itself when the answer is one no sect inside it claims', () => {
    // red_c is neutral for both sects, so it is evidence against each of them
    // and for the generic position their parent holds. That is a resolved
    // answer, not a tie: "you are broadly of this tendency, and neither of the
    // two sects within it".
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_c')]);
    expect(result.kind).toBe('resolved');
    expect(result.node.id).toBe('red_trunk');
    expect(result.level).toBe('sect');
  });

  it('stops at the top when nothing separates the groups', () => {
    // The root enumerates groups now, not families, so backing off all the way
    // reports the groups that are tied rather than the families inside them.
    const result = resultOf([answer('q_family', 'pick_neither')]);
    expect(result.kind).toBe('undecided');
    expect(result.level).toBe('group');
    expect(result.node.kind).toBe('root');
    expect(result.candidates.map((c) => c.id).sort()).toEqual(['cool', 'warm']);
  });

  it('descends once the margin is met and not before', () => {
    const answers = [answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')];

    const strict = resultOf(answers, rosterModel({ minAnswersForSect: 2, childMarginMin: 100 }));
    expect(strict.kind).toBe('undecided');

    const lenient = resultOf(answers, rosterModel({ minAnswersForSect: 2, childMarginMin: 1.01 }));
    expect(lenient.kind).toBe('resolved');
  });

  it('respects childShareMin independently of the margin', () => {
    const answers = [answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')];
    const result = resultOf(
      answers,
      rosterModel({ minAnswersForSect: 2, childShareMin: 0.99, childMarginMin: 1.01 }),
    );
    expect(result.kind).toBe('undecided');
  });

  it('lists candidates down to the candidate floor, always at least two', () => {
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_shared', 'shared_yes')]);
    expect(result.candidates.length).toBeGreaterThanOrEqual(2);
    const top = result.candidates[0]?.mass as number;
    for (const candidate of result.candidates.slice(2)) {
      expect(candidate.mass).toBeGreaterThanOrEqual(top * model.config.candidateFloor);
    }
  });
});

describe('guards on naming a sect', () => {
  it('will not name one before the minimum number of scoring answers', () => {
    const strict = rosterModel({ minAnswersForSect: 8 });
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')], strict);
    expect(result.kind).toBe('undecided');
    expect(result.backOffReason).toBe('too-few-answers');
    expect(result.candidates.map((c) => c.id)).toContain('red_left');
  });

  it('does not count unsure answers towards that minimum', () => {
    const strict = rosterModel({ minAnswersForSect: 3 });
    const result = resultOf(
      [
        answer('q_family', 'pick_red'),
        answer('q_red_split', 'red_a'),
        answer('q_blue_split', 'unsure'),
      ],
      strict,
    );
    expect(result.backOffReason).toBe('too-few-answers');
  });

  it('will not name one whose mass is below the absolute floor', () => {
    const strict = rosterModel({ minAnswersForSect: 1, absoluteFloor: 0.95, childMarginMin: 1.01 });
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')], strict);
    expect(result.kind).toBe('undecided');
    expect(result.backOffReason).toBe('below-absolute-floor');
  });
});

describe('the lineage gate', () => {
  it('knows which questions are a lineage ideology’s own', () => {
    expect(lineageShibboleths(model, 'blue_lineage')).toEqual(['q_shibboleth']);
  });

  it('does not treat a cleared inherited stance as a position of its own', () => {
    // blue_lineage clears q_blue_split. Dropping a stance says nothing about
    // what the ideology holds, so it cannot serve as identifying evidence.
    expect(lineageShibboleths(model, 'blue_lineage')).not.toContain('q_blue_split');
  });

  it('requires nothing of an ideology that is not lineage-flagged', () => {
    const check = checkLineage(computePosterior(model, []), 'red_left');
    expect(check.required).toBe(false);
    expect(check.passed).toBe(true);
  });

  it('is unsatisfied while the shibboleth is unanswered', () => {
    const posterior = computePosterior(model, [
      answer('q_family', 'pick_blue'),
      answer('q_blue_split', 'blue_c'),
    ]);
    const check = checkLineage(posterior, 'blue_lineage');
    expect(check.required).toBe(true);
    expect(check.passed).toBe(false);
    expect(check.established).toEqual([]);
  });

  it('is satisfied by positive evidence on the shibboleth', () => {
    const posterior = computePosterior(model, [
      answer('q_family', 'pick_blue'),
      answer('q_shibboleth', 'shib_yes'),
    ]);
    const check = checkLineage(posterior, 'blue_lineage');
    expect(check.passed).toBe(true);
    expect(check.established).toEqual(['q_shibboleth']);
  });

  it('is not satisfied by answering the shibboleth the other way', () => {
    const posterior = computePosterior(model, [
      answer('q_family', 'pick_blue'),
      answer('q_shibboleth', 'shib_no'),
    ]);
    expect(checkLineage(posterior, 'blue_lineage').passed).toBe(false);
  });

  it('blocks a sect result the posterior would otherwise have given', () => {
    // blue_c leaves blue_one and blue_two both mispredicting while
    // blue_lineage, which cleared that stance, is untouched — so it tops its
    // parent on inherited evidence alone.
    const answers = [answer('q_family', 'pick_blue'), answer('q_blue_split', 'blue_c')];
    const posterior = computePosterior(model, answers);

    const index = model.indexOf.get('blue_lineage') as number;
    const parentIndex = model.indexOf.get('blue_one') as number;
    expect(posterior.probabilities[index]).toBeGreaterThan(
      posterior.probabilities[parentIndex] as number,
    );

    const result = resolve(posterior);
    expect(result.kind).toBe('undecided');
    expect(result.backOffReason).toBe('lineage-not-established');
    expect(result.node.id).toBe('blue_one');
  });

  it('allows the same sect once the shibboleth is answered for it', () => {
    const result = resultOf([
      answer('q_family', 'pick_blue'),
      answer('q_blue_split', 'blue_c'),
      answer('q_shibboleth', 'shib_yes'),
    ]);
    expect(result.kind).toBe('resolved');
    expect(result.node.id).toBe('blue_lineage');
  });

  it('never blocks an ideology that is not lineage-flagged', () => {
    const plain = rosterModel({}, (docs) => {
      const target = docs.ideologies.ideologies.find((i) => i.id === 'blue_lineage');
      if (target) Object.assign(target, { lineage: false });
    });
    const result = resultOf(
      [answer('q_family', 'pick_blue'), answer('q_blue_split', 'blue_c')],
      plain,
    );
    expect(result.kind).toBe('resolved');
    expect(result.node.id).toBe('blue_lineage');
  });
});

describe('the anchor and its contributions', () => {
  it('anchors a resolved result on the named sect', () => {
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')]);
    expect(result.anchorIdeologyId).toBe('red_left');
  });

  it('anchors an undecided result on the best-supported ideology beneath it', () => {
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_c')]);
    expect(['red_trunk', 'red_left', 'red_right']).toContain(result.anchorIdeologyId);
  });

  it('returns one contribution per scoring answer, strongest effect first', () => {
    const result = resultOf([
      answer('q_family', 'pick_red'),
      answer('q_red_split', 'red_a'),
      answer('q_blue_split', 'unsure'),
    ]);
    expect(result.contributions).toHaveLength(2);
    const magnitudes = result.contributions.map((c) => Math.abs(c.contribution));
    expect([...magnitudes].sort((a, b) => b - a)).toEqual(magnitudes);
  });

  it('carries the question and option text needed to show the result', () => {
    const result = resultOf([answer('q_family', 'pick_red'), answer('q_red_split', 'red_a')]);
    const first = result.contributions.find((c) => c.questionId === 'q_red_split');
    expect(first?.questionText).toMatch(/Inside the red family/);
    expect(first?.optionLabels).toEqual(['The first way.']);
  });
});

describe('degenerate input', () => {
  it('returns a family-level undecided with no answers at all', () => {
    const result = resultOf([]);
    expect(result.kind).toBe('undecided');
    expect(result.scoringAnswerCount).toBe(0);
  });

  it('returns a family-level undecided when every answer is unsure', () => {
    const result = resultOf([
      answer('q_family', 'unsure'),
      answer('q_red_split', 'unsure'),
      answer('q_blue_split', 'unknown_term'),
    ]);
    expect(result.kind).toBe('undecided');
    expect(result.node.kind).toBe('root');
  });

  it('keeps a family and an ideology of the same name apart', () => {
    // Regression: the tree was once keyed by bare id, so a family node
    // overwrote the ideology node of the same name. With `red_trunk` also a
    // family id, the walk became root -> red_trunk(family) -> red_left ->
    // ... -> red_trunk(family) and recursed until the stack blew. Families and
    // ideologies are separate namespaces in content, so the tree has to key by
    // kind as well as id.
    const colliding = rosterModel({}, (docs) => {
      // Rename the family to collide with one of its own members.
      docs.families.families[0] = { ...docs.families.families[0], id: 'red_trunk' } as never;
      for (const ideology of docs.ideologies.ideologies) {
        if ((ideology as { family: string }).family === 'red') {
          (ideology as { family: string }).family = 'red_trunk';
        }
      }
    });

    expect(() => resultOf([answer('q_family', 'pick_red')], colliding)).not.toThrow();
    expect(() => computePosterior(colliding, [answer('q_family', 'pick_red')])).not.toThrow();

    const posterior = computePosterior(colliding, [answer('q_family', 'pick_red')]);

    // Both nodes survive as distinct entries rather than one overwriting the
    // other. Their subtree masses are equal here — the family's only direct
    // child is that very ideology — so the check that matters is that the
    // ideology's own mass is a strict part of the family's total, which is only
    // true if both nodes exist.
    expect(colliding.tree.nodes.has(ideologyKey('red_trunk'))).toBe(true);
    expect(colliding.tree.nodes.has(familyKey('red_trunk'))).toBe(true);
    expect(colliding.tree.nodes.get(ideologyKey('red_trunk'))?.kind).toBe('ideology');
    expect(colliding.tree.nodes.get(familyKey('red_trunk'))?.kind).toBe('family');

    const familyMass = subtreeMass(posterior, familyKey('red_trunk'));
    expect(familyMass).toBeGreaterThan(0);
    expect(massOfIdeology(posterior, 'red_trunk')).toBeLessThan(familyMass);
  });

  it('does not throw on a single-ideology roster', () => {
    const tiny = rosterModel({ minAnswersForSect: 1 }, (docs) => {
      docs.ideologies.ideologies = docs.ideologies.ideologies.filter((i) => i.id === 'blue_two');
      docs.families.families = docs.families.families.filter((f) => f.id === 'blue');
    });
    const result = resultOf([answer('q_blue_split', 'blue_b')], tiny);
    expect(result.node.id).toBe('blue_two');
    expect(result.kind).toBe('resolved');
  });
});
