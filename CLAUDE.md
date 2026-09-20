# CLAUDE.md — Leftist Ideology Test

Working instructions for this repo. Read `SPEC.md` first; it is the source of
truth for *what* is being built. This file covers *how* to work in the repo.

**Stack:** Vite + TypeScript + Svelte 5. No backend. All logic client-side in
pure functions. Content in YAML under `/content`, validated with Zod. Vitest for
tests. Dev scripts in `/scripts`.

---

## Commands

Built:

| Command | What it does |
| --- | --- |
| `npm run validate` | Zod schema + referential integrity over `/content` (SPEC §10.1) |
| `npm run lint:content` | Design-principle lint over question prose (SPEC §10.2) |
| `npm run coverage` | Stance matrix, pairwise separation, family default fitness (SPEC §5.2a, §10.4, §10.5) |
| `npm run stats` | Bank shape against the ranges in SPEC §9 |
| `npm run trace` | Step through one simulated session, printing why each question was chosen (`--mode`, `--as <ideology>`) |
| `npm run roster:todo` | Regenerates docs/roster-todo.md |
| `npm run test` | Vitest, once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run check` | Perfect-respondent recovery per ideology, through the real flow and resolver (`--mode quick\|standard\|deep`, `--family`, `--ideology`). Exits non-zero on any failure |
| `npm run typecheck` | `tsc --noEmit`, then `svelte-check --fail-on-warnings` |
| `npm run dev` | Vite dev server on the real `/content` |
| `npm run dev:fixture` | Vite dev server on the six-ideology test roster (`--mode fixture`) |
| `npm run build` / `preview` | Static build to `dist/`, and a local server for it |
| `npm run test:e2e` | Playwright, against the fixture roster; uses installed Chrome (`PW_CHANNEL`) |
| `npm run ci` | `validate`, `lint:content`, `typecheck`, `test`, `build`, `test:e2e`, in that order |

Planned, in roughly this order:

| Command | What it will do |
| --- | --- |
| `npm run simulate` | Ideal-type recovery simulation + confusion matrix (SPEC §10.3) |
| `npm run lint` / `format` | ESLint + Prettier |

`npm run ci` is what CI runs and what must pass before anything is considered
done; add each command above to it as it lands. Run `ci` before saying a piece
of work is finished.

`npm run check` is not in `ci` yet, and should join it only when it passes in
the mode CI runs. It reports what the *content* can recover, so a failure is a
content decision — a wrong stance, a missing question, or a pair to record —
never a weight to nudge (rule 4 below). Its own line says so on every run: this
shows the encoded stances are separable, not that they are correct. It is the
minimal form of `npm run simulate` (SPEC.md §10.3) and should be folded into it
when that lands.

Package manager: npm. Node 20+.

Common flags: `--json` for machine-readable output on every tool; `--quiet` and
`--strict` on `validate` and `lint:content`; `--rule <code>` on `lint:content`;
`--family <id>`, `--all` and `--no-matrix` on `coverage`.

`validate` and `lint:content` gate CI. `coverage` and `stats` report and never
fail: what they surface is a content decision, and a tool that failed the build
for an unseparated pair or a misfitting default would push people to close the
gap by nudging a weight, which is exactly what content rule 4 forbids.

---

## Folder layout

```
/content                    all authored content; no code
  families.yaml             families + the default stances members inherit
  ideologies.yaml           ideologies, their tree position, their own stances
  questions.yaml            the question bank
  lint/
    named-entities.txt      people, events, organisations banned from prose
    jargon.txt              terms needing a tooltip, banned from stems
    loaded-words.txt        language that tells the respondent what to think
  (planned) config.yml      engine tunables (beta, thresholds, budgets)
  (planned) glossary.yml    term -> plain-language definition, used by tooltips

/src
  content/
    schema.ts               Zod schemas; every TS type is z.infer of one
    load.ts                 parse, normalise, index, resolve inheritance
    validate.ts             cross-record checks (pure; returns Issue[])
    lint.ts                 design-principle lint (pure; SPEC §11)
    coverage.ts             stance matrix, pairwise separation, default fitness (pure)
    stats.ts                bank shape against the SPEC §9 budgets (pure)
  engine/                   pure scoring and resolution; no I/O, no randomness
    config.ts               tunables, with the reasoning for each default
    model.ts                priors, likelihood tables, the ideology tree
    posterior.ts            replay, the within-scope update, aggregation
    resolve.ts              tree back-off, the lineage gate, contributions
    explain.ts              explainMatch, modifierTags
    session.ts              answers, back/edit, URL serialisation
    flow.ts                 nextQuestion: gating, follow-ups, EIG, modifier quota
    perfect-respondent.ts   ideal-type recovery: answer as an ideology, judge the result
    index.ts                the barrel; import from here, not from within
  lib/                      the UI's view-model: pure, unit-tested, no DOM
    quiz.ts                 quiz state as an action log; transitions, Back, views
    result-view.ts          result page formatting over resolve/explainMatch
    text.ts                 interpolation, quoting earlier answers, percentages
    shuffle.ts              seeded per-session option order
    quiz-store.svelte.ts    the one session store (runes); memory only
  app/content-source.ts     the YAML inlined at build (alias `$content-source`)
  components/               Svelte components, presentational
  styles/                   tokens.css (design tokens), global.css
  App.svelte, main.ts       the shell and the entry point

/scripts                    node/tsx dev scripts, one per npm command
  report.ts                 shared terminal output: colours, tables, issues
  validate.ts               reads the files, prints issues, sets the exit code
  lint-content.ts           prose lint, with a by-rule summary and waiver census
  coverage.ts               matrix, separation report, default fitness
  stats.ts                  bank statistics
  trace.ts                  one simulated session, with selection reasons
  check.ts                  perfect-respondent recovery per ideology, by mode
  roster-todo.ts            regenerates docs/roster-todo.md from the content
/tests
  fixtures/base.ts          a minimal valid content set + helpers to break it
  fixtures/broken/*.yaml    whole files broken on purpose, one defect each
  fixtures/content-source.ts  the test roster as app content, for --mode fixture
  e2e/*.spec.ts             Playwright; runs the built UI on the fixture roster
  *.test.ts                 cross-cutting tests; unit tests sit next to source
/docs
  content-log.md            one line per content change (see below)
  inseparable.md            pairs no honest question could separate
  coverage-gaps.md          ideologies the bank cannot yet reach, and why
  roster-decisions.md       tiering, dual-family calls, proposed tendency parents
  roster-purged.md          what is deliberately off the roster, and why
  roster-todo.md            GENERATED — stance coverage per ideology
  question-blueprint.md     the reasoning behind the planned bank
  question-inventory.md     one row per planned question — the authoritative count
  review/boundary-stance-notes.md  stances the author is unsure of; add rows while authoring
  (planned) taxonomy.md     human-readable tree with one-line glosses
```

Content lives in three flat files while the bank is small. Split them by family
when a file stops being navigable, not before — the loader takes YAML text, so
the split is a change to `scripts/validate.ts` and nothing else.

Rules about layout:

- **Nothing in `/content` imports code, and nothing in `/src/engine` reads
  content from disk.** The engine imports content *types* and takes a parsed
  `Content` as an argument, which is what makes it testable against a hand-built
  roster instead of the real bank.
- Unit tests live beside the file they test (`eig.ts` / `eig.test.ts`). `/tests`
  is for integration, golden and simulation-adjacent tests.
- `/scripts` may use Node APIs. `/src` may not — it must run in a browser with no
  polyfills.

---

## Code conventions

**TypeScript**

- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`; use `unknown` plus
  a narrowing guard.
- Types are derived from Zod schemas (`type Question = z.infer<typeof QuestionSchema>`),
  never hand-written in parallel. One source of truth per shape.
- Discriminated unions over optional-field soup (`Result` is
  `{ kind: 'resolved' } | { kind: 'undecided' }`, SPEC §8.2).
- No classes. Modules exporting functions, plus plain data.
- Branded id types (`NodeId`, `QuestionId`, `OptionId`) so ids can't be crossed.

**Engine purity** — non-negotiable, this is the whole architecture:

- No `Date.now()`, no `Math.random()`, no `localStorage`, no `fetch`, no
  `console` inside `src/engine/`. Anything time- or randomness-dependent is
  passed in. There is currently no randomness in the engine at all; if the
  simulation harness needs some, it takes a seeded generator as an argument and
  never reaches for a global.
- Every walk over the tree terminates by construction *and* carries a bound.
  `resolve` descends strictly, but it still counts its steps: a pure function
  handed malformed content must return, not hang.
- No mutation of inputs. Return new objects. The posterior is immutable; a new
  answer produces a new posterior.
- **Answers are the source of truth; the posterior is derived.** Going back and
  changing an answer recomputes from the full answer list. Never incrementally
  un-apply an update.
- Every engine function is total: defined for empty content, empty answers,
  zero-leaf scopes, and all-zero stances. No throwing on valid-but-degenerate
  input.

**Svelte**

- Svelte 5 runes (`$state`, `$derived`, `$props`). No legacy stores except one
  session store, which owns mode and persistence and delegates every answer
  operation to the pure helpers in `src/engine/session.ts`. It holds answers and
  derives the posterior; it never stores a posterior of its own.
- Components are presentational. Any logic worth testing belongs in `src/lib`.
- Scoped component CSS. Design tokens in `src/styles/tokens.css`. No CSS
  framework, no runtime CSS-in-JS.
- Accessibility is part of "works": real buttons and radios, labels tied to
  inputs, visible focus, tooltips reachable by keyboard and touch (never
  hover-only), `aria-live` on question transitions.

**Naming and ids**

- Files `kebab-case.ts`; Svelte components `PascalCase.svelte`.
- **Every content id is lowercase snake_case** (`ID_PATTERN` in `schema.ts`),
  with no punctuation of any kind. Question ids carry their depth as a prefix
  (`d1_state_role`, `d3_dissent_after_revolution`); option, ideology, family and
  tag ids are bare (`smash_and_replace`, `cliffism`, `left_communism`).
  Ideology ids are flat, not paths — the tree comes from the `family` and
  `tendency` fields, so an ideology can be re-parented without renaming it.
- Ids are permanent, and they are the share-URL format. Renaming one silently
  invalidates every link anyone has saved, so it is a breaking content change:
  update every reference, run `npm run validate`, and log it.

**Testing**

- Vitest. Unit-test every engine function, including boundaries.
- Engine tests use small hand-built fixtures, not the real content bank —
  `tests/fixtures/roster.ts` is 6 ideologies whose numbers can be worked out by
  hand. A unit test that depends on the bank will break every time the bank
  grows, which trains people to stop reading failures.
- The one exception is `tests/engine-content.test.ts`, which asserts the
  near-neighbour pairs SPEC §1 names as the success criterion. It is a stand-in
  for `npm run simulate` and should be folded into it when that lands.
- When an engine test fails, work out whether the assertion or the engine is
  wrong before touching either. Several of these tests were wrong first.
- Golden test on selection determinism: the same `(content, answers, mode)` must
  yield the same next question.
- No snapshot tests of prose. Assert on behaviour.

**Errors**

- Content errors are caught at validate time, not runtime. The app assumes
  content is valid because CI proved it.
- User-facing failure states still exist (corrupt saved session, unparseable URL
  fragment) and must degrade to "start over", never to a blank screen.

**Comments**

- Comment the *why*, especially where the maths is non-obvious (the within-scope
  update in SPEC §5.3, the back-off thresholds in §8.1). Do not narrate the code.

---

## Content rules

These govern everything under `/content`. They matter more than the code
conventions, because the quality of this project is the quality of its content.

1. **Claude writes all content in `/content`** — question text, options,
   tooltips, follow-ups and ideology stances — following the design principles in
   `SPEC.md` §11. Those ten principles are binding and must not be paraphrased
   away. Read them before writing a single question.

2. **Every content change must pass `npm run validate` and `npm run lint:content`,
   and be logged in `docs/content-log.md` with a one-line reason.** Format:

   ```
   2026-09-18  questions/depth3/trotskyism.yml  +q-war-between-two-such-states
               Separates Cliffism from orthodox Trotskyism on defencism; separability
               for that pair was 1 opposing stance.
   ```

   One line per change, newest last. The reason says *why the content needed to
   change*, not what the diff shows.

3. **Stance weight 3 is reserved for what defines an ideology, and every weight-3
   stance gets a one-line `note` justifying it.** The note says what would change
   about the ideology if the position were reversed. If you can't write that
   sentence, the stance is not a 3. Cap: 6 weight-3 stances per leaf.

3a. **The 75% rule: write a family default for a question only when at least
   about three quarters of the family's members would give that answer with real
   conviction.** Below that, leave the question without a family default and
   author each member's stance individually.

   A default is *inherited* by every member that does not override it. So a
   default a quarter of the family disagrees with is not a convenient shortcut
   that a few members then correct — it is a position put into the mouths of
   ideologies that never held it, and it stays there for every member nobody
   remembered to override. The cost of omitting a default is some repetition.
   The cost of a wrong one is a misrepresentation that looks like content.

   Worked example, and the reason the rule exists: `left_communism` has **no**
   family default on parliamentary participation. Hostility to electoral work is
   the usual shorthand for that family, but De Leonism seeks a political mandate
   at the ballot box, Impossibilism stands candidates, and Luxemburg argued for
   contesting elections against her own party's majority. Three of eight is far
   past the threshold, so that question is authored per member.

   `npm run coverage` reports the override share for every default and warns
   above 30%, and flags any member overriding more than 40% of its family's
   defaults as a candidate misfiling. **A flagged default should usually be
   deleted and authored per member, not reworded until the number moves.**

   Only a *position* override counts: a different `accept` or `reject` set, or a
   `null` clear. Restating the family's exact position at a different weight is
   a **weight-only** difference — shown in its own column, counted toward
   neither threshold. Restating a family position at weight 3 is how a defining
   ideology marks it as a shibboleth, and that is agreement, not dissent.

4. **Never adjust a stance or an option purely to make a simulation pass.** When
   `npm run simulate` or `npm run separability` shows two ideologies failing to
   separate, the only acceptable fixes are:

   - **Add a genuinely distinguishing question** — one that names a real
     disagreement a member of either camp would recognise as the point at issue.
   - **Correct a stance that misrepresents the ideology** — because you got the
     position wrong, not because the number was inconvenient.

   If neither applies, because the two ideologies honestly hold the same
   positions on everything the test can ask about, **say so and record it in
   `docs/inseparable.md`** with the pair, what they share, what (if anything)
   separates them in the world, and why the test can't reach it. Then either
   merge the leaves or accept that the test returns them together.

   Where an ideology is simply under-written rather than genuinely
   indistinguishable — it lacks stances on the questions doing the work — that
   goes in `docs/coverage-gaps.md` instead, with the stances and questions it
   needs. Do not close the gap by raising a weight until the result appears.

   Tuning weights until the matrix looks good produces a test that recovers its
   own assumptions. Doing so is a defect, not a fix, even when every gate goes
   green afterwards.

### Working notes for content

- Write from inside each tradition. Before authoring an option for a camp, be
  able to state that camp's view in a sentence its own members would sign. If an
  option reads as the obviously wrong answer, it is a strawman and principle 5
  fails — rewrite it.
- Prefer a scenario to a proposition. "A new government is defending a revolution
  against real threats…" beats "Is authority ever justified?" every time
  (principle 2).
- Prefer the plain phrasing. If the stem needs the word "invariance" to work, the
  stem is wrong: describe the thing in plain words and put "invariance" in the
  tooltip (principle 6).
- Authoring order that works: taxonomy → `contrasts` on every leaf → depth-1
  questions → depth-2 per family → stances → run `separability` → write depth-3
  questions *aimed at the weakest pairs the report names*. Depth-3 content is
  commissioned by the separability report; it is not written speculatively.
- Use stance inheritance (SPEC §5.2). Author shared positions on the family or
  tendency node and override only where a sect genuinely differs. A leaf whose
  stances are all inherited has not been distinguished from its siblings yet —
  that is a signal, and `npm run coverage` reports it.
- When a question gets cut, cut its stances in the same change. `validate` will
  catch orphans, but leaving them for CI wastes a cycle.

---

## Working agreements

- **Plan before content.** Large content batches get a short plan first — which
  family, which pairs, how many questions, what the separability report said.
- **Don't scaffold ahead of the spec.** If something isn't in `SPEC.md`, either it
  isn't being built or the spec needs changing first. Say which.
- **Report gate results honestly.** If `simulate` drops below a §10.3 threshold,
  say so with the numbers. Never present a partially passing run as passing.
- **The taxonomy can shrink.** Discovering that two leaves are the same ideology
  under two names is a finding, not a failure. Record it and merge.
- No new runtime dependencies without asking. Dev dependencies that serve a gate
  (a YAML parser, a text-analysis helper for the lint) are fine.
- No commits or branches unless asked.
