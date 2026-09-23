/**
 * A minimal valid content set, plus helpers for breaking it one field at a
 * time. Tests build from this rather than from /content so that a change to
 * the real bank never silently changes what a unit test is asserting.
 */

import { stringify } from 'yaml';
import type { RawContent } from '../../src/content/load.js';

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type Record_ = { [key: string]: Json };

export interface Docs {
  groups: { groups: Json[] };
  families: { families: Json[] };
  ideologies: { ideologies: Json[] };
  questions: { questions: Json[] };
}

const BASE: Docs = {
  groups: {
    groups: [
      {
        id: 'grp_one',
        name: 'Group one',
        description: 'A group that holds both families, so the tree has a level above them.',
      },
    ],
  },
  families: {
    families: [
      {
        id: 'fam_a',
        name: 'Family A',
        group: 'grp_one',
        summary: 'A family that holds a default position on the first question.',
        stances: {
          q_one: { accept: ['opt_first'], reject: ['opt_third'], weight: 2 },
        },
      },
      {
        id: 'fam_b',
        name: 'Family B',
        group: 'grp_one',
        summary: 'A family with a different default.',
        stances: {
          q_one: { accept: ['opt_second'], weight: 1 },
        },
      },
    ],
  },
  ideologies: {
    ideologies: [
      {
        id: 'ideo_parent',
        name: 'Parent tendency',
        family: 'fam_a',
        roster_tier: 'core',
        summary: 'An interior node of the tree that its children inherit from.',
        stances: {
          q_two: { accept: ['two_alpha'], weight: 2 },
        },
      },
      {
        id: 'ideo_child',
        name: 'Child sect',
        family: 'fam_a',
        tendency: 'ideo_parent',
        roster_tier: 'core',
        summary: 'A sect that overrides one inherited stance and keeps the rest.',
        stances: {
          q_two: {
            accept: ['two_beta'],
            reject: ['two_alpha'],
            weight: 3,
            note: 'Defining: reverse it and the sect is indistinguishable from its parent.',
          },
        },
      },
      {
        id: 'ideo_other',
        name: 'Unrelated ideology',
        family: 'fam_b',
        roster_tier: 'niche',
        summary: 'Sits in the other family so cross-family checks have something to catch.',
        stances: {
          q_three: { accept: ['agree', 'strongly_agree'], weight: 1 },
        },
      },
    ],
  },
  questions: {
    questions: [
      {
        id: 'q_one',
        depth: 1,
        kind: 'single_choice',
        tags: ['root'],
        text: 'A first question that splits the field.',
        options: [
          { id: 'opt_first', label: 'The first position, as its holders would put it.', short: 'the first' },
          { id: 'opt_second', label: 'The second position, put the same way.', short: 'the second' },
          { id: 'opt_third', label: 'The third position, put the same way.', short: 'the third' },
        ],
      },
      {
        id: 'q_two',
        depth: 2,
        kind: 'single_choice',
        tags: ['branch'],
        requires: { answered: { q_one: ['opt_first', 'opt_second'] } },
        text: 'You said "{{answers.q_one.short}}". What follows from that?',
        options: [
          { id: 'two_alpha', label: 'One thing follows.' },
          { id: 'two_beta', label: 'A different thing follows.' },
          { id: 'two_gamma', label: 'A third thing follows.' },
        ],
      },
      {
        id: 'q_three',
        depth: 3,
        kind: 'likert5',
        tags: ['leaf'],
        requires: {
          all: [{ depth_unlocked_gte: 3 }, { family_mass_gte: { fam_b: 0.1 } }],
        },
        text: 'A proposition that only matters once the second family is in play.',
      },
    ],
  },
};

/** A deep copy of the valid base, optionally mutated before serialising. */
export function docs(mutate?: (d: Docs) => void): Docs {
  const copy = structuredClone(BASE);
  mutate?.(copy);
  return copy;
}

/** Serialise a fixture to the raw YAML `parseContent` expects. */
export function toRaw(d: Docs): RawContent {
  return {
    groups: stringify(d.groups),
    families: stringify(d.families),
    ideologies: stringify(d.ideologies),
    questions: stringify(d.questions),
  };
}

/** The valid base as raw YAML, optionally broken first. */
export function fixture(mutate?: (d: Docs) => void): RawContent {
  return toRaw(docs(mutate));
}

function find(list: Json[], id: string, what: string): Record_ {
  const found = list.find((entry) => (entry as Record_)['id'] === id);
  if (!found) throw new Error(`fixture has no ${what} "${id}"`);
  return found as Record_;
}

export const q = (d: Docs, id: string): Record_ => find(d.questions.questions, id, 'question');
export const ideo = (d: Docs, id: string): Record_ => find(d.ideologies.ideologies, id, 'ideology');
export const fam = (d: Docs, id: string): Record_ => find(d.families.families, id, 'family');
export const grp = (d: Docs, id: string): Record_ => find(d.groups.groups, id, 'group');
