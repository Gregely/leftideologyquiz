# Redesign — make Quick answerable by someone with no political education

**Status: plan for review. Nothing in `/content`, `/src` or `/scripts` has been
changed.** Every number below is measured from the bank as it stands
(55 questions, 1,067 authored stance cells, 2,211 resolved).

---

## 0. The problem, measured

The complaint is that Quick asks a newcomer questions they cannot answer from
their own life, in options that read like manifestos. The bank confirms it.

| Measure over the 46 depth-1 questions | Value |
|---|---|
| Stem length, mean / max | **27.5 / 41 words** |
| Longest option, mean / max | **27.6 / 34 words** |
| Single-choice questions whose options are all ≤ 8 words | **0 of 35** |
| Stems ≤ 18 words | **5 of 46** |
| Flesch–Kincaid grade of stem + options, mean | **8.5** |
| Questions at grade ≤ 7 | **10 of 46** |
| Six-option questions | 14 |

A Quick respondent sees 11–15 of these. Three of the worst offenders are exactly
the ones named in the brief:

- `d1_decisive_agent` — "When it comes to actually forcing a change of system,
  whose organisation counts most?" Six options averaging 21 words. The question
  presupposes that the respondent has a theory of historical agency.
- `d1_peasantry` — a likert on whether the rural poor are "a revolutionary force
  in their own right, not only allies of the towns." Asked of everyone who did
  not already name the peasantry.
- `d1_party_needed` — "Left to their own experience … where do working people's
  political ideas end up?" This is *What Is To Be Done?* with the citation
  removed. Option `union_ideas_only` runs 31 words.

### The three causes, and what each one costs

1. **Depth was defined by ideology distance, not by respondent knowledge.**
   SPEC §3.3 makes a question depth 1 when its answer "changes which *family* is
   favoured". Nothing in that test asks whether a newcomer can answer it. The
   dimensions that best separate 13 families happen to be movement-theory
   dimensions (party, agent, state machinery, transition), so depth 1 filled up
   with them: of the 46, **28 are questions about how movements and states should
   be organised**, and only 17 are about anything a person could hold a view on
   before joining one.

2. **Principle 5 turns every option into a small manifesto.** "Each option is
   phrased the way a committed member of that camp would phrase it" is why
   options carry their own justification clause — "…because prices carry
   information no committee can assemble", "…and a movement that insists on
   directing them repeats what it says it is against". That clause is what makes
   the mean option 27 words. Principle 5 is protecting something real (no option
   should read as the obviously sensible one), but it achieves it by making every
   option argue, which is the wrong fix at tier 1.

3. **The lint measures the wrong things.** It checks a 226-name entity list, a
   108-term jargon list, a 60-word stem cap and an option-length *ratio*. It has
   no absolute option cap, no reading-grade check, no filler list, and its jargon
   list is a list of *left* vocabulary — it does not contain "productive
   enterprises", "material output", "civil liberties", "social ownership",
   "self-management", "pluralism", "mandate", "apparatus" or "programme", all of
   which appear in depth-1 stems and options today. A newcomer trips on those
   long before they trip on "invariance".

---

## 1. Tier model

`depth` keeps its name, its type (`1 | 2 | 3`), its schema field and its role in
mode gating. **Only the definition changes**: from *how fine an ideology
distinction the question draws* to *what the respondent has to know to answer
it*.

| Tier | Asked in | The respondent needs… | Subject matter | Voice |
|---|---|---|---|---|
| **1** | Quick (and above) | **nothing.** No political education, no vocabulary, no interest in politics. | Everyday values and situations: work, healthcare, housing, tax, inheritance, police, protest, unjust laws, environment, care, family, faith, where wealth came from. | Plain. The options are positions, not arguments. |
| **2** | Standard (and above) | **to have thought about politics.** Follows the news, has opinions about governments and movements, has no factional vocabulary. | How change should happen; what to do with the state; markets and plans; parties, unions and movements; nation and empire. | Plain words. Any technical term explained inline in **under 8 words**. |
| **3** | Deep | **to know left debates.** Can tell a council from a party and knows why it matters. | Near-neighbour separation inside a family or tendency. | Current style: concrete invented scenarios, camp-voice options, the history-class allowance. |

Three consequences worth stating before the SPEC edits:

- **Tier is a property of the question, not of the ideology.** A question that
  separates anarchism from Marxism–Leninism can be tier 1 (`Should there be
  police?`) or tier 3 (`Is the workplace council the form of the future society
  or one more institution to abolish?`). The old rule forced the second.
- **Tier 1 will not reach every family.** That is the honest consequence, and
  §3 below deals with it rather than hiding it.
- **The depth cap in `flow.ts` already does the work.** `quick: { maxDepth: 1 }`
  plus `deeperAllowance: 3` means Quick asks tier-1 questions plus at most three
  tier-2 questions of exceptional gain. That is exactly the behaviour the new
  model wants, unchanged.

### SPEC.md changes required

| Section | Change | Why |
|---|---|---|
| **§3.3 Depths** | Replace the table and "The depth rule" wholesale with the tier table above. Keep the sentence "Depth is a property of the question, not of when it is asked." Delete the paragraph beginning "A question is **depth 2** if its answer changes which branch or tendency of a family is favoured" — that *is* the rule being replaced. | This is the redesign. Everything else follows from it. |
| **§11 principle 2** (concrete not abstract) | Split by tier. Tier 1: "an everyday situation the respondent has been in or can picture from their own life — work, rent, a hospital, a police stop, a strike, a will. **No invented revolutions, no new governments, no movements.**" Tiers 2–3: keep the current wording. | The current principle is satisfied by "A new government is defending a revolution against real armed threats", which is concrete *and* unanswerable by a newcomer. Concreteness was never the missing property; familiarity was. |
| **§11 principle 3** (history allowance) | Add: "History-class questions are **tier 3 only**. The ~10% cap is measured against the whole bank as now." | A verdict on a class of historical cases cannot be answered without knowing the cases. |
| **§11 principle 5** (camp voice) | Replace with: "**Every option is a plain statement of a position some camp would choose, and the option set together covers the range of answers the question admits. No option may read as the obviously sensible one; that is achieved by giving each option equal standing and equal length, not by making each one argue its case. Camp voice — the option written as a member would put it, with its own justification — is permitted at tier 3 only.**" | This is the change that shortens the options. Note what is *kept*: the anti-strawman requirement and the "every camp recognises its own view" test still apply; only the means changes. |
| **§11 principle 6** (plain stems, glossed jargon) | Tier 1: "**no technical term at all**, in stem or option, glossed or not. If the position cannot be stated in everyday words it is not a tier-1 question." Tier 2: "any term the stem or an option still needs is explained **inline in under 8 words**, not in a tooltip." Tier 3: keep tooltips. | A tooltip is a tax on the reader. At tier 1 it is an admission that the question is in the wrong tier. |
| **§11 principle 7** (3–6 options) | Tier 1: **2–5**. Tiers 2–3: 3–6 as now. | Two options is legitimate at tier 1 (a genuine binary), and six short options is still six things to hold in mind. |
| **§3.2 Kinds / likert cap** | "Capped at 15% of the bank" becomes: "**Tier 1 is exempt; a tier-1 question should be a likert or a 2–3 option choice unless a wider set is genuinely needed. Tiers 2 and 3 together are capped at 15% of their combined count.**" | The 15% cap exists to stop "agree/disagree" being used where a real choice belongs. At tier 1 the scale *is* the natural form — it is the only form that does not require the respondent to recognise a position. |
| **§9 Content scale** | Rewrite the bucket table (see §3 and §6 below for the numbers). Change the hard rule "Every family reachable via ≥ 3 depth-1 questions" to "**Every broad group reachable via ≥ 3 tier-1 questions; every family reachable via ≥ 3 questions at tier ≤ 2.**" Change "Modifier tags: every tag fed by ≥ 2 depth-1 questions" to "**every tag fed by ≥ 2 questions at or below the lowest tier at which it can be asked honestly, and that tier recorded**". | Tier 1 cannot reach 13 families and should not pretend to. The modifier rule as written would force a tier-1 caste question on respondents for whom caste is not an everyday category. |
| **§10.3 Simulation targets** | See §3 below — the Quick row changes from family to group, and the confidently-wrong-sect row for Quick becomes 0% by construction. | |
| **§4 Modes** | Quick's "Target resolution" changes from "Family, sometimes tendency" to "**Broad group, sometimes family. Never a sect.**" | |
| **§1.1** | No change. Honest uncertainty is the principle the redesign leans on hardest. | |
| **§13** | Update the content checklist counts once §9 is settled. | |

`CLAUDE.md` needs one edit: the "Working notes for content" bullet "Prefer a
scenario to a proposition" must be qualified "— at tiers 2 and 3. At tier 1 a
proposition the respondent can agree or disagree with is usually better than a
scenario they have to imagine themselves into."

---

## 2. Language rules a linter can check

All limits are per question, measured on the authored prose (likert questions
have no authored options, so option rules do not apply to them).

### 2.1 Numeric limits by tier

| Rule | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Stem words | **≤ 18** | ≤ 30 | ≤ 60 (unchanged) |
| Option words, each | **≤ 8** | ≤ 14 | ≤ 40 (unchanged) |
| Option count (`single_choice`) | **2–5** | 3–6 | 3–6 |
| Flesch–Kincaid grade, stem + options combined | **≤ 7** | ≤ 9 | not checked |
| Tooltips | **forbidden** | forbidden (inline gloss ≤ 8 words instead) | allowed |
| Option-length imbalance | longest ≤ 2× shortest **and** gap ≤ 4 words | current rule (ratio 2.5, gap 12) | current rule |

Severity: word counts, option counts and the tier-1 tooltip ban are **errors**.
Reading grade is an **error at tier 1** and a **warning at tier 2** — the formula
is a heuristic and a legitimate question can fail it on one long proper word.
Both are waivable with `lint_waiver` only at tier 2.

**Reading-grade formula**, fixed so the lint is deterministic and dependency-free
(`src/content/lint.ts` must run in a browser, so no Node APIs and no new runtime
dependency):

```
FK grade = 0.39 · (words / sentences) + 11.8 · (syllables / words) − 15.59
```

with sentences counted on `[.!?]` runs (minimum 1), and syllables by vowel-group
count: lower-case, strip non-letters, words of ≤ 3 letters count 1, strip a
trailing silent `e`/`ed`/`es`, then count runs of `[aeiouy]{1,2}`. A short
exceptions map (`are:1, one:1, every:2, area:3, …`) lives beside the word lists in
`content/lint/syllables.txt` so it can be corrected without a code change. This is
the same estimator used to produce the numbers in §0 and §5, so the two agree.

### 2.2 Banned word list for tier 1 — `content/lint/tier1-banned.txt`

Any match is an **error** in a tier-1 stem or option. Whole-word, case-insensitive,
matching the existing `termPattern` behaviour so multi-word phrases work.

*Left and political-theory vocabulary*
proletariat · proletarian · bourgeois · bourgeoisie · vanguard · cadre · means of
production · mode of production · class struggle · class consciousness ·
imperialism · imperialist · hegemony · dialectic · materialist · praxis ·
capital (as a noun for the class) · capitalism · capitalist · socialism ·
socialist · communism · communist · anarchism · anarchist · syndicalism ·
reformism · revisionism · insurrection · expropriation · nationalisation ·
collectivisation · dictatorship of the proletariat · surplus value ·
accumulation · commodity · wage labour · the masses · the movement ·
the working class *(as a named actor)* · counter-revolution · comrade

*Governing and institutional vocabulary*
apparatus · machinery of government · the state *(as a noun for a system)* ·
transitional · transition · pluralism · pluralist · mandate · sovereignty ·
sovereign · self-determination · autonomy · confederation · federation ·
constitutional · legitimacy · civil liberties · civil society · polity ·
central plan · planned economy · market forces · price signals · allocation ·
decommodify · self-management · co-determination · collective bargaining ·
social ownership · common ownership · public sector · primary stage

*Abstract nouns a newcomer would have to look up*
emancipation · liberation *(in the political sense)* · exploitation ·
oppression · domination · subordination · structural · systemic · material
conditions · productive forces · superstructure · programmatic · prefigurative ·
decolonial · intersectional · neoliberal · technocratic

The list is not a ban on the *ideas*; it is a ban on naming them. "Should the big
companies be owned by the government?" is the same question as one using
"nationalisation" and is in bounds. Where no plain phrasing exists, the question
belongs at tier 2 — that is the list doing its job.

Maintenance rule: a term goes on this list when a novice reviewer (§9) says they
would have to look it up. The list is expected to grow.

### 2.3 Filler list — `content/lint/filler.txt`

A **warning** at every tier, an **error** at tier 1. Filler is what pushes options
past the word cap without adding a position.

in general · generally speaking · essentially · in principle · in practice ·
fundamentally · ultimately · at bottom · it is the case that · it should be
noted · the fact is · of course · naturally · arguably · to some extent ·
in a sense · in many ways · broadly speaking · when all is said and done ·
at the end of the day · needless to say · as such · in terms of ·
the question of · the issue of · with respect to · in order to *(prefer "to")* ·
due to the fact that · for the purpose of · has the effect of · serves to ·
whatever it is called · whatever else changes · in the first place

### 2.4 Options must not restate the stem

**Rule.** Strip stopwords from the stem and from each option. Flag the option
when either holds:

- the option's content-word set is ≥ 50% contained in the stem's, **or**
- the option shares a content-word trigram with the stem.

Severity: warning at tiers 2–3, error at tier 1. Waivable. This catches the
pattern where the stem does the work and the option is "Yes, exactly that" in
different words — currently visible in `d1_pluralism_after`, whose stem asks
"Should other parties be free to organise and to compete to replace it?" and
whose first option is "Yes, all of them, including parties that want to undo
what was won."

### 2.5 Tier-1 form

- **Default to `likert5`** (an agree/disagree statement) or **2–3 short options**.
  A likert asks the respondent to react to a sentence; a five-option
  single-choice asks them to *recognise five positions*, which is the thing a
  newcomer cannot do.
- **The 15% likert cap does not apply to tier 1.** Tiers 2 and 3 together keep a
  15% cap computed over tier-2-plus-tier-3 questions only, so a tier-1 bank that
  is 70% likert cannot push the deeper tiers over.
- **Everyday situations only.** The permitted settings at tier 1 are: a job and a
  workplace; rent, a mortgage, a landlord; a hospital or a GP; a school; tax and
  benefits; a will and an inheritance; the police, a court, a prison; a protest,
  a strike, a picket; a bill, a shop, a supermarket; a neighbourhood, a council;
  looking after a child or a relative; weather, flooding, a factory closing.
  **Forbidden at tier 1:** a revolution, a new government, a movement with a
  programme, a party, a transition, a colonised country, a socialist state.

---

## 3. What Quick can honestly return

### 3.1 What tier-1 values questions can and cannot separate

Tier-1 questions can put mass on an ideology only where the ideology's defining
commitment has an everyday form. Running the 16 dimensions of §4 against the 13
families:

**Separable from values alone**

| Distinction | The tier-1 question that does it |
|---|---|
| Change through elections and law **vs** the system has to be replaced | trust in elections and government (T5), how change happens (T16) |
| Concentrated authority is acceptable **vs** it is the problem | police and prisons (T7), obeying unjust laws (T6), who decides at work (T1) |
| Politics grounded in faith **vs** secular | faith and politics (T10) |
| The frame is class and the economy **vs** the nation and what was taken | self-rule and belonging (T11), where wealth came from (T12) |
| Private-with-rules **vs** public **vs** worker-owned **vs** held in common | workplace ownership (T1), what is paid for together (T2) |
| Force is never acceptable **vs** sometimes necessary | force in politics (T8) |
| Build the alternative now **vs** take power first | how change happens (T16) |
| Inequality and inheritance tolerated **vs** not | inequality (T3), inheritance (T4) |

**Not separable from values alone — and no honest tier-1 question would**

| Pair or set | Why |
|---|---|
| marxism_leninism / maoism / trotskyism / left_communism | They agree on every everyday value a newcomer holds — rupture, class, secular ethics, public ownership, force at the decisive moment. They differ on the party, the peasantry, the bureaucracy, world revolution and councils. There is no everyday form of any of those. |
| liberal_left / social_democracy | Differ on how far public ownership should go and on whether the settlement is the destination. T1 and T2 move them a little; the rest is tier 2. |
| market_socialism / guild_socialism / the collectivist anarchists | All answer "the people who work there" to T1. Who runs a whole *industry* is tier 2. |
| anti_colonial / national_question | Both answer T11 and T12 the same way. Whether the primary structure is colonial domination or the nation as the unit is tier 2. |
| post_marxist | Its defining claim is the *absence* of a single decisive class. A newcomer has no view on a claim about theory. Reachable only through T14 (ecology) for ecosocialism and through tier 2 otherwise. |
| early_socialism | T16's "build the alternative and let it spread" reaches it, but shares that answer with anarchism, Zapatismo and the Gandhian religious left. |
| Every same-family pair | Without exception. Tier 1 does not do sect work. |

**The honest grouping.** Six broad groups, each of which tier-1 questions can
reach and distinguish:

| Group | Families | Leaves | The tier-1 profile that reaches it |
|---|---|---:|---|
| `reforming_left` | liberal_left, social_democracy, market_socialism, post_marxist | 15 | Elections work; keep pluralism; public services yes, seizing the big firms no; force never |
| `revolutionary_socialist` | marxism_leninism, maoism, trotskyism, left_communism | 36 | Elections do not touch who really runs things; big firms to the public or held in common; force when there is no other way; secular |
| `anarchist` | anarchism | 14 | As above **but** no police, no prisons, no one in charge; break unjust laws; build it now |
| `religious_left` | religious_left | 6 | Faith is where the values come from; usually force refused |
| `national_and_anticolonial` | anti_colonial, national_question | 18 | Rich countries took what they have; a people should run its own affairs; the frame is the country, not the class |
| `communitarian` | early_socialism | 4 | Change comes from building a working example, not from elections and not from taking power |

`revolutionary_socialist` holds 39% of the leaves. That is not a defect of the
grouping — it is an accurate statement that four of the thirteen families differ
only on questions a newcomer has never been asked.

### 3.2 The three options

**(a) Return the top three families, ranked; judge "correct family in the top 3".**

*Engine cost: near zero.* `Result.runnersUp` already carries the top five leaves
and `Undecided(node, candidates)` already lists children at the root. The result
page would show three family names. `perfect-respondent.ts` would change its
Quick verdict to "expected ∈ top-3 families".

*Against it.* The metric is weak — three of thirteen is a 23% hit rate before any
evidence — so a 95% "top-3" score would mean much less than the current 93.5%
"top-1" score does. More importantly it does not make the *output* honest: telling
a newcomer "you are probably a Trotskyist, a Marxist–Leninist or a left
communist" is three names they have never heard for one distinction the test did
not make. And it leaves Quick free to name a sect when the thresholds happen to
fire, which is how `mutualism` is currently returned to a perfect
individualist-anarchist respondent on 14 answers.

**(b) Add a broad-group level above family in the tree.**

*Schema cost.* `content/groups.yaml` with `{id, name, summary, order}`, plus a
`group: <id>` field on `FamilySchema`. ~40 lines of schema and loader.

*Engine cost.* `model.ts` builds `group:<id>` nodes between `__root__` and the
families — the existing `familyKey`/`ideologyKey` pattern extends directly, about
25 lines. `resolve.ts` walks `node.children` generically and already collapses
single-child chains, so **it needs no change at all**; a group with one family
collapses through it. `posterior.ts` aggregation is over the tree and is likewise
generic. `flow.ts` gating uses `family_mass_gte`, which is unaffected; a
`group_mass_gte` atom is optional and not needed for the redesign.

*Tooling cost.* `validate.ts`: every family names a group, group ids unique, no
orphan groups (~30 lines). `perfect-respondent.ts`: Quick's `expected` becomes
the group and `familyOfKey` gains a `groupOfKey` sibling (~20 lines).
`coverage.ts`, `stats.ts` and `check.ts` gain a group column. `result-view.ts`
and the result component name the group.

*Total: roughly 150–250 lines across eight files, plus tests.* Bounded, and it is
mostly additive — no existing behaviour changes.

*For it.* The resolver gets a level at which tier-1 evidence is actually
sufficient, so the six current "undecided at root" outcomes become resolved
results with a real name. It also gives escalation a natural sentence: "You are
somewhere in the revolutionary socialist tradition. Standard mode will tell you
which kind."

*Against it, on its own.* It does not stop Quick naming a sect. With group nodes
added and nothing else, a respondent whose answers happen to concentrate still
gets `Resolved(mutualism)` after 14 questions, on tier-1 evidence that cannot
support it.

**(c) My proposal: (b) plus a per-mode maximum report level.**

Add one field to the mode settings in `flow.ts` beside `maxDepth` and `budget`:

```
maxReportLevel: 'group' | 'family' | 'tendency' | 'sect'
quick:    { maxDepth: 1, budget: 15, maxReportLevel: 'group' }
standard: { maxDepth: 2, budget: 35, maxReportLevel: 'tendency' }
deep:     { maxDepth: 3, budget: 60, maxReportLevel: 'sect' }
```

`resolve` takes it as an argument and stops descending when the next node would
be below the cap, returning `Resolved(group)` or `Undecided(group, candidates)`
as its thresholds decide. About 15 lines in `resolve.ts` and one signature
change. The result page then says, in this shape:

> **You are somewhere in the revolutionary socialist tradition.**
> Closest families: Marxism–Leninism, Trotskyism, left communism.
> These four traditions agree on almost everything Quick asked about. What
> separates them — the party, the peasantry, what happened to the revolutions of
> the last century — takes about twenty more questions. *[Continue to Standard]*

Quick still computes the full posterior, still lists the leading families as
information, and still hands everything to Standard on escalation. It simply
does not *claim* a level its evidence cannot carry.

**Recommendation: (c).** It is (b)'s cost plus about fifteen lines, it is the
only one of the three that makes the Quick *output* honest rather than just the
*metric* generous, and it removes the confidently-wrong-sect failure mode from
Quick by construction rather than by tuning. (a) is cheapest but buys nothing the
respondent wants.

### 3.3 How SPEC §10.3 changes

| Metric | Deep | Standard | Quick — now | Quick — proposed |
|---|---|---|---|---|
| Exact leaf recovery, noise 0 | ≥ 85% | ≥ 60% | — | — (Quick cannot name a leaf) |
| Result node is an ancestor-or-self of the true leaf | ≥ 98% | ≥ 98% | ≥ 98% | ≥ 98%, measured on the group→family→tendency→sect path |
| True leaf in `candidates` when undecided | ≥ 95% | ≥ 95% | ≥ 95% | n/a at group level; replaced by **true family in the listed families ≥ 95%** |
| Correct family, noise 0 | ≥ 97% | ≥ 95% | **≥ 90%** | **retired for Quick** |
| **Correct group, noise 0** | — | — | — | **≥ 95%** (new) |
| **Correct family when Quick names one** | — | — | — | **≥ 85%** (new; Quick names a family only when the group's own thresholds are met) |
| Confidently wrong sect | ≤ 2% | ≤ 2% | ≤ 2% | **0% by construction** |
| **Answerable-without-knowledge** | — | — | — | **100% of tier-1 questions pass the §9 novice review** (new, qualitative; see §9) |

Today's Quick run scores 93.5% correct family and 1.1% confidently wrong. Under
the group metric the same run would score 96.8% (the six failures all sit inside
their group except `cabralism`, which is returned as `mao_zedong_thought` —
`revolutionary_socialist` against its true group `national_and_anticolonial`).
The new ≥ 95% target is therefore a real target, not a formality: it is met
today by 1.8 points and the re-authoring must not lose that margin.

---

## 4. Tier-1 dimensions

Sixteen dimensions, **20 questions** (four dimensions carry two). Sample
questions are **style examples, not final content** — they are here to show the
length and register the rules in §2 produce, and every one of them would go
through the §9 novice review before being authored.

Abbreviations for groups: **RL** reforming_left, **RS** revolutionary_socialist,
**AN** anarchist, **RE** religious_left, **NA** national_and_anticolonial,
**CO** communitarian.

| # | Dimension | Sample question (style example) | Splits | Tag |
|---:|---|---|---|---|
| T1 | **Who owns and who decides at work** | *(a)* "The people who work somewhere should own it." *(likert)* · *(b)* "Who should have the final say at your work?" — The owners · Managers the government picks · The people who work there · Everyone it serves | (a) RL ÷ RS/AN; within RL, market_socialism ÷ liberal_left. (b) liberal_left ÷ social_democracy ÷ market_socialism/AN ÷ marxism_leninism | — |
| T2 | **What is paid for together** | "Health care, housing and transport should be run by government and paid for from tax, not bought and sold." *(likert)* | RL ÷ RS (degree); liberal_left ÷ social_democracy | — |
| T3 | **How much inequality is acceptable** | "Some people earning twenty times what others earn is wrong, however hard they work." *(likert)* | RL ÷ RS/AN; distributism and third_way at the low end | — |
| T4 | **Inheritance** | "When someone dies, what should happen to a large fortune?" — All to their family · Most to the family, some taxed · Most to the public · Nobody should have one | liberal_left ÷ social_democracy ÷ RS; distributism (spread it, don't tax it) | — |
| T5 | **Trust in elections and government** | "Voting changes who is in charge, but not who really runs things." *(likert)* | **The main splitter.** RL ÷ RS/AN. Also post_marxist and eurocommunism at the middle | — |
| T6 | **Obeying unjust laws** | "A law is clearly unjust. What should people do?" — Obey it and campaign to change it · Break it openly and take the punishment · Break it and avoid the punishment · Ignore the law generally | RL ÷ AN; religious_left (open refusal) ÷ RS | — |
| T7 | **Police and prisons** | "What would you want instead of the police as they are?" — The same, better controlled · Fewer police, more support services · Neighbourhoods handling it themselves · Ordinary people, trained and elected · Nothing like a police force | **AN ÷ everything.** Also religious_left (nothing) ÷ RS (elected militia) | — |
| T8 | **Force in politics** | "Is there ever a good reason to use force to change how a country is run?" — Never · Only to defend people being attacked · Yes, if nothing else works · Yes — power never gives way without it | RE (never) ÷ RL (never/defensive) ÷ RS/NA (yes) ÷ AN (split) | — |
| T9 | **Freedom and shared duty** | "When what you want and what your community decides clash, which gives way?" — The community · Neither, if the community is free · You · It depends what right is at stake | Inside AN (individualist ÷ social); liberal_left ÷ RS | — |
| T10 | **Faith and politics** | *(a)* "My sense of right and wrong comes mainly from my religion." *(likert)* · *(b)* "Should religion have a place in a movement for a fairer country?" — Yes, believers belong in it as believers · It is a private matter · No, it has usually been on the other side | **RE ÷ everything.** (b) also christian_anarchism, gandhian | `religion` ×2 |
| T11 | **Self-rule and belonging** | *(a)* "People should be able to run their own affairs in their own area and their own language." *(likert)* · *(b)* "Where a people is ruled from somewhere else, what matters most?" — Their own country · Running their own affairs where they live · Joining with the rest of their people · Ordinary people there and here having the same interests | **NA ÷ everything.** (b) national_question ÷ RS (last option) | `nation` ×2 |
| T12 | **Where wealth came from** | "Rich countries are rich partly because of what they took from poorer ones." *(likert)* | NA ÷ RL; also RS at the middle | `anti_colonial` |
| T13 | **Racism and who is at the bottom** | *(a)* "If everyone had the same money, would racism go away?" — Mostly yes · It would get much better · No, it has its own roots · It would barely change · *(b)* "Some jobs and university places should be set aside for people from groups that have always been kept at the bottom." *(likert)* | (a) NA/post_marxist ÷ RS; (b) ambedkarism and lohiaite ÷ the rest of NA | `race` ×2 |
| T14 | **Environment and growth** | *(a)* "We should use less overall, even if it means the economy grows more slowly." *(likert)* · *(b)* "More energy, more building, more things made — is that what a better country looks like?" *(likert)* | ecosocialism, social_ecology, primitivism, gandhian ÷ the productivists (saint_simonianism, marxism_leninism) | `ecology` ×2 |
| T15 | **Unpaid care** | *(a)* "Looking after children and elderly relatives is work and should count as work." *(likert)* · *(b)* "Sharing out housework and childcare between men and women matters as much as equal pay." *(likert)* | Modifier only — no roster ideology is defined by it | `gender` ×2 |
| T16 | **How change actually happens** | "Which is closest to how things actually get better?" — Laws passed, one at a time · People organising until those in charge give way · Building something different alongside and letting it spread · Everything changing hands at once | **RL ÷ RS ÷ AN/CO.** The `spread` option is what reaches CO | — |
| T17 | **Machines and work** | "Machines that can do people's jobs — good news or bad?" — Good, if the time saved is shared out · Good, if the people affected control them · Bad, unless kept small and local · Bad in themselves | technology-optimist (saint_simonianism, marxism_leninism, deng) ÷ primitivism, gandhian, lohiaite | `technology` ×1 |

That is 16 dimensions if T17 is folded into T14 as the blueprint's D17 was, and
17 if it stands alone; I would keep it separate, because it is the only tier-1
feeder for `technology`.

**Tag reachability in Quick under this list:** `religion` 2, `nation` 2, `race` 2,
`ecology` 2, `gender` 2 — all reach the display threshold. `anti_colonial` gets
**1** (T12) and `technology` gets **1** (T17); `caste` gets **0**. Three fixes are
available and I recommend the third:

1. Force a second tier-1 question for each. For `caste` this would mean asking
   every respondent about hereditary rank, which for most is not an everyday
   category — exactly the failure this redesign is correcting.
2. Let `modifier_tags` take an **array** per option (a two-line schema change,
   `z.enum(MODIFIER_TAGS)` → `z.union([tag, z.array(tag)])`, plus one loop in
   `flow.ts`). T13(b) would then feed `race` *and* `caste`, and T12 could feed
   `anti_colonial` alongside a second option elsewhere. Cheap, and useful
   independently.
3. **Reword SPEC §9** as proposed in §1: a tag needs two feeders *at or below the
   lowest tier at which it can be asked honestly*, and the tier is recorded per
   tag. `caste` becomes a Standard-and-deeper tag; `anti_colonial` and
   `technology` get their second feeder at tier 2. The result page shows the tags
   the mode could measure and says nothing about the others.

I recommend **3, with 2 adopted as well** because the array change is two lines
and removes an arbitrary constraint. Open decision, flagged in §10.

---

## 5. Audit of every existing question

Word counts are measured, not estimated. `stem` = words in the stem; `opt max` =
words in the longest option; `FK` = Flesch–Kincaid grade of stem plus options.
Dispositions are: **T1** keep as tier 1 after a rewrite · **→T2** demote to tier 2
with a rewrite · **→T3** demote to tier 3 with tightening · **retire**.

### 5.1 The 46 depth-1 questions

| id | stem | opt max | FK | disposition | reason |
|---|---:|---:|---:|---|---|
| `d1_ownership` | 21 | 25 | 9.2 | **T1** | Who owns the big firms is an everyday question; six 21-word options are not. Merge `occupancy_and_use` into tier 2, cut to 5 short options. |
| `d1_workplace_control` | 25 | 21 | 8.9 | **T1** | "Who has the final say at your work" needs no theory. Shortest options in the bank already. |
| `d1_expropriation` | 32 | 29 | 5.9 | **T1** | "If the government took over a big company, should it pay the owners?" is everyday. Six options → four. |
| `d1_police_and_army` | 33 | 30 | 9.2 | **T1** | Police reform is a live everyday argument. Drop the interpolated lead-in and the invasion clause. |
| `d1_violence` | 24 | 25 | 7.5 | **T1** | Whether force is ever justified is a moral question anyone holds a view on. Six → four options. |
| `d1_faith_grounds` | 11 | 24 | 8.0 | **T1** | Already an 11-word stem; only the options need cutting. |
| `d1_religion_and_liberation` | 12 | 25 | 7.1 | **T1** | Same. Drop `reform_the_tradition` to tier 2 or shorten hard. |
| `d1_ecology_priority` | 27 | — | 15.0 | **T1** | The position is everyday; the prose is not. Has a tooltip defining "total material output" — a tier-1 violation by itself. |
| `d1_growth` | 26 | — | 12.3 | **T1** | As above. Keep both this and the one above; they are T14(a) and T14(b). |
| `d1_race_structure` | 27 | 34 | 6.9 | **T1** | Becomes T13(a) as a 4-option short question. The 34-word `colonial_relation_inside` option moves to tier 2. |
| `d1_care_work` | 30 | — | 8.4 | **T1** | Pure modifier question, needs only shortening to 14 words. |
| `d1_gender_division` | 27 | — | 13.7 | **T1** | Uses "socialist economy" and "achieved socialism". Restate as housework and equal pay. |
| `d1_change_by_example` | 27 | 24 | 7.1 | **T1** | The co-op scenario is everyday. Likely merges into T16 rather than standing alone. |
| `d1_distribution` | 14 | 26 | 6.0 | **T1** | 14-word stem already. Four options → four short ones. |
| `d1_individual_sovereignty` | 21 | 25 | 7.1 | **T1** | Becomes T9 unchanged in substance. |
| `d1_wealth_from_periphery` | 30 | — | 11.8 | **T1** | Becomes T12. "through the terms on which they trade, borrow and are invested in" is the tier-2 half; cut it. |
| `d1_reserved_places` | 32 | — | 10.6 | **T1** | Becomes T13(b). Drop the interpolated lead-in, which forces it to trail `d1_internal_hierarchy`. |
| `d1_state_role` | 33 | 29 | 7.7 | **→T2** | "The machinery of government — ministries, courts, police, army" and six strategies for it is the central movement-theory question. T5 covers the everyday half. |
| `d1_change_route` | 28 | 25 | 8.2 | **→T2** | Six roads a movement should organise for. T16 covers the everyday half. |
| `d1_state_after_transition` | 24 | 31 | 7.2 | **→T2** | Presupposes a transitional state. |
| `d1_state_neutrality` | 34 | 31 | 7.2 | **→T2** | Requires a theory of why the civil service pulls a government back. |
| `d1_owners_resist` | 31 | 27 | 6.7 | **→T2** | A prediction about elite behaviour, not a value. |
| `d1_reforms_accumulate` | 41 | — | 9.7 | **→T2** | Longest depth-1 stem in the bank; abstract; gated on the one above. |
| `d1_price_signals` | 32 | — | 13.9 | **→T2** | An economics claim about information. |
| `d1_planning_or_market` | 22 | 30 | 8.7 | **→T2** | "Negotiated plan", "computed plan", "direct allocation" are three positions a newcomer cannot recognise. |
| `d1_land` | 30 | 30 | 7.7 | **→T2** | Six farmland regimes including occupancy-and-use. No everyday form in a mostly urban readership. |
| `d1_small_property` | 30 | 28 | 7.5 | **→T2** | Overlaps `d1_ownership` at tier 1; its distributism work is a tier-2 distinction. |
| `d1_party_needed` | 21 | 31 | 7.9 | **→T2** | Named in the brief. Where working people's ideas end up on their own is movement theory in its purest form. |
| `d1_organisation_form` | 16 | 27 | 9.9 | **→T2** | Mass party / cadre body / front / federation — four things a newcomer cannot tell apart. |
| `d1_party_role` | 30 | 29 | 8.9 | **→T2** | Named in the brief. |
| `d1_guiding_leader` | 30 | 22 | 6.0 | **→T2** | Close to tier 1 in form, but the scenario is a movement with a founding leader. |
| `d1_pluralism_after` | 23 | 26 | 7.4 | **→T2** | Opens "A socialist movement has come to power, by whatever route." |
| `d1_civil_liberties` | 34 | 27 | 7.0 | **→T2** | Gated on the above and interpolates it. |
| `d1_decisive_agent` | 14 | 27 | 7.1 | **→T2** | Named in the brief. Whose organisation is decisive is a theory of agency. |
| `d1_peasantry` | 33 | — | 8.4 | **→T2** | Named in the brief. Keep — it is a real Maoism/narodnism separator — but only for respondents already placed. |
| `d1_single_subject` | 22 | 27 | 8.1 | **→T2** | How movements should relate to one another. |
| `d1_autonomous_movements` | 35 | 31 | 7.8 | **→T2** | Movement-internal. T13 covers the everyday half. |
| `d1_violence_initiation` | 32 | 32 | 5.3 | **→T2** | A minority acting ahead of the majority is a strategic question. |
| `d1_technology_scale` | 34 | 27 | 6.8 | **→T2** | An invented regional automated network. T17 covers the everyday half. |
| `d1_imperialism_primary` | 30 | 25 | 6.2 | **→T2** | "Which is the main thing to break" asks for a ranking of structures. T12 covers the everyday half. |
| `d1_nation_self_gov` | 29 | 25 | 8.9 | **→T2** | Six answers to the national question. T11(b) is its tier-1 cousin and may reuse three of its option ids. |
| `d1_autonomy_without_state` | 39 | — | 16.3 | **→T2** | Worst reading grade in the bank. |
| `d1_nation_unity` | 22 | — | 10.2 | **→T2** | Understandable, but only to someone who already frames politics nationally. |
| `d1_alignment` | 29 | 32 | 6.5 | **→T2** | Foreign alignment of a new state. |
| `d1_internal_hierarchy` | 41 | 34 | 7.4 | **→T2** | Joint-longest stem, longest options in the bank. T13(b) carries the everyday half. |
| `d1_world_revolution` | 26 | 25 | 7.3 | **→T3** | Whether socialism can be built in one country is a left debate, and its work is separating Trotskyism from Marxism–Leninism. |

### 5.2 The 2 depth-2 and 7 depth-3 questions

| id | stem | opt max | FK | disposition | reason |
|---|---:|---:|---:|---|---|
| `d2_reform_horizon` | 39 | 34 | 7.8 | **→T2** (keep) | Stays tier 2. Split into the inventory's #49/#50 as already planned; stem over the new 30-word cap. |
| `d2_union_role` | 15 | 28 | 8.4 | **→T2** (keep) | Stays tier 2; options over the 14-word cap. |
| `d3_dissent_after_revolution` | 27 | 30 | 9.0 | **→T2** | Principle-2 exemplar and answerable by anyone who has thought about politics. The inventory already moves it to depth 2. |
| `d3_party_vs_class` | 28 | 34 | 8.2 | **→T2** | A free vote against what the organisation is sure of — plain, concrete, no left vocabulary. |
| `d3_council_or_programme` | 39 | 31 | 7.6 | **→T3** (tighten) | Needs the councilist/Bordigist distinction to mean anything. Carries the one live lint warning. |
| `d3_bureaucratic_planned_economy` | 41 | 37 | 8.2 | **→T3** (tighten) | History class; longest options in the bank. |
| `d3_war_between_such_states` | 31 | 26 | 7.0 | **→T3** (tighten) | History class. |
| `d3_class_struggle_under_socialism` | 28 | 37 | 7.7 | **→T3** (tighten) | History class. |
| `d3_specific_organisation` | 33 | 30 | 8.7 | **→T3** (tighten) | Anarchist organisational forms. |

### 5.3 The unwritten inventory rows

`docs/question-inventory.md` has 46 written depth-1 rows (all audited above),
**46 unwritten depth-2 rows** (55 rows less the 9 that reuse an authored
question) and **27 unwritten depth-3 rows** (28 less `d3_war_between_such_states`).

Every one of them is movement-theory or sect-separation work by construction —
they were commissioned by the separability plan. **None becomes tier 1.** They
keep their tier and are written to the new tier-2 and tier-3 language rules.
Two consequences:

- The tier-2 pool would be 28 demoted + 2 authored + 2 moved up from depth 3 +
  46 unwritten = **78**, against SPEC §9's 50–60. About 18 of the demoted
  depth-1 questions duplicate an unwritten row's ground (`d1_state_role` and
  #7 `d2_route_to_power`; `d1_small_property` and #28 `d2_means_of_work`;
  `d1_nation_self_gov` and #14 `d2_independence_and_socialism`, and so on).
  Merging those brings tier 2 to **≈ 60**, which is the top of the range and is
  where I would set it.
- Tier 3 would be 5 tightened + 1 demoted + 27 unwritten = **33**, against
  25–31. The three self-ID questions for families that tier 1 and 2 already
  separate cleanly are the obvious trims, bringing it to **≈ 30**.

### 5.4 Summary of dispositions

| Disposition | Count | Of which authored | Of which unwritten inventory rows |
|---|---:|---:|---:|
| Keep as **tier 1** after rewrite | 17 | 17 | 0 |
| Demote to **tier 2** with rewrite | 78 | 32 | 46 |
| Demote to **tier 3** with tightening | 33 | 6 | 27 |
| **Retire** | 0 | 0 | 0 |
| **New tier-1 questions to write** | ~5 | — | — |

Nothing is retired. Every existing question states a real disagreement; the
redesign is about *when* it is asked and *how long the prose is*, not about
whether the disagreement exists. The one candidate for retirement,
`d1_change_by_example`, is more likely to be absorbed into T16 than dropped.

Target bank after the redesign: **tier 1 ≈ 20–22, tier 2 ≈ 60, tier 3 ≈ 30 —
about 112**, against SPEC §9's current 117–143. §9's ranges must be restated for
the new tiers; the total drops because tier 1 is smaller than depth 1 was and
because the merges in §5.3 remove real duplication.

---

## 6. What survives, and what re-authoring costs

### 6.1 Unaffected

Confirmed by reading the code, not assumed:

- **The engine.** `posterior.ts`, `explain.ts`, `session.ts` and the likelihood
  model of SPEC §5.3 are untouched. The softmax over stance weights does not care
  what tier a question is.
- **The flow.** `flow.ts` already caps by `maxDepth` per mode, already carries
  `deeperAllowance: 3` for Quick, already derives the forced queue, boosts,
  unlocks and modifier coverage from the answer list. The tier model is a change
  of *meaning* for `depth`, not of mechanism. (The `maxReportLevel` field of §3.2
  is an addition, not a change.)
- **The resolver.** `resolve.ts` walks `node.children` generically and collapses
  single-child chains, so group nodes need no resolver change; only the
  `maxReportLevel` stop condition is new.
- **Follow-up machinery.** `force`, `boost`, `unlock`, `exclusive_with`,
  interpolation and `requires` all keep working. Note one new discipline: a
  tier-1 question may not be gated on or interpolate a tier-2 question, or Quick
  could not ask it. The validator should enforce that (§7).
- **The app.** The quiz store, `quiz.ts`, back/edit, URL serialisation and the
  result page all operate on questions generically. The result page gains a
  group name if (c) is adopted.
- **The tools.** `validate`, `lint:content`, `coverage`, `stats`, `trace` and
  `check` all keep their structure. `lint` gains rules (§7); `check` gains a
  group-level Quick criterion; `coverage` and `stats` gain a tier column.
- **The roster.** All 93 ideologies, 13 families, the tendency tree, `lineage`,
  `boundary` and `roster_tier` are untouched.
- **Family defaults.** Every default survives the demotions unchanged, because a
  demoted question keeps its id and its options; only its `depth` and its prose
  change.
- **`inseparable_from` pairs.** `connollyism`/`abertzale_left` and
  `zapatismo`/`democratic_confederalism` are unaffected — both pairs are
  separated (or not) by tier-2 and tier-3 questions.
- **Every open row in `docs/review/boundary-stance-notes.md`.** They are
  statements about what a tradition holds, not about how a question is worded.

### 6.2 What can be reused as source knowledge

The 1,067 authored stance cells are the most expensive thing in the repo and
almost all of them survive.

**The key fact: a stance references a question id and option ids, nothing else.**
A rewrite that shortens the prose but keeps the option set keeps every stance on
that question, untouched and unreviewed. So:

| | questions | authored cells | what happens to them |
|---|---:|---:|---|
| Demoted to tier 2 or 3, prose shortened, option ids kept | 38 | **716** | **Nothing. Zero re-authoring.** |
| Tier-1 rewrites that keep their option set (pure shortening) | 14 | **~200** | Nothing; re-read to confirm the shorter option still says what the stance assumed |
| Tier-1 rewrites that merge or drop an option (`d1_ownership` 6→5, `d1_expropriation` 6→4, `d1_violence` 6→4) | 3 | **151** | Only the cells naming a merged or dropped option need editing — roughly **40–60 cells** |
| New tier-1 questions (≈ 5) | 5 | 0 | **~150–250 new cells** at 30–50 ideologies each |
| Deferred inventory rows, when written | 73 | 0 | Out of scope for the redesign; unchanged by it |

**Re-authoring load: roughly 200–300 stance cells touched, out of 1,067 —
under 30%, and most of that is new tier-1 content rather than rework.** The 716
cells on demoted questions do not move at all.

By tier:

- **Tier 1: ~20–22 questions, of which 17 are rewrites and ~5 are new. ~350 stance
  cells, of which ~100 are new or edited.** This is the bulk of the writing work
  but the smallest share of the stance work, because tier-1 questions are
  deliberately coarse and many ideologies hold no distinctive position on them.
- **Tier 2: ~60 questions, of which 32 are prose-shortening rewrites of existing
  questions (716 cells preserved) and ~28 are unwritten inventory rows needing
  fresh stances.** The unwritten rows were always going to need them; the
  redesign adds nothing.
- **Tier 3: ~30 questions, 6 tightenings and ~24 unwritten rows.** Unchanged by
  the redesign — tier 3 *is* the current style.

The discipline that makes this cheap is worth stating as a rule in `CLAUDE.md`:
**rewriting a question's prose is free; changing its option ids is not.** Option
ids are the join key between prose and stances, exactly as ideology ids are the
join key to share URLs.

---

## 7. Lint and tooling changes

In the order I would build them.

1. **Tier-aware word limits** (`src/content/lint.ts`). Replace the single
   `MAX_STEM_WORDS = 60` with a per-tier table (§2.1), and add the missing
   absolute option cap. Errors.
2. **Option count by tier.** `OPTION_COUNT_LIMITS` in `schema.ts` becomes
   tier-aware: tier 1 `{min: 2, max: 5}`, tiers 2–3 `{min: 3, max: 6}`. Note this
   is a schema-level change because the current check lives in
   `QuestionSchema.superRefine`, which can see `q.depth`.
3. **Reading-grade check.** Pure function in `lint.ts` implementing the formula
   in §2.1, plus `content/lint/syllables.txt` for exceptions. Error at tier 1,
   warning at tier 2, not run at tier 3.
4. **`content/lint/tier1-banned.txt`** (§2.2). Error in any tier-1 stem or
   option. Loaded by `scripts/lint-content.ts` alongside the three existing
   lists; `LintLists` gains a fourth field.
5. **`content/lint/filler.txt`** (§2.3). Warning at tiers 2–3, error at tier 1,
   waivable.
6. **Option-restates-stem rule** (§2.4). Needs a small stopword list —
   `content/lint/stopwords.txt`.
7. **Tier-1 tooltip ban and inline-gloss rule.** `tooltip` present on a
   `depth: 1` question is an error. At tier 2, a term from the jargon list in a
   stem is an error unless the stem itself glosses it — detected as a
   parenthetical or dash-clause of ≤ 8 words within 10 words of the term.
8. **Likert cap change.** `stats.ts` computes the cap over tier-2 + tier-3
   questions only and reports tier-1 likert share separately, without a cap.
9. **Tier-1 setting whitelist** (§2.5). Softer than a word list: a warning when a
   tier-1 stem contains any of a short forbidden-setting list ("revolution",
   "movement", "party", "the state", "power", "regime", "transition",
   "colonial"). Overlaps the banned list; keep it separate so the message can say
   *why*.
10. **Gating discipline** (`validate.ts`). Error when a tier-1 question's
    `requires` or interpolation references a question of a higher tier — it could
    never be asked in Quick. This catches `d1_reserved_places` and
    `d1_autonomous_movements` today, both of which trail a question that is
    moving to tier 2.
11. **`check` criterion for Quick** (`perfect-respondent.ts`, `scripts/check.ts`).
    Quick's `expected` becomes the group; the pass test becomes
    `groupOfKey(returned) === group`, and a separate counter reports "named a
    family, and it was right" against the new ≥ 85% target. A Quick run that
    returns a node below `maxReportLevel` is a **bug**, not a failure, and should
    throw.
12. **`coverage` and `stats` tier columns.** Both currently report by `depth`;
    the header labels change and `coverage` gains "reachable at tier 1 /
    tier ≤ 2" per group and family, which is the SPEC §9 hard rule made
    measurable.
13. **`modifier_tags` array support** (§4, optional). Two lines in `schema.ts`,
    one loop in `flow.ts`.

Items 1–7 and 10 are content-lint work with no engine effect and could land
before any content is rewritten, failing loudly on everything — which is the
point, and is why item 1 should ship with every existing question's `depth`
already moved, or the build stays red for the whole rewrite.

---

## 8. Pilot: 12 tier-1 questions

Chosen to split the six groups as far as tier 1 can, and to be writable and
testable in one sitting. Options are **outlines, a few words each — not final
wording.** Two of the twelve are pure modifier questions, included because the
result page needs at least one tag to be earnable in a 12-question pilot.

| # | Dimension | Question in outline | Options in outline | Groups it splits |
|---:|---|---|---|---|
| 1 | T5 trust in elections | "Voting changes who is in charge, but not who really runs things." | likert5 | **RL ÷ RS/AN/CO.** The single most informative tier-1 question |
| 2 | T16 how change happens | How do things actually get better? | laws step by step · organising until they give way · building something else alongside · everything changing hands at once | RL ÷ RS ÷ AN/CO. The `alongside` option is CO's and anarchism's |
| 3 | T1(a) workplace ownership | "The people who work somewhere should own it." | likert5 | RL ÷ RS/AN; market_socialism inside RL |
| 4 | T1(b) who decides at work | Final say over how work is organised | the owners · managers the government picks · the people who work there · everyone it serves | liberal_left ÷ marxism_leninism ÷ market_socialism/AN |
| 5 | T2 what is paid for together | Health, housing and transport: run by government from tax, or bought and sold | likert5 | RL internally; RL ÷ RS by degree |
| 6 | T7 police and prisons | What instead of the police as they are? | same, better controlled · fewer police, more support · neighbourhoods themselves · elected and trained ordinary people · nothing like a police force | **AN ÷ everything.** Also RE ÷ RS |
| 7 | T8 force in politics | Ever a good reason to use force to change how a country is run? | never · only defending people · if nothing else works · power never gives way without it | **RE ÷ RL ÷ RS/NA.** AN splits across it, which is true |
| 8 | T6 unjust laws | A law is clearly unjust — what should people do? | obey and campaign · break it openly, take the punishment · break it and avoid it · the law is not the point | RL ÷ AN; RE takes "openly" |
| 9 | T10(a) faith | "My sense of right and wrong comes mainly from my religion." | likert5 | **RE ÷ everything.** Feeds `religion` |
| 10 | T12 where wealth came from | "Rich countries are rich partly because of what they took from poorer ones." | likert5 | **NA ÷ RL.** Feeds `anti_colonial` |
| 11 | T11(a) self-rule | "People should run their own affairs in their own area and their own language." | likert5 | **NA ÷ everything.** Feeds `nation` |
| 12 | T3 inequality | "Some people earning twenty times what others earn is wrong, however hard they work." | likert5 | RL internally (third_way, distributism low); RL ÷ RS |

**Coverage check.** Every group is reached by at least three of the twelve:
RL by 1, 2, 3, 5, 12 · RS by 1, 2, 3, 4, 7 · AN by 2, 6, 7, 8 · RE by 7, 8, 9 ·
NA by 7, 10, 11 · CO by 2, 8 — **CO by only two**, which is honest: early
socialism is four niche ideologies whose signature is one answer to question 2.
A thirteenth question (T4 inheritance, or `d1_change_by_example` shortened) would
give CO a third and is the first thing to add if the pilot under-reaches it.

Nine of the twelve are likert. That is the intended shape of tier 1 and is why
the 15% cap has to lift for it.

Tags earnable in the pilot: `religion` (1 of 2 feeders), `anti_colonial` (1),
`nation` (1) — none reaches the display threshold of two. **The pilot should be
judged on placement, not on tags**, and a full tier-1 bank of 20–22 restores the
pairs.

---

## 9. Novice testing

### 9.1 The subagent review

Run after tier-1 and tier-2 prose is drafted and before stances are touched.
This is a review of *answerability*, not of politics.

**Set-up.** One subagent per pass, given: the drafted questions (id, tier, stem,
options) as plain text with no ideology information, no stance data, no SPEC and
no blueprint. Withholding the stance matrix matters — a reviewer who can see
which camp an option belongs to will rate it answerable because *they* can now
place it.

**Persona.** "You are 34, you work in a warehouse, you vote sometimes and you do
not follow politics beyond the headlines. You have never read a political book.
You have opinions about your rent, your manager, the hospital waiting list and
the police. Answer as that person, not as someone imagining them."

**Per question, the reviewer returns exactly one verdict plus one sentence:**

| Verdict | Meaning |
|---|---|
| `own-life` | I could answer this from my own experience without stopping |
| `think` | I could answer it, but I had to stop and work out what it meant |
| `guess` | I understood the words but had no view; I would pick something at random |
| `look-up` | There is a word or an idea here I would have to look up |

Plus, for every option: `plain` / `wordy` / `dont-understand`, and for every
question the free-text question **"which option did you nearly pick, and why did
you not?"** — that one catches options that are the same position twice.

**Thresholds.**

- Tier 1: **≥ 90% `own-life`, 0 `look-up`, 0 `guess`.** Any `look-up` is a
  banned-list candidate; add the term and re-run the lint.
- Tier 2: **≥ 80% `own-life` or `think`, ≤ 10% `look-up`.** A `look-up` at tier 2
  is acceptable only where the question carries an inline gloss.
- Any question with a `guess` verdict at tier 1 is rewritten or demoted, not
  defended.

**Run it twice with different personas** — a second as a 19-year-old student, a
third as a 61-year-old retired nurse — because "everyday" is not the same
everyday for everyone, and the settings whitelist in §2.5 leans on a
working-age-renter frame that the other two will test.

Record the results in `docs/review/novice-review.md`, one row per question per
persona, and treat it as a gate the same way `lint:content` is: no tier-1
question ships with a `guess` or `look-up` against it.

### 9.2 What to do with real people

The subagent review catches vocabulary. It cannot catch boredom, suspicion or the
feeling of being asked to declare something. Friends can.

**Recruit 5–8 people who do not follow left politics.** Mix: at least two who
would not call themselves left-wing at all, at least one under 25, at least one
who has never voted. Do not tell them what the test is for beyond "it tries to
work out where you stand"; in particular do not say "left", which primes them.

**Protocol, about 20 minutes each.**

1. Sit beside them. Do not explain anything, including when they ask. Say "answer
   however you want" and write down that they asked.
2. **Ask them to think aloud.** The single most valuable data is the sentence
   before they click.
3. Note, per question: **seconds to answer**, whether they re-read the stem,
   whether they asked what a word meant, whether they said any of "I don't know",
   "it depends", "what does that mean", "none of these", or "can I pick two".
4. Note every use of **"I'm not sure"** and every **back-button** press. Both are
   already recorded by the engine; the point is to know *why*.
5. At the end, before showing the result, ask: "were there any questions where you
   felt you were being asked to pick a side you'd never thought about?" and "were
   there any where you wanted to say something that wasn't there?"
6. Show the result. Ask: "does that sound like you?" and "would you show this to
   a friend?" A result nobody would share is a result nobody believes.
7. Ask them to name **the two worst questions**. People are much better at
   ranking than at rating.

**What counts as a failure.** Any question where two or more people hesitated
over vocabulary. Any question where a majority picked "I'm not sure". Any
question where someone said "it depends" and could not resolve it — that is a
double-barrelled stem the lint heuristic missed. And any respondent who finished
Quick and could not say, in their own words, roughly what they had been told.

**What to ignore.** Disagreement with the result. Several will say "I'm not a
socialist"; the test's own §12 says it reports where answers land, and a
respondent outside the left should be told so. That is a result-page problem, not
a question problem.

Keep the notes in `docs/review/` and bring the two-worst-questions lists back to
the tier-1 bank before anything else is rewritten.

---

## 10. Risks and open decisions

### 10.1 Tier 1 cannot separate four families, and the flow must say so

`marxism_leninism`, `maoism`, `trotskyism` and `left_communism` share every
everyday value. After 12–15 tier-1 questions a respondent in that region has
`revolutionary_socialist` at high mass and four families at roughly equal shares.

**How the flow should hand them over.** Three mechanisms already exist and need
no engine change:

- `deeperAllowance: 3` already lets Quick ask up to three tier-2 questions when
  their score beats the best tier-1 question by 1.5×. Once the group is settled,
  the tier-2 questions inside it have high EIG and the tier-1 questions have
  almost none, so the allowance fires exactly where it should. The three most
  valuable are the party question, the transitional-state question and the
  councils question — and three is enough to split the four families in the best
  case, which is the right ambition for a mode called Quick.
- `family_mass_gte` gating already lets a tier-2 question declare "only ask me
  once this region is likely", which is what keeps those three from being wasted
  on a social democrat.
- The escalation path (SPEC §4) preserves every answer, so the honest Quick
  result names the group, names the families, and offers Standard.

**The risk to watch:** the allowance makes Quick's question mix bimodal — a
reforming-left respondent sees 15 everyday questions, a revolutionary-socialist
respondent sees 12 everyday questions and 3 about parties and states. The second
group gets the experience this redesign is trying to remove. Mitigation: write
those three tier-2 questions to the tier-2 language rules with unusual care, and
put them through the §9 review at the tier-1 threshold rather than the tier-2 one.

### 10.2 The cheaper structure: author positions on underlying issues once

**The proposal.** Give each ideology a position on ~20 underlying issues
(`content/issues.yaml`: who should own productive property, is the existing state
usable, is force legitimate, is authority itself the problem, is the frame class
or nation, …), each scored on a small scale. Annotate each *option* with the issue
positions it expresses. Derive the stance matrix at load time. Rewording a
question, or adding a new one, would then never mean authoring a stance.

**The engine cost, honestly.**

- A new file, schema and loader: small.
- A derivation step producing `(ideology, question, option) → weight` from
  `(ideology, issue) → position` and `(option, issue) → position`. This is a new
  *model*, not a new file: it replaces the authored weight with a function of two
  vectors. SPEC §5.3's likelihood table is currently `softmax(β · w(i,q,o))` where
  `w` is authored; it would become `softmax(β · f(pos_i, pos_o))` for some `f`
  (dot product, or negative distance). **That is a change to the scoring model,
  not a refactor**, and every threshold in `config.ts` — `beta`,
  `rejectMultiplier`, `childShareMin`, `childMarginMin` — is calibrated against
  the current scale and would need re-deriving.
- `explain.ts` gets harder in a way that matters. SPEC §8.4 requires the result
  page to name the answers that most moved the posterior, "no separate
  explanation model, no post-hoc narrative". Per-answer log-likelihood deltas
  still exist, so this survives — but "why did this answer favour Bordigism" now
  has an extra indirection through issues, and the note field that currently
  justifies a weight-3 stance has nowhere obvious to live.
- The 75% rule, the family-default inheritance tree and the fitness report are
  all built on authored stances per question. They would have to be rebuilt on
  issues. `coverage.ts` is ~400 lines of that.
- Authoring cost is not obviously lower: 93 × 20 = **1,860 issue positions** to
  replace 1,067 authored cells, plus an issue-position annotation on every one of
  the ~250 options. The saving is on *future* questions, not on the existing bank.

**Recommendation: against, for v1.** The benefit it is actually being proposed
for — "rewording a question never means re-authoring stances" — **is already
true**, because a stance joins on option id, not on prose. §6.2 measures the
consequence: 716 of 1,067 cells are untouched by this entire redesign, and the
rewrites cost 40–60 edits. The derived model's real additional benefit is that
*new* questions come with stances for free, which would be worth something for
the ~5 new tier-1 questions and the 73 unwritten inventory rows — but not worth
re-deriving the likelihood model and every resolver threshold to get.

**Do the two cheap parts instead:**

1. Write the rule into `CLAUDE.md`: **option ids are permanent; prose is not.** A
   rewrite that keeps the option set costs nothing downstream. This is the whole
   benefit, for free.
2. Add an **optional `issue:` annotation on options** that the engine ignores and
   the *validator* uses: warn when one ideology's stances imply opposite
   positions on the same issue across two questions. That catches the
   double-counting error that has already been made twice (mutualism's land and
   ownership weight-3s; democratic confederalism's two statements of the same
   doctrine), and it keeps the derived model buildable later without committing
   to it now.

### 10.3 Other open decisions

| # | Decision | My recommendation |
|---:|---|---|
| 1 | Group level: adopt (c) — groups plus `maxReportLevel` — or stay with (a)? | **(c).** §3.2. |
| 2 | Group boundaries: is `revolutionary_socialist` at 36 leaves too coarse? Splitting it into "state and party" (ML, Maoism, Trotskyism) and "councils and refusal" (left communism) would need a tier-1 question about whether a strong government should run things after a big change — which I judge tier 2, not tier 1. | **Do not split.** Revisit after the §9 novice review says whether that question can be asked at tier 1. |
| 3 | Modifier tags: force tier-1 feeders for `caste`, `technology` and `anti_colonial`, or reword SPEC §9? | **Reword §9**, and adopt the two-line array change so one option can feed two tags. §4. |
| 4 | Does `d1_ecology_priority` *and* `d1_growth` both belong at tier 1, given they are near-mirror propositions? | Yes — they are the `ecology` tag's two feeders and a respondent who answers them inconsistently is informative. But check with the §9 reviewers that they do not read as the same question asked twice. |
| 5 | Quick budget: 15 questions of which 9 are likert will feel faster than today's 15. Raise to 18? | **Leave at 15** until the pilot is timed with real people (§9.2). Perceived length is what matters and it is about to change a lot. |
| 6 | `history_class` becomes tier-3-only. That leaves `d2_socialist_states_model` and `d2_independence_and_socialism` (both history-class, both planned for tier 2) needing either a present-tense rewrite or a demotion. | Rewrite them present-tense as the inventory already contemplates for `d2_independence_and_socialism`. |
| 7 | Should tier 1 be allowed a `multi` question ("pick any that apply")? It is the most natural everyday form for values. | **No.** SPEC §3.2 rules multi out of v1, the one existing multi was already rewritten away, and averaged likelihoods over a multi are hard to explain on the result page. |
| 8 | The 46 demoted depth-1 questions all move to `depth: 2` in one commit. Until their prose is rewritten, Standard mode carries 32 over-length questions. | Move the `depth` field first and let the lint fail loudly, or the rewrite has no gate. Accept a red build for the duration and say so in `docs/content-log.md`. |

### 10.4 The largest risk

**That the tier-1 bank cannot tell `reforming_left` from `revolutionary_socialist`
as reliably as depth 1 currently tells the families apart.** Today's separation
rests heavily on `d1_state_role`, `d1_change_route`, `d1_party_needed` and
`d1_organisation_form` — 170 authored stance cells across four questions, all of
which are moving to tier 2. Their tier-1 replacements are T5 (trust in elections)
and T16 (how change happens), which are two questions carrying the work of four.

The measurable form of this risk is the group-recovery number in §3.3: today's
run would score 96.8% against the proposed ≥ 95%. **Two ideologies moving from
the right group to the wrong one eats the whole margin.** So:

- Run `npm run check` against the group criterion **before** rewriting anything,
  to establish the true baseline.
- Write T5 and T16 first, author their stances, and re-run. If group recovery
  falls below 95%, the answer is a third tier-1 question on that axis — inheritance
  (T4) and "what is paid for together" (T2) are the candidates — and **not** a
  weight adjustment. CLAUDE.md rule 4 applies to this redesign exactly as it
  applies to everything else.

---

## Recommended order of work

1. Agree the tier model and the group taxonomy (§1, §3.1). Everything else
   depends on both.
2. Edit SPEC.md §3.2, §3.3, §4, §9, §10.3 and §11 principles 2, 3, 5, 6, 7, and
   the one CLAUDE.md line (§1).
3. Build lint items 1–7 and 10 (§7). Move every demoted question's `depth` field
   in the same commit. The build goes red; that is the gate.
4. Add the group level and `maxReportLevel` (§3.2 option c), plus the `check`
   criterion change (§7 item 11). Establish the group-recovery baseline.
5. Write and review the 12 pilot questions (§8, §9). Author their stances.
   Re-run `check`.
6. If the pilot holds, finish tier 1 (20–22 questions) and run the full novice
   review.
7. Shorten the 32 demoted questions to the tier-2 rules. No stance work.
8. Tighten the 6 tier-3 questions. No stance work.
9. Only then return to the 73 unwritten inventory rows.
