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
