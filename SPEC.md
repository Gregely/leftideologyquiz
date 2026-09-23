# SPEC — Leftist Ideology Test

Working title: **Leftist Ideology Test**
Status: draft for review. No code exists yet.
Audience: whoever implements this (human or Claude). Read alongside `CLAUDE.md`.

---

## 1. Goal

Build a static web test that places a respondent at a specific point in the
landscape of leftist thought — including the parts of it that are one sect wide.

The success criterion is **near-neighbour discrimination**, not axis placement.
The test is working when it can reliably separate pairs that differ on one or
two real questions and agree on everything else:

Every pair below is on the roster in `content/ideologies.yaml`, by the ids given.
That is a standing constraint on this table, not an incidental fact: a criterion
naming an ideology the test cannot return is a criterion nothing can be measured
against.

| Pair | What actually separates them |
| --- | --- |
| `council_communism` vs `bordigism` | Whether the revolutionary organ is the mass workers' council (elected, recallable, sovereign) or the disciplined programmatic party, which does not take its line from majority sentiment |
| `cliffism` vs `orthodox_trotskyism` | Whether a bureaucratically-run planned economy is a form of capitalism, or a workers' state that has gone wrong but is still worth defending against capitalist states |
| `mao_zedong_thought` vs `marxism_leninism_maoism` | Whether Maoism is a national application of Marxism–Leninism or a third and higher stage of it, with people's war as a universally applicable strategy rather than one suited to a peasant country |
| `anarcho_communism` vs `anarcho_syndicalism` | Whether the union at the point of production is *the* vehicle of both struggle and post-revolutionary administration, or one vehicle among neighbourhood and communal forms |
| `classical_social_democracy` vs `democratic_socialism` | Whether the goal is a permanently mixed economy with a strong welfare floor, or the eventual replacement of private ownership of major productive assets, reached by electoral means |
| `mutualism` vs `market_socialism` | Whether firms are worker-owned inside a market the state regulates, or property rests on occupancy-and-use with credit socialised and no state to regulate anything |

A test that answers "you are a libertarian socialist, 72% left, 65% liberty"
has failed this spec, even if the answer is true.

### 1.1 Honest uncertainty over false precision

The second, equally binding goal: the test must **know when it cannot tell**.

If a respondent's answers do not actually distinguish council communism from
Bordigism, the correct output is the left-communist node plus both candidates
and a plain statement of what would separate them — not a coin flip presented as
a result. Returning a less specific but true answer is a success. Returning a
more specific but arbitrary one is a failure, and the simulation harness (§10.3)
scores it as one.

### 1.2 Axes

Latent axes (state/anti-state, market/plan, vanguard/mass, reform/rupture,
productivist/ecological, universalist/particularist) may be computed and shown as
secondary colour on the result page. They are never the primary output and are
never used to select a question or resolve a result. They are a summary of the
posterior, not an input to it.

---

## 2. Ideology model

### 2.1 Shape

A four-level tree. Every scored entity is a **leaf**; interior nodes exist so
the test can back off to them.

```
group          6 nodes    "revolutionary_socialist"
  family      13 nodes    "Trotskyism"
    tendency  ~8 nodes    "orthodox_trotskyism"
      sect    93 leaves   "cliffism"
```

Some families are effectively two levels deep (a tendency with one leaf), and
some groups hold one family. That is allowed; the resolver collapses
single-child chains when reporting (§8.1).

**Why groups exist.** Tier-1 questions (§3.3) cannot separate 13 families. Four
of them — Marxism–Leninism, Maoism, Trotskyism and left communism — agree on
every everyday value a respondent holds, and differ on the party, the
peasantry, the bureaucracy and the councils, none of which has an everyday
form. Returning one of those four to a Quick respondent would be exactly the
false precision §1.1 exists to prevent. Returning the group they share is true,
and Standard mode then takes it further. Groups live in `content/groups.yaml`
and each family names one.

### 2.2 The family list

The live taxonomy is `content/ideologies.yaml`. `npm run coverage` and
`npm run stats` report actual counts, and `docs/roster-todo.md` is regenerated
from the content. The counts below are the roster as it stands, not targets.

| # | Family id | Name | Leaves |
| --- | --- | --- | ---: |
| 1 | `early_socialism` | Pre-Marxist and early socialism | 4 |
| 2 | `liberal_left` | Liberal left | 3 |
| 3 | `social_democracy` | Social democracy | 7 |
| 4 | `market_socialism` | Market and cooperative socialism | 2 |
| 5 | `post_marxist` | Post-Marxist and new left | 3 |
| 6 | `religious_left` | Religious left | 6 |
| 7 | `anti_colonial` | Anti-colonial and decolonial left | 11 |
| 8 | `national_question` | National-question left | 7 |
| 9 | `marxism_leninism` | Marxism–Leninism and descendants | 12 |
| 10 | `maoism` | Maoism | 7 |
| 11 | `trotskyism` | Trotskyism | 9 |
| 12 | `left_communism` | Left communism and autonomism | 8 |
| 13 | `anarchism` | Anarchism | 14 |
| | | **Total** | **93** |

Family ids are load-bearing — `requires: family_mass_gte` clauses in
`content/questions.yaml` refer to them — so an existing family's id never
changes even when its display name does.

Two families were dissolved or split on the evidence of §5.2a. The former
`green_and_historical` grouped seven traditions sharing no position on the
state, ownership or strategy, which meant no family default could have been
written for any of them; its members went to `early_socialism`, `post_marxist`,
`market_socialism` and `anarchism`. The former combined anti-colonial family
mixed two different claims — that colonial domination is the structure to break,
and that the nation is the unit of emancipation — which are held by overlapping
but distinct sets of ideologies; it split into `anti_colonial` and
`national_question`.

`market_socialism` has two members and `liberal_left` three. Small families are
allowed, but a family of one cannot have defaults worth writing, and a family of
two can barely meet the 75% rule; both are candidates for merging if they do not
grow.

The roster was purged down from a wider draft. What is deliberately excluded —
single-issue policies, academic lenses, tactics, internet labels, organisations,
and currents that are not left — is recorded with reasons in
`docs/roster-purged.md`, and the tiering, dual-family calls and proposed
tendency parents in `docs/roster-decisions.md`.

Leaves may still be merged or cut during authoring if they cannot be honestly
distinguished (§10.4); the taxonomy shrinking is a finding, not a failure.

### 2.3 Node record

The authoritative shape is `IdeologySchema` in `src/content/schema.ts`; this is
what it looks like in the content.

```yaml
- id: bordigism                              # flat, lowercase snake_case
  name: Bordigism
  aliases: [the Italian communist left]
  family: left_communism
  tendency: null                             # optional: a parent in the same family
  roster_tier: core                          # core | niche | boundary
  lineage: false                             # defined by lineage, not by positions
  boundary: false                            # sits at the edge of the left
  summary: >                                 # one sentence, shown on the result
    ...
  reading: []
  stances:                                   # sparse; inherited, see §5.2
    d3_council_or_programme:
      accept: [programme_prevails]
      reject: [assembly_prevails]
      weight: 3
      note: One line on what would change if this reversed.
```

Ideology ids are flat rather than paths: the tree comes from `family` and
`tendency`, so an ideology can be re-parented without being renamed — and ids
are the share-URL format, so they must not churn.

**Not yet built.** The record above has no `commitments` and no `contrasts`.
`contrasts` is meant to be mandatory and load-bearing: every leaf naming at
least one near neighbour and the position that separates them, with the
validator requiring a question on which the two hold opposing effective stances.
That is the mechanism that stops the taxonomy growing distinctions the test
cannot detect, and until it exists the same job is done after the fact by
`npm run coverage`, which reports every same-family pair with no separating
question. Adding `contrasts` is a schema change plus a validator check, and
should happen before the bank is authored rather than after.

---

## 3. Question model

### 3.1 Record

```yaml
id: q-state-defence-loyal-opposition
depth: 2                     # 1 | 2 | 3
scope: [trotskyism, marxism-leninism, left-communism]   # node ids; see §5.3
kind: single                 # single | likert
stem: >
  A new government is defending a revolution against real armed threats.
  A group of workers loyal to its aims starts organising against its decisions.
  What should it do?
tooltips:
  - term: workers' council
    text: >
      A body of delegates elected directly from workplaces and recallable
      at any time.
tags: [party-and-state, dissent, transition]
weight: 1.0                  # question-level multiplier, 0.5-1.5
history_class: false         # see design principle 3
self_id: false               # see design principle 10
requires: ...                # §7.1
options:
  - id: o-tolerate
    text: >
      Let them organise and argue openly. A revolution that has to suppress its
      own supporters has already lost the thing it was defending.
    follow_ups: ...          # §7.2
  - id: o-suppress-temporarily
    text: >
      Ban the faction while the emergency lasts, and say plainly that it is an
      emergency measure and not a principle.
  - id: o-suppress-permanently
    text: >
      Organised opposition inside the workers' state is how counter-revolution
      gets its foothold. It should not be permitted.
```

Every question carries two implicit options, injected by the engine and never
authored:

- **"I'm not sure"** — recorded, consumes budget, produces no posterior update.
- **"I don't know this term"** — same, and additionally applies a flow-only
  penalty (§7.3) to other questions sharing a glossary term, so a respondent is
  not marched through vocabulary they have told us they don't have. It has **no**
  effect on the posterior in either direction.

### 3.2 Kinds

- `single` — 3 to 6 authored options, exactly one chosen. The default, and most
  of the bank.
- `likert` — one proposition on a 5-point agree/disagree scale.

  **Tier 1 is exempt from the cap, and should mostly use this form.** A likert
  asks the respondent to react to a sentence; a five-option single-choice asks
  them to *recognise five positions*, which is the thing someone with no
  political education cannot do. A tier-1 question is a likert or a 2-3 option
  choice unless a wider set is genuinely needed.

  **Tiers 2 and 3 together are capped at 15% of their combined count**, where
  the old rule applies unchanged: used only where the disagreement really is one
  of degree, and if a question can be written as `single`, it must be. The cap
  is computed over tier-2-plus-tier-3 questions only, so a tier-1 bank that is
  mostly likert cannot push the deeper tiers over it.

Ranking, multi-select and slider questions are out of scope for v1.

### 3.3 Depths

**Depth is a tier: it says what the respondent has to know to answer, not how
fine an ideology distinction the question draws.**

| Tier | Asked in | The respondent needs… | Subject matter | Voice |
| --- | --- | --- | --- | --- |
| **1** | Quick (and above) | **nothing.** No political education, no vocabulary, no interest in politics. | Everyday values and situations: work, healthcare, housing, tax, inheritance, police, protest, unjust laws, the environment, unpaid care, faith, where wealth came from. | Plain. Options state a position; they do not argue for it. |
| **2** | Standard (and above) | **to have thought about politics.** Follows the news, has opinions about governments and movements, has no factional vocabulary. | How change should happen; what to do with the state; markets and plans; parties, unions and movements; nation and empire. | Plain words. Any technical term is explained inline in **under 8 words**. |
| **3** | Deep | **to know left debates.** Can tell a council from a party and knows why it matters. | Near-neighbour separation inside a family or tendency. | Concrete invented scenarios, camp-voice options, the history-class allowance. |

Depth is a property of the question, not of when it is asked. A depth-3 question
may be asked early if its gating is satisfied and its information gain is high —
that is the point of adaptive selection.

**Why the rule changed.** Depth used to be defined by which level of the tree a
question's answer moved: depth 1 split families, depth 2 split branches within
one, depth 3 separated near-neighbours. Nothing in that test asked whether a
respondent could answer. The dimensions that best separate 13 families are
movement-theory dimensions — the party, the revolutionary agent, the state
machinery, the transition — so depth 1 filled with them, and Quick mode asked a
newcomer to hold positions on questions they had never been asked. Of the 46
depth-1 questions that produced the complaint, 28 were about how movements and
states should be organised. The full argument and measurements are in
docs/redesign.md.

**Consequences worth knowing.** Tier 1 cannot separate 13 families: four of them
agree on every everyday value a respondent holds. Quick therefore reports a
**broad group** (§2.1, §8.1) and never a family or a sect. Because tier decides
which mode asks a question, it changes what respondents see — a tier-3 question
is never asked in Standard mode. In a family where every member descends from
one tendency (Trotskyism), Standard resolves to that tendency and only Deep
separates the sects. Close calls are listed in docs/question-inventory.md.

---

## 4. Modes

| Mode | Max depth | Question budget | Target resolution |
| --- | --- | --- | --- |
| Quick | 1 (plus up to 3 tier-2 questions of exceptional gain) | 12–15 | **Broad group. Never a family, never a sect.** |
| Standard | 2 | 25–35 | Tendency, or a flat family's member |
| Deep | 3 | up to 60 | Sect, with honest back-off |

Each mode carries a `maxReportLevel` alongside its depth cap — `group`,
`tendency`, `sect` — and the resolver will not name anything deeper, however the
evidence falls (§8.1). This is what stops Quick returning a sect on twelve
everyday questions because the thresholds happened to clear.

Quick allows a small number of depth-2 questions because some family boundaries
are genuinely settled by a question that also does depth-2 work; the cap keeps it
from becoming a short Standard run.

**Escalation.** After any result, the respondent can continue. The session keeps
its full answer history and posterior; escalation raises the depth cap and budget
and resumes the selection loop. No question is ever re-asked, and escalating from
Quick must never discard Quick's answers.

---

## 5. Scoring engine

All of §5 is pure: `(content, answers) -> posterior`. No I/O, no clock, no global
RNG. Same inputs, same output, always.

### 5.1 Stances

A **stance** is one ideology's position on one option of one question.

```yaml
- ideology: trotskyism/state-capitalist/cliffism
  question: q-nature-of-bureaucratic-planned-economy
  option: o-new-exploiting-class-capitalism
  weight: 3
  note: >
    Defining. Reverse this and the tendency's entire position on which states
    to defend, and on what socialism is, changes with it.
```

`weight` is an integer in `-3..3`.

| Weight | Meaning |
| --- | --- |
| 3 | Defining. Remove this position and the ideology is a different ideology. **Requires a `note`.** |
| 2 | Characteristic. Held by essentially everyone in this current. |
| 1 | Leans this way. |
| 0 | No position / unstated — the default for anything not authored. |
| -1..-3 | Mirror of the above, in opposition. -3 also requires a `note`. |

Weight 3 is scarce by construction. The content lint caps weight-3 stances at
**6 per leaf** and requires the `note` to say what would change if the position
were reversed.

### 5.2 Stance inheritance

Authoring 93 ideologies × 300 questions × 5 options by hand is not possible, and
would not be honest if it were. Stances are therefore **sparse and inherited**:

- A stance may be authored on any node — family, tendency or sect.
- A leaf's effective stance for `(question, option)` is the one on the nearest
  ancestor (including itself) that declares it.
- A descendant overrides an ancestor by declaring its own weight.
- A descendant declares `weight: null` to mean "this ancestor's stance does not
  apply to me; I have no position here". The distinction that makes a sect a sect
  is often exactly this.

The validator resolves inheritance and exports the effective stance matrix.
Nothing downstream ever sees the unresolved form.

### 5.2a When a family default may be written — the 75% rule

**A family default is written for a question only when at least about three
quarters of the family's members would give that answer with real conviction.**
Below that threshold the question gets no family default, and every member's
stance on it is authored individually.

The rule follows from inheritance being silent. A default applies to every
member that does not override it, so a default a quarter of the family rejects
is not a shortcut that a few exceptions then correct — it is a position
attributed to ideologies that never held it, and it stays attributed for every
member nobody remembered to override. Omitting a default costs some repetition.
Writing a wrong one produces a misrepresentation shaped exactly like content,
which the engine will then score.

The worked case is `left_communism`, which has **no** family default on
parliamentary participation. Hostility to electoral work is the usual shorthand
for that family, but De Leonism seeks a political mandate at the ballot box,
Impossibilism stands candidates, and Luxemburg argued for contesting elections
against her own party's majority — three of eight, far past the threshold.

Enforcement is by report rather than by gate. `npm run coverage` prints a family
default fitness section: the override share for each default, warning above
**30%**, and each member's share of its family's defaults overridden, flagging
above **40%** as a candidate misfiling. Neither fails the build, because the
right response to a flagged default is a judgement — usually deleting it and
authoring per member, never rewording it until the number moves.

**What counts as an override.** Only a *position* difference: a member whose
effective `accept` or `reject` set differs from the default's, or who clears the
default with `null`. A member that accepts and rejects exactly what the default
does but at a different weight is a **weight-only** difference. The report shows
weight-only differences in their own column and counts them toward neither
threshold.

The distinction matters because weight is how a stance says how much a position
matters to an ideology, not what the position is. A defining ideology routinely
restates a family position at weight 3 to make it a shibboleth — the family
holds it, this sect is *defined* by it. Counting that as an override would
report the default as misfitting precisely where it fits best, and push authors
to weaken defaults that are working.

A member flagged at 40% is evidence about the *taxonomy*, not only the stances:
an ideology described mostly by its exceptions is usually in the wrong family.

### 5.3 Likelihood and update

For question `q` with options `O` and scope `S` — the set of leaves at or under
the nodes in `q.scope`; an absent `scope` means all leaves:

For `i ∈ S`:

```
P(o | i, q) = softmax over O of ( β · w(i, q, o) )        β = 0.9 (config)
```

For `likert`, the five points are treated as five options with weights
interpolated from the authored agree/disagree weight.

**Within-scope update.** A question authored to separate Trotskyist tendencies is
evidence about *which* Trotskyist you are; it is not evidence about whether you
are a Trotskyist at all. So the update leaves the S vs ¬S mass ratio untouched
and redistributes only inside S:

```
for i ∈ S:   logp[i] += q.weight · log P(o | i, q)
for i ∉ S:   logp[i] += q.weight · log Pbar(o | S)

Pbar(o | S) = Σ_{i∈S} P(i)·P(o | i, q)  /  Σ_{i∈S} P(i)      (scope average)
```

This is the clean way to have family-specific questions without letting them act
as silent cross-family evidence. Depth-1 questions normally carry no `scope` and
update everything.

"I'm not sure" and "I don't know this term" multiply by 1 for every ideology —
literally no update.

### 5.4 Priors

Uniform over leaves by default. A leaf may declare `prior` in `[0.5, 1.5]`,
documented to encode **answer-space breadth only** — how wide a range of answer
patterns the ideology is compatible with. Never popularity, never historical
importance, never the author's opinion of it. Every non-default prior needs a
one-line justification in the node record, and `npm run lint:content` fails
without one. Most leaves should keep 1.0.

### 5.5 Aggregation

A node's posterior is the sum of its descendant leaves' posteriors, computed once
per update and cached on the session.

### 5.6 Pure function surface

```
src/lib/engine/
  posterior.ts   applyAnswer(state, question, answer, index) -> Posterior
                 aggregate(posterior, tree) -> NodePosterior
  entropy.ts     entropy(posterior) -> bits
  eig.ts         expectedInfoGain(question, posterior, index) -> bits
  gating.ts      isEligible(question, session, nodePosterior) -> boolean
  select.ts      selectNext(session, posterior, index) -> Question | null
  resolve.ts     resolve(posterior, tree, config) -> Result
  stop.ts        shouldStop(session, posterior, index) -> StopReason | null
```

---

## 6. Expected information gain

For each eligible unasked question `q`:

```
EIG(q) = H(P) − Σ_{o ∈ O} P(o) · H(P | o)

P(o) = Σ_i P(i) · P(o | i, q)          (marginal over the CURRENT posterior)
H    = Shannon entropy over leaves, in bits
```

Marginalising over the current posterior is what makes the selection adaptive
without hand-written rules: a Trotskyist-internal question scores near zero for a
respondent who currently looks like an anarchist, because under that posterior
almost all the probability mass is outside its scope and the question moves
nothing.

Implicit "unsure" options are excluded from the sum — they carry no information
by construction. Cost is O(questions × leaves × options) ≈ 300 × 93 × 5 ≈ 1.4·10⁵
operations per selection; trivial, but per-question likelihood tables are still
precomputed at load.

Selection uses EIG **modulated** by authored intent (§7.3), never EIG alone.

---

## 7. Flow mechanisms

Three mechanisms, in strict precedence: forced follow-ups, then gating as a hard
filter, then adaptive ranking over whatever survives.

### 7.1 Gating — `requires`

A small, total, declarative expression language. No arbitrary code, no
interpolated strings, fully checkable by the validator.

```yaml
requires:
  all:
    - { answered: q-state-and-revolution, is: o-smash-and-replace }
    - any:
        - { node: left-communism, min_mass: 0.15 }
        - { node: anarchism-social, min_mass: 0.15 }
    - not: { answered: q-council-vocabulary, is: o-dont-know }
```

Atoms:

| Atom | Meaning |
| --- | --- |
| `{ answered: <q-id>, is: <opt-id> }` | That question was answered with that option |
| `{ answered: <q-id>, in: [<opt-id>, ...] }` | ...with any of those options |
| `{ answered: <q-id> }` | Answered at all (not unsure/don't-know) |
| `{ node: <node-id>, min_mass: <0..1> }` | That node's aggregate posterior is at least this |
| `{ node: <node-id>, max_mass: <0..1> }` | ...at most this |
| `{ unlocked: <q-id> }` | Satisfied by an `unlock` follow-up (§7.2) |
| `{ mode_at_least: quick\|standard\|deep }` | Current mode |
| `{ answered_count_min: <n> }` | At least n scoring answers so far |

Combinators: `all`, `any`, `not`. An absent `requires` means eligible.

**Rule:** every `depth: 3` question and every ideology-specific question MUST
carry a `requires` clause that establishes relevance before it can be asked
(design principle 8). The content lint enforces this.

**As implemented** (`ConditionSchema` in `src/content/schema.ts`), the atoms are
fewer than the table above: `{ answered: { <q-id>: [<opt-id>…] } }`,
`{ family_mass_gte: { <family-id>: n } }` and `{ depth_unlocked_gte: n }`, with
`all`, `any` and `not`. `unlock` follow-ups grant eligibility directly rather than
through an `unlocked` atom. None of the atoms can see the resolver's result or how
mass is spread *within* a family.

**Self-identification gating.** That limit matters for principle 10's
self-identification questions, which were meant to be asked "only when the
positions have run out" — an `undecided` result within the family. `requires`
cannot express that. The gate is instead:

```yaml
requires:
  all:
    - depth_unlocked_gte: 3
    - family_mass_gte: { <family>: 0.5 }
```

and the "positions have run out" part is left to selection: a self-ID question's
stances sit only on that family's members at weight ≤ 1, so its information gain
is small while one member clearly leads and largest when members are tied. If
simulation shows that to be too loose, the fix is a new atom such as
`undecided_within: <family>` that reads the resolver's result — a schema and
engine change, proposed but not made.

### 7.2 Authored follow-ups — `follow_ups`

Declared on an **option**, because a follow-up is a response to what someone just
said.

```yaml
options:
  - id: o-new-exploiting-class-capitalism
    text: ...
    follow_ups:
      - { question: q-war-between-two-such-states, mode: force }
      - { question: q-what-would-a-workers-state-look-like, mode: boost, boost: 2.0 }
      - { question: q-self-id-trotskyist-traditions, mode: unlock }
```

| Mode | Effect |
| --- | --- |
| `force` | Pushed onto the forced queue and asked next, ahead of everything, provided its own `requires` still holds and the depth cap allows it. If gating blocks it, it is dropped, not deferred. |
| `boost` | Multiplies the question's selection score by `boost` (default 1.5, range 1.1–3.0) for the rest of the session. Boosts from multiple sources multiply, capped at 4.0. |
| `unlock` | Satisfies `{ unlocked: <q-id> }` for that question — the mechanism by which ideology-specific questions become askable. |

The forced queue is FIFO and capped at 3 pending; a `force` beyond that degrades
to `boost: 3.0`, so a chain of authored follow-ups can never hijack a session.

**Writing rule (also principle 9):** a `force` follow-up must read as the natural
next thing to ask. It may quote the previous answer — "You said a state like that
is really a form of capitalism. Then when two of them go to war…" — and must
never read as the next field of a form.

### 7.3 Adaptive selection

```
selectNext(session, posterior):
  1. if forcedQueue non-empty:
       pop until one passes gating and the depth cap; return it
  2. pool = questions where
       not already asked
       and depth <= mode.maxDepth   (Quick: depth 2 allowed while quickDepth2Used < 3)
       and isEligible(q, session, nodePosterior)
  3. if pool is empty: return null                     -> stop reason "exhausted"
  4. score(q) = EIG(q) · q.weight · boost(q) · diversity(q) · depthPref(q)
  5. return argmax score, ties broken by lowest id     (determinism)
```

- `diversity(q)` — multiplicative penalty: ×0.6 if the previous question shared a
  primary tag, ×0.8 if two of the last three did, ×0.5 if the respondent answered
  "I don't know this term" on a question sharing a glossary term. Flow only; it
  never touches the posterior.
- `depthPref(q)` — ×1.15 for depth-1 questions during the first five questions,
  so the opening does not dive into sectarian minutiae before the field has been
  narrowed.

Selection is deterministic given `(content, answers, mode)`. There is no
randomness anywhere in the engine. If between-session variety is ever wanted, it
comes from a seeded RNG passed in explicitly, and never in tests.

**As built** (`src/engine/flow.ts`, `nextQuestion`). The forced queue, boosts,
unlocks and modifier coverage are *derived from the answer list on every call*,
exactly like the posterior, so back and share-URLs reproduce the same next
question. Two simplifications against the text above: there is no per-question
`weight` field, so `q.weight` is 1; and the glossary-term diversity penalty waits
for the glossary. Quick mode's depth-2 allowance is taken only when the deeper
question's score is at least 1.5× the best depth-1 score.

Every selected question carries a reason:

```ts
type SelectionReason =
  | { type: 'forced_follow_up'; from: QuestionId }
  | { type: 'information_gain'; eig: number; boost: number }
  | { type: 'modifier_coverage'; tag: ModifierTag }
```

`npm run trace` steps through one simulated session and prints each question with
its reason.

### 7.3a The modifier quota

Modifier-only questions carry no stances, so their expected information gain is
zero and adaptive selection alone would never choose them — leaving the result's
modifier tags empty. Each mode therefore has a `modifier_quota` (config field
`modifierQuota`):

| Mode | Quota | Budget |
| --- | ---: | ---: |
| Quick | 3 | 15 |
| Standard | 6 | 35 |
| Deep | 8 | 60 |

- Quota questions **count toward the mode's budget**.
- They are **interleaved** after the first 4 questions (`modifierInterleaveAfter`)
  and spaced across the rest of the budget, rather than bunched at the end. If the
  remaining budget only just covers the unmet quota, a modifier question is asked
  immediately.
- A mode **may not finish** — for `confident`, `no-information` or `exhausted` —
  until its quota is met or the eligible modifier pool is empty, even if the
  posterior has already settled. `budget` is the only stop that overrides it.
- The choice covers a tag **not yet measured** before any tag is repeated, and
  among those prefers a **dual-use** question (one that also carries stances and
  so also informs the placement). Ties break on information gain, then content
  order.
- The reason is `{ type: 'modifier_coverage', tag }`, naming the tag it was asked
  to measure.
- A modifier answer never changes the posterior unless the question also has
  stances.
- A question is never asked twice, whether by quota or by selection.

### 7.4 Stopping

Stop when any of these holds:

| Reason | Condition |
| --- | --- |
| `budget` | The mode's question budget is reached |
| `confident` | The resolver returns a sect-level result and ≥ 8 answers have been given |
| `exhausted` | No eligible questions remain |
| `no_information` | Best available EIG < 0.02 bits |
| `user` | The respondent chose to finish early (UI; not an engine stop) |

`confident`, `no_information` and `exhausted` are held back until the modifier
quota is met or cannot be (§7.3a). The earlier "three consecutive selections"
condition for `no_information` is not implemented: selection is replayed from
the answers, and a single low-gain step is already a deterministic stop.

Floor: never return a result before 8 scoring answers, in any mode.

---

## 8. Result model

### 8.1 Back-off resolution

Walk down from the root, deciding at each node whether the evidence supports
descending.

```
resolve(posterior, tree, config):
  node = root
  loop:
    if node is a leaf: return Resolved(node)
    children = node.children ranked by aggregate mass
    if children.length == 1: node = children[0]; continue     # collapse chains
    top, second = children[0], children[1]
    share  = mass(top) / mass(node)
    margin = mass(top) / max(mass(second), epsilon)
    if share >= config.childShareMin and margin >= config.childMarginMin:
      node = top; continue
    return Undecided(node, candidates = children with
                     mass(child) >= config.candidateFloor · mass(top))
```

Defaults live in `content/config.yml`; all are tunable and all are covered by
boundary tests:

| Threshold | Default | Meaning |
| --- | --- | --- |
| `childShareMin` | 0.50 | Top child must hold half the parent's mass to descend |
| `childMarginMin` | 1.6 | ...and be 1.6× the runner-up |
| `candidateFloor` | 0.45 | Candidates listed are those within 45% of the top child |
| `minAnswersForSect` | 8 | Never name a sect on fewer answers |
| `absoluteFloor` | 0.12 | A node below this absolute mass is never reported, even if it wins its parent |

**The report cap.** Each mode also carries a `maxReportLevel` — Quick `group`,
Standard `tendency`, Deep `sect` (§4) — and the walk stops there however the
evidence falls. A mode that stops at its cap returns `Resolved(node)` with the
children listed as candidates and `backOffReason: 'mode-reports-no-deeper'`:
the evidence supported getting there, so it is not a back-off, but it is not
the whole story either and the result page says so.

The cap is measured by position in the tree, not by `NodeLevel`, because a flat
family's members sit directly under the family while being `sect`-level. Under
`tendency` the walk may name any ideology hanging straight off a family — which
is what Standard has always done — but not one hanging off another ideology.
`council_communism` therefore stays a Standard answer and `cliffism` stays a
Deep one.

Result kinds:

- `Resolved(leaf)` — "You're a Cliffite."
- `Undecided(node, candidates)` — "You're a left communist. Within that, your
  answers fit council communism and Bordigism about equally. Here is what
  separates them, and here are the questions that would decide it."

`Undecided` is a first-class, fully designed outcome, not an error state. Its
presentation must not read as a failure; it reads as precision about the limit of
the evidence.

### 8.2 Result payload

```ts
type Result = {
  kind: 'resolved' | 'undecided'
  node: NodeId                                    // the deepest honest node
  candidates: { id: NodeId; mass: number; contrastWithTop?: string }[]
  runnersUp: { id: NodeId; mass: number }[]        // top 5 leaves overall
  axes: { id: string; value: number; confidence: number }[]   // §1.2, cosmetic
  deciders: { questionId: string; eig: number; gloss: string }[]   // §8.3
  evidence: {                                                      // §8.4
    forTop: { questionId: string; optionId: string; contribution: number }[]
    against: { questionId: string; optionId: string; contribution: number }[]
  }
  mode: Mode
  answeredCount: number
  stopReason: StopReason
  canEscalateTo: Mode | null
  inseparable: { ideologies: [IdeologyId, IdeologyId]; note: string }[]   // §8.2a
}
```

### 8.2a Inseparable pairs

Some pairs hold the same position on everything the test can ask and differ only
by lineage or by the people concerned (docs/inseparable.md). Each member of such
a pair declares the other in `inseparable_from`, with a note, on both sides — the
validator rejects a one-sided declaration. The resolver attaches the note to a
result when both members are candidates, *and* when the result resolves to one of
them, so a respondent who lands on one is still told about the other. The result
page must name both and show the note: without it, the result looks undecided for
no reason.

### 8.3 "What would decide it"

For an `undecided` result, recompute EIG restricted to the tied candidates — the
questions that best separate *those* ideologies specifically. Show the top three
with a one-line gloss and offer them as the escalation path. This turns the
honest-uncertainty case into the most interesting screen in the product.

### 8.4 Explaining the result

The result page shows the three answers that contributed most to the top
candidate's log-posterior, and the one or two that argued against it. These come
directly from the stored per-answer log-likelihood deltas — no separate
explanation model, no post-hoc narrative. If the engine cannot point at the
answers that produced a result, the result is not shown.

---

## 9. Content scale

The ranges are set from the unique question count in
docs/question-inventory.md, about ±10% around each. They describe what the
separation plan needs for this 93-ideology roster; they are not targets to write
towards. An earlier version asked for 250–300 questions (110–140 at depth 3),
set for a ~130-leaf draft taxonomy and inflated by a plan that counted the same
questions twice.

| Bucket | Range | Hard rule |
| --- | --- | --- |
| Total questions | ~112 (tier 1 ≈ 21, tier 2 ≈ 60, tier 3 ≈ 30) | |
| Tier 1 | 18–24 | **Every broad group reachable via ≥ 3 tier-1 questions** |
| Tier 2 | 50–62 | **Every family reachable via ≥ 3 questions at tier ≤ 2**; every same-family pair in different branches separated by ≥ 2 questions at tier ≤ 2 |
| Tier 3 | 25–31 (incl. self-ID) | Every same-family pair separated by ≥ 2 independent questions at some tier, or recorded in docs/inseparable.md |
| `history_class: true` | ≤ 10% of bank | Tier 3 only. Lint fails above 10% |
| `kind: likert` | ≤ 15% of tiers 2+3; **tier 1 exempt** | §3.2 |
| `self_id: true` | ≤ 1 per family, tier 3 only | Max effective stance weight 1; lint fails otherwise |
| Effective stances per leaf | ≥ 15 | Lint fails below. Tier-3 stances are required only for leaves in a pair that needs them |
| Weight-3 stances per leaf | ≤ 6, each with a `note` | Lint fails otherwise |
| Modifier tags | every tag fed by ≥ 2 questions **at or below the lowest tier at which it can be asked honestly**, and that tier recorded | Forcing two tier-1 feeders for every tag would put a question about hereditary rank in front of every respondent, which is the failure this revision corrects. A tag whose lowest honest tier is 2 is a Standard-and-deeper tag, and the result page says nothing about it in Quick |

The totals fell from 117–143 because tier 1 is smaller than depth 1 was (about
21 questions against 46) and because the demoted depth-1 questions merge with
depth-2 inventory rows that covered the same ground. The audit is in
docs/redesign.md §5.

"Independent separators" means two questions on which the pair hold different
positions and both hold a position — a stance against silence does not count.

Questions a respondent sees: 12–15 Quick, 25–35 Standard, up to 60 Deep. With a
130-question bank, a Deep respondent sees nearly half of it; two respondents with
different politics will still diverge sharply, because adaptive selection and
gating route them through different families' questions. The bank exists to be
selected from, not administered.

---

## 10. Quality gates

### 10.1 `npm run validate`

Zod conformance plus referential integrity. Every `parent`, `scope`, `requires`
question/option/node id, `follow_ups` target, stance `ideology`/`question`/
`option`, and glossary term resolves. Every leaf has ≥ 1 `contrast`, and every
contrast pair has ≥ 1 question with opposing effective stances. No orphan
questions (no ideology holds a stance on it). No unreachable questions (gating
that can never be satisfied — proved over the atom space where tractable, and
otherwise reported as unreached by the simulation harness).

### 10.2 `npm run lint:content`

Mechanical enforcement of the design principles in §11, wherever mechanisation is
possible:

- Proper-noun detection in stems and options against a names/orgs/events list plus
  a capitalised-token heuristic with an explicit allowlist. Principle 1.
- Four-digit years and decade forms banned in stems and options; allowed in
  tooltips. Principles 1 and 3.
- Double-barrel heuristic: stems joining two clauses with "and", or containing two
  question marks, are flagged. Principle 4.
- Option count 3–6 for `single`. Principle 7.
- Every glossary term used in a stem has a tooltip on that question. Principle 6.
- Length caps: stem ≤ 55 words, each option ≤ 40 words.
- All quotas from §9.
- Weight-3 `note` present; non-default `prior` justification present.
- Every `depth: 3` and every ideology-specific question carries `requires`.

Heuristic checks (double-barrel, proper noun) can be waived per question with
`lint_waiver: <reason>` — a visible, reviewable line in the YAML. The lint prints
a waiver census on every run.

### 10.3 `npm run simulate` — ideal-type recovery

The central correctness test, and the reason the content rules in `CLAUDE.md`
exist.

For each leaf, synthesise a respondent who answers according to that ideology's
effective stances (argmax weight, deterministic tie-break, "unsure" where all
weights are 0), run the engine in each mode, and record what comes back.

| Metric | Deep | Standard | Quick |
| --- | --- | --- | --- |
| Exact leaf recovery, noise 0 | ≥ 85% | ≥ 60% | — (Quick cannot name a leaf) |
| Result node is an ancestor-or-self of the true leaf | ≥ 98% | ≥ 98% | ≥ 98% |
| True leaf present in `candidates` when `undecided` | ≥ 95% | ≥ 95% | — |
| True family among the families a group result lists | — | — | ≥ 95% |
| Correct family, noise 0 | ≥ 97% | ≥ 95% | — (retired) |
| **Correct group, noise 0** | — | — | **≥ 95%** |
| Exact leaf recovery, noise 0.15 | ≥ 70% | — | — |
| **Confidently wrong sect** (resolved, not an ancestor of truth) | ≤ 2% | ≤ 2% | 0% by construction |
| **Answerable without knowledge** | — | — | 100% of tier-1 questions pass the novice review (docs/redesign.md §9) |

Noise ε: with probability ε the synthetic respondent picks a non-argmax option,
weighted by its stance. Seeded and deterministic per run.

The last two rows matter most. One confidently wrong sect is worse than a
hundred honest `undecided`s, and the thresholds are set to say so. Quick's
confidently-wrong rate is 0% by construction rather than by tuning: the mode
cannot name a sect at all (§4, §8.1).

**Quick's targets changed with the tier model.** Correct-family was retired for
Quick because tier-1 questions are not written to separate families — four of
the thirteen agree on every everyday value — so scoring the mode against that
distinction would reward writing tier-1 questions that presuppose the answer.
The baseline the current content sets under the new criterion is recorded in
docs/redesign-baseline.md; it is a reference, not a target.

### 10.4 `npm run separability`

For every pair of leaves sharing a parent, and every pair named in a `contrasts`
entry: the number of questions on which their effective stances oppose, and the
KL divergence between their answer distributions.

Pairs below threshold are **not** fixed by nudging weights. They are fixed by
writing a question that genuinely separates them, by correcting a stance that
misrepresents one of them, or — if neither is possible, because the two really do
hold the same positions — by recording the pair in `docs/inseparable.md` with the
reason, and either merging the leaves or accepting that the test will always
return them together. See the content rules in `CLAUDE.md`.

### 10.5 `npm run coverage`

Per-ideology report: effective stance count by depth, which questions can reach
it, contrast coverage, and whether it is reachable at all in each mode. Read by
humans during authoring; not a gate, but printed in CI.

---

## 11. Question design principles

> These ten principles are binding on every question in the bank. They are
> reproduced here verbatim as authored, and must not be paraphrased, softened, or
> reordered when this document is revised.

1. **Position-based, not history-based.** Questions ask what the respondent
   believes should happen or is true in principle. No stem or option may require
   knowing a date, a named event, a named person or a named organisation. Those
   may appear only in tooltips, as optional context.

2. **Concrete, not abstract — and at tier 1, familiar.**

   **Tier 1:** an everyday situation the respondent has been in or can picture
   from their own life — a job, a landlord, a hospital, a school, a will, a
   police stop, a strike, a bill, looking after a relative. **No invented
   revolutions, no new governments, no movements, no transitions.** Where a
   proposition works better than a scenario, use the proposition: at tier 1 a
   sentence to agree or disagree with asks less of the reader than a scenario
   they must imagine themselves into.

   **Tiers 2 and 3:** short hypothetical scenarios with real trade-offs ("A new
   government is defending a revolution against real threats. A group of workers
   loyal to its aims starts organising against its decisions. What should it
   do?"), never "Is authority ever justified?". Scenarios are invented or
   generic, not real events.

   Concreteness was never the missing property; familiarity was. The scenario
   quoted above is perfectly concrete and perfectly unanswerable by someone who
   has never thought about revolutions.

3. **Limited history allowance, at tier 3 only.** Where two ideologies differ
   only in their verdict on a historical class of cases (e.g. 20th-century
   one-party socialist states), phrase it as a verdict on the general class,
   describe it in plain words, put examples in the tooltip, and cap such
   questions at ~10% of the bank. **`history_class: true` is a tier-3
   property:** a verdict on a class of historical cases cannot be given by
   someone who does not know the cases, so such a question belongs in the mode
   that assumes they do.

4. **One position per question.** No double-barrelled stems.

5. **Every camp must recognise its own view; camp voice at tier 3 only.**

   Each option is a **plain statement of a position some camp would choose**,
   and the option set together covers the range of answers the question admits.
   No strawman options; no option is obviously the "reasonable" one. That is
   achieved by giving every option **equal standing and equal length**, not by
   making each one argue its case.

   **Camp voice** — the option written as a member would put it, carrying its
   own justification clause — is permitted at **tier 3** only. At tiers 1 and 2
   the justification is what turns an option into a small manifesto: it is why
   the depth-1 options that prompted this revision averaged 27 words, and why
   the longest ran to 34.

   What is kept from the older wording: the anti-strawman requirement, and the
   test that a committed member of each camp would recognise their own view in
   the option meant for them. Only the means changes.

6. **Plain stems, and less glossing the shallower the tier.**

   **Tier 1: no technical term at all**, in stem or option, glossed or not, and
   **no tooltip**. The banned list is `content/lint/tier1-banned.txt` and a
   match is a lint error. If a position cannot be stated in everyday words, the
   question is not a tier-1 question — that is the rule working, not failing. A
   tooltip at tier 1 is an admission that the question needs vocabulary the
   respondent does not have.

   **Tier 2:** any term the stem or an option still needs is explained **inline
   in under 8 words**, not in a tooltip. A tooltip is a tax on the reader, and
   at tier 2 it is usually avoidable.

   **Tier 3:** the stem must be answerable without knowing the ideology's
   vocabulary; describe the idea in plain words and put the technical term in a
   tooltip.

7. **Options per question: 2–5 at tier 1, 3–6 at tiers 2 and 3 (except
   likert).** Two is a legitimate tier-1 question — a genuine binary — and six
   short options is still six positions to hold in mind. Every question has
   implicit "unsure" and "don't know this term" options that never update
   scores.

8. **Ideology-specific questions only appear after gating shows they're
   relevant.**

9. **Follow-ups read as a natural next question.** They may quote the earlier
   answer ("You said X. Then…") and must not feel like a form.

10. **At most one optional self-identification question per family at depth 3,**
    where the options are named traditions. It has low weight so it nudges but
    never decides.

---

## 12. Non-goals

- **No accounts.** No sign-up, no login, no identity of any kind.
- **No data collection.** No analytics, no telemetry, no error-reporting service,
  no third-party scripts, no remotely hosted fonts or assets. Nothing about a
  respondent's answers leaves their device.
- **No backend.** The build output is static files. It must run correctly from a
  plain static host with no server-side logic.
- Permitted local storage: an in-progress session in `localStorage` so a refresh
  doesn't lose progress, and optional encoding of answers in the URL fragment for
  a shareable result. Both are client-only by construction; the fragment is never
  sent to a server, and the UI says so.
- Not a political education tool, not a recommender, and not a quiz that tells
  anyone what to think. It reports where the answers land.
- Not comprehensive: right-wing, centrist and other non-left positions are out of
  scope. A respondent whose answers fall outside the left is told that plainly,
  rather than being assigned the nearest left ideology.
- No internationalisation in v1 (English only), no user-contributed content, no
  admin UI.

---

## 13. Definition of done

The project is done when all of the following are true.

**Content**

- [ ] All 93 leaf ideologies carry a `summary`, and — once the fields exist —
      `commitments` and at least one `contrasts` entry naming a real near
      neighbour.
- [ ] 250–300 questions meeting every quota in §9.
- [ ] Every question conforms to all ten principles in §11; every lint waiver has
      a written reason.
- [ ] Effective stance coverage: every leaf ≥ 15 stances, ≥ 5 at depth 3.
- [ ] Glossary covers every technical term used anywhere in the content.
- [ ] `docs/content-log.md` has a line for every content change.
- [ ] `docs/inseparable.md` records every pair the test cannot honestly separate,
      with the reason.

**Engine**

- [ ] Every function in `src/lib/engine/` is pure and total, with unit tests
      covering edge cases: empty posterior, all-unsure session, single-candidate
      family, scope matching zero leaves, question with all-zero stances.
- [ ] Property test on the gating language: no `requires` expression can throw,
      and evaluation is order-independent.
- [ ] Selection is deterministic — the same `(content, answers, mode)` yields the
      same next question, asserted by a golden test.
- [ ] Resolver thresholds covered by tests at and either side of each boundary.
- [ ] A full 60-question Deep session completes in < 150 ms of engine time on a
      mid-range laptop; a single selection in < 30 ms.

**Simulation**

- [ ] `npm run simulate` meets every threshold in §10.3.
- [ ] `npm run separability` reports no pair below threshold that is not recorded
      in `docs/inseparable.md`.
- [ ] Confusion matrix reviewed by a human; every off-diagonal cluster is either a
      known-hard pair on record or a content bug that has been fixed.
- [ ] Adversarial respondents tested — all-unsure, all-first-option, alternating,
      self-contradictory — and none produce a confident sect result.

**Application**

- [ ] All three modes work end to end, including escalation Quick → Standard →
      Deep with answers preserved.
- [ ] `undecided` results are fully designed, including "what would decide it".
- [ ] The result page explains itself (§8.4).
- [ ] Tooltips are reachable by keyboard and touch, never hover-only.
- [ ] Keyboard-navigable throughout, visible focus, screen-reader-tested question
      flow, respects `prefers-reduced-motion` and `prefers-color-scheme`.
- [ ] Works at 320 px width with no horizontal scroll.
- [ ] The back button works mid-quiz, and changing an earlier answer recomputes
      the posterior correctly — answers are the source of truth, the posterior is
      derived and never incrementally patched on undo.
- [ ] Refreshing mid-session restores progress.
- [ ] No network requests after initial load, asserted by a test.

**Project**

- [ ] `npm run validate`, `lint:content`, `lint`, `test`, `simulate` and
      `separability` all pass, and all run in CI.
- [ ] `README.md` explains what the test is and what it is not.
- [ ] An in-app methodology page, linked from the result, explains the scoring
      model in plain language and admits its limits.
- [ ] Build output is static, loads with no backend, and passes a Lighthouse run
      (performance ≥ 95, accessibility 100).
