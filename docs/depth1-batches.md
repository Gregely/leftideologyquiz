# Depth-1 authoring batches

The split of the remaining depth-1 rows of `docs/question-inventory.md` across
two authoring passes. Batch 2 reads this file and uses the same split; it is
recorded here rather than re-derived so the two passes cannot disagree about
what is left.

---

## Reconciliation — how many rows are actually left

The inventory has **47 depth-1 rows**. `content/questions.yaml` holds **28**
depth-1 questions. **47 − 28 = 19 remaining**, which is exactly the list the
prototype session deferred.

The "21 remaining" figure counts the two questions commissioned by the first
`npm run check` run — `d1_religion_and_liberation` and
`d1_wealth_from_periphery` — as additions *on top of* the inventory. They are
not. Both were already inventory rows (30 and 21 respectively) that the
prototype pass had deferred and then pulled forward when the check showed the
religious-left and anti-colonial families could not be reached without them.
The content-log entry for that change says so in as many words. So:

- 26 planned rows authored in the first pass + 2 pulled forward = 28 authored,
  **all 28 of them inventory rows**.
- Nothing needs adding to the inventory, and the depth-1 count stays 47.

## One row is a duplicate, not a deferral — `d1_hostile_press`

Inventory row 16 reads: *"A press funded by the old owners campaigning against a
new government: free, restricted, closed."* That is the scenario
`d1_civil_liberties` (row 45) already asks, in those words:

> Former owners now fund newspapers and rallies arguing to reverse the changes.
> What should happen to their freedom to publish and to meet?

…with options running free / ordinary law only / restricted during the emergency
/ conditional on securing the revolution. Writing row 16 would be asking the same
question twice, which is what `exclusive_with` exists to prevent. It is recorded
as **absorbed into `d1_civil_liberties`**, the way rows 13, 14, 15 and others
record what they absorbed, and is not authored.

Depth 1 is therefore **46 planned, 46 authorable**, inside the SPEC §9 range of
42–52. A distinct press question is still possible — *who should own newspapers
and broadcasters* is a real disagreement `d1_civil_liberties` does not reach —
but that is a new row with a different position line, not this one, and writing
it now would be writing to a number.

**18 questions remain**, split 9 / 9.

---

## The split

Blueprint §2 dimension order (D1 → D26). The break falls between D6 and D7,
which also splits the work by kind: batch 1 is the economic and institutional
core, batch 2 is the cross-cutting dimensions that carry the modifier tags.

### Batch 1 — D1 to D6 (9 questions)

| # | id | dim | position |
|---:|---|---|---|
| 1 | `d1_expropriation` | D1 | Taking major firms into public ownership: on what terms |
| 2 | `d1_land` | D1 | Who should hold farmland |
| 3 | `d1_owners_resist` | D2 | What owners do when a legal majority transfers the big firms |
| 4 | `d1_reforms_accumulate` | D2 | Reforms add up into a change of system (likert) |
| 5 | `d1_price_signals` | D3 | Prices carry information no planner could gather (likert) |
| 6 | `d1_state_neutrality` | D4 | Why the permanent state pulls a left government back |
| 7 | `d1_police_and_army` | D4 | What the armed body of the new society looks like |
| 8 | `d1_party_needed` | D5 | Where working people's ideas end up on their own |
| 9 | `d1_organisation_form` | D5 | What is actually worth building |

*(`d1_hostile_press`, D6 — absorbed into `d1_civil_liberties`, see above.)*

### Batch 2 — D7 to D23 (9 questions)

| # | id | dim | position | tag |
|---:|---|---|---|---|
| 1 | `d1_autonomy_without_state` | D7 | A people can govern itself inside someone else's state (likert) | `nation` |
| 2 | `d1_nation_unity` | D7 | A people divided across several states should unify (likert) | `nation` |
| 3 | `d1_alignment` | D10 | Ally with others like us, with neither bloc, or stand alone | — |
| 4 | `d1_violence_initiation` | D12 | A small group acting before the majority | — |
| 5 | `d1_race_structure` | D15 | Racial hierarchy: its own structure, or a division within the class | `race` |
| 6 | `d1_autonomous_movements` | D18 | Movements of oppressed groups: autonomous, or inside the class movement | `race`, `gender` |
| 7 | `d1_small_property` | D21 | Widely held small property as the goal | — |
| 8 | `d1_internal_hierarchy` | D23 | A hereditary status hierarchy: dismantle, reform, or dissolve with development | `caste` |
| 9 | `d1_reserved_places` | D23 | Reserved places for a hereditary lower-ranked group (likert) | `caste` |

### What batch 2 owes

- **`race` and `caste` have no feeder at all today; `nation` has one.** Batch 2
  carries every question that feeds them, so all three must come out of it with
  two or more. `race`: `d1_race_structure` + `d1_autonomous_movements`.
  `caste`: `d1_internal_hierarchy` + `d1_reserved_places`. `nation`:
  `d1_nation_self_gov` (already authored) + `d1_autonomy_without_state` +
  `d1_nation_unity`.
- **At least one more interpolating stem.** The brief asks for three or more
  across the two batches; batch 1 wrote two (`d1_reforms_accumulate` quotes
  `d1_owners_resist`, `d1_police_and_army` quotes `d1_state_neutrality`).
- The `nation` pair is what `docs/coverage-gaps.md` names as part of the fix for
  `connollyism`, the one Quick failure a depth-1 question can plausibly close.
