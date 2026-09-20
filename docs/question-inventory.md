# Question inventory

One row per planned question. **Each question appears once.** This supersedes
the counts in `docs/question-blueprint.md` §4–§5, which double-counted (see
"Reconciliation" at the end). No question text is written yet; the "position"
column is the one-line disagreement each question will ask about.

**Depth rule** (recorded in SPEC.md §3.3): a question is **depth 2** if its
answer changes which branch or tendency of a family is favoured and it is worth
asking in Standard mode; **depth 3** if it only separates near-neighbours that
already share a branch — pairs that agree on every depth-2 question of their
family — and is worth asking only in Deep mode. Depth decides which mode asks a
question, so it changes what respondents see. Close calls are marked **◆** and
collected at the end so they can be overruled.

Columns: **id** is the planned id (an existing question keeps its content but is
renamed if its depth changes — a breaking id change, to be logged when made);
**scope** is the family or cluster whose members hold stances on it; **H** marks
a history-class question (principle 3); **L** a likert; tags are modifier tags
the question feeds.

Totals: **47 depth-1, 55 depth-2, 28 depth-3 — 130 questions.**

---

## Depth 1 — 47

| # | id | dim | position | reuses | notes |
|---:|---|---|---|---|---|
| 1 | d1_ownership | D1 | Who should own the large enterprises | d1_ownership | gains a "dispersed small property" or "state-led development" option |
| 2 | d1_expropriation | D1 | Taking major firms into social ownership: with full compensation, without, or not at all | — | |
| 3 | d1_land | D1 | Who should hold land: those who work it, the public, private owners, or everyone in common | — | |
| 4 | d1_change_route | D2 | Which road a movement should organise for | d1_change_route | |
| 5 | d1_owners_resist | D2 | Whether owners would accept a legal majority transferring major firms, or resist by any means | — | |
| 6 | d1_reforms_accumulate | D2 | Reforms, added up, can change the system | — | L |
| 7 | d1_planning_or_market | D3 | How it is settled what gets produced | d2_planning_or_market | moved to depth 1 (only question reaching market_socialism); tag technology |
| 8 | d1_price_signals | D3 | Prices carry information no planner can gather | — | L |
| 9 | d1_state_role | D4 | What to do with the existing machinery of government | d1_state_role | gains "win a state of our own" |
| 10 | d1_state_neutrality | D4 | The state: a neutral instrument, or the instrument of a class | — | |
| 11 | d1_police_and_army | D4 | Police and army: reform them, replace with a people's militia, or abolish them | — | |
| 12 | d1_party_role | D5 | An organisation's job inside a mass movement that does not share its programme | d2_party_role | moved to depth 1 |
| 13 | d1_party_needed | D5 | Does the working class need a party to become revolutionary | — | absorbs Maoism M9 |
| 14 | d1_organisation_form | D5 | Mass party, cadre organisation, front of movements, federation, or none | — | absorbs left-communism L4, post-Marxist P2 |
| 15 | d1_pluralism_after | D6 | After taking power: competitive elections, socialist parties only, one party, or no state to hold them | — | absorbs M7, R2, Q3 |
| 16 | d1_hostile_press | D6 | A press funded by the old owners campaigning against a new government: free, restricted, closed | — | |
| 17 | d1_nation_self_gov | D7 | A people governed from outside: independence, autonomy where they live, unification, sovereignty against foreign capital, confederation instead of a state, or class matters more | — | absorbs Q1, S9; tag nation |
| 18 | d1_autonomy_without_state | D7 | A people can govern its own affairs inside someone else's state | — | L; absorbs SD cluster D4; tag nation |
| 19 | d1_nation_unity | D7 | A people divided across several states should unify | — | L; tag nation |
| 20 | d1_imperialism_primary | D8 | The main structure to break: domination of poor nations by rich ones, or class in every country | — | absorbs M8; tag anti_colonial |
| 21 | d1_wealth_from_periphery | D8 | Rich countries' prosperity rests substantially on wealth taken from poorer ones | — | L; tag anti_colonial |
| 22 | d1_decisive_agent | D9 | Whose organisation is decisive | d2_who_is_the_agent | rewritten as single-choice; absorbs SD cluster D3; tag anti_colonial |
| 23 | d1_peasantry | D9 | The rural poor are a revolutionary force in their own right | d2_who_is_the_agent | L; the second half of the rewrite; absorbs early-socialism E3 |
| 24 | d1_world_revolution | D10 | Can socialism be built and last in one country | — | absorbs Leninist-core E1 |
| 25 | d1_alignment | D10 | A socialist or newly independent country: ally with others like it, with neither bloc, or stand alone | — | absorbs E4 |
| 26 | d1_state_after_transition | D11 | What happens to the state once the transition is complete | d2_state_after_transition | moved to depth 1; stays gated on d1_state_role |
| 27 | d1_violence | D12 | Force: refused on principle, defensive only, necessary at the moment of rupture, or offensive action acceptable | — | absorbs S5, F4, N3 |
| 28 | d1_violence_initiation | D12 | A small committed group acting before the majority: creates the conditions, or substitutes itself for the class | — | |
| 29 | d1_faith_grounds | D13 | Is your politics grounded in religious faith | — | absorbs S7; tag religion |
| 30 | d1_religion_and_liberation | D13 | Religion: an ally of liberation, a private matter, or an obstacle | — | tag religion |
| 31 | d1_ecology_priority | D14 | Ecological limits over material output | d1_ecology_priority | L; tag ecology |
| 32 | d1_growth | D14 | A socialist economy should keep growing its material output | — | L; absorbs post-Marxist P3; tag ecology |
| 33 | d1_race_structure | D15 | Racial hierarchy: a structure of its own, or a division within the class | — | tag race |
| 34 | d1_care_work | D16 | Reorganising care work matters as much as paid work | d1_care_work | L; tag gender |
| 35 | d1_gender_division | D16 | A socialist economy that leaves the division of work between women and men untouched has failed | — | **new** (item 2d); L; tag gender |
| 36 | d1_technology_scale | D17 | A large automated system: run it and share the gains, run it under accountable control, break it up, or forgo it | d1_technology_scale | rewrite; absorbs S4, N2; tag technology |
| 37 | d1_single_subject | D18 | One class decisive, or many movements none privileged | — | absorbs post-Marxist P1 |
| 38 | d1_autonomous_movements | D18 | Movements of oppressed groups: organise autonomously, or within the class movement | — | tags gender, race on the relevant options |
| 39 | d1_change_by_example | D19 | Build the model community and let it spread, or only a change of power changes anything | — | |
| 40 | d1_individual_sovereignty | D20 | The individual is the point, freedom comes through association, or the collective is prior | — | |
| 41 | d1_small_property | D21 | Widely held small property is the goal, or all productive property social | — | absorbs liberal-left B1 |
| 42 | d1_distribution | D22 | By need, by labour contributed, or market income plus a floor | — | absorbs anarchist A2 |
| 43 | d1_internal_hierarchy | D23 | A hereditary status hierarchy: dismantle it first, reform it from within, or it dissolves with development | — | absorbs Indian N1; tag caste |
| 44 | d1_reserved_places | D23 | People born into a hereditary lower-ranked group should have reserved places in legislatures, universities and public jobs | — | **new** (item 2e); L; tag caste |
| 45 | d1_civil_liberties | D24 | Civil liberties are the point of socialism, or conditional on securing the revolution | — | |
| 46 | d1_guiding_leader | D25 | A movement led by one leader whose thought settles disputes | — | absorbs E5, M6, Q7 |
| 47 | d1_workplace_control | D26 | Who runs a workplace: its workers, the public authority, or owners under regulation | — | absorbs Leninist-core E3 (with #7) |

Depth-1 count by dimension: D1 3, D2 3, D3 2, D4 3, D5 3, D6 2, D7 3, D8 2, D9 2,
D10 2, D11 1, D12 2, D13 2, **D14 2**, D15 1, **D16 2**, D17 1, D18 2, D19 1, D20 1,
D21 1, D22 1, **D23 2**, D24 1, D25 1, D26 1 = **47**.

---

## Depth 2 — 55

| # | id | scope | position | reuses | notes |
|---:|---|---|---|---|---|
| 1 | d2_dissent_after_revolution | ML, TR, LC, AN | A besieged revolutionary government facing organised opposition from its own supporters | d3_dissent_after_revolution | moved from depth 3 |
| 2 | d2_rich_country_workers | MAO, AC | Workers in wealthy countries: potential allies, or bought off by imperial wealth | — | merges Maoism M3 and anti-colonial K6; ◆; tag anti_colonial |
| 3 | d2_class_struggle_under_socialism | MAO, ML, TR | Entrenched officials in a socialist state: a class question fought by mass campaigns, by rules, or not a class question | d3_class_struggle_under_socialism | H; ◆ |
| 4 | d2_stand_for_election | LC, MS, AN | Should revolutionaries stand for election | — | merges L3 and I3; the per-member question left communism has no default on |
| 5 | d2_industry_unit | MS, AN, LC | The unit that runs an industry: a national guild, firm cooperatives, an industrial union, or workplace councils | — | merges I2 and L6 |
| 6 | d2_consumer_voice | MS, AN, LC | Who speaks for people as consumers: a democratic state, the market, no one separate, or councils including consumers | — | I1 |
| 7 | d2_route_to_power | ML, AC, NQ | An armed nucleus, mass insurrection, winning elections, or a cross-class movement around a leader | — | R1 |
| 8 | d2_land_and_indigenous | AC, ML | Land: rebuild from indigenous communal forms, or redistribute to peasant families | — | R4 |
| 9 | d2_labour_and_national_capital | NQ, AC, ML | Labour and national capital: allied under the state, or opposed | — | R5 |
| 10 | d2_neighbourhood_councils | AC, ML | Neighbourhood councils running budgets alongside the state | — | R7; ◆ |
| 11 | d2_markets_under_party | ML, MAO | Private capital and markets in socialism's early stage, under party direction | — | C2 |
| 12 | d2_transition_immediacy | LC, MAO | After a rupture: a measured transitional period, or immediate abolition of money and exchange | — | merges L2 and M5 |
| 13 | d2_bureaucratic_planned_economy | TR, ML, LC | What a planned economy run by an unremovable bureaucracy is | d3_bureaucratic_planned_economy | H; ◆ |
| 14 | d2_independence_and_socialism | NQ, AC, ML | Independence without social change: a real gain, or only a new flag | — | H (can be written as a present position); Q2 |
| 15 | d2_socialist_states_model | SD, PM | The large socialist states of the last century: no model at all, or a failure whose aim must be won by consent | — | H; SD cluster D6 |
| 16 | d2_leave_or_reform_religion | AC, RL | A religion that sanctions hierarchy: reform it from within, or leave it | — | N4 |
| 17 | d2_law_as_instrument | AC | Constitution and law as the instrument of liberation | — | N5 |
| 18 | d2_council_or_programme | LC | Assembly of delegates versus an organisation holding the programme | d3_council_or_programme | ◆; exclusive with #19 |
| 19 | d2_party_vs_class | LC, ML, TR | A free vote of workers against what the organisation is sure is right | d3_party_vs_class | ◆; exclusive with #18 |
| 20 | d2_struggle_scope | LC | What the struggle is over: workplace power, the whole of everyday life, or refusing work | — | L5 |
| 21 | d2_immediate_demands | LC | Fight for immediate reforms as preparation, or stand only for the final goal | — | L7; ◆ |
| 22 | d2_council_form_future | LC | The workplace council: the form of the future society, or one more institution to abolish | — | L8; ◆ |
| 23 | d2_universal_stage | MAO | An application of the general theory to one country, or a universal new stage | — | M1 |
| 24 | d2_peoples_war | MAO | Armed struggle in the countryside: suited to peasant countries, universal and protracted, started now, or ended by negotiation | — | M2 |
| 25 | d2_revolt_against_party | MAO | A mass movement against officials: directed by the party, or revolt against all authority including the party's | — | M4 |
| 26 | d2_reforming_states_verdict | ML | Socialist states that introduced markets and relaxed the party line: restored capitalism, or remained socialist | — | H; E2; ◆ |
| 27 | d2_breaking_with_leading_power | ML | A socialist state breaking with the leading socialist power: justified, or a betrayal | — | H; E7 |
| 28 | d2_means_of_work | AN | The means of work belong to whoever uses them, the association, everyone in common, or the individual producer | — | A1 |
| 29 | d2_money_after | AN | Money and prices after the change: kept without rent or interest, or abolished | — | A3 |
| 30 | d2_union_role | AN, LC, ML | What the workers' organisation is for in the long run | d2_union_role | A4 |
| 31 | d2_association_or_independence | AN | Normal economic life: cooperative associations, or independent producers trading | — | A6; ◆ |
| 32 | d2_basic_unit | AN | The basic unit of a free society: the workplace or the commune | — | A7; separates the SPEC §1 pair anarcho-communism / anarcho-syndicalism |
| 33 | d2_anarchist_organisation | AN | A formal federation, small groups formed and dissolved, organisation as the problem, or community assemblies | d3_specific_organisation | rewrite (S1): platformism and especifismo are purged |
| 34 | d2_act_now_or_build | AN | Attack the existing order now, build a mass movement, or build parallel institutions | — | S2 |
| 35 | d2_relation_to_left | AN | The organised left: part of it, or break with it | — | S3 |
| 36 | d2_hold_territory_now | AN | Hold a territory and govern it now, before any wider change | — | S6 |
| 37 | d2_overthrow_or_live_free | AN | The aim: overthrow the order, or live free now as daily refusal | — | S10 |
| 38 | d2_faith_economy | RL | What faith requires of the economy | — | F1 |
| 39 | d2_faith_and_class_analysis | RL | Marxist class analysis: a tool faith can use, or incompatible | — | F2 |
| 40 | d2_community_in_common | RL | The believing community should itself live in common, or witness in the wider world | — | F3 |
| 41 | d2_violence_remakes | AC | Violence in throwing off colonial rule: remakes the colonised as free people, a means only, or to be avoided | — | H; K1 |
| 42 | d2_cultural_recovery | AC | Recovering the people's own culture: the core of liberation, or secondary | — | K2 |
| 43 | d2_educated_class | AC | The educated class: give up its position and merge with the peasantry, or lead | — | K3 |
| 44 | d2_unit_of_development | AC | Cooperative villages, a continental union, a self-reliant nation, or an alliance of poor nations | — | K4 |
| 45 | d2_aid_and_debt | AC | Foreign aid and debt: refuse them, or accept on terms | — | K5 |
| 46 | d2_collective_settlement | NQ | Collective settlement and cooperative agriculture as how a nation is built | — | Q4 |
| 47 | d2_language_core | NQ | Language as the core of nationhood | — | Q5 |
| 48 | d2_labour_owned_institutions | NQ | The labour movement owning its own enterprises, bank and services | — | Q8 |
| 49 | d2_final_goal | SD | Replace private ownership of major assets, keep a permanent mixed economy, or widen opportunity in markets | d2_reform_horizon | rewrite, first half |
| 50 | d2_welfare_state_stage | SD | The welfare state with full employment: the achievement to defend, or a stage on the way | d2_reform_horizon | rewrite, second half; ◆ |
| 51 | d2_how_socialism_comes | SD | Capitalism's own development produces it, reforms accumulate without end-point, or expert administration proves itself | — | SD cluster D2, merged with D7 |
| 52 | d2_how_change_spreads | ES | A model community, the rule of producers through industry, or the peasant commune | — | early-socialism E1 |
| 53 | d2_bearable_work | ES | Work made bearable by matching it to what people enjoy, by a good environment, or by efficient organisation | — | early-socialism E2 |
| 54 | d2_who_directs | ES | Who directs the new order: benevolent founders, free attraction, or experts | — | early-socialism E4 |
| 55 | d2_policy_justification | LL | Economic policy justified by autonomy, by need and opportunity, or by family and local community | — | liberal-left B2 |

post_marxist and market_socialism have no depth-2 questions of their own. Their
members are separated by depth-1 questions (#7, #14, #32, #37 and #47 in the
depth-1 table) and by the shared questions #4–#6 above.

---

## Depth 3 — 28

| # | id | separates | position | reuses | notes |
|---:|---|---|---|---|---|
| 1 | d3_moral_incentives | guevarism / castroism | Motive in the new economy: moral commitment, or material incentives | — | R3 |
| 2 | d3_export_revolution | guevarism / castroism | Carry revolution abroad, including by arms; solidarity only; or neither | — | H; R6 |
| 3 | d3_growth_or_common_prosperity | deng_xiaoping_theory / xi_jinping_thought | Growth first, common prosperity with limits on wealth, or egalitarian redistribution | — | C3 |
| 4 | d3_party_supervision | deng / xi | Party supervision of private firms and culture: strong and extending, or light | — | C4 |
| 5 | d3_union_open_membership | revolutionary_syndicalism / anarcho_syndicalism | The union admits any political view, or carries a programme | — | I6; ◆ |
| 6 | d3_war_between_such_states | Trotskyist splits | When two bureaucratic planned economies go to war | d3_war_between_such_states | H |
| 7 | d3_long_term_entry | pabloism / grantism / the rest | Work for years inside communist or national-liberation movements, inside mass labour parties, or stay independent | — | T3 |
| 8 | d3_revolutionary_openings | morenism | Openings are frequent and must be met, or rare and built for patiently | — | T4 |
| 9 | d3_union_independence | lambertism | Unions' independence from the state and cross-class coalitions as the first principle | — | T5 |
| 10 | d3_polemic_with_left | spartacism | Other left organisations: joint work, or open polemic without accommodation | — | T6 |
| 11 | d3_historical_inevitability | posadism, pabloism | History moves irreversibly toward socialism, so even catastrophe hastens it | — | T7 |
| 12 | d3_coalition_government | Trotskyist splits | Governing coalitions with non-socialist parties: never, or tactically acceptable | — | T8 |
| 13 | d3_non_socialist_liberation | Trotskyist splits | Movements for national liberation led by non-socialists: support them critically, or stay independent | — | T9 |
| 14 | d3_nuclear_war | posadism | A general nuclear war between rival blocs would advance socialism by destroying capitalism's apparatus, or set it back catastrophically | — | **new** T10 (item 4) |
| 15 | d3_purges_verdict | stalinism / marxism_leninism | Mass purges of a ruling party's own members to root out suspected enemies under external threat: justified by the danger, or an abuse that betrayed socialism | — | **new** E8 (item 4); H |
| 16 | d3_claims_above_individual | egoism / individualist_anarchism | Justice, duty and rights: binding, or fixed ideas to dissolve | — | A5 |
| 17 | d3_what_makes_property_yours | mutualism / individualist / egoism | What makes something rightfully yours: your labour, occupancy and use, or the power to hold it and others' agreement | — | **new** A8 |
| 18 | d3_local_elections | social_ecology / democratic_confederalism / zapatismo | Stand in local elections to turn municipal councils into assemblies | — | S8; ◆ |
| 19 | d3_womens_coequal_institutions | democratic_confederalism / zapatismo | Women's liberation as a founding principle, with women's own institutions and shared leadership at every level | — | **new** (item 4); tag gender |
| 20 | d3_caste_representation | ambedkarism / lohiaite_socialism | The oppressed castes' politics: a broad coalition of all backward and poor groups, or their own separate organisation and representation | — | N6; ◆; tag caste |
| 21 | d3_agent_of_national_revolution | baathism / nasserism | The agent of national revolution: a civilian ideological party, or officers acting for the nation | — | Q6 |
| 22 | d3_dominant_nation_workers | connollyism / bundism | Workers of the dominant nation: allies | — | Q9 |
| 23 | d3_self_id_trotskyism | trotskyism | Named Trotskyist traditions, plus "none of these" | — | self_id |
| 24 | d3_self_id_marxism_leninism | marxism_leninism | Named traditions, including the general line | — | self_id; second separator for leninism / marxism_leninism |
| 25 | d3_self_id_maoism | maoism | Named traditions, including the general line | — | self_id |
| 26 | d3_self_id_religious_left | religious_left | The faith tradition that grounds your politics | — | self_id |
| 27 | d3_self_id_national_question | national_question | The national movement you belong to | — | self_id |
| 28 | d3_self_id_anarchism | anarchism | zapatismo, democratic confederalism, or neither | — | self_id |

Dropped from the blueprint grids: **E6** (factions inside the party). After the
correction in docs/review/boundary-stance-notes.md — Leninism banned factions
too — every member of the Leninist core gave the same answer, so the question
separated nothing.

---

## Close calls (◆) — overrule any of these

| id | assigned | alternative | why it is a close call |
|---|---|---|---|
| d2_rich_country_workers | 2 | 3 | Inside Maoism it only separates MLM–Third Worldism from its parent, which is depth-3 work; inside the anti-colonial family it splits the family, which is depth-2 work. Assigned by the more general use. |
| d2_class_struggle_under_socialism | 2 | 1 | It separates Maoism from Marxism–Leninism, a family-level split, but only matters once a respondent is in that region, so it is gated rather than asked of everyone. |
| d2_bureaucratic_planned_economy | 2 | 3 | Inside Trotskyism every member shares the orthodox branch, so by the letter of the rule this is depth 3. But it is the SPEC §1 criterion pair and also places respondents between the Trotskyist, ML and left-communist families. |
| d2_council_or_programme, d2_party_vs_class | 2 | 3 | Left communism is flat, so the rule makes them depth 2. They are also the SPEC §1 criterion pair's separators, which argues for Standard mode. |
| d2_immediate_demands, d2_council_form_future | 2 | 3 | Each separates groups of two or three left communists, not single near-duplicates; a respondent in Standard mode could reasonably not be asked. |
| d2_neighbourhood_councils | 2 | 3 | Only chavismo answers yes, so it separates one ideology from its anti-colonial siblings — flat family, so depth 2 by the rule, but it is chavismo's shibboleth in all but name. |
| d2_reforming_states_verdict | 2 | 3 | Separates Hoxhaism (inside the Stalinist subtree) and Titoism; the Hoxhaist half is depth-3 work. |
| d2_association_or_independence | 2 | 3 | Only individualist anarchism differs, and its nearest neighbour, mutualism, is a near-duplicate. |
| d2_welfare_state_stage | 2 | 3 | Separates classical social democracy from Bernsteinian revisionism (parent and child) but also from democratic socialism (a different branch). |
| d3_union_open_membership | 3 | 2 | The two syndicalisms are flat siblings in anarchism, but near-duplicates; depth 3 on the near-duplicate reading. |
| d3_local_elections | 3 | 2 | Also separates social ecology from zapatismo, which are different branches of anarchism. |
| d3_caste_representation | 3 | 2 | Ambedkarism and Lohiaite socialism are flat anti-colonial siblings, but the only pair the question moves. |
| **All Trotskyist questions except d2_bureaucratic_planned_economy** | 3 | 2 | The largest consequence of the rule: every Trotskyist sect descends from orthodox Trotskyism, so a Standard-mode respondent is placed at the orthodox tendency and never asked the questions that separate the splits. That matches SPEC §4 (Standard targets tendency, Deep targets sect) but means Standard can never return Cliffism. If Standard should separate the SPEC §1 pair, d3_war_between_such_states is the one to promote. |

---

## Modifier-tag feeds

Every tag has at least two depth-1 questions feeding it, so the §9 display
threshold (earned ≥ 2) is reachable in Quick mode.

| tag | depth-1 | deeper |
|---|---|---|
| ecology | d1_ecology_priority, d1_growth | — |
| gender | d1_care_work, d1_gender_division, d1_autonomous_movements | d3_womens_coequal_institutions |
| race | d1_race_structure, d1_autonomous_movements | — |
| caste | d1_internal_hierarchy, d1_reserved_places | d3_caste_representation |
| technology | d1_technology_scale, d1_planning_or_market | — |
| religion | d1_faith_grounds, d1_religion_and_liberation | — |
| nation | d1_nation_self_gov, d1_autonomy_without_state, d1_nation_unity | — |
| anti_colonial | d1_imperialism_primary, d1_wealth_from_periphery, d1_decisive_agent | d2_rich_country_workers |

History-class questions: **10 of 130 = 7.7%**, inside the ~10% cap
(d2_class_struggle_under_socialism, d2_bureaucratic_planned_economy,
d2_independence_and_socialism, d2_socialist_states_model,
d2_reforming_states_verdict, d2_breaking_with_leading_power,
d2_violence_remakes, d3_export_revolution, d3_war_between_such_states,
d3_purges_verdict).

---

## Reconciliation with the blueprint

The blueprint's totals were **44 + 135 + ~94 = ~273**. They double-counted.

1. **§4 and §5 overlapped.** Every one of §5's 84 sect-level cluster questions
   was also inside a §4 family budget: §4 described the Trotskyist, Maoist,
   left-communist, Marxist–Leninist, anarchist, social-democratic and
   national-question blocks by exactly the distinctions §5 then gridded as
   T1–T9, M1–M9, L1–L8, E1–E7, A1–A7, S1–S10, D1–D7 and Q1–Q9. **84 questions
   were counted twice.**
2. **§4's 135 was a budget, not a list.** Removing the overlap leaves about 51
   depth-2 slots that were never specified as questions. They are not in this
   inventory. Filling them would be writing to a number.
3. **Grid columns repeated depth-1 dimensions.** A further 43 grid columns asked
   a depth-1 position under another name — the guiding-leader question appeared
   three times (E5, M6, Q7), multi-party pluralism three times (M7, R2, Q3),
   non-violence three times (S5, F4, N3), and so on. Each now exists once, at
   depth 1, and the rows above say what it absorbed.
4. **Added:** d1_gender_division, d1_reserved_places, d3_nuclear_war,
   d3_purges_verdict, d3_what_makes_property_yours,
   d3_womens_coequal_institutions. **Dropped:** E6.

Depth 1 in the blueprint's §2 table summed to **45**, not 44: D14 was written
"1 (+1 existing)" and counted as one. With D14 counted as two, and the two
additions in D16 and D23, depth 1 is **47**.

| depth | blueprint | unique | SPEC §9 range (≈ ±10%) |
|---|---:|---:|---|
| 1 | 44 | **47** | 42–52 |
| 2 | 135 | **55** | 50–60 |
| 3 | ~94 | **28** | 25–31 |
| total | ~273 | **130** | 117–143 |
