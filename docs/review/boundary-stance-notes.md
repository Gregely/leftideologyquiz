# Boundary stance notes

**A log of stances the author is not sure of.** Authoring sessions add a row
whenever a stance rests on general knowledge rather than the ideology's own
texts, or whenever the author's own judgement may have leaked into it. Each row
names the question, the stance, and why it is uncertain. A row is closed when the
stance has been checked against the tradition's own sources, and the outcome is
written in the last column — kept, changed, or set to silence.

This file exists because CLAUDE.md rule 4 forbids tuning a stance to make a
separation work, and the easiest way to break that rule by accident is to keep a
guessed stance because a separation depends on it. A stance that is doing
load-bearing separation work and is also on this list is the first thing to check
when `npm run simulate` is built.

Question ids are the planned ids in docs/question-inventory.md; grid codes (E6,
R5, …) refer to docs/question-blueprint.md §5.

| question | ideology | stance in the plan | why uncertain | status |
|---|---|---|---|---|
| E6 factions inside the party (dropped) | leninism | was "allowed until a decision is taken" | Lenin's party banned organised factions in 1921. The earlier cell described the pre-1921 practice as the doctrine. | **Changed to "banned".** With that correction every member of the Leninist core answers alike, so E6 separated nothing and was dropped from the plan. |
| d1_world_revolution | leninism | "depends on revolution spreading" | Lenin repeatedly argued that the revolution could not survive in isolation, but also led the retreat to building within one country; the one-country doctrine was formulated after him. The cell is defensible but contestable, and it is now leninism's only position separator from marxism_leninism. | open |
| d2_labour_and_national_capital (R5) | sandinismo | was "labour and national capital opposed" | The Sandinista mixed economy explicitly courted "patriotic" private producers, which reads as an alliance mediated by the state. | **Set to silence** pending the Sandinista programme texts. Likely "allied". |
| d3_claims_above_individual (A5) | individualist_anarchism | was "binding" | The natural-rights wing held this; the egoist-influenced wing held the opposite, and several figures moved from one to the other. | **Set to silence.** The pair with egoism now rests on d3_what_makes_property_yours as well. |
| d1_technology_scale (was S4) | insurrectionary_anarchism | was "keep and democratise industry" | A guess; insurrectionary texts are largely silent on the future organisation of industry, and some currents lean anti-industrial. | **Set to silence.** |
| d1_violence (was S5) | revolutionary_syndicalism | was "defensive only" | A guess; syndicalist doctrine centres the general strike, and its attitude to force at the moment of rupture varied. | **Set to silence.** |
| d3_purges_verdict | stalinism, marxism_leninism | stalinism "justified", marxism_leninism "an abuse" | The general-line cell follows the mid-century condemnation of the purges by most ruling parties. Many present-day Marxist–Leninists defend them, so the cell may describe a historical line rather than today's. It is one of stalinism's two separators. | open |
| d1_guiding_leader | stalinism | "yes" | Position proxy for devotion to one leader's record; adherents may reject the framing while holding the positions. | open |
| d3_nuclear_war | posadism | "advances socialism" | The best-known and most-caricatured posadist claim; the option must be written as an adherent would put it (principle 5), not as a punchline. | open |

## Stances where the author's own judgement is most likely to leak in

Every stance for these ideologies needs checking against the tradition's own
texts before it is committed, because each is contested as left, associated with
state violence, or tied to a live national conflict — the conditions in which an
author's own view most easily passes for description. Principle 5 applies with
full force: each option must be one an adherent would sign.

- pol_potism
- juche
- baathism
- nasserism
- xi_jinping_thought
- deng_xiaoping_theory
- peronism
- labour_zionism
- distributism
- third_way

Add rows to the table above as their stances are authored.

## Rows added in the depth-1 authoring pass (2026-09-20)

| question | ideology | stance in the content | why uncertain | status |
|---|---|---|---|---|
| d1_state_after_transition | stalinism | "it stays, as the planner" | Written from the doctrine that the state grows stronger while capitalist encirclement lasts, against the family default that it withers. Both were said; which is the *position* rather than the circumstance is a judgement. | open |
| d1_guiding_leader | stalinism | "the leader's thought settles it" | Carried over from the plan (E5). Adherents may reject the framing while holding the positions. | open |
| d1_guiding_leader | nasserism, peronism | "the leader's thought settles it" | Both movements are organised around one leader, but neither claims a doctrine that settles disputes the way Juche or Gonzalo Thought does. Weight 1–2 on that reading. | open |
| d1_guiding_leader | castroism | was "the leader's thought settles it" | Cuba's party is formally collective and Castroism proclaims no "Castro Thought". | **Changed to "collective leadership", weight 1.** Found by `npm run check`: the old cell let a perfect Castroist respondent be returned as gonzalo_thought. |
| d1_violence | gonzalo_thought | was "armed struggle now", weight 3 | The distinctive claim is *initiating* the war, which no depth-1 option expresses; the parent accepts the same option. | **Removed.** The difference belongs to d2_peoples_war. |
| d1_change_route | marxism_leninism_maoism | was "protracted armed struggle", weight 3 | Same: the claim is that people's war is universal, not that the option differs from mao_zedong_thought's. | **Removed.** Belongs to d2_universal_stage. |
| d1_world_revolution | mao_zedong_thought | now leads with "rely on nobody" | Mao held both socialism in one country and self-reliance; which one a Maoist gives as the answer to "can it build socialism alone" is a judgement. Reordering changed which ideology a simulated Maoist looks like. | open |
| d1_religion_and_liberation | ambedkarism | silence | He held the tradition to be the sanction of caste and converted to another, which is neither "reform it" nor "an obstacle" as the options put it. Left silent rather than guessed. | open |
| d1_faith_grounds, d1_religion_and_liberation | distributism | "faith grounds it", "an ally" | Distributism's arguments are drawn from Catholic social teaching, but its adherents argue for it on economic grounds too. It is also what makes distributism look like the religious left. | open |
| d1_pluralism_after, d1_civil_liberties | baathism, nasserism | one party / liberties conditional | Written from the single-party states these movements built. Whether the doctrine requires it, or the circumstances produced it, is exactly the distinction principle 5 asks for. | open |
| d1_world_revolution, d1_ownership, d1_planning_or_market | pol_potism | self-reliance, common ownership, direct allocation | Drawn from what the regime did, not from a body of doctrine it published. Every cell needs checking against the movement's own texts. | open |
| d1_decisive_agent, d1_single_subject | labour_zionism | a state of their own, collective settlement | Tied to a live national conflict; the stances are written as the movement stated them, and need checking against its own programme rather than against later argument. | open |

## Rows added in depth-1 batch 1 (2026-09-20)

Questions are the nine of `docs/depth1-batches.md` batch 1.

| question | ideology | stance in the content | why uncertain | status |
|---|---|---|---|---|
| d1_expropriation | mao_zedong_thought | "pay nothing", weight 2 | Land and foreign and bureaucrat capital were confiscated, but national capitalists were redeemed by bond over years, which is closer to the gradual buy-out option. Which of the two the doctrine gives as its answer to "the largest firms" is a judgement. | open |
| d1_expropriation | gandhian_socialism | silence | Trusteeship — owners keep title and hold it for the community by a change of heart — is the position, and no option expresses it. The "nothing passes into public hands" option gives tax and competition law as the method, which Gandhian trusteeship is not. | open |
| d1_expropriation | distributism | "nothing should pass into public hands", weight 2 | The option's method (tax, competition law, support for smaller firms) is distributism's method, but the option is also the third-way answer, so the two agree here for opposite reasons. | open |
| d1_expropriation | ambedkarism, nehruvian_socialism | compensation | Both rest on the same reading: state ownership of industry acquired with compensation in government bonds. Defensible from the constitutional programmes; the later practice diverged. | open |
| d1_price_signals | orthodox_trotskyism | "agree", weight 1 | Trotsky argued that a plan is checked and partly realised through the market, alongside soviet democracy and a stable currency. That is a genuine endorsement, but it is about the transition rather than about socialism, and it is the stance that separates Trotskyism from Marxism–Leninism on this question. | open |
| d1_party_needed | mao_zedong_thought | "brought from outside", weight 2 | The mass line — gather the scattered ideas of the masses, systematise them, return them — reads more like the "fought out between people in the movement" option than like the Leninist one. The Leninist reading is taken because the party still does the systematising; the tension is real and belongs to d2_revolt_against_party. | open |
| d1_party_needed | mao_spontex | "revolutionary conclusions through the struggle itself", weight 2 | The current is named for its spontaneism, and this is its only separator from mao_zedong_thought at depth 1. It rests on the general characterisation rather than on a text. | open |
| d1_police_and_army | marxism_leninism (family) | "rebuilt under the new authority" **and** "a popular militia" | The doctrine says the standing army is replaced by the armed people; the states built a professional army. Both options are accepted rather than choosing between a doctrine and a practice, which costs some separation from the left-communist and Trotskyist militia answer. | open |
| d1_land | labour_zionism | "the village holds it in common", weight 2 | Collective settlement on nationally held land is what the movement built, and the stance is written as the movement stated it. Tied to a live national conflict; flagged with the rest of this ideology's cells. | open |
| d1_land | pol_potism | "public ownership, worked as large farms", weight 2 | Drawn from what the regime did, not from published doctrine, like the rest of this entry's cells. | open |
| d1_owners_resist | kautskyism | "strangle the economy" and "resist by any means", weight 2 | Kautsky expected the owners to resist a parliamentary majority by every means including force, while holding that the majority is won at the ballot. Taking the first half as his answer here is what separates him from the rest of his family. | open |
| d1_owners_resist | impossibilism | "accept it in the end", weight 2 | The position that a socialist majority captures the machinery, armed forces included, and the minority cannot resist. It reads as complacency from outside the tradition and as consistency from inside it; written as the tradition puts it. | open |
| d1_state_neutrality | guild_socialism | "any apparatus that size defends itself", weight 2 | Guild socialism's objection to state collectivism is that officials would rule the industry, which is this option. Whether its members would generalise that into a claim about any large apparatus, as the option does, is the uncertain part. It is also what now separates guild socialism from social democracy. | open |
| d1_state_neutrality | fabianism | "staffed from one narrow layer", weight 3 | Permeation presupposes institutions that serve whoever staffs and advises them, which makes this defining. The note claims a lot from a method; Fabians also wrote about the state as a field of expertise rather than of class. | open |
| d1_organisation_form | labour_zionism, connollyism | workplace bodies plus a mass party | Both built a labour federation that was also an economic and political body. Reading that as two accepted options rather than one is a judgement about which the movement would name first. | open |

## Rows added in depth-1 batch 2 (2026-09-20)

Questions are the nine of `docs/depth1-batches.md` batch 2.

| question | ideology | stance in the content | why uncertain | status |
|---|---|---|---|---|
| d1_nation_unity | baathism | "one state", weight 3 | The claim is the first clause of the movement's own statement of itself, so the position is not in doubt. What is in doubt is the weight: whether the unity of the nation or the state-led development is the thing without which the doctrine collapses. Flagged with the rest of this entry's cells. | open |
| d1_autonomy_without_state | baathism | "disagree", weight 1 | Written from the claim that the nation needs one sovereign state of its own, not from anything the movement said about minority autonomy. Deliberately weight 1 for that reason; the stronger reading, that it rejects autonomy for peoples inside the state, is an inference about practice rather than doctrine. | open |
| d1_autonomy_without_state | labour_zionism | "disagree", weight 2 | The territorial claim against the diaspora-autonomy alternative is the historical disagreement, and the cell is written as the movement stated its own case. Tied to a live national conflict; flagged with the rest of this ideology's cells. Weight 2 rather than 3 on purpose: the argument for 3 is available and was not taken. | open |
| d1_nation_unity | labour_zionism | silence | The proposition is about a people split between several states by borders others drew, which is not the claim this movement makes about itself. Left silent rather than stretched to fit. | open |
| d1_reserved_places | gandhian_socialism | silence | The tradition opposed separate electorates and accepted reserved seats inside a joint one. "Disagree" would therefore misstate it and "agree" would overstate it, and the proposition as written does not distinguish the two. The separation from Ambedkarism is carried by d1_internal_hierarchy instead. | open |
| d1_autonomous_movements | bordigism | "argue against it", weight 2 | Rests on the general characterisation that the party is indifferent to every category but class, and that organising by any other is a division the other side benefits from. It is the only holder of that option, so it is doing real work; it needs checking against the tradition's own texts. | open |
| d1_small_property | lohiaite_socialism | "they are the model", weight 2 | Small-unit technology and decentralised power point this way, but the tradition also wanted ceilings on holdings and public ownership of large industry, which is the "protected alongside social ownership" option. This cell is what now pulls a Lohiaite respondent towards distributism at depth 1. | open |
| d1_internal_hierarchy | lohiaite_socialism | "fight it together with exploitation", weight 3 | The claim that the hereditary ranking is how class works in this country is well attested; whether an adherent would name it, rather than the preferential quota, as the defining commitment is a judgement. | open |
| d1_small_property | stalinism | "combined into large modern units", weight 2 | The socialist reconstruction of agriculture through large collective farms is explicit doctrine, so the position is not in doubt. It is recorded here because it is now one of stalinism's separators from marxism_leninism, and this entry's cells are all flagged. | open |
| d1_violence_initiation | mao_zedong_thought | "only if the leadership judges the moment", weight 1 | Follows from the party commanding the gun. Deliberately weight 1: the tradition also holds that the masses make history, and the balance between the two is exactly what d2_revolt_against_party asks. | open |
| d1_race_structure | marxism_leninism (family) | "a division in the class" **and** "colonial rule carried on at home" | Both were the line at different times — racial division as a weapon that splits workers, and oppressed peoples inside a country as a national question with a right to self-determination. Accepting both at weight 1 avoids choosing between them, at the cost of separating nobody. | open |
| d1_alignment | castroism | "behind the movements still fighting elsewhere", weight 2 | Well attested in practice and in the movement's own account of itself. Recorded because it is what now separates castroism from ho_chi_minh_thought, which the previous run returned in its place. | open |
| d1_alignment | deng_xiaoping_theory | "ordinary relations with everybody", weight 2 | Reform and opening is doctrine, but this option's reasoning — that picking a camp costs the markets a country needs — is the author's phrasing of it rather than the doctrine's. Flagged with the rest of this entry's cells. | open |

