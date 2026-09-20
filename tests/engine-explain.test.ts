/**
 * explainMatch and modifierTags — what the result page is built from.
 */

import { describe, expect, it } from 'vitest';
import {
  computePosterior,
  explainMatch,
  modifierTags,
  modifierTagsFromAnswers,
  type Answer,
} from '../src/engine/index.js';
import { rosterContent, rosterModel } from './fixtures/roster.js';

const model = rosterModel();
const answer = (questionId: string, ...optionIds: string[]): Answer => ({ questionId, optionIds });

describe('explainMatch', () => {
  const answers = [
    answer('q_family', 'pick_red'),
    answer('q_red_split', 'red_a'),
    answer('q_eco', 'strongly_agree'),
  ];
  const posterior = computePosterior(model, answers);

  it('puts the answer that helped most at the top of raised', () => {
    const explanation = explainMatch(posterior, 'red_left');
    expect(explanation.raised[0]?.questionId).toBeDefined();
    expect(explanation.raised[0]?.contribution).toBeGreaterThan(0);
    for (const entry of explanation.raised) expect(entry.contribution).toBeGreaterThan(0);
  });

  it('puts the answer that hurt most at the top of lowered', () => {
    const explanation = explainMatch(posterior, 'red_right');
    expect(explanation.lowered[0]?.questionId).toBe('q_red_split');
    for (const entry of explanation.lowered) expect(entry.contribution).toBeLessThan(0);
  });

  it('sorts raised descending and lowered ascending', () => {
    const explanation = explainMatch(posterior, 'red_left');
    const raised = explanation.raised.map((e) => e.contribution);
    const lowered = explanation.lowered.map((e) => e.contribution);
    expect([...raised].sort((a, b) => b - a)).toEqual(raised);
    expect([...lowered].sort((a, b) => a - b)).toEqual(lowered);
  });

  it('gives mirror ideologies mirror explanations', () => {
    const left = explainMatch(posterior, 'red_left');
    const right = explainMatch(posterior, 'red_right');
    const leftSplit = left.all.find((e) => e.questionId === 'q_red_split')?.contribution as number;
    const rightSplit = right.all.find((e) => e.questionId === 'q_red_split')?.contribution as number;
    expect(leftSplit).toBeGreaterThan(0);
    expect(rightSplit).toBeLessThan(0);
  });

  it('omits inert answers entirely', () => {
    const withUnsure = computePosterior(model, [...answers, answer('q_blue_split', 'unsure')]);
    const explanation = explainMatch(withUnsure, 'red_left');
    expect(explanation.all.map((e) => e.questionId)).not.toContain('q_blue_split');
  });

  it('honours the limit without truncating `all`', () => {
    const explanation = explainMatch(posterior, 'red_left', 1);
    expect(explanation.raised.length).toBeLessThanOrEqual(1);
    expect(explanation.all).toHaveLength(3);
  });

  it('reports the ideology name and current mass', () => {
    const explanation = explainMatch(posterior, 'red_left');
    expect(explanation.name).toBe('Red left');
    expect(explanation.mass).toBeGreaterThan(0);
  });

  it('returns an empty explanation for an unknown ideology rather than throwing', () => {
    const explanation = explainMatch(posterior, 'no_such_ideology');
    expect(explanation.all).toEqual([]);
    expect(explanation.mass).toBe(0);
  });
});

describe('modifierTags', () => {
  it('awards a tag for an option that carries one', () => {
    const tags = modifierTags(computePosterior(model, [answer('q_eco', 'strongly_agree')]));
    expect(tags.map((t) => t.tag)).toEqual(['ecology']);
    expect(tags[0]?.earned).toBe(1);
    expect(tags[0]?.strength).toBe(1);
  });

  it('awards nothing for an option that carries none', () => {
    const tags = modifierTags(computePosterior(model, [answer('q_eco', 'disagree')]));
    expect(tags).toEqual([]);
  });

  it('reports strength as chances taken out of chances offered', () => {
    const tags = modifierTags(
      computePosterior(model, [answer('q_eco', 'agree'), answer('q_tech', 'tech_no')]),
    );
    const ecology = tags.find((t) => t.tag === 'ecology');
    expect(ecology?.earned).toBe(1);
    expect(ecology?.available).toBe(1);
    // q_tech was answered but its technology tag was not taken, so the tag is
    // absent rather than present at zero.
    expect(tags.find((t) => t.tag === 'technology')).toBeUndefined();
  });

  it('collects several tags at once', () => {
    const tags = modifierTags(
      computePosterior(model, [answer('q_eco', 'strongly_agree'), answer('q_tech', 'tech_yes')]),
    );
    expect(tags.map((t) => t.tag).sort()).toEqual(['ecology', 'technology']);
  });

  it('ignores unsure and unknown_term', () => {
    const tags = modifierTags(
      computePosterior(model, [answer('q_eco', 'unsure'), answer('q_tech', 'unknown_term')]),
    );
    expect(tags).toEqual([]);
  });

  it('names the questions that awarded each tag', () => {
    const tags = modifierTags(computePosterior(model, [answer('q_tech', 'tech_yes')]));
    expect(tags[0]?.questionIds).toEqual(['q_tech']);
  });

  it('is computed from a question with no stances at all', () => {
    // q_tech moves no ideology, so a tag it awards can only come from the
    // answer itself.
    const posterior = computePosterior(model, [answer('q_tech', 'tech_yes')]);
    expect(posterior.scoringAnswerCount).toBe(0);
    expect(modifierTags(posterior).map((t) => t.tag)).toEqual(['technology']);
  });

  it('does not change when every stance in the roster changes', () => {
    // The point of modifier tags: they describe what someone answered, not
    // where the test placed them.
    const rewired = rosterModel({}, (docs) => {
      for (const ideology of docs.ideologies.ideologies) {
        Object.assign(ideology, { stances: {} });
      }
      for (const family of docs.families.families) {
        Object.assign(family, { stances: {} });
      }
    });

    const answers = [answer('q_eco', 'strongly_agree'), answer('q_tech', 'tech_yes')];
    const normal = modifierTags(computePosterior(model, answers));
    const stanceless = modifierTags(computePosterior(rewired, answers));

    expect(stanceless).toEqual(normal);
  });

  it('does not depend on the posterior at all', () => {
    const answers = [answer('q_eco', 'agree')];
    const fromPosterior = modifierTags(computePosterior(model, answers));
    const fromAnswers = modifierTagsFromAnswers(rosterContent(), answers);
    expect(fromAnswers).toEqual(fromPosterior);
  });

  it('counts a question once however many tagged options it has', () => {
    const tags = modifierTags(computePosterior(model, [answer('q_eco', 'strongly_agree')]));
    expect(tags[0]?.earned).toBe(1);
  });

  it('returns nothing for no answers', () => {
    expect(modifierTags(computePosterior(model, []))).toEqual([]);
  });
});
