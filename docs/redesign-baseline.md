# Redesign baseline

**What this is.** `npm run check -- --mode quick` run against the **old question
bank** — the 55 questions and 1,067 authored stance cells tagged
`pre-redesign` — through the **new engine**: the group level, the per-mode
`maxReportLevel`, and the Quick pass criterion judged at the broad group.

**What this is not.** A target. The pilot is compared against it to see what
twelve everyday questions cost and what they buy, not to be tuned until it
beats it. Nothing here was adjusted to make a number look better; the one
engine change made after the first run is described under "A correction made
before recording", and it moved the numbers in the direction of *more*
questions asked, not fewer failures.

Measured 2026-09-20, on commit `55a3c3a` content (tag `pre-redesign`) with the
engine as of the pilot branch.

---

## The numbers

| Metric | Baseline | SPEC.md §10.3 target (proposed) |
|---|---:|---|
| **Group recovery** — the returned group is the ideology's group | **86 / 93 = 92.5%** | ≥ 95% |
| **Family-correct** — the same run resolved at family level instead | **86 / 93 = 92.5%** | retired for Quick |
| **Confidently wrong** — resolved at a node that is not an ancestor of the truth | **2 / 93 = 2.2%** | ≤ 2% (0% intended once Quick cannot name a sect) |
| Ideologies with no tier-1 stance | **0 of 93** | — |
| Questions asked, mean / 95th percentile | **13.2 / 15** | 12–15 (SPEC.md §4) |

Group recovery and family-correct coming out identical is a coincidence of this
bank, not an identity: they fail on overlapping but not identical sets.
`cabralism` is family-wrong (returned `maoism`) *and* group-wrong (returned
`revolutionary_socialist`); `narodnism` is group-wrong but its family-level
resolve is an undecided group, so it fails both; `fourierism`,
`christian_socialism`, `islamic_socialism`, `sankarism` and
`lohiaite_socialism` are undecided at the root either way.

### The seven failures, by group

| Group | Ideologies that do not come back in it |
|---|---|
| `communitarian` | narodnism, fourierism |
| `faith_left` | christian_socialism, islamic_socialism |
| `national_and_anticolonial` | cabralism, sankarism, lohiaite_socialism |
| `reforming_left`, `revolutionary_socialist`, `anarchist` | none |

### The two confidently-wrong runs

| True | Returned | Why |
|---|---|---|
| `narodnism` (`communitarian`) | `revolutionary_socialist`, resolved | Its whole profile — the peasant agent, communal land, common ownership — is shared with Maoism. Recorded in docs/coverage-gaps.md since the prototype pass. |
| `cabralism` (`national_and_anticolonial`) | `revolutionary_socialist`, resolved | Self-reliance plus the peasant agent plus armed resistance is the Maoist profile exactly. Also recorded. |

Both were already failures under the family criterion, for the same reason.
Neither is new, and neither is caused by the grouping.

---

## What the grouping itself changed

Worth recording, because it is the clearest thing the baseline shows and it is
not a content problem.

**Groups are much less even than families were.** Families run from 2 to 14
leaves; groups run from 4 to 36:

| Group | Families | Leaves | Share of a uniform prior |
|---|---:|---:|---:|
| `revolutionary_socialist` | 4 | 36 | 38.7% |
| `national_and_anticolonial` | 2 | 18 | 19.4% |
| `reforming_left` | 4 | 15 | 16.1% |
| `anarchist` | 1 | 14 | 15.1% |
| `faith_left` | 1 | 6 | 6.5% |
| `communitarian` | 1 | 4 | 4.3% |

The resolver descends when the top child holds ≥ 50% of the parent's mass and
≥ 1.6× the runner-up (`childShareMin`, `childMarginMin`). A group starting at
4.3% of the prior has to travel much further to clear 50% than one starting at
38.7%, so **the two smallest groups carry five of the seven failures**, and the
largest group is what two of them are returned as instead.

This is a real property of the tree, and it is exactly the kind of thing that
would be tempting to fix by putting a thumb on the scale. It is recorded here
rather than fixed. The honest options, if the pilot shows the same pattern, are
in the pilot report — and adjusting a threshold is not one of them without an
explicit decision.

---

## A correction made before recording

The first run under the new engine read **83 / 93 (89.2%), mean 9.4 questions**.
That was a bug in the group work, not a finding.

`flow.ts` stops a mode as `confident` when `resolve` returns `kind: 'resolved'`.
Before the group level existed, `resolve` only ever said `resolved` for a
sect-level answer, which is what SPEC.md §7.4 means by the word. Adding the
report cap made it also say `resolved` for "as deep as this mode may go", so
Quick began stopping the moment a group led — at eight or nine questions, well
inside its 12–15 budget, on evidence it still had budget to improve.

The fix restores SPEC.md §7.4's meaning: `confident` now requires
`backOffReason === null` as well, so a result that stopped because the mode may
not report anything narrower does not end the run. Quick went back to running
to its budget (mean 13.2) and recovery went to 92.5%.

Recording it because the difference — 89.2% against 92.5% — is larger than the
gap between this baseline and its target, and anyone comparing a future run
against this file needs to know which of the two engines produced it.

---

## Retrieving the old bank

The pre-redesign content is on the annotated tag `pre-redesign`
(commit `55a3c3a`). Nothing is duplicated inside the repo; the tag is the copy.

```bash
git show pre-redesign:content/questions.yaml
```

```bash
git show pre-redesign:content/ideologies.yaml > /tmp/old-ideologies.yaml
```

To see one question and every stance that named it, which is what restoring a
question during the scale-up actually needs:

```bash
git show pre-redesign:content/questions.yaml | grep -n "id: d1_ownership" -A 40
```

```bash
git show pre-redesign:content/ideologies.yaml | grep -n "d1_ownership" -B 2 -A 6
```

The whole of the old tree, to browse rather than to grep:

```bash
git checkout pre-redesign -- content/
```

That last one **overwrites the live content**; `git checkout HEAD -- content/`
puts it back. Prefer `git show` unless you mean to restore.
