/**
 * Session state: the answers, and getting them in and out of a URL.
 *
 * The property that matters throughout: the posterior is a function of the
 * answers and nothing else, so going back, editing and restoring all have to
 * land on exactly the state a fresh run of those answers would produce.
 */

import { describe, expect, it } from 'vitest';
import {
  answerQuestion,
  answersById,
  computePosterior,
  deserialiseSession,
  emptySession,
  goBack,
  hasAnswered,
  resolve,
  scoringAnswers,
  serialiseSession,
  truncate,
} from '../src/engine/index.js';
import { rosterContent, rosterModel } from './fixtures/roster.js';

const content = rosterContent();
const model = rosterModel();

describe('recording answers', () => {
  it('appends in order', () => {
    let session = emptySession();
    session = answerQuestion(session, 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['red_a']);
    expect(session.answers.map((a) => a.questionId)).toEqual(['q_family', 'q_red_split']);
  });

  it('does not mutate the session it is given', () => {
    const first = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    const second = answerQuestion(first, 'q_red_split', ['red_a']);
    expect(first.answers).toHaveLength(1);
    expect(second.answers).toHaveLength(2);
  });

  it('copies the option list rather than holding the caller’s array', () => {
    const options = ['pick_red'];
    const session = answerQuestion(emptySession(), 'q_family', options);
    options.push('pick_blue');
    expect(session.answers[0]?.optionIds).toEqual(['pick_red']);
  });

  it('replaces an existing answer in place rather than appending', () => {
    let session = emptySession();
    session = answerQuestion(session, 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['red_a']);
    session = answerQuestion(session, 'q_family', ['pick_blue']);

    expect(session.answers).toHaveLength(2);
    expect(session.answers.map((a) => a.questionId)).toEqual(['q_family', 'q_red_split']);
    expect(session.answers[0]?.optionIds).toEqual(['pick_blue']);
  });

  it('exposes answers by question id', () => {
    let session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['red_a']);
    expect([...answersById(session).keys()]).toEqual(['q_family', 'q_red_split']);
    expect(hasAnswered(session, 'q_family')).toBe(true);
    expect(hasAnswered(session, 'q_eco')).toBe(false);
  });

  it('separates scoring answers from inert ones', () => {
    let session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['unsure']);
    session = answerQuestion(session, 'q_eco', ['unknown_term']);
    expect(scoringAnswers(session).map((a) => a.questionId)).toEqual(['q_family']);
  });
});

describe('going back', () => {
  it('drops the most recent answer', () => {
    let session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['red_a']);
    expect(goBack(session).answers.map((a) => a.questionId)).toEqual(['q_family']);
  });

  it('lands on exactly the posterior that answer list would have produced', () => {
    let session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['red_a']);

    const rolledBack = computePosterior(model, goBack(session).answers);
    const fresh = computePosterior(model, [{ questionId: 'q_family', optionIds: ['pick_red'] }]);
    expect([...rolledBack.probabilities]).toEqual([...fresh.probabilities]);
  });

  it('is safe on an empty session', () => {
    expect(goBack(emptySession()).answers).toEqual([]);
  });

  it('undoes an edit exactly, with no drift', () => {
    const base = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    const edited = answerQuestion(base, 'q_family', ['pick_blue']);
    const restored = answerQuestion(edited, 'q_family', ['pick_red']);

    expect([...computePosterior(model, restored.answers).probabilities]).toEqual([
      ...computePosterior(model, base.answers).probabilities,
    ]);
  });

  it('truncates to a prefix', () => {
    let session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['red_a']);
    session = answerQuestion(session, 'q_eco', ['agree']);
    expect(truncate(session, 1).answers.map((a) => a.questionId)).toEqual(['q_family']);
    expect(truncate(session, 0).answers).toEqual([]);
    expect(truncate(session, -5).answers).toEqual([]);
    expect(truncate(session, 99).answers).toHaveLength(3);
  });
});

describe('serialisation', () => {
  it('round-trips a session', () => {
    let session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['red_a']);
    session = answerQuestion(session, 'q_eco', ['unsure']);

    const restored = deserialiseSession(content, serialiseSession(session));
    expect(restored.session.answers).toEqual(session.answers);
    expect(restored.dropped).toEqual([]);
    expect(restored.unreadable).toBe(false);
  });

  it('reproduces the same result after a round trip', () => {
    let session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    session = answerQuestion(session, 'q_red_split', ['red_a']);

    const restored = deserialiseSession(content, serialiseSession(session)).session;
    const before = resolve(computePosterior(model, session.answers));
    const after = resolve(computePosterior(model, restored.answers));

    expect(after.node.id).toBe(before.node.id);
    expect(after.confidence).toBeCloseTo(before.confidence, 12);
  });

  it('round-trips a multi answer', () => {
    const multi = rosterContent((docs) => {
      const question = docs.questions.questions.find((q) => q.id === 'q_red_split');
      if (question) Object.assign(question, { kind: 'multi' });
    });
    const session = answerQuestion(emptySession(), 'q_red_split', ['red_a', 'red_c']);
    const restored = deserialiseSession(multi, serialiseSession(session));
    expect(restored.session.answers[0]?.optionIds).toEqual(['red_a', 'red_c']);
  });

  it('round-trips an empty session', () => {
    const restored = deserialiseSession(content, serialiseSession(emptySession()));
    expect(restored.session.answers).toEqual([]);
    expect(restored.unreadable).toBe(false);
  });

  it('tolerates a leading fragment marker', () => {
    const session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    const restored = deserialiseSession(content, `#${serialiseSession(session)}`);
    expect(restored.session.answers).toHaveLength(1);
  });

  it('preserves answer order, because replay is sequential', () => {
    let session = answerQuestion(emptySession(), 'q_red_split', ['red_a']);
    session = answerQuestion(session, 'q_family', ['pick_red']);
    const restored = deserialiseSession(content, serialiseSession(session)).session;
    expect(restored.answers.map((a) => a.questionId)).toEqual(['q_red_split', 'q_family']);
  });
});

describe('serialisation of stale or damaged input', () => {
  it('reports an unknown format version rather than guessing', () => {
    const restored = deserialiseSession(content, 'v9~q_family:pick_red');
    expect(restored.unreadable).toBe(true);
    expect(restored.session.answers).toEqual([]);
  });

  it('drops an answer to a question that no longer exists, keeping the rest', () => {
    const restored = deserialiseSession(content, 'v1~q_deleted:whatever~q_family:pick_red');
    expect(restored.session.answers.map((a) => a.questionId)).toEqual(['q_family']);
    expect(restored.dropped[0]?.reason).toMatch(/no question "q_deleted"/);
  });

  it('drops an answer naming an option that no longer exists', () => {
    const restored = deserialiseSession(content, 'v1~q_family:pick_purple');
    expect(restored.session.answers).toEqual([]);
    expect(restored.dropped[0]?.reason).toMatch(/no option\(s\) pick_purple/);
  });

  it('drops several options on a question that takes one', () => {
    const restored = deserialiseSession(content, 'v1~q_family:pick_red,pick_blue');
    expect(restored.session.answers).toEqual([]);
    expect(restored.dropped[0]?.reason).toMatch(/takes one answer, got 2/);
  });

  it('drops a repeated question', () => {
    const restored = deserialiseSession(content, 'v1~q_family:pick_red~q_family:pick_blue');
    expect(restored.session.answers).toHaveLength(1);
    expect(restored.session.answers[0]?.optionIds).toEqual(['pick_red']);
    expect(restored.dropped[0]?.reason).toMatch(/answered twice/);
  });

  it('never throws, whatever it is handed', () => {
    for (const input of ['', '   ', 'v1', 'v1~', 'v1~~~', 'v1~junk', 'v1~q_family:', '~:~:~', 'v1~q_family:pick_red:extra']) {
      expect(() => deserialiseSession(content, input)).not.toThrow();
    }
  });

  it('accepts an implicit option, which is a real answer', () => {
    const restored = deserialiseSession(content, 'v1~q_family:unsure');
    expect(restored.session.answers[0]?.optionIds).toEqual(['unsure']);
    expect(restored.dropped).toEqual([]);
  });

  it('uses ids rather than positions, so reordering content is harmless', () => {
    const reordered = rosterContent((docs) => {
      docs.questions.questions.reverse();
      docs.ideologies.ideologies.reverse();
    });
    const session = answerQuestion(emptySession(), 'q_family', ['pick_red']);
    const restored = deserialiseSession(reordered, serialiseSession(session));
    expect(restored.session.answers).toEqual(session.answers);
    expect(restored.dropped).toEqual([]);
  });
});
