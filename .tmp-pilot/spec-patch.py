import io

p = 'SPEC.md'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


# --- §3.2 kinds / likert cap ------------------------------------------------
sub("""- `likert` — one proposition on a 5-point agree/disagree scale. Used only where
  the disagreement really is one of degree. Capped at 15% of the bank; if a
  question can be written as `single`, it must be.""",
    """- `likert` — one proposition on a 5-point agree/disagree scale.

  **Tier 1 is exempt from the cap, and should mostly use this form.** A likert
  asks the respondent to react to a sentence; a five-option single-choice asks
  them to *recognise five positions*, which is the thing someone with no
  political education cannot do. A tier-1 question is a likert or a 2-3 option
  choice unless a wider set is genuinely needed.

  **Tiers 2 and 3 together are capped at 15% of their combined count**, where
  the old rule applies unchanged: used only where the disagreement really is one
  of degree, and if a question can be written as `single`, it must be. The cap
  is computed over tier-2-plus-tier-3 questions only, so a tier-1 bank that is
  mostly likert cannot push the deeper tiers over it.""")

# --- §3.3 depths ------------------------------------------------------------
sub("""| Depth | Job | Example of what it decides |
| --- | --- | --- |
| 1 | Split the field into families | Whether existing state institutions can be used to get where you want to go, or have to be dismantled |
| 2 | Place within a family | Inside Leninism: whether a planned economy run by an unaccountable bureaucracy is still a form of workers' power |
| 3 | Separate near-neighbours inside a tendency | Inside the state-capitalist current: whether that analysis changes what you do when two such states go to war |

Depth is a property of the question, not of when it is asked. A depth-3 question
may be asked early if its gating is satisfied and its information gain is high —
that is the point of adaptive selection.

**The depth rule.** A question is **depth 2** if its answer changes which branch
or tendency of a family is favoured, and it is worth asking in Standard mode. It
is **depth 3** if it only separates near-neighbours that already share a branch —
pairs that agree on every depth-2 question of their family — and is worth asking
only in Deep mode. Because depth decides which mode asks a question, **it
changes what respondents see**: a depth-3 question is never asked in Standard
mode. Consequence worth knowing: in a family where every member descends from
one tendency (Trotskyism), Standard mode resolves to that tendency and only Deep
separates the sects. Close calls are listed in docs/question-inventory.md.""",
    """**Depth is a tier: it says what the respondent has to know to answer, not how
fine an ideology distinction the question draws.**

| Tier | Asked in | The respondent needs… | Subject matter | Voice |
| --- | --- | --- | --- | --- |
| **1** | Quick (and above) | **nothing.** No political education, no vocabulary, no interest in politics. | Everyday values and situations: work, healthcare, housing, tax, inheritance, police, protest, unjust laws, the environment, unpaid care, faith, where wealth came from. | Plain. Options state a position; they do not argue for it. |
| **2** | Standard (and above) | **to have thought about politics.** Follows the news, has opinions about governments and movements, has no factional vocabulary. | How change should happen; what to do with the state; markets and plans; parties, unions and movements; nation and empire. | Plain words. Any technical term is explained inline in **under 8 words**. |
| **3** | Deep | **to know left debates.** Can tell a council from a party and knows why it matters. | Near-neighbour separation inside a family or tendency. | Concrete invented scenarios, camp-voice options, the history-class allowance. |

Depth is a property of the question, not of when it is asked. A depth-3 question
may be asked early if its gating is satisfied and its information gain is high —
that is the point of adaptive selection.

**Why the rule changed.** Depth used to be defined by which level of the tree a
question's answer moved: depth 1 split families, depth 2 split branches within
one, depth 3 separated near-neighbours. Nothing in that test asked whether a
respondent could answer. The dimensions that best separate 13 families are
movement-theory dimensions — the party, the revolutionary agent, the state
machinery, the transition — so depth 1 filled with them, and Quick mode asked a
newcomer to hold positions on questions they had never been asked. Of the 46
depth-1 questions that produced the complaint, 28 were about how movements and
states should be organised. The full argument and measurements are in
docs/redesign.md.

**Consequences worth knowing.** Tier 1 cannot separate 13 families: four of them
agree on every everyday value a respondent holds. Quick therefore reports a
**broad group** (§2.1, §8.1) and never a family or a sect. Because tier decides
which mode asks a question, it changes what respondents see — a tier-3 question
is never asked in Standard mode. In a family where every member descends from
one tendency (Trotskyism), Standard resolves to that tendency and only Deep
separates the sects. Close calls are listed in docs/question-inventory.md.""")

# --- §4 modes ---------------------------------------------------------------
sub("""| Quick | 1 (plus up to 3 depth-2 questions of exceptional gain) | 12–15 | Family, sometimes tendency |
| Standard | 2 | 25–35 | Tendency, often sect |
| Deep | 3 | up to 60 | Sect, with honest back-off |""",
    """| Quick | 1 (plus up to 3 tier-2 questions of exceptional gain) | 12–15 | **Broad group. Never a family, never a sect.** |
| Standard | 2 | 25–35 | Tendency, or a flat family's member |
| Deep | 3 | up to 60 | Sect, with honest back-off |

Each mode carries a `maxReportLevel` alongside its depth cap — `group`,
`tendency`, `sect` — and the resolver will not name anything deeper, however the
evidence falls (§8.1). This is what stops Quick returning a sect on twelve
everyday questions because the thresholds happened to clear.""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
