# Question blueprint

Status: **plan for review. No question text.** Nothing in `/content` changes
until this is approved.

Inputs: SPEC.md (§9 budgets, §11 principles, §5.2a 75% rule), CLAUDE.md content
rules, docs/roster-decisions.md, docs/roster-purged.md, content/*.yaml, and the
current tool output:

- `npm run stats`: 19 questions (d1 6, d2 6, d3 7) against 250–300; 0 stances;
  history allowance 3/19; `race` and `religion` tags declared but unused.
- `npm run coverage`: 0 of 1,767 cells filled; **367 of 367 same-family pairs
  unseparated**; fitness report silent (no family defaults).

Roster: 93 ideologies, 13 families. Core = `*`, boundary = `†`, lineage = `[L]`.

| Family | n | Members |
|---|---:|---|
| early_socialism | 4 | narodnism, owenism, fourierism, saint_simonianism |
| liberal_left | 3 | social_liberalism\*, liberal_socialism\*, distributism† |
| social_democracy | 7 | kautskyism\*, classical_social_democracy\*, bernsteinian_revisionism, fabianism, democratic_socialism\*, austromarxism, third_way† |
| market_socialism | 2 | market_socialism\*, guild_socialism\* |
| post_marxist | 3 | post_marxism\*, eurocommunism\*, ecosocialism\* |
| religious_left | 6 | christian_socialism\*, christian_communism, liberation_theology\*, islamic_socialism\*, buddhist_socialism, gandhian_socialism |
| anti_colonial | 11 | third_worldism\*, fanonism\*, cabralism, ujamaa, nkrumaism, sankarism, ambedkarism\*, lohiaite_socialism, nehruvian_socialism†, chavismo\*, mariateguism |
| national_question | 7 | baathism†, nasserism†, labour_zionism†, connollyism\*, abertzale_left\*, bundism, peronism† |
| marxism_leninism | 12 | leninism\*, marxism_leninism\*, stalinism\*[L], titoism\*, hoxhaism[L], guevarism\*[L], castroism\*, ho_chi_minh_thought, sandinismo, juche†, deng_xiaoping_theory†, xi_jinping_thought† |
| maoism | 7 | mao_zedong_thought\*, marxism_leninism_maoism\*, gonzalo_thought[L], prachanda_path[L], mlm_third_worldism, mao_spontex, pol_potism† |
| trotskyism | 9 | orthodox_trotskyism\*[L], cliffism\*, shachtmanism\*, pabloism[L], grantism[L], morenism[L], lambertism[L], posadism[L], spartacism[L] |
| left_communism | 8 | council_communism\*, bordigism\*, luxemburgism\*, communization\*, situationism\*, autonomism\*, de_leonism\*, impossibilism |
| anarchism | 14 | mutualism\*, collectivist_anarchism\*, anarcho_communism\*, anarcho_syndicalism\*, insurrectionary_anarchism\*, individualist_anarchism\*, egoism†, anarcho_primitivism\*, social_ecology\*, post_left_anarchy\*, christian_anarchism, zapatismo\*, democratic_confederalism\*, revolutionary_syndicalism\* |

**Planned bank size: 130** — 47 depth-1, 55 depth-2, 28 depth-3 (including 6
self-identification questions). **The authoritative list is
docs/question-inventory.md**, one row per question. An earlier version of this
document totalled ~273 because §4 and §5 counted the same questions twice; the
reconciliation is at the end of the inventory and summarised in "Totals" below.
§4's per-family budgets and §5's grids are kept as the *reasoning* for which
questions exist — where a grid column was merged into a depth-1 dimension or
dropped, the grid says so.

---

## 1. Audit of the existing 19 questions

Checked against SPEC §11 and the 13-family roster. Every existing question
passes `lint:content` (3 loaded-word warnings, all legitimate camp voice), so
the audit is about *fit to the roster*, not prose hygiene.

| Question | Verdict | Reason |
|---|---|---|
| d1_state_role | **keep** | The single most discriminating family split; five options map cleanly to social democracy / ML-Trotskyism / left communism / prefigurative anarchism / abolitionist anarchism. Needs one option for the national-question and anti-colonial "a state of our own" answer — see D4. |
| d1_change_route | **keep** | Clean reform-vs-rupture axis (D2). `long_cultural_work` also gives post_marxist a depth-1 foothold. |
| d1_ownership | **keep** | D1. Five options cover plan, worker-market, common, occupancy. Missing: widely-dispersed small property (distributism) and state-led development with private sector (Nehruvian, Nasserist) — add as rewrite of one option or a sixth. |
| d1_ecology_priority | **keep** | Cross-cutting ecology axis (D14), likert, already tags `ecology`. |
| d1_care_work | **keep** | Pure modifier question for `gender` (D16). Correctly has no stances; the purge makes that permanent. |
| d1_technology_scale | **rewrite** | Scenario is good but "continental scale" and the specialist framing make it double-duty (scale *and* expertise). Split the scale/expertise tension into the technology axis (D17) only; `break_it_up_for_local_control` is also wrongly tagged `ecology` — ecology belongs to D14. |
| d2_state_after_transition | **keep** | Separates withering / permanent planner / deliberate dissolution / no transitional state — splits ML, Trotskyism, left communism and anarchism. Rescope to depth 1 (it now does family work: D11). |
| d2_party_role | **keep** | Core D5 question; separates lead / fight democratically / keep programme / dissolve / refuse. Promote to depth 1 as D5's anchor. |
| d2_planning_or_market | **keep** | D3. Promote to depth 1: it is the only question that reaches market_socialism. |
| d2_reform_horizon | **rewrite** | Good social-democracy splitter but gated only on parliamentary answers; `destination_but_deepen_democracy` bundles two positions (governance of firms *and* insulation from elections). Split into two d2 social-democracy questions. |
| d2_union_role | **keep** | Separates syndicalism / anarcho-communism / councilism / ML transmission belt / bargaining. Becomes the anchor of the industrial-democracy cluster (§5.8). |
| d2_who_is_the_agent | **rewrite** | `multi` with 6 options is the only multi in the bank and is hard to score (averaged likelihoods). Its real content is D9 (revolutionary subject). Rewrite as single-choice "which group's organisation is decisive" plus a separate likert on the peasantry. |
| d3_dissent_after_revolution | **keep** | Principle-2 exemplar. Separates ML (suppress) / Trotskyism (restrict) / left communism (councils) / anarchism (permit). Rescope to depth 2 in ML, Trotskyism, left communism. |
| d3_party_vs_class | **keep** | Council communism vs Bordigism (SPEC §1 criterion pair). |
| d3_council_or_programme | **keep** | Same pair from the organisational side; `exclusive_with` d3_party_vs_class stays. |
| d3_bureaucratic_planned_economy | **keep** | Cliffism / orthodox / Shachtman / ML. History-class (budgeted in §8). Now also needed for left communism's state-capitalism verdict. |
| d3_war_between_such_states | **keep** | Defencism vs revolutionary defeatism; separates Cliffism from orthodox. History-class. |
| d3_class_struggle_under_socialism | **keep** | Maoism vs Soviet-line ML (and Trotskyist restoration thesis). History-class. |
| d3_specific_organisation | **rewrite** | Platformism/especifismo are purged, but the question survives: re-aim it at anarcho-communism vs insurrectionary vs post-left (formal organisation vs affinity groups). Drop `ideological_pole_not_direction` wording as especifista-specific; replace with a "federation of organised groups" option. |

**Drop: none.** Every question states a real disagreement; four need
rewriting and four change depth.

**Depth-1 dimensions the survivors already cover:** D1 ownership, D2 reform vs
rupture, D3 markets vs planning, D4 role of the state, D5 party, D11 the state
after transition, D14 ecology, D16 gender (modifier only), D17 technology.
**Not covered at all:** D6 democracy, D7 nation, D8 anti-colonialism, D9 agent
(only via the rewrite), D10 international outlook, D12 violence, D13 religion,
D15 race, D18–D25. National_question, religious_left and early_socialism
currently have **no depth-1 question that could put mass on them.**

---

## 2. Depth-1 dimensions

26 position axes, **47 depth-1 questions** (SPEC §9 range 42–52). An earlier
version said 44; the table below summed to 45, because D14 was written "1 (+1
existing)" and counted once. With D14 counted as two and one question added to
D16 and to D23 (below), the total is 47. The major axes get
2–3 questions each so that one atypical answer cannot misplace a respondent's
family — the respondent-noise model assumes redundancy on the axes that matter
most.

Family abbreviations: **ES** early_socialism, **LL** liberal_left, **SD**
social_democracy, **MS** market_socialism, **PM** post_marxist, **RL**
religious_left, **AC** anti_colonial, **NQ** national_question, **ML**
marxism_leninism, **MAO** maoism, **TR** trotskyism, **LC** left_communism,
**AN** anarchism.

**F** = the family carries a default on this dimension (≥75% of members would
answer the same way with conviction). **I** = no family default; authored per
member. **—** = the family has no stake (no stance; the within-scope update
leaves it untouched). ✦ = cross-cutting: scored where an ideology takes a
position, and also feeds a modifier tag.

| # | Dimension | Qs | How it splits the field | F | I |
|---|---|---:|---|---|---|
| D1 | Ownership of major production | 3 | Private-with-public (LL, SD right) / public-planned (ML, TR, MAO) / worker-owned-in-market (MS) / common, no exchange (LC, AN-communist) / occupancy-and-use or dispersed small property (mutualism, distributism, narodnism) | ML, TR, MAO, LC | SD, AN, LL, AC, NQ, RL, ES, PM, MS |
| D2 | Reform vs rupture | 3 | Legislate (SD, LL, PM, Kautskyism) / build counter-power then rupture (LC, syndicalists, TR) / organised insurrection (ML, TR) / prolonged armed struggle (MAO, Guevarism) / prefigure and replace (AN, ES) | LL, ML, MAO | SD (Kautsky vs Bernstein), TR, LC, AN, AC, NQ, RL, PM |
| D3 | Markets vs planning | 2 | Market (LL, MS, mutualism, Deng) / central plan (ML, TR) / negotiated plan (AN-communist, guild) / direct allocation by need (LC, communization) / computed plan | TR | ML (Tito, Deng, Xi dissent), AN, LC, SD, MS, PM |
| D4 | The existing state | 3 | Use and expand (SD, LL) / use then wind down / break and replace (ML, TR, MAO) / bypass and build (AN-social, ES) / abolish outright (AN) / **win a state of our own** (NQ, AC) | ML, TR, MAO, LL | AN (Zapatismo, confederalism bypass), SD, AC, NQ, LC |
| D5 | Party and organisation | 3 | Vanguard leads (ML, MAO, TR) / mass party of the class (SD, Kautsky, Eurocommunism) / programme-holding minority (Bordigism) / no party above the class's organs (LC-council, AN) / movement without party (post-left, autonomism) | ML, MAO | TR (dispute is *how* to lead), LC, AN, SD, PM, AC |
| D6 | Democracy and pluralism after power | 2 | Multi-party pluralism kept (SD, LL, PM, Sandinismo, Chavismo) / soviet pluralism among socialist parties (TR, Luxemburgism) / one-party (ML) / no state to hold elections (AN, LC) | LL, SD, PM | ML (Tito, Sandinismo), TR, AC, NQ |
| D7 ✦ | The nation as the unit of emancipation | 3 | Nation primary (NQ, Ba'athism, Nasserism) / national autonomy without separate state (Bundism, Austromarxism, confederalism) / nation as a stage (ML, MAO) / nation dissolves in class (TR, LC, AN-internationalist) | NQ, LC | AC, ML, SD, AN (confederalism, Zapatismo), MAO |
| D8 ✦ | Colonial and imperial domination as primary | 2 | Primary structure (AC, MLM-Third Worldism, Third Worldism) / one form of class rule (ML, TR) / irrelevant to strategy in rich countries (SD right, LL) | AC | MAO, ML, TR, NQ, LC |
| D9 | The decisive agent | 2 | Industrial workers (LC, TR, syndicalists) / all waged workers (SD, PM) / peasantry (MAO, narodnism, Ujamaa) / colonised peoples (AC, MLM-TW) / citizens at large (LL) / plural subjects (PM) | MAO, LL | ML, AC, SD, AN, LC |
| D10 | International outlook | 2 | World revolution now (TR, LC) / national road, solidarity abroad (ML post-Stalin, Castroism) / non-aligned development (Nehruvian, Titoism, Nkrumaism) / continental or civilisational unity (Nkrumaism, Ba'athism) | TR, LC | ML (socialism in one country vs internationalism), AC, NQ, MAO |
| D11 | The state after transition | 1 | Withers (ML, TR, MAO) / permanent planner (Nehruvian, Deng) / dismantled deliberately / none to begin with (AN, LC) | AN, LC | ML, TR, SD |
| D12 | Violence and armed struggle | 2 | Principled non-violence (Gandhian, Tolstoyan, Christian anarchism, Buddhist) / only defensive / necessary at the moment of rupture (ML, TR, LC) / initiated by a small group (Guevarism, Gonzalo, insurrectionary) | — | every family (no family ≥75% on this) |
| D13 ✦ | Religion as the ground of politics | 2 | Faith grounds the politics (RL, Christian anarchism, Gandhian) / religion private and compatible / religion obstacle to liberation (ML, LC, many AN) | RL | AN, ML, AC, NQ |
| D14 ✦ | Ecological limits over output | 2 (1 existing) | Degrowth-leaning (primitivism, social ecology) / eco-socialist / productivist (ML, Saint-Simonianism, Xi's "ecological civilisation" is its own case) | — | all; PM only through ecosocialism |
| D15 ✦ | Racial hierarchy as structural | 1 | Race a structure of its own, not reducible to class (AC, PM) / class-first, race as division within the class (TR, LC) / not a separate structure | — | all |
| D16 ✦ | Care work and social reproduction | 2 (1 existing) | Modifier only — no roster ideology is defined by it (roster-purged.md). Second question, a likert: a socialist economy that leaves the division of work between women and men untouched has failed. Without it, `gender` had one depth-1 feeder and could not reach the display threshold of two | — | — |
| D17 ✦ | Technology and scale | 1 (rewrite) | Socialise the gains (Saint-Simonianism, Xi, ML productivism) / democratise control / break up for local control (social ecology, Gandhian) / forgo (primitivism) | — | all |
| D18 ✦ | Class vs plural identities | 2 | One decisive class (TR, LC, ML) / class plus autonomous movements of the oppressed (PM, AC, Ambedkarism) / identity-based politics a diversion | TR, LC | PM, AC, SD, AN, ML |
| D19 | Change by example | 1 | Build the model community and let it spread (ES, Gandhian, Zapatismo, Christian communism) / only a change of power changes anything | ES | AN, RL |
| D20 | Individual sovereignty vs collective | 1 | The individual is the point (individualist, egoism, LL) / freedom through association (AN-social) / the collective is prior (ML, MAO) | — | AN (split sharply), LL, all |
| D21 | Small property | 1 | Widely held small property is the goal (distributism, mutualism, narodnism, Gandhian) / all property social | — | LL, AN, ES, RL |
| D22 | Distribution | 1 | By need (AN-communist, LC, communization) / by labour contributed (collectivist, Saint-Simonianism, ML "socialist stage") / market income plus floor (LL, SD) | LC | AN, ML, ES, SD |
| D23 ✦ | Internal hierarchies (caste, estate) | 2 | (a) Dismantling a hereditary status hierarchy is prior to economic change (Ambedkarism, Lohiaite) / reform it from within (Gandhian) / economic change dissolves it (Nehruvian, most Marxists). (b) Reserved places in legislatures, universities and public jobs for people born into a lower-ranked hereditary group — a real disagreement that Ambedkarites, Gandhians and Marxists answer differently. Both at depth 1, so `caste` is measurable without the gated Indian-subcontinent questions | — | AC, RL |
| D24 | Civil liberties as ends | 1 | Liberties are the point of socialism (LL, SD, PM, Luxemburgism) / liberties conditional on securing the revolution (ML, MAO) | LL, SD, PM | ML, TR, AC, NQ |
| D25 | A guiding leader and doctrine | 1 | Movement led by an authoritative leader-and-thought (Juche, Gonzalo, Xi, Peronism) / collective leadership / no leaders | — | ML, MAO, NQ, AN |
| D26 | Workplace control | 1 | Self-management by workers (MS, guild, syndicalists, Titoism, councils) / managed by the public authority (ML, Fabianism, Saint-Simonianism) / by owners under regulation (LL, SD right) | LC | ML, SD, AN, MS |

Notes on the table:

- **D12 violence has no family default anywhere.** Every family contains both
  principled pacifists or legalists and people who hold violence necessary at
  some moment. It is the clearest application of the 75% rule and the most
  informative cross-family question for religious and anarchist sects.
- **D4 gains a sixth option** ("win a state of our own for our people"), which
  is how national_question and much of anti_colonial answer the state question.
  Without it, D4 has no option those families would choose — a principle-5
  failure the current `d1_state_role` has.
- **LL and SD carry more defaults than their size suggests** because their
  members really do agree on the constitutional frame; their internal splits are
  about ownership and horizon (D1, D2), which stay per-member.
- **Cross-cutting dimensions** (D7, D8, D13–D18, D23) never carry family
  defaults except where a family is *defined* by them (NQ on D7, AC on D8, RL on
  D13). Elsewhere they are per-member stances plus modifier tags (§9).

---

## 3. Depth-1 reachability

For each family, the answer pattern that concentrates mass on it. "Reachable"
means an ordinary respondent answering sincerely, with no vocabulary, can put a
plurality of mass on the family within the depth-1 questions alone. Depth-1
questions are ungated, so every family below is reachable in Quick mode.

| Family | Answer pattern that reaches it | Status |
|---|---|---|
| early_socialism | D19 build-the-model-community + D21 small or communal property + D2 prefigure + D4 bypass + D12 non-violent, *without* the anti-state commitment of D4-abolish | **Reachable in principle, fragile.** No core members, and its signature (change by example) is shared with Gandhian socialism and Zapatismo. Needs D19 to exist; without it, unreachable. |
| liberal_left | D4 use-and-expand + D1 private-with-public + D24 liberties-as-ends + D20 individual + D9 citizens | Reachable. Separated from SD mainly by D1 and D9. |
| social_democracy | D2 legislate + D4 use + D5 mass party + D6 pluralism, with D1 anywhere from mixed to public | Reachable. |
| market_socialism | D3 market **and** D26 workers' self-management **and** D1 worker-owned, with D4 use or bypass | **Reachable only on a conjunction.** Each answer alone is shared: market with LL and mutualism, self-management with syndicalists and councils. Needs all three D-axes to have a "worker-owned enterprises trading" option; D3 is currently the only one. See §4. |
| post_marxist | D18 plural subjects + D2 long cultural work / legislate + D24 liberties + D5 mass party without vanguard; ecosocialism additionally via D14 | **Reachable but thin.** Its signature (no single revolutionary subject) is D18, which needs two questions. Ecosocialism's family placement means an ecological respondent with a class analysis lands here only if D18 is answered pluralistically — otherwise they land in SD or ML, which is *correct* and should not be patched (they are eco-leaning members of those families, and the `ecology` tag says so). |
| religious_left | D13 faith-grounds-politics (two questions) | Reachable, cleanly. Without D13 it was unreachable; that is the principal gap the current bank has. |
| anti_colonial | D8 colonial domination primary + D9 colonised peoples / peasantry + D10 non-aligned or continental | Reachable. Ambedkarism additionally needs D23. |
| national_question | D7 nation-is-the-unit + D4 **win a state of our own** + D10 national road | **Reachable only with new questions.** See below. |
| marxism_leninism | D4 break-and-replace + D5 vanguard + D6 one-party + D1 public-planned | Reachable. |
| maoism | ML pattern + D9 peasantry + D2 prolonged people's war | Reachable. D9 is what separates MAO from ML at depth 1. |
| trotskyism | ML pattern on D4/D5 **but** D6 socialist pluralism + D10 world revolution now | Reachable. D10 is the separator; without it TR is indistinguishable from ML at depth 1. |
| left_communism | D5 no party above the class + D4 break-and-replace + D1 common-no-exchange + D7 internationalist | Reachable. |
| anarchism | D4 abolish or bypass + D5 no party + D11 no transitional state | Reachable. The most over-determined family at depth 1. |

**No family is unreachable once the 47 planned depth-1 questions exist.** Three
are unreachable on the current 19 and need new dimensions to reach:
religious_left (D13), national_question (D7 + the D4 option), early_socialism
(D19).

### national_question

The family is defined by one claim — *the nation is the unit of emancipation* —
and needs three D7 questions, because "nation" means different things to its
members:

1. **Self-government:** a scenario in which a people governed from outside
   could have either social reform under the existing sovereign or independence
   with the social question left open. Connollyism and the abertzale left take
   independence *and* insist it is socialist; Ba'athism and Nasserism take
   independence and unity first; Bundism refuses the framing (autonomy without
   territory).
2. **Autonomy without a state:** whether a people can be self-governing inside
   someone else's state — through its own language, schools and institutions.
   Separates Bundism and Austromarxism (yes) from the territorial members (no),
   and reaches democratic confederalism from the anarchist side.
3. **Unity of a wider nation:** whether a people divided across several states
   should unify. Reaches Ba'athism, Nasserism and Nkrumaism; the others are
   indifferent.

**Can an ordinary respondent reach Connollyism or the Basque left?** Yes, and
without knowing either name: someone who answers (1) "independence, and it has
to be a workers' republic or it is only a change of flag", D4 "win a state of
our own", D1 public or mixed, D6 pluralist, lands on the pair. **The two are then
indistinguishable by position** — both are the same claim applied to different
peoples. See §10: that pair is the roster's clearest case for docs/inseparable.md,
and the result page should return them together.

### market_socialism

Two members, no depth-2 block (§4). Reached through the D3 + D26 + D1
conjunction. Separated *from* neighbours by questions those neighbours' blocks
already contain: from LL/SD by D26 (self-management), from mutualism by D4 (uses
the state), from syndicalism by D3 (markets between firms), from Titoism by D5
(no single party). Guild socialism vs market socialism is one depth-3 question
(§5.8).

### early_socialism

Reachable in principle through D19, but no ordinary respondent is expected to
land there, and that is correct — it has no core members. The risk is the
reverse: that it *absorbs* respondents who belong to Gandhian socialism or
Zapatismo because all three answer D19 the same way. D12 (non-violence) and D13
(religion) pull Gandhian respondents to religious_left; D4 (abolish) pulls
Zapatista respondents to anarchism. Narodnism additionally needs D9 peasantry.

### post_marxist

Three members that share only a rejection: of a single decisive class. That is
a thin basis for a family. D18 carries it at depth 1; Eurocommunism is reached
by the conjunction of D5 mass-party and D24 liberties from the ML side;
ecosocialism by D14 plus D18. If fitness later flags this family, the likely
honest outcome is that ecosocialism belongs elsewhere (§10).

---

## 4. Depth-2 plan per family

**Superseded counts.** The "Qs" column below is the original per-family
*budget*, totalling 135. It overlapped §5 — each block was described by the same
distinctions §5 then gridded — and about 51 of its slots were never specified as
questions. The unique depth-2 list is 55 questions, in docs/question-inventory.md.
The distinctions in this table remain the reasoning for which families need
depth-2 questions at all; the gating below still applies.

Standard gate for a family block:
`{ family_mass_gte: { <family>: 0.15 } }`. Sub-blocks add an `answered` gate on
the depth-1 or depth-2 answer that makes them relevant. A question that serves
two families lists both in an `any`.

| Family | Qs | Tendency-level distinctions to separate | Gate |
|---|---:|---|---|
| early_socialism | 6 | Owen (environment forms character; model community) vs Fourier (work matched to passion; association) vs Saint-Simon (rule of producers and experts; industrial planning) vs Narodnism (peasant commune; bypassing capitalism). Axes: who directs, scale, whether industry is the vehicle, the peasantry | ES ≥ 0.15 |
| liberal_left | 6 | Social liberalism (regulated market, state guarantees) vs liberal socialism (social ownership justified by autonomy) vs distributism (dispersed small property, anti-state and anti-big-capital) | LL ≥ 0.15 |
| social_democracy | 11 | Kautskyism (inevitable majority, final goal) vs Bernstein (movement is everything) vs classical (durable mixed settlement) vs Fabian (expert permeation) vs democratic socialism (replace private ownership) vs Austromarxism (national-cultural autonomy, slow revolution) vs Third Way (markets settled). Includes the two halves of the rewritten `d2_reform_horizon` | SD ≥ 0.15 |
| market_socialism | 0 | See below | — |
| post_marxist | 6 | Post-Marxism (chains of equivalence, no privileged subject) vs Eurocommunism (mass communist party, democratic road) vs ecosocialism (accumulation as ecological cause). Axes: status of class, role of the party, growth | PM ≥ 0.15 |
| religious_left | 10 | Christian socialism (cooperative economy as gospel duty) vs Christian communism (common purse as literal command) vs liberation theology (preferential option, structural sin) vs Islamic socialism (zakat, riba, stewardship) vs Buddhist socialism (craving, sufficiency) vs Gandhian (village, trusteeship, non-violence). Faith-neutral questions on property, the state and violence, plus two on the relation between church/community and movement | RL ≥ 0.15 |
| anti_colonial | 13 | Third Worldism, Fanonism (violence as remaking), Cabralism (culture, class suicide), Ujamaa (village cooperation), Nkrumaism (continental unity), Sankarism (self-reliance, refuse aid), Ambedkarism (caste first), Lohiaite (caste + decentralisation), Nehruvian (planned industrialisation, secular constitution), Chavismo (elected road, communal councils), Mariáteguism (indigenous communal land) | AC ≥ 0.15 |
| national_question | 10 | Connollyism / abertzale left (socialist republic of one people) vs Ba'athism / Nasserism (pan-Arab unity, single party, state socialism) vs Labour Zionism (collective settlement, labour institutions) vs Bundism (autonomy in place, *doikayt*) vs Peronism (class conciliation, sovereignty) | NQ ≥ 0.15 |
| marxism_leninism | 18 | **ML-A (state and economy, 9):** planning vs market reform (Tito, Deng, Xi), self-management, industrialisation pace, collectivisation, private sector's place. Gate ML ≥ 0.15. **ML-B (party and leadership, 9):** one party vs fronts (Sandinismo), guiding leader (Juche, Xi), anti-revisionism (Hoxha), foco vs mass party (Guevara), national path vs bloc (Tito, Ho, Castro). Gate ML ≥ 0.15 + answered D5 in [vanguard, mass party] | as stated |
| maoism | 11 | Mao Thought vs MLM (universal people's war), Gonzalo (initiate war, militarised party, guiding thought), Prachanda (war then negotiation and elections), MLM-TW (first-world workers bought off), Mao-Spontex (revolt against all authority, including the party's), Pol Potism (immediate abolition of money and cities) | MAO ≥ 0.15 |
| trotskyism | 12 | The nature of bureaucratic planned economies (orthodox / Cliff / Shachtman), defencism, entrism (Pablo, Grant), frequency of revolutionary openings (Moreno), union independence (Lambert), programmatic intransigence (Spartacism), historical optimism (Posadas). Includes rescoped `d3_dissent_after_revolution` | TR ≥ 0.15 |
| left_communism | 12 | Councils vs programme (council communism, Bordigism), immediacy (communization), everyday life and spectacle (situationism), refusal of work and autonomy (autonomism), ballot plus industrial unions (De Leonism), single-issue abolition candidacy (impossibilism), mass strike and party (Luxemburgism). **Parliamentary participation authored per member** — no family default (CLAUDE.md 3a) | LC ≥ 0.15 |
| anarchism | 20 | **AN-E (economics, 10):** property (occupancy, collective, common), distribution (need vs labour), markets, money, the role of the union, individual sovereignty. Gate AN ≥ 0.15. **AN-S (strategy and structure, 10):** formal organisation vs affinity, insurrection now vs mass movement, relation to the left, municipal assemblies, territorial autonomy, non-violence, civilisation and technology. Gate AN ≥ 0.15 + answered D4 in [abolish, bypass] | as stated |

**Families over 15, justified:** anarchism (20) has 14 members and 91 pairs, and
its members split on two independent axes — how the economy should work and how
to get there — which a single 15-question block cannot cover without leaving
most pairs with one separating question. Marxism–Leninism (18) has 66 pairs and
the same two-axis structure (economic reform vs party form); the two sub-blocks
let a respondent who has shown no interest in party questions skip ML-B.

**Families under 10, justified:** early_socialism, liberal_left and post_marxist
have 3–4 members (3–6 pairs). Six questions give every pair at least two
separating questions, which is the fragility threshold `coverage` reports;
more would spend a Standard-mode budget on families few respondents reach.

### market_socialism — no depth-2 block

Two members. Their separation from other families rests on depth-1 questions
(D3, D26, D1, D4, D5 as in §3) and on neighbouring blocks that already ask the
relevant questions: ML-A's self-management and market-reform items (Titoism),
AN-E's market and property items (mutualism), and the social-democracy block's
ownership-horizon items. Those questions list `market_socialism` in their
`any` gate so they are asked when MS carries mass. The one question that
separates guild socialism from market socialism is depth-3 (§5.8).

---

## 5. Depth-3 separation plan

**~95 depth-3 questions, plus up to 10 self-identification questions (§6).**

Method. For each cluster the separating questions are defined as abstract
positions, then every member's expected answer is laid out in a grid. Any pair
is separated by the columns where the two cells differ; `coverage` will measure
exactly this once stances exist. A cell of `·` means no stance (silence), which
separates only weakly — a stance against silence counts, but only at weight ≥ 2.
Each cluster ends with the pairs that have **fewer than two clear
differences**: those are fragile under noise (SPEC §10.3) and are carried into
§6 and §10.

Every question is a position, a scenario or a verdict on a general class of
cases. None needs a name, date, event or organisation; the ones that give a
verdict on a historical class of cases are marked **H** and budgeted in §8.

### Revisions after review

The grids below keep their original columns as the reasoning for which
questions exist. Where a column was merged into a depth-1 dimension, the
inventory row says what it absorbed; the grid is not renumbered.

**Cells changed** (each logged in docs/review/boundary-stance-notes.md):

| cell | was | now | why |
|---|---|---|---|
| 5.3 leninism E6 | A (factions allowed) | B, then E6 dropped | factions were banned in 1921; with the fix every member answers alike |
| 5.10 sandinismo R5 | N (labour opposed to national capital) | · | the Sandinista mixed economy courted "patriotic" producers; likely Y, unchecked |
| 5.6 individualist_anarchism A5 | Y (claims above the individual binding) | · | the egoist-influenced wing held the opposite |
| 5.7 insurrectionary_anarchism S4 | K (keep and democratise industry) | · | a guess the doctrine does not support |
| 5.7 revolutionary_syndicalism S5 | D (defensive violence only) | · | a guess the doctrine does not support |

**Questions added:** 5.3 E8 (purges verdict: Stalinism's second separator);
5.4 T10 (nuclear war: Posadism's second separator); 5.6 A8 (what makes property
yours: labour, occupancy and use, or the power to hold it — needed once A5
lost its individualist cell); 5.7 a women's-institutions question (democratic
confederalism's solid separator from Zapatismo).

**Pairs re-checked after the changes:** individualist / egoism now rests on A8
and A5 (egoism's cell only); insurrectionary / post-left still separates on S1
and S10; revolutionary / anarcho-syndicalism on I6 and D4 (abolish outright).
Recorded in docs/inseparable.md: connollyism / abertzale_left and zapatismo /
democratic_confederalism.

### 5.1 Left communism (8) — 8 questions

| Q | Position |
|---|---|
| L1 | Assembly of delegates vs a programme-holding organisation, when they disagree: **A** the assembly / **P** the programme / **N** the question is wrong — neither should exist as a separate power |
| L2 | After a rupture: **T** a measured transitional period (distribution by labour contributed) / **I** immediate abolition of exchange and wages |
| L3 | Should revolutionaries stand for election? **Y** / **N** |
| L4 | Organisation: **N** none above the councils / **M** a mass party of the class that argues and is outvoted / **P** a minority holding the programme / **X** no permanent organisation |
| L5 | What the struggle is over: **W** power in the workplace / **D** the whole of everyday life / **R** refusing work itself |
| L6 | The organ that runs production: **U** industrial unions / **C** councils elected by everyone in a workplace / **·** |
| L7 | Immediate demands: **F** fight for them as preparation / **O** stand only for the final goal |
| L8 | The workplace-council form itself: **K** the form of the future society / **S** one more institution the revolution abolishes |

| | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L8 |
|---|---|---|---|---|---|---|---|---|
| council_communism | A | T | N | N | W | C | · | K |
| bordigism | P | T | N | P | W | · | O | S |
| luxemburgism | A | T | Y | M | W | C | F | K |
| communization | N | I | N | X | D | · | · | S |
| situationism | A | · | N | X | D | C | · | K |
| autonomism | · | · | N | X | R | · | F | S |
| de_leonism | · | T | Y | M | W | U | O | K |
| impossibilism | · | · | Y | M | W | · | O | · |

Reuses `d3_party_vs_class` (L1-adjacent) and `d3_council_or_programme` (L1).
**Weak pairs:** de_leonism / impossibilism (L6 and L2 only, one of which is a
stance against silence); situationism / council_communism (L4 and L5). Both
stay separable; both are fragile.

### 5.2 Maoism (7) — 8 questions

| Q | Position |
|---|---|
| M1 | Is this body of ideas **A** an application of the general theory to one country's conditions, or **U** a universal new stage of it? |
| M2 | Armed struggle in the countryside: **C** suited to peasant countries / **P** universal, protracted / **I** to be started now without waiting for conditions / **N** to be ended by negotiation once it can win elections |
| M3 | Workers in wealthy countries: **R** potentially revolutionary / **B** bought off by the proceeds of imperial exploitation |
| M4 | A mass movement against officials: **L** called and directed by the party / **R** revolt against all authority, the party's included |
| M5 | Money, markets and cities after victory: **G** phased out gradually / **I** abolished at once |
| M6 | Should one leader's thought be the movement's guiding doctrine? **Y** / **N** |
| M7 | After a war it can win: **Y** compete in multi-party elections / **N** |
| M8 | The principal contradiction in the world: **K** class within each country / **P** poor nations against rich ones |
| M9 | Does the revolution need a disciplined party at all? **Y** / **N** — the masses in revolt are their own organisation |

| | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 |
|---|---|---|---|---|---|---|---|---|---|
| mao_zedong_thought | A | C | R | L | G | N | N | K | Y |
| marxism_leninism_maoism | U | P | R | L | G | N | N | K | Y |
| gonzalo_thought | U | I | R | L | G | Y | N | K | Y |
| prachanda_path | U | N | R | L | G | · | Y | K | Y |
| mlm_third_worldism | U | P | B | L | G | N | N | P | Y |
| mao_spontex | A | · | R | R | G | N | N | K | N |
| pol_potism | · | I | · | L | I | · | N | · | Y |

Reuses `d3_class_struggle_under_socialism`. The SPEC §1 criterion pair
(mao_zedong_thought / MLM) separates on M1 and M2. M9 exists because without it
mao_zedong_thought / mao_spontex rested on M4 alone. **Weak pairs:** none below
two after M9. M6 is the only position proxy for Gonzalo's shibboleth — see §6.

### 5.3 Leninist core (6) — 7 questions

| Q | Position |
|---|---|
| E1 | Can socialism be built in one country, or does it depend on revolution spreading? **S** / **W** |
| E2 | **H** Socialist states that later introduced markets and relaxed the party's line: **R** restored capitalism / **A** remained socialist with reforms |
| E3 | Enterprises: **P** run to a central plan / **S** self-managed by their workers, trading with each other |
| E4 | Alignment: **B** with the other socialist states / **N** with neither bloc / **I** alone, self-reliant |
| E5 | A single leader whose thought settles disputes: **Y** / **N** |
| ~~E6~~ | ~~Organised factions inside the party~~ — **dropped**: see below |
| E7 | **H** A socialist state that breaks with the leading socialist power: **J** justified / **T** a betrayal |
| E8 | **H** Mass purges of a ruling party's own members to root out suspected enemies under external threat: **J** justified by the danger / **X** an abuse that betrayed socialism |

| | E1 | E2 | E3 | E4 | E5 | E7 | E8 |
|---|---|---|---|---|---|---|---|
| leninism | W | · | P | · | N | · | · |
| marxism_leninism | S | · | P | B | N | T | X |
| stalinism | S | · | P | B | Y | T | J |
| hoxhaism | S | R | P | I | · | J | J |
| titoism | S | A | S | N | N | J | · |
| juche | S | · | P | I | Y | J | · |

**Revisions.** E6 had Leninism as "factions allowed until a decision is taken".
Lenin's party banned organised factions in 1921, so the cell was wrong; corrected
to "banned", every member answers E6 alike and it was dropped. E1, E3, E4 and E5
are depth-1 dimensions (D10, D26/D3, D10, D25) and live there in the inventory.
E8 is new, added so that Stalinism has a second position separator.

**Weak pairs.**
- marxism_leninism / stalinism: E5 and E8 — two separators, both flagged in
  docs/review/boundary-stance-notes.md.
- leninism / marxism_leninism: E1 only, and the Leninism cell is contestable.
  The second separator is the marxism_leninism self-identification question
  (§6); see docs/inseparable.md for why the pair is kept rather than recorded.

### 5.4 Trotskyism (9) — 9 questions

| Q | Position |
|---|---|
| T1 | **H** A planned economy run by an unremovable bureaucracy: **W** a workers' state gone wrong / **C** capitalism with one owner / **N** a new kind of class society (reuses `d3_bureaucratic_planned_economy`) |
| T2 | **H** When such a state fights a capitalist one: **D** defend it / **X** support neither (reuses `d3_war_between_such_states`) |
| T3 | Working inside larger parties for a long period: **Ec** inside communist or national-liberation movements / **Ed** inside mass labour or social-democratic parties / **O** stay an independent organisation |
| T4 | Revolutionary openings: **F** frequent — build to intervene in each / **R** rare — build patiently |
| T5 | Unions' independence from the state and from cross-class coalitions: **Y** the first principle / **·** |
| T6 | Other left organisations: **U** seek joint work / **H** polemicise openly, never accommodate |
| T7 | History: **O** moving irreversibly toward socialism, so even catastrophe hastens it / **C** open |
| T8 | Governing coalitions with non-socialist parties: **V** never / **T** tactically acceptable |
| T9 | National-liberation movements led by non-socialists: **S** support them critically as allies / **I** stay independent of them |
| T10 | A general nuclear war between rival blocs: **A** would advance socialism by destroying capitalism's apparatus / **B** would set it back catastrophically |

| | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|---|---|---|---|---|---|---|---|---|---|---|
| orthodox_trotskyism | W | D | O | R | · | U | C | V | · | B |
| pabloism | W | D | Ec | · | · | U | O | T | S | · |
| cliffism | C | X | O | · | · | U | C | V | · | B |
| shachtmanism | N | X | O | · | · | U | C | T | · | B |
| grantism | W | D | Ed | R | · | · | C | · | · | · |
| morenism | W | D | O | F | · | · | C | V | S | · |
| lambertism | W | D | O | R | Y | · | C | V | I | · |
| posadism | W | D | · | · | · | · | O | · | S | A |
| spartacism | W | D | O | R | · | H | C | V | I | · |

T10 is new. Posadism's commitments about contact with non-human intelligence
cannot be asked as a position question; its stance on nuclear war can. With T7,
posadism has two separators from orthodox Trotskyism on which both hold a
position, so it comes off docs/inseparable.md (fragile, and still lineage-gated).

**Weak pairs** (one clear difference): orthodox / grantism (T3), orthodox /
spartacism (T6), orthodox / lambertism (T5), lambertism / spartacism (T5, T6 —
two, but both weight-2 at best). This is what the family is: each split is the
trunk plus one defining position. The separating question can carry weight 3,
which separates noise-free respondents cleanly, but a single atypical answer
collapses the pair. Carried to §6 and §10.

### 5.5 Chinese lineage (cross-family: maoism / marxism_leninism) — 4 questions

| Q | Position |
|---|---|
| C1 | Class struggle continuing under socialism, fought by mass campaigns: **Y** / **N** |
| C2 | Private capital and markets in the early stage of socialism: **N** / **Y** under party direction |
| C3 | Now: **G** growth first, distribution later / **E** common prosperity and limits on wealth / **R** egalitarian redistribution |
| C4 | Party supervision of private firms, culture and the internet: **S** strong and extending / **L** light, to let development run |

| | C1 | C2 | C3 | C4 |
|---|---|---|---|---|
| mao_zedong_thought | Y | N | R | · |
| deng_xiaoping_theory | N | Y | G | L |
| xi_jinping_thought | N | Y | E | S |

Deng / Xi separate on C3 and C4 — genuine, but differences of emphasis within
one line, so the stances will be weight 2 and the pair is fragile. The within-
scope update lets C1–C4 be asked of a respondent with mass in either family.

### 5.6 Anarchist economics (6) — 7 questions

Cluster adds egoism, which sits under individualist anarchism.

| Q | Position |
|---|---|
| A1 | The means of work belong to: **O** whoever occupies and uses them / **C** the association that works them / **K** everyone in common / **S** the individual producer |
| A2 | Distribution: **L** by labour contributed / **N** by need / **M** by free exchange |
| A3 | Money and prices after the change: **Y** kept, without rent or interest / **N** abolished |
| A4 | The union after the change: **U** runs production / **O** one organ among several / **X** no special role |
| A5 | Claims above the individual — justice, duty, humanity: **Y** binding / **N** fixed ideas to be dissolved |
| A6 | Normal economic life: **A** cooperative associations / **I** independent producers trading |
| A7 | The basic unit of the free society: **W** the workplace / **C** the commune or neighbourhood |

| | A1 | A2 | A3 | A4 | A5 | A6 | A7 |
|---|---|---|---|---|---|---|---|
| mutualism | O | M | Y | X | Y | A | · |
| collectivist_anarchism | C | L | Y | O | Y | A | C |
| anarcho_communism | K | N | N | O | Y | A | C |
| anarcho_syndicalism | C | · | · | U | Y | A | W |
| individualist_anarchism | S | M | Y | X | · | I | · |
| egoism | · | · | · | X | N | · | · |

The SPEC §1 criterion pair anarcho_communism / anarcho_syndicalism separates on
A4 and A7 (A1 and A2 add weight). **Weak pair:** mutualism / individualist
(A1 and A6) — honestly close, since several individualists called themselves
mutualists. Two clear differences, but both are matters of emphasis.

### 5.7 Anarchist strategy and structure (8) — 10 questions

| Q | Position |
|---|---|
| S1 | Organisation: **F** a formal federation with members / **A** small groups formed for a purpose and dissolved / **R** organisation as such is the problem / **C** assemblies of the whole community |
| S2 | Now: **N** attack the existing order now / **B** build a mass movement / **P** build parallel institutions |
| S3 | The organised left: **I** part of it / **B** break with it — it reproduces what it opposes |
| S4 | Industry and agriculture: **K** keep and democratise / **R** reduce to a human scale / **A** unwind |
| S5 | Violence: **V** refused on principle / **D** defensive only / **O** offensive action acceptable |
| S6 | Hold a territory and govern it now, before any wider change? **Y** / **N** |
| S7 | Is the refusal of the state grounded in religious faith? **Y** / **N** |
| S8 | Should anarchists stand in local elections to turn councils into assemblies? **Y** / **N** |
| S9 | A people's demand for self-determination: **R** legitimate, answered by confederation not a state / **I** irrelevant to anarchism |
| S10 | The aim: **O** overthrow the order / **L** live free now; refusal as daily practice |

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 |
|---|---|---|---|---|---|---|---|---|---|---|
| insurrectionary_anarchism | A | N | B | · | O | N | N | N | · | O |
| post_left_anarchy | R | · | B | · | · | N | N | N | · | L |
| revolutionary_syndicalism | F | B | I | K | · | N | N | N | · | O |
| social_ecology | C | P | I | R | D | · | N | Y | I | O |
| democratic_confederalism | C | P | I | R | D | Y | N | · | R | O |
| zapatismo | C | P | · | R | D | Y | N | N | R | · |
| christian_anarchism | · | P | · | R | V | N | Y | N | · | L |
| anarcho_primitivism | · | · | B | A | · | N | N | N | · | L |

**Weak pair:** zapatismo / democratic_confederalism (S8, S3 — one of them
silence). They hold the same structural position — territorial self-government
through confederated assemblies, without seeking a state — and differ mainly in
the peoples they arose among, which is not a position. See §10.

### 5.8 Industrial democracy (6, cross-family) — 6 questions

| Q | Position |
|---|---|
| I1 | Who speaks for people as consumers? **S** a democratic state / **M** the market / **N** no separate body / **C** councils that include consumers |
| I2 | The unit that runs an industry: **G** a national guild of everyone in it / **F** firm-level cooperatives / **U** an industrial union / **K** workplace councils |
| I3 | Should the movement also win elections? **Y** / **N** |
| I4 | Between enterprises: **M** markets / **P** a negotiated plan |
| I5 | Is the goal a stateless society as such? **Y** / **·** whatever the organised workers decide |
| I6 | Should the union admit members of any political view? **Y** it is the class's organisation / **N** it carries a programme |

| | I1 | I2 | I3 | I4 | I5 | I6 |
|---|---|---|---|---|---|---|
| guild_socialism | S | G | Y | P | · | · |
| market_socialism | M | F | Y | M | · | · |
| revolutionary_syndicalism | N | U | N | · | · | Y |
| anarcho_syndicalism | N | U | N | P | Y | N |
| de_leonism | C | U | Y | P | · | N |
| council_communism | C | K | N | P | · | · |

guild_socialism / market_socialism — the only pair market_socialism has — is
separated on I1, I2 and I4. revolutionary / anarcho-syndicalism on I5 and I6.

### 5.9 Social democracy and neighbours (8, cross-family) — 7 questions

| Q | Position |
|---|---|
| D1 | The final goal: **R** replace private ownership of major assets / **M** a permanent mixed economy / **O** opportunity inside markets |
| D2 | How socialism comes: **C** capitalism's own development produces it / **N** reforms accumulate, with no end-point / **E** expert administration proves itself better |
| D3 | The agent: **W** the organised working class / **X** administrators and experts / **A** a broad alliance across classes |
| D4 | A multinational state: **Y** give each nationality cultural self-government without separate territory / **·** |
| D5 | The welfare state with full employment: **F** the achievement, to defend / **S** a stage on the way |
| D6 | **H** The socialist states of the last century: **X** not a model at all / **K** failed, but the aim was right and must be won by consent / **·** |
| D7 | Historical development as a matter of scientific law: **Y** / **N** |

| | D1 | D2 | D3 | D4 | D5 | D6 | D7 |
|---|---|---|---|---|---|---|---|
| kautskyism | R | C | W | · | S | · | Y |
| bernsteinian_revisionism | M | N | W | · | S | · | N |
| classical_social_democracy | M | N | W | · | F | X | N |
| fabianism | R | E | X | · | S | · | N |
| democratic_socialism | R | N | W | · | S | X | N |
| austromarxism | R | C | W | Y | S | · | Y |
| eurocommunism | R | N | A | · | S | K | N |
| third_way | O | N | A | · | F | X | N |

Reuses both halves of the rewritten `d2_reform_horizon`. The SPEC §1 criterion
pair classical_social_democracy / democratic_socialism separates on D1 and D5.
**Weak pairs:** kautskyism / austromarxism (D4 only — Austromarxism is
Kautskyism plus the national question, which is what it is); bernsteinian /
classical (D5 only — parent and child in the tree, so the back-off to their
tendency is the honest result).

### 5.10 Latin American revolutionary (6, cross-family) — 7 questions

| Q | Position |
|---|---|
| R1 | Route to power: **F** a small armed nucleus creates the conditions / **M** mass insurrection / **E** win elections, then transform the state / **C** a cross-class movement around a national leader |
| R2 | After power: **O** one party / **P** competitive elections kept / **L** a movement-state organised around the leader |
| R3 | Motive in the new economy: **V** moral commitment and solidarity / **Mt** material incentives |
| R4 | The land: **I** indigenous communal forms are the basis / **R** redistribute to peasant families |
| R5 | Labour and national capital: **Y** allied, mediated by the state / **N** opposed |
| R6 | Revolution abroad: **Y** actively carry it, including armed / **S** solidarity, not export / **N** |
| R7 | Neighbourhood councils that run budgets alongside the state: **Y** central / **·** |

| | R1 | R2 | R3 | R4 | R5 | R6 | R7 |
|---|---|---|---|---|---|---|---|
| guevarism | F | O | V | · | N | Y | · |
| castroism | F | O | · | R | N | S | · |
| chavismo | E | P | · | R | N | S | Y |
| sandinismo | M | P | · | R | · | S | · |
| mariateguism | M | · | · | I | N | · | · |
| peronism | C | L | Mt | · | Y | N | · |

guevarism / castroism: R3, R6. chavismo / sandinismo: R1, R7. **No pair
below two.**

### 5.11 Anti-colonial (6) — 6 questions (counted in the AC depth-2 block)

| Q | Position |
|---|---|
| K1 | Violence in throwing off colonial rule: **T** it remakes the colonised as free people / **N** a means only / **V** to be avoided |
| K2 | Recovering the people's own culture: **R** the core of liberation / **S** secondary |
| K3 | The educated class: **C** must give up its position and merge with the peasantry / **L** should lead |
| K4 | The unit of development: **V** cooperative villages / **C** a continental union / **N** a self-reliant nation / **G** an alliance of poor nations |
| K5 | Foreign aid and debt: **R** refuse them / **A** accept on terms |
| K6 | Workers in wealthy countries: **B** bought off / **A** allies |

| | K1 | K2 | K3 | K4 | K5 | K6 |
|---|---|---|---|---|---|---|
| fanonism | T | · | C | · | · | B |
| cabralism | N | R | C | N | · | · |
| third_worldism | · | · | · | G | · | B |
| ujamaa | · | R | · | V | A | · |
| nkrumaism | V | · | L | C | A | · |
| sankarism | · | · | C | N | R | · |

**Weak pair:** cabralism / sankarism (K1, K2, K5 — all partly silence). Watch
once stances exist. Third Worldism vs MLM–Third Worldism (cross-family) is
separated by the Maoism axes M1 and M2 — the Maoist version requires people's
war, the general one does not.

### 5.12 Indian subcontinent (4) — 6 questions

| Q | Position |
|---|---|
| N1 | Caste: **A** annihilate it first; economic change will not / **R** reform it within the tradition / **D** it dissolves with development |
| N2 | Scale: **V** self-reliant villages / **S** small machines, decentralised / **H** planned heavy industry |
| N3 | Non-violence: **P** a principle / **T** a tactic |
| N4 | A religion that sanctions hierarchy: **C** reform it from within / **X** leave it |
| N5 | Constitution and law as the instrument of liberation: **Y** / **·** |
| N6 | The oppressed castes' politics: **B** a broad coalition of all backward and poor groups / **S** their own separate organisation and representation |

| | N1 | N2 | N3 | N4 | N5 | N6 |
|---|---|---|---|---|---|---|
| gandhian_socialism | R | V | P | C | · | · |
| lohiaite_socialism | A | S | T | · | · | B |
| ambedkarism | A | · | · | X | Y | S |
| nehruvian_socialism | D | H | · | X | Y | · |

N6 exists because lohiaite / ambedkarism otherwise differed only against
silence. N1 feeds the `race` tag's anti-caste reading (§9). **No pair below two
after N6.**

### 5.13 Religious left (6) — 4 questions + self-identification

| Q | Position |
|---|---|
| F1 | What faith requires of the economy: **C** a cooperative economy / **K** a common purse, no private property / **P** structural change led by the poor themselves / **Z** obligatory giving, no interest, limits on accumulation / **S** sufficiency — reduce craving / **T** owners hold wealth in trust for all |
| F2 | Marxist class analysis: **U** a tool faith can use / **R** incompatible |
| F3 | The believing community: **M** must itself live in common / **W** witnesses in the wider world |
| F4 | Force against extreme oppression: **V** refused / **J** can be justified |

| | F1 | F2 | F3 | F4 |
|---|---|---|---|---|
| christian_socialism | C | · | W | · |
| christian_communism | K | · | M | V |
| liberation_theology | P | U | W | J |
| islamic_socialism | Z | · | W | · |
| buddhist_socialism | S | · | · | V |
| gandhian_socialism | T | R | · | V |

**Weak pairs:** christian_socialism / islamic_socialism (F1 only). Honestly
these members are separated first by *which* tradition grounds them, and naming
a tradition is self-identification. The religious_left self-ID question (§6)
is the right instrument; no position question should pretend otherwise.

### 5.14 National question (7) — 9 questions (4 depth-3, 5 in the NQ block)

| Q | Position |
|---|---|
| Q1 | Territory: **T** a state of our own on our land / **A** autonomy where we already live, without territory / **U** unify a nation divided across states / **S** sovereignty of an existing state against foreign capital |
| Q2 | Independence and socialism: **I** inseparable — a republic without social change is only a new flag / **F** independence first / **C** class conciliation inside the nation |
| Q3 | Party: **S** one national party / **P** pluralism |
| Q4 | Collective settlement and cooperative agriculture as how the nation is built: **Y** / **·** |
| Q5 | Language as the core of nationhood: **Y** / **·** |
| Q6 | The agent of national revolution: **P** a civilian ideological party / **M** officers acting for the nation |
| Q7 | A single national leader embodying the movement: **Y** / **N** |
| Q8 | The labour movement owning its own enterprises, bank and services: **Y** / **·** |
| Q9 | Workers of the dominant nation: **A** allies / **·** |

| | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|---|---|---|---|---|---|---|---|---|---|
| connollyism | T | I | P | · | · | · | N | · | A |
| abertzale_left | T | I | P | · | Y | · | N | · | · |
| labour_zionism | T | I | P | Y | Y | · | N | Y | · |
| bundism | A | I | P | · | Y | · | N | · | A |
| baathism | U | F | S | · | · | P | · | · | · |
| nasserism | U | F | S | · | · | M | Y | · | · |
| peronism | S | C | · | · | · | · | Y | · | · |

**Weak pairs:** connollyism / abertzale_left (Q5, Q9 — both against silence);
baathism / nasserism (Q6, Q7). The first is the roster's clearest inseparable
pair (§10); the second rests on one real difference in agent.

### 5.15 Additions — smaller clusters

- **Liberal left (3), 2 questions** in its block: property (spread in small
  holdings / private and regulated / social ownership) and justification
  (autonomy / need and opportunity / family and local community). Separates all
  three pairs on both.
- **Early socialism (4), 4 questions** in its block: how change spreads (model
  community / rule of producers through industry / the peasant commune); what
  makes work bearable (matched to what people enjoy / a good environment forms
  good character / efficient organisation); the peasantry as base; who directs
  (benevolent founders / free attraction / experts). Owenism / Fourierism is the
  weakest pair (two clear).
- **Post-Marxist (3), 3 questions** in its block: whether any class is
  privileged; a mass party vs a front of movements; growth vs limits.
  Separates all three pairs.

### Depth-3 count

**Superseded.** This section originally counted the grids above as 84 depth-3
questions on top of §4's 135 depth-2 budget. Those were largely the same
questions: §4 described each family block by exactly the distinctions §5 then
gridded. The unique count, with each question assigned a depth by the rule in
SPEC.md §3.3, is in docs/question-inventory.md: **55 depth-2 and 28 depth-3**.
Most grid columns turned out to be depth-2 (they separate tendencies within a
family), and 43 were depth-1 dimensions asked again under another name.

---

## 6. Lineage-defined ideologies

Twelve ideologies carry `lineage: true`. The engine's lineage gate will not name
one as a sect until a respondent has given positive evidence on a question the
ideology holds a position on *itself* — so each needs at least one honest
position proxy, or it can only ever be returned alongside its parent.

| Ideology | Defining shibboleth | Position proxy | What stays inseparable without lineage knowledge |
|---|---|---|---|
| stalinism | Defence of one leader's record and the period of forced industrialisation | E5 (a single leader whose thought settles disputes) and E8 (purges of the party's own members justified by the danger) | Two separators, both flagged as uncertain. A respondent who holds the ML line without either is correctly returned as ML. |
| hoxhaism | Every later socialist state betrayed the line | E2 (later reforming states restored capitalism) + E4 (alone and self-reliant) | Separable. |
| guevarism | The foco; the new person | R1 (armed nucleus creates conditions), R3 (moral incentives), R6 (carry revolution abroad) | Separable from castroism on R3 and R6. |
| gonzalo_thought | Initiate people's war; a guiding leader's thought as doctrine | M2 = I, M6 = Y | Separable from MLM on two questions, but its difference from pol_potism on M2 is shared. Separable overall. |
| prachanda_path | People's war then negotiated entry into multi-party politics | M2 = N, M7 = Y | Separable. |
| orthodox_trotskyism | The trunk: degenerated workers' state, defencism | T1 = W, T2 = D | Separable from Cliffism and Shachtmanism; *is* the default the other seven splits are measured against. |
| pabloism | Long-term entry into communist and national-liberation movements | T3 = Ec, T7 = O, T9 = S | Separable. |
| grantism | Long-term work inside mass labour parties | T3 = Ed | **Fragile** — one position. |
| morenism | Revolutionary openings are frequent | T4 = F, T9 = S | Two positions, both of emphasis. Fragile. |
| lambertism | Union independence from the state and from cross-class coalitions as first principle | T5 = Y, T9 = I | Against spartacism: T5 vs T6 only. Fragile. |
| posadism | Historical optimism that even catastrophe hastens socialism; nuclear war as a clearing | T7 = O (shared with pabloism), T10 = A | Two separators from orthodox Trotskyism, so no longer recorded as inseparable. Its extraterrestrial commitments stay out of reach, which is correct under principle 2. Fragile. |
| spartacism | Programmatic intransigence; open polemic against the rest of the left | T6 = H, T8 = V | Fragile against lambertism. |

### Self-identification questions (principle 10)

At most one per family, depth 3, optional, stance weight ≤ 1 — it nudges
between candidates the positions have already narrowed to; it never decides.

**Gating.** The original plan gated these on "an `undecided` result within that
family". **The schema's `requires` cannot express that**: its atoms are
`answered`, `family_mass_gte` and `depth_unlocked_gte`, none of which can see the
resolver's output or how mass is spread *inside* a family. The gate is therefore:

```yaml
requires:
  all:
    - depth_unlocked_gte: 3
    - family_mass_gte: { <family>: 0.5 }
```

The "positions have run out" part is left to selection rather than gating. A
self-ID question's stances sit only on that family's members, at weight ≤ 1, so
its expected information gain is small while one member clearly leads and
largest when members are tied — which is when the adaptive selector will pick
it. That is recorded in SPEC.md §7.1. If that proves too loose in simulation,
the alternative is a new condition atom (say `undecided_within: <family>`) that
reads the resolver's result — a schema and engine change, proposed rather than
made.

| Family | Options (named traditions) | Why it is needed |
|---|---|---|
| trotskyism | the nine traditions, plus "none of these" | Six of nine are lineage; T3–T9 leave four fragile pairs |
| marxism_leninism | leninism, stalinism, hoxhaism, titoism, juche, ho_chi_minh_thought, "the general line" | The second separator for leninism / marxism_leninism, whose only position separator (E1) is contestable; a third for ML / Stalinism |
| maoism | gonzalo_thought, prachanda_path, mlm_third_worldism, "the general line" | Both lineage members; one-question separations |
| religious_left | Christian, Islamic, Buddhist, Hindu or Gandhian, other | Members are separated first by which tradition grounds them (§5.13) |
| national_question | the national movements the family's members belong to, plus "a different people" | connollyism / abertzale_left are the same claim applied to different peoples (§10) |
| anarchism | zapatismo, democratic_confederalism, "neither" | The pair shares one structural position (§5.7) |

Six self-ID questions. Principle 10's cap is one per family, so the maximum
is thirteen; six is what the separation plan actually needs. Each is exempt
from the named-entity and jargon lint by `self_id: true`, and must still pass the
year check.

---

## 7. Planned follow-up chains

"force" asks next; "boost" raises selection score; "unlock" grants eligibility.
The forced queue is capped at 3 pending (SPEC §7.2), so no chain below forces
more than two in a row.

| # | Answer | → Ask | Mode | Why it reads as the next question |
|---|---|---|---|---|
| 1 | D4 "break it up and replace it" | D11 the state after transition | force | "You said it has to be replaced. Once the replacement has done its work, what happens to *it*?" |
| 2 | D11 "withers away" | E1 socialism in one country | boost | Withering presumes the transition succeeds; whether it can in one place is the obvious next doubt. |
| 3 | D5 "a vanguard should lead" | L1-style "when the class votes against the organisation" | force | The natural test of any claim to lead: what happens when the led disagree. Existing `d3_dissent_after_revolution → d3_party_vs_class` is this chain. |
| 4 | T1 "capitalism with one owner" | T2 war between two such states | force | Existing chain; the analysis has an immediate practical consequence. |
| 5 | T1 "a workers' state gone wrong" | T2 | boost | Same consequence, less urgent — defencism is expected. |
| 6 | D9 "the peasantry" | M2 armed struggle in the countryside | boost | If the peasantry is decisive, how it fights is the next question. |
| 7 | M2 "started now, without waiting" | M6 guiding leader | boost | Who decides the moment has come? Initiation needs a source of authority. |
| 8 | D7 "the nation is the unit" | Q1 territory | force | "You said the nation comes first. What does self-government mean for it — a state, autonomy, or unity with others?" |
| 9 | Q1 "autonomy without territory" | D4-variant: autonomy inside a multinational state | unlock | Only meaningful after that answer; reaches bundism and austromarxism. |
| 10 | D13 "faith grounds my politics" | F1 what faith requires economically | force | The obvious next step from "it is grounded in faith" is "then what does it require?" |
| 11 | D12 "violence refused on principle" | F4 / S5 force against extreme oppression | boost | Tests the principle against its hardest case. |
| 12 | D3 "markets between worker-owned firms" | I1 who speaks for consumers | force | A market answers the consumer question one way; the follow-up asks whether that is enough. |
| 13 | D26 "workers manage their workplaces" | I2 the unit that runs an industry | boost | Self-management at what scale — firm, industry, or council? |
| 14 | A2 "by need" | A7 workplace vs commune | boost | Need is met where people live or where they work — the ancom/syndicalist split. |
| 15 | S1 "small groups formed for a purpose" | S10 overthrow vs live free now | force | Affinity groups are for acting; acting for what is the next question. |
| 16 | D8 "colonial domination is primary" | K6 workers in wealthy countries | boost | If exploitation runs between nations, where do rich-country workers stand? |
| 17 | D2 "win elections and legislate" | D5 (SD) welfare state as achievement or stage | force | "You said legislate. When the legislating has built a welfare state, is that where you stop?" Replaces the old `d2_reform_horizon` trigger. |
| 18 | E2 "reforming states restored capitalism" | E7 breaking with the leading socialist power | boost | Having judged the reformers, the respondent's view of earlier ruptures follows. |
| 19 | N1 "annihilate caste first" | N6 separate representation vs broad coalition | force | How to organise follows directly from treating caste as prior. |
| 20 | C2 "markets under party direction" | C3 growth first vs common prosperity | force | Markets under direction toward what — the Deng/Xi question. |

Chain lengths: the longest forced run is 1 → 3 (two forced) or 8 → 9 (force then
unlock). `stats` will report the longest forced chain; target ≤ 3.

---

## 8. History-allowance budget (principle 3)

Questions that deliver a verdict on a general class of historical cases, marked
**H** above:

| Question | Class of cases |
|---|---|
| T1 (existing `d3_bureaucratic_planned_economy`) | planned economies run by an unremovable bureaucracy |
| T2 (existing `d3_war_between_such_states`) | wars between such states |
| existing `d3_class_struggle_under_socialism` | entrenched officialdom in socialist states |
| E2 | socialist states that introduced markets and relaxed the party line |
| E7 | a socialist state breaking with the leading socialist power |
| D6 (SD cluster) | the socialist states of the last century as a model |
| C1 | continuing mass campaigns against officials |
| K1 | violence in decolonisation |
| Q2 | independence without social change |
| R6 | carrying revolution abroad |

Ten at most, each phrased as a general class with examples only in the tooltip.
Several (K1, Q2, R6, C1) can be written as present-tense positions rather than
verdicts; if they are, they drop off this list. **Worst case 10 of ~274 =
3.6%**, well inside the ~10% cap. `stats` currently reports 3/19 = 15.8% "over";
that figure falls below the cap once the bank passes ~30 questions.

---

## 9. Modifier-tag plan

Tags never move the posterior (SPEC §1.2). They describe what someone answered,
independently of where they were placed.

**Threshold for showing a tag: earned ≥ 2 *and* strength (earned / available)
≥ 0.6.** One answer should never produce a tag. That rule requires every tag to
have at least two questions that can award it — the table is built to that.

| Tag id | Shown as | Depth-1 feeders | Deeper feeders |
|---|---|---|---|
| `ecology` | Ecological emphasis | d1_ecology_priority, d1_growth | — |
| `gender` | Feminist emphasis | d1_care_work, d1_gender_division, d1_autonomous_movements (women's-movement option) | d3_womens_coequal_institutions |
| `race` | Anti-racist emphasis | d1_race_structure, d1_autonomous_movements (racially-oppressed option) | — |
| `caste` **(new)** | Anti-caste emphasis | d1_internal_hierarchy, d1_reserved_places | d3_caste_representation |
| `religion` | Religiously grounded | d1_faith_grounds, d1_religion_and_liberation | — |
| `nation` | Emphasis on national self-determination | d1_nation_self_gov, d1_autonomy_without_state, d1_nation_unity | — |
| `technology` | Technologically optimistic | d1_technology_scale, d1_planning_or_market | — |
| `anti_colonial` **(new)** | Anti-colonial emphasis | d1_imperialism_primary, d1_wealth_from_periphery, d1_decisive_agent | d2_rich_country_workers |

Every tag has at least two depth-1 feeders, so the threshold is reachable in
Quick mode. Question ids are the planned ids in docs/question-inventory.md.

**Applied in this revision** (schema, content and log):

- `anti_colonial` and `caste` are now in `MODIFIER_TAGS`, and every tag has a
  display name in `MODIFIER_TAG_LABELS` in `src/content/schema.ts`.
- **`caste` is its own tag, not folded into `race`.** Ambedkarite writers
  distinguish the two, and principle 5 requires every camp to recognise its own
  view; the earlier proposal to show one combined tag is withdrawn.
- `nation` is shown as "Emphasis on national self-determination". "Nationalist"
  is avoided because several families on this roster would read it as an
  accusation rather than a description.
- Three mis-tagged options in the existing bank are fixed:
  `peasants_and_rural_poor` loses `nation` (a peasant base is not a national
  claim); `colonised_nations` becomes `anti_colonial`;
  `break_it_up_for_local_control` loses `ecology` (scale is a technology
  position). No other existing option's tag disagreed with its text.
- `caste` now has two depth-1 feeders. The earlier plan fed it at depth 1 only
  through D23 and at depth 3 through a question gated on the Indian-subcontinent
  cluster, so most respondents could never earn it twice. The second depth-1
  question (reserved places for hereditary lower-ranked groups) is an honest
  position question in its own right, so the tag stays.

**Getting tags asked at all.** Modifier-only questions carry no stances, so
their expected information gain is zero and adaptive selection alone would never
choose them. The flow now carries a per-mode modifier quota (SPEC.md §7.3a):
Quick 3, Standard 6, Deep 8, interleaved after the first 4 questions, covering
unmeasured tags first and preferring dual-use questions.

---

## 10. Risks — where position alone cannot honestly separate

In rough order of how much they matter. The standard throughout is **two
independent separators** per same-family pair — two questions on which the pair
hold different positions and *both hold a position* (docs/inseparable.md).

1. **connollyism / abertzale_left — recorded as inseparable.** The same claim
   applied to two peoples; the only candidate separators (language as the core of
   nationhood; the dominant nation's workers as allies) are each a stance against
   silence. Declared in `inseparable_from`, so the result names both and says the
   position is the same and the difference is the people concerned. Ordinary
   respondents can reach them — as a pair. A shared tendency node is proposed in
   docs/roster-decisions.md §6, not added.
2. **zapatismo / democratic_confederalism — recorded as inseparable.** One solid
   separator (women's co-equal institutions); the second candidate, local
   elections, has democratic confederalism at silence and is contested. Declared
   in `inseparable_from`.
3. **The Trotskyist splits.** Six of nine are lineage-defined, and the family is
   a trunk plus single-position departures. grantism, lambertism, spartacism and
   morenism rest on one or two positions. **posadism now has two** (historical
   inevitability, nuclear war) and is off the inseparable list, but stays fragile
   and lineage-gated. Under the depth rule every Trotskyist question except the
   nature-of-bureaucratic-economies question is depth 3, so **Standard mode
   stops at the orthodox tendency** — the largest close call in the inventory.
4. **stalinism / marxism_leninism** — two separators (guiding leader, purges
   verdict), both flagged as uncertain in docs/review/boundary-stance-notes.md.
   **leninism / marxism_leninism** — one contestable position separator plus the
   self-identification question.
5. **The religious-left traditions.** Separated first by *which* faith grounds
   them. Position questions do part of it; the rest is self-ID. Writing the
   faith-and-economy question's six options so each tradition recognises itself
   (principle 5) is the hardest single piece of content in the plan.
6. **deng_xiaoping_theory / xi_jinping_thought** (two emphasis-level separators),
   **bernsteinian / classical_social_democracy**, **kautskyism /
   austromarxism**: differences of emphasis between parent and child. The
   resolver's back-off to the parent is the honest outcome.
7. **pol_potism and communization overlap on immediacy.** Both would answer
   "abolish money and exchange at once". The depth-1 state, party and pluralism
   questions separate them sharply, but the test must never return pol_potism
   on the immediacy answer alone: its stances should put weight 3 on the
   party-state and forced de-urbanisation positions, not on immediacy.
8. **Where the author's own judgement is most likely to leak in.** Every stance
   for **pol_potism, juche, baathism, nasserism, xi_jinping_thought,
   deng_xiaoping_theory, peronism, labour_zionism, distributism and third_way**
   needs checking against the tradition's own texts before it is committed —
   each is contested as left, associated with state violence, or tied to a live
   national conflict, which is where an author's view most easily passes for
   description. Tracked in docs/review/boundary-stance-notes.md; plan a dedicated
   review pass.
9. **post_marxist and market_socialism have no depth-2 questions of their own.**
   Both are separated entirely by depth-1 and shared questions. post_marxist's
   three members share only a rejection of a single decisive class; if the
   fitness report flags the family once stances exist, the likely honest outcome
   is that ecosocialism belongs elsewhere.
10. **early_socialism may absorb Gandhian and Zapatista respondents** through the
    change-by-example question. The violence, religion and state questions are
    the counterweights; watch in simulation.
11. **D12 violence carries no family default anywhere.** Correct under the 75%
    rule, but it means ~93 individual stances on one question — the single most
    labour-intensive dimension to author.
12. **The bank is smaller than first planned.** 130 questions, not ~273. A Deep
    respondent sees up to 60, so two Deep respondents will share more questions
    than SPEC.md §9 once hoped. That is the honest size of what the separation
    plan needs; the alternative is writing questions to a number.

---

## Totals

The authoritative per-question list is docs/question-inventory.md.

| Depth | Earlier plan | Unique | SPEC §9 range |
|---|---:|---:|---|
| 1 | 44 (table actually summed to 45) | **47** | 42–52 |
| 2 | 135 | **55** | 50–60 |
| 3 | ~94 incl. 6 self-ID | **28** incl. 6 self-ID | 25–31 |
| **Total** | **~273** | **130** | 117–143 |

**Why the numbers fell.** The overlap was real: all 84 of §5's sect-level
questions were also inside §4's depth-2 budgets, so **84 questions were counted
twice**. Of §4's 135, about 51 were budget that no specified question filled. A
further 43 grid columns asked a depth-1 dimension again under another name. Six
questions were added in this revision and one (E6) dropped.

Of the 19 existing questions: 11 kept at their current depth (two gain an option),
4 moved to a different depth, 4 rewritten; none dropped.

**Suggested authoring order**, per CLAUDE.md: the 47 depth-1 questions and the
roster's family defaults first; run `coverage` and `stats`; then the depth-2
questions family by family, largest pair count first (anarchism,
marxism_leninism, anti_colonial); then depth 3 in the order the separation
report ranks the pairs.
