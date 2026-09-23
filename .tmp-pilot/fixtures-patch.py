import io


def patch(path, edits):
    s = io.open(path, encoding='utf-8').read()
    for old, new in edits:
        assert s.count(old) == 1, (path, s.count(old), old[:70])
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8', newline='').write(s)
    print('patched', path)


# --- tests/fixtures/base.ts -------------------------------------------------
patch('tests/fixtures/base.ts', [
    ("""export interface Docs {
  families: { families: Json[] };""",
     """export interface Docs {
  groups: { groups: Json[] };
  families: { families: Json[] };"""),
    ("""const BASE: Docs = {
  families: {""",
     """const BASE: Docs = {
  groups: {
    groups: [
      {
        id: 'grp_one',
        name: 'Group one',
        description: 'A group that holds both families, so the tree has a level above them.',
      },
    ],
  },
  families: {"""),
    ("""        id: 'fam_a',
        name: 'Family A',""",
     """        id: 'fam_a',
        name: 'Family A',
        group: 'grp_one',"""),
    ("""        id: 'fam_b',
        name: 'Family B',""",
     """        id: 'fam_b',
        name: 'Family B',
        group: 'grp_one',"""),
    ("""export function toRaw(d: Docs): RawContent {
  return {
    families: stringify(d.families),""",
     """export function toRaw(d: Docs): RawContent {
  return {
    groups: stringify(d.groups),
    families: stringify(d.families),"""),
    ("""export const fam = (d: Docs, id: string): Record_ => find(d.families.families, id, 'family');""",
     """export const fam = (d: Docs, id: string): Record_ => find(d.families.families, id, 'family');
export const grp = (d: Docs, id: string): Record_ => find(d.groups.groups, id, 'group');"""),
])

# --- tests/fixtures/roster.ts ----------------------------------------------
patch('tests/fixtures/roster.ts', [
    ("""const FAMILIES = {
  families: [
    {
      id: 'red',
      name: 'The red family',""",
     """const GROUPS = {
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
      group: 'warm',"""),
    ("""      id: 'blue',
      name: 'The blue family',""",
     """      id: 'blue',
      name: 'The blue family',
      group: 'cool',"""),
    ("""  families: typeof FAMILIES;
  ideologies: typeof IDEOLOGIES;
  questions: typeof QUESTIONS;
};

export function rosterDocs(): RosterDocs {
  return structuredClone({ families: FAMILIES, ideologies: IDEOLOGIES, questions: QUESTIONS });
}""",
     """  groups: typeof GROUPS;
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
}"""),
    ("""  const loaded = parseContent({
    families: stringify(docs.families),""",
     """  const loaded = parseContent({
    groups: stringify(docs.groups),
    families: stringify(docs.families),"""),
])

# --- tests/fixtures/content-source.ts --------------------------------------
patch('tests/fixtures/content-source.ts', [
    ("""export const rawContent: RawContent = {
  families: stringify(docs.families),""",
     """export const rawContent: RawContent = {
  groups: stringify(docs.groups),
  families: stringify(docs.families),"""),
])

# --- src/app/content-source.ts ---------------------------------------------
patch('src/app/content-source.ts', [
    ("""import type { RawContent } from '../content/load.js';
import families from '../../content/families.yaml?raw';
import ideologies from '../../content/ideologies.yaml?raw';
import questions from '../../content/questions.yaml?raw';

export const rawContent: RawContent = { families, ideologies, questions };""",
     """import type { RawContent } from '../content/load.js';
import groups from '../../content/groups.yaml?raw';
import families from '../../content/families.yaml?raw';
import ideologies from '../../content/ideologies.yaml?raw';
import questions from '../../content/questions.yaml?raw';

export const rawContent: RawContent = { groups, families, ideologies, questions };"""),
])

# --- scripts/report.ts ------------------------------------------------------
patch('scripts/report.ts', [
    ("""  return parseContent({
    families: readFile('content/families.yaml'),""",
     """  return parseContent({
    groups: readFile('content/groups.yaml'),
    families: readFile('content/families.yaml'),"""),
])

# --- scripts/roster-todo.ts -------------------------------------------------
patch('scripts/roster-todo.ts', [
    ("""    families: read('content/families.yaml'),""",
     """    groups: read('content/groups.yaml'),
    families: read('content/families.yaml'),"""),
])

# --- test files that read the real content ---------------------------------
for path in ['tests/content.test.ts', 'tests/engine-content.test.ts']:
    patch(path, [
        ("""  families: read('content/families.yaml'),""",
         """  groups: read('content/groups.yaml'),
  families: read('content/families.yaml'),"""),
    ])

# --- test files that stringify roster docs ---------------------------------
for path in ['tests/coverage.test.ts', 'tests/fitness.test.ts', 'tests/inseparable.test.ts',
             'tests/lint.test.ts']:
    s = io.open(path, encoding='utf-8').read()
    old = """    families: stringify(docs.families),"""
    new = """    groups: stringify(docs.groups),
    families: stringify(docs.families),"""
    assert s.count(old) >= 1, path
    s = s.replace(old, new)
    old2 = """parseContent({ families: 'not: valid', ideologies: '', questions: '' })"""
    new2 = """parseContent({ groups: '', families: 'not: valid', ideologies: '', questions: '' })"""
    s = s.replace(old2, new2)
    io.open(path, 'w', encoding='utf-8', newline='').write(s)
    print('patched', path)
