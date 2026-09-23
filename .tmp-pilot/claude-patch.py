import io

p = 'CLAUDE.md'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


sub("""### Working notes for content""",
    """5. **Tiers: `depth` says what the respondent must know, not how fine the
   ideology distinction is.** Redefined by `docs/redesign.md`; SPEC.md §3.3 is
   the full statement.

   | Tier | Asked in | The respondent needs | Subject matter | Voice |
   |---|---|---|---|---|
   | **1** | Quick | **nothing** — no political education, no vocabulary, no interest in politics | Everyday life: work, rent, hospitals, tax, wills, police, protest, unjust laws, the environment, looking after people | Plain. Options state a position; they do not argue for it |
   | **2** | Standard | **to have thought about politics** — follows the news, no factional vocabulary | How change happens; what to do with government, markets, parties, unions; nation and empire | Plain words; any technical term glossed inline in **under 8 words** |
   | **3** | Deep | **to know left debates** | Near-neighbour separation inside a family or tendency | Camp voice, invented scenarios, the history-class allowance |

   A tier-1 question may not carry a tooltip, may not use a word from
   `content/lint/tier1-banned.txt`, and may not be set in an invented
   revolution. If a position cannot be stated in everyday words, the question
   belongs at tier 2 — that is the rule working, not failing. `lint:content`
   enforces the word counts, the reading grade and the lists.

6. **Option ids are permanent, and they are what a stance is keyed to.**
   Rewriting a question's prose is free: shorten the stem, cut the argument out
   of an option, drop filler — every stance on that question survives untouched,
   because a stance names `question_id` and `option_id` and nothing else. That
   is what makes the tier rewrite affordable at all (`docs/redesign.md` §6.2:
   716 of 1,067 authored cells do not move).

   **A rewording that changes what an option *means* is not a rewrite. It gets a
   new option id, and every stance that named the old one is re-authored.**
   Keeping the id would leave each of those stances pointing at a position its
   author never held, and nothing would report it: the validator sees a resolved
   id, the lint sees valid prose, and `check` sees a number that moved for a
   reason nobody can name. Changing the id turns that silent corruption into an
   error on every affected stance, which is the point.

   The test is not how many words changed. It is whether someone who chose that
   option before would still choose it. "Pay the full market value for them" →
   "Pay their owners in full" is a rewrite. "Pay the full market value" →
   "Pay something towards it" is a new option.

7. **Annotate a stance with `issue:` when two questions state one doctrine.**
   Inert — the engine never reads it — but `validate` errors when one ideology
   carries a weight-bearing stance on the same issue twice, because the
   likelihood counts each one and the ideology becomes narrower than the
   evidence warrants. This has already happened twice and both times it was
   found by hand (`mutualism` on occupancy-and-use, `democratic_confederalism`
   on the national question).

### Working notes for content""")

sub("""- Prefer a scenario to a proposition. "A new government is defending a revolution
  against real threats…" beats "Is authority ever justified?" every time
  (principle 2).""",
    """- Prefer a scenario to a proposition **at tiers 2 and 3**. "A new government is
  defending a revolution against real threats…" beats "Is authority ever
  justified?" every time (principle 2). **At tier 1 the opposite usually holds:**
  a statement the respondent can agree or disagree with asks them to react,
  where a five-option scenario asks them to *recognise five positions* — which
  is the thing someone with no political education cannot do. Tier 1 defaults to
  a likert or two or three short options.""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
