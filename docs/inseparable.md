# Ideologies the test cannot honestly separate

Required by CLAUDE.md § Content rules, rule 4. A pair goes here when it cannot
be separated by any question that respects SPEC.md §11 — **not** when separating
it would merely be difficult. The alternative fixes come first: write a question
that states a real disagreement, or correct a stance that misrepresents one of
the two. Adjusting weights until a report goes green is not on the list.

**The standard.** The plan requires two *independent* separators for every
same-family pair: two questions on which the pair hold different positions *and
both hold a position* — a stance against silence separates only weakly and does
not count. A pair with fewer goes here.

**How a recorded pair reaches the respondent.** Each member of a recorded pair
declares the other in `inseparable_from`, with a note. The resolver attaches the
note to any result that lists both as candidates, or that resolves to one of
them, so the result page names both and says why — same position, different
people or lineage — instead of looking undecided for no reason.

Each entry records the pair, what they share, what separates them in the world,
and why the test cannot reach it.

---

## connollyism / abertzale_left

**Status:** recorded; declared in `content/ideologies.yaml` (`inseparable_from`).

**What they share.** One position: a socialist republic for a people governed
from outside, with independence and social change treated as a single struggle —
a republic that leaves ownership untouched is only a new flag.

**What separates them in the world.** Which people the claim is made for, and the
history and movements attached to each.

**Why the test cannot reach it.** Neither difference is a position. The two
candidate separators in the plan are both a stance against silence:
d2_language_core (the Basque left treats language as the core of nationhood; Irish
republican socialism takes no position) and d3_dominant_nation_workers (Connolly's
tradition courts the dominant nation's workers; the Basque left takes no
position). Neither meets the standard above.

**Decision.** Return them as a pair, with the note. The national_question
self-identification question (named national movements) can nudge between them.
A shared tendency node is proposed in docs/roster-decisions.md §6 but not added.

---

## zapatismo / democratic_confederalism

**Status:** recorded; declared in `content/ideologies.yaml` (`inseparable_from`).

**What they share.** One structure: territory governed by confederated community
assemblies that refuse to seek a state of their own, with an armed defence force
answerable to those assemblies.

**What separates them in the world.** The peoples they arose among and the
movements behind them, and a difference of emphasis on women's liberation.

**Why the test cannot reach it.** One solid separator exists:
d3_womens_coequal_institutions (democratic confederalism makes women's liberation
a founding principle, with women's own institutions and shared leadership at every
level). The only candidate second separator, d3_local_elections, has democratic
confederalism's cell at silence, and whether either movement contests elections
at all is contested. One independent separator does not meet the standard.

**Decision.** Return them as a pair, with the note, and keep both questions: the
solid one still moves mass between them. The anarchism self-identification
question can nudge.

---

## Resolved — no longer recorded

### posadism / orthodox_trotskyism

Recorded here until the blueprint revision. Posadism's commitments about contact
with non-human intelligence cannot be asked as position questions, but its stance
on nuclear war can: **d3_nuclear_war** asks whether a general nuclear war between
rival blocs would advance socialism by destroying capitalism's apparatus or set it
back catastrophically. With d3_historical_inevitability (history moves
irreversibly toward socialism, so even catastrophe hastens it), posadism now has
**two separators from orthodox Trotskyism** on which both hold a position.

Both are fragile — historical inevitability is shared with pabloism, and a single
atypical answer on either collapses the pair — and posadism stays
`lineage: true`, so the resolver will not name it as a sect without positive
evidence on its own questions. But it meets the standard, so it comes off this
list. The Trotskyism self-identification question remains the fallback.

### Not recorded, and why

- **stalinism / marxism_leninism** — two separators: d1_guiding_leader and
  d3_purges_verdict. Both cells are flagged in
  docs/review/boundary-stance-notes.md, because many present-day Marxist–Leninists
  defend the purges too.
- **leninism / marxism_leninism** — after correcting Leninism's stance on party
  factions (banned, as for Marxism–Leninism), the only position separator left is
  d1_world_revolution, and that cell is contestable. The second separator is the
  marxism_leninism self-identification question. That meets the letter of the
  standard only because principle 10 allows it; the pair is fragile, and when
  positions run out the resolver backs off to leninism, the parent node — which
  is the honest answer.
- **deng_xiaoping_theory / xi_jinping_thought** — two separators with stances on
  both sides: d3_growth_or_common_prosperity and d3_party_supervision. Both are
  differences of emphasis within one line (weight 2 at most), so the pair is
  fragile, but it meets the standard.
