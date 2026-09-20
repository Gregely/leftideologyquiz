# Coverage gaps

Places where the bank cannot recover an ideology, recorded rather than fixed by
adjusting weights (CLAUDE.md § Content rules, rule 4). These are content gaps,
not engine bugs: the fix is a question that states a real disagreement, and it
belongs in the next authoring pass.

This file is written by hand until `npm run coverage` (SPEC.md §10.5) exists, at
which point it should become that command's output plus a decision per line.

Distinct from `docs/inseparable.md`, which is for pairs no honest question could
separate. Everything here is separable in principle and simply is not yet.

---

## ~~eco_left is not reachable by its own answers~~ — RESOLVED

**Found:** 2026-09-19. **Closed:** 2026-09-19 by the roster replacement.

An ideal-type degrowth respondent was returned as `anarcho_communism`, because
the `eco_left` family held no stance on `d1_state_role` or `d1_change_route` and
so placed its members by what they said about the state.

The purged roster settles the open question this entry raised. There is no
`eco_left` family any more: `ecosocialism` sits in `green_and_historical`,
`degrowth` is excluded as a single-issue economic model
(docs/roster-purged.md), and ecological commitment is carried by the `ecology`
modifier tag — an axis rather than a family, which is what the entry suspected.

Nothing to author. Kept as a record of why ecology is a tag and not a family.

---

## d1_care_work moves no ideology

**Found:** 2026-09-19, same probe.

`d1_care_work` has no stances anywhere in the bank, so answering it is inert:
it earns a `gender` modifier tag and contributes nothing to placement. The
validator does not warn, because a question carrying `modifier_tags` is exempt
from the `question/no-stances` check by design.

That exemption is right, and on the purged roster it is now the permanent
answer rather than a temporary one: the whole feminist and queer band is
excluded as cross-cutting (docs/roster-purged.md), so no ideology on the roster
is *defined* by its answer here. `d1_care_work` should stay a pure modifier
question earning the `gender` tag, and is no longer a gap.

The real gap it points at: `race` is declared in `MODIFIER_TAGS` and no question
awards it. Either author one or drop the tag.

---

## The eleven Quick-mode recovery failures on the depth-1 core

**Found:** 2026-09-20, by `npm run check -- --mode quick` — a perfect respondent
per ideology, answering its own effective stances through the real flow. 82 of
93 come back inside their own family; the eleven below do not.

None of them is unreachable: every family is reached by some member (see the
family masses in the traces below). What fails is a *member* whose depth-1
answers are also the answers of a near neighbour in another family, and the
questions that would separate them are depth-2 rows of
docs/question-inventory.md that this pass did not write. **The fix is those
questions, not a weight.**

| ideology | returned instead | why | what would separate it |
|---|---|---|---|
| narodnism | undecided at root (anti_colonial, maoism, anarchism) | three effective stances in total: the peasant agent and communal land, which Maoism and anti-colonialism also hold | early-socialism block: d2_how_change_spreads, d2_who_directs, d2_bearable_work |
| saint_simonianism | undecided at root (early_socialism, anti_colonial) | planned industry plus rule by producers reads as Nehruvian development | d2_who_directs, d2_how_change_spreads |
| social_liberalism | `third_way` (resolved) | identical at depth 1: regulated market, citizens as the agent, market income plus a floor, rights under law | a question on welfare conditionality and on running public services as markets — not in the inventory; propose one for D24 |
| liberal_socialism | undecided at root (social_democracy, liberal_left) | a mixed economy justified by autonomy answers like democratic socialism | d2_policy_justification (liberal-left block), d2_final_goal |
| guild_socialism | undecided at root (market_socialism, social_democracy) | using the state and refusing insurrection are social-democratic answers; its own claim is about *who runs an industry* | d2_industry_unit, d2_consumer_voice |
| eurocommunism | undecided at root (post_marxist, social_democracy) | the democratic road with a mass party is the social-democratic profile; its difference is where it came from | d2_socialist_states_model, d2_how_socialism_comes |
| christian_socialism | undecided at root (religious_left, market_socialism) | a co-operative economy reached by election is market socialism's answer | d2_faith_economy, d2_community_in_common |
| fanonism | `mlm_third_worldism` | the peasant base, armed struggle and the primacy of the world division are exactly MLM–Third Worldism's profile | d2_violence_remakes, d2_cultural_recovery, d2_educated_class |
| cabralism | marxism_leninism_maoism (undecided) | as above; its own content is culture and class suicide | d2_cultural_recovery, d2_educated_class, d2_unit_of_development |
| sankarism | undecided at root (maoism, anti_colonial) | self-reliance plus a leading party, with no depth-1 question on aid and debt | d2_aid_and_debt, d2_unit_of_development |
| connollyism | undecided at root (trotskyism, national_question, marxism_leninism) | public ownership, insurrection and rupture outweigh the one national-question answer it holds | d2_independence_and_socialism, plus the two deferred depth-1 nation questions (d1_autonomy_without_state, d1_nation_unity) |

Two further findings from the same run, recorded because they are about the
*model* rather than about any one ideology:

- **A child that restates its parent's position at a higher weight takes the
  parent's respondents.** `classical_social_democracy` comes back as
  `bernsteinian_revisionism`, which holds the same positions more sharply. This
  is what the likelihood does — a higher weight is a narrower distribution — and
  it is why `marxism_leninism_maoism` and `gonzalo_thought` had their depth-1
  weight-3 restatements removed in this pass. Where a child genuinely differs
  only at depth 2, it should hold no depth-1 stance of its own.
- **Confidently wrong sects: 4 of 93 (4.3%) in Quick**, against SPEC.md §10.3's
  ≤ 2%: social_liberalism → third_way, classical_social_democracy →
  bernsteinian_revisionism, fanonism → mlm_third_worldism, castroism →
  ho_chi_minh_thought. Each is a near neighbour that holds the same depth-1
  answers more sharply. Quick mode names a sect whenever eight answers and the
  resolver's thresholds allow it; whether Quick should be allowed to name a
  sect at all is a question for SPEC.md §4, not a content fix. Three of the four
  are inside the true family, so they count as Quick passes and as §10.3
  failures at the same time — worth keeping separate in the eventual
  `npm run simulate`.
