import io

p = 'SPEC.md'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


# --- §2.1 shape -------------------------------------------------------------
sub("""A three-level tree. Every scored entity is a **leaf**; interior nodes exist so
the test can back off to them.

```
family        12 nodes    "Trotskyism"
  tendency     ~8 nodes    "orthodox_trotskyism"
    sect      93 leaves    "cliffism"
```

Some families are effectively two levels deep (a tendency with one leaf). That is
allowed; the resolver collapses single-child chains when reporting (§8.1).""",
    """A four-level tree. Every scored entity is a **leaf**; interior nodes exist so
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
and each family names one.""")

# --- §8.1 back-off ----------------------------------------------------------
sub("""| `absoluteFloor` | 0.12 | A node below this absolute mass is never reported, even if it wins its parent |""",
    """| `absoluteFloor` | 0.12 | A node below this absolute mass is never reported, even if it wins its parent |

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
Deep one.""")

# --- §9 content scale -------------------------------------------------------
sub("""| Bucket | Range | Hard rule |
| --- | --- | --- |
| Total questions | 117–143 (planned 130) | |
| Depth 1 | 42–52 (planned 47) | Every family reachable via ≥ 3 depth-1 questions |
| Depth 2 | 50–60 (planned 55) | Every same-family pair in different branches separated by ≥ 2 questions at depth ≤ 2 |
| Depth 3 | 25–31 (planned 28, incl. self-ID) | Every same-family pair separated by ≥ 2 independent questions at some depth, or recorded in docs/inseparable.md |
| `history_class: true` | ≤ 10% of bank (≈ 13) | Lint fails above 10% |
| `kind: likert` | ≤ 15% of bank | |
| `self_id: true` | ≤ 1 per family, depth 3 only | Max effective stance weight 1; lint fails otherwise |
| Effective stances per leaf | ≥ 15 | Lint fails below. Depth-3 stances are required only for leaves in a pair that needs them — most leaves have none, by the depth rule |
| Weight-3 stances per leaf | ≤ 6, each with a `note` | Lint fails otherwise |
| Modifier tags | every tag fed by ≥ 2 depth-1 questions | So the display threshold is reachable in Quick mode |""",
    """| Bucket | Range | Hard rule |
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
docs/redesign.md §5.""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
