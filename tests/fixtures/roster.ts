/**
 * A hand-built roster of 6 ideologies in 2 families, built so every branch of
 * the engine has a case that exercises it and so the numbers can be worked out
 * by hand.
 *
 *   red                                   blue
 *   └── red_trunk        (interior)       ├── blue_one          (interior)
 *       ├── red_left                      │   └── blue_lineage  (lineage: true)
 *       └── red_right                     └── blue_two
 *
 * Deliberate properties:
 *  - red_left and red_right are mirror images on q_red_split, so a neutral
 *    answer leaves them exactly tied and the resolver has to step up.
 *  - red_trunk has no stances of its own: it exists to be backed off to.
 *  - blue_lineage inherits everything from blue_one except that it *clears*
 *    the q_blue_split stance, so it can outrank its parent without ever
 *    giving evidence on its own shibboleth. That is the case the lineage gate
 *    is for, and it is reachable no other way.
 *  - q_eco has a stance from one red ideology only, so it tests that a
 *    family-local question does not shift red against blue.
 *  - q_tech has no stances at all: inert for the posterior, live for modifier
 *    tags.
 */

import { stringify } from 'yaml';
import { parseContent, type Content } from '../../src/content/load.js';
import { buildModel, type EngineModel } from '../../src/engine/model.js';
import { withConfig, type EngineConfig } from '../../src/engine/config.js';

const GROUPS = {
  groups: [
    {
      id: 'warm',
      name: 'The warm group',
      description: 'Holds the red family, so the tree has a level above the families.',
    },
    {
      id: 'cool',
      name: 'The cool group',
      description: 'Holds the blue family, and is the other answer a quick run can give.',
    },
  ],
};

const FAMILIES = {
  families: [
    {
      id: 'red',
      name: 'The red family',
      group: 'warm',
      summary: 'Holds that the first option on the family question is the right one.',
      stances: {
        q_family: {
          accept: ['pick_red'],
          reject: ['pick_blue'],
          weight: 3,
          note: 'Defining for the family: reverse it and its members are in the other family.',
        },
      },
    },
    {
      id: 'blue',
      name: 'The blue family',
      group: 'cool',
      summary: 'The mirror of the red family on the same question.',
      stances: {
        q_family: {
          accept: ['pick_blue'],
          reject: ['pick_red'],
          weight: 3,
          note: 'Defining for the family: the mirror of the red stance on the same question.',
        },
      },
    },
  ],
};

const IDEOLOGIES = {
  ideologies: [
    {
      id: 'red_trunk',
      name: 'Red trunk',
      family: 'red',
      roster_tier: 'core',
      summary: 'An interior node holding only what the family holds.',
      stances: {},
    },
    {
      id: 'red_left',
      name: 'Red left',
      family: 'red',
      tendency: 'red_trunk',
      roster_tier: 'core',
      summary: 'Takes the first side of the split inside the red family.',
      stances: {
        q_red_split: {
          accept: ['red_a'],
          reject: ['red_b'],
          weight: 3,
          note: 'Defining: the whole disagreement with red_right is this option.',
        },
        q_eco: { accept: ['strongly_agree'], weight: 2 },
        q_red_shared: { accept: ['shared_yes'], weight: 2 },
      },
    },
    {
      id: 'red_right',
      name: 'Red right',
      family: 'red',
      tendency: 'red_trunk',
      roster_tier: 'core',
      summary: 'Takes the other side of the same split.',
      stances: {
        q_red_split: {
          accept: ['red_b'],
          reject: ['red_a'],
          weight: 3,
          note: 'Defining: the exact mirror of red_left on the same question.',
        },
        // Identical to red_left. Answering this raises both sects above their
        // parent and leaves them level with each other, which is the tie the
        // resolver has to step up from rather than guess at.
        q_red_shared: { accept: ['shared_yes'], weight: 2 },
      },
    },
    {
      id: 'blue_one',
      name: 'Blue one',
      family: 'blue',
      roster_tier: 'core',
      summary: 'Takes the first side of the split inside the blue family.',
      stances: {
        q_blue_split: { accept: ['blue_a'], weight: 2 },
      },
    },
    {
      id: 'blue_two',
      name: 'Blue two',
      family: 'blue',
      roster_tier: 'core',
      summary: 'Takes the other side of the blue split.',
      stances: {
        q_blue_split: { accept: ['blue_b'], weight: 2 },
      },
    },
    {
      id: 'blue_lineage',
      name: 'Blue lineage',
      family: 'blue',
      tendency: 'blue_one',
      roster_tier: 'niche',
      lineage: true,
      summary: 'Defined by a lineage; its only position of its own is the shibboleth.',
      stances: {
        // Clearing an inherited stance is not a position of its own, so it is
        // not a shibboleth — but it does let this ideology outrank its parent.
        q_blue_split: null,
        q_shibboleth: { accept: ['shib_yes'], weight: 2 },
      },
    },
  ],
};

const QUESTIONS = {
  questions: [
    {
      id: 'q_family',
      depth: 1,
      kind: 'single_choice',
      tags: ['root'],
      text: 'Which side of the first question do you take?',
      options: [
        { id: 'pick_red', label: 'The red answer.', short: 'red' },
        { id: 'pick_blue', label: 'The blue answer.', short: 'blue' },
        { id: 'pick_neither', label: 'Neither of those two.' },
      ],
    },
    {
      id: 'q_red_split',
      depth: 2,
      kind: 'single_choice',
      tags: ['red'],
      text: 'Inside the red family, which way?',
      options: [
        { id: 'red_a', label: 'The first way.' },
        { id: 'red_b', label: 'The second way.' },
        { id: 'red_c', label: 'Neither, for reasons both sides would recognise.' },
      ],
    },
    {
      id: 'q_red_shared',
      depth: 2,
      kind: 'single_choice',
      tags: ['red'],
      text: 'A question both sides of the red family answer the same way.',
      options: [
        { id: 'shared_yes', label: 'Yes, and firmly so.' },
        { id: 'shared_no', label: 'No, and firmly so.' },
        { id: 'shared_maybe', label: 'Hard to say either way.' },
      ],
    },
    {
      id: 'q_blue_split',
      depth: 2,
      kind: 'single_choice',
      tags: ['blue'],
      text: 'Inside the blue family, which way?',
      options: [
        { id: 'blue_a', label: 'The first way.' },
        { id: 'blue_b', label: 'The second way.' },
        { id: 'blue_c', label: 'Neither.' },
      ],
    },
    {
      id: 'q_shibboleth',
      depth: 3,
      kind: 'single_choice',
      tags: ['blue', 'lineage'],
      text: 'The question only one tradition takes a position on.',
      options: [
        { id: 'shib_yes', label: 'Yes, as that tradition puts it.' },
        { id: 'shib_no', label: 'No.' },
        { id: 'shib_maybe', label: 'It depends on the case.' },
      ],
    },
    {
      id: 'q_eco',
      depth: 1,
      kind: 'likert5',
      tags: ['ecology'],
      text: 'We should use less stuff, even if we grow less.',
      modifier_tags: {
        strongly_agree: 'ecology',
        agree: 'ecology',
      },
    },
    {
      id: 'q_tech',
      depth: 1,
      kind: 'single_choice',
      tags: ['technology'],
      text: 'A question no ideology in this roster takes a position on.',
      options: [
        { id: 'tech_yes', label: 'Build it and use it.' },
        { id: 'tech_no', label: 'Do without it entirely.' },
        { id: 'tech_maybe', label: 'Depends what it is for.' },
      ],
      modifier_tags: {
        tech_yes: 'technology',
      },
    },
  ],
};

export type RosterDocs = {
  groups: typeof GROUPS;
  families: typeof FAMILIES;
  ideologies: typeof IDEOLOGIES;
  questions: typeof QUESTIONS;
};

export function rosterDocs(): RosterDocs {
  return structuredClone({
    groups: GROUPS,
    families: FAMILIES,
    ideologies: IDEOLOGIES,
    questions: QUESTIONS,
  });
}

export function rosterContent(mutate?: (docs: RosterDocs) => void): Content {
  const docs = rosterDocs();
  mutate?.(docs);
  const loaded = parseContent({
    groups: stringify(docs.groups),
    families: stringify(docs.families),
    ideologies: stringify(docs.ideologies),
    questions: stringify(docs.questions),
  });
  if (!loaded.content) {
    throw new Error(`roster fixture is invalid: ${JSON.stringify(loaded.issues, null, 2)}`);
  }
  return loaded.content;
}

/**
 * Most tests want a sect-level answer out of two or three answers, so
 * `minAnswersForSect` defaults low here. Tests about that threshold set it
 * back explicitly.
 */
export function rosterModel(
  config: Partial<EngineConfig> = {},
  mutate?: (docs: RosterDocs) => void,
): EngineModel {
  return buildModel(rosterContent(mutate), withConfig({ minAnswersForSect: 2, ...config }));
}
