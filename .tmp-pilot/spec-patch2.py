import io

p = 'SPEC.md'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


# --- §11 principles ---------------------------------------------------------
sub("""2. **Concrete, not abstract.** Use short hypothetical scenarios with real
   trade-offs ("A new government is defending a revolution against real threats.
   A group of workers loyal to its aims starts organising against its decisions.
   What should it do?"), never "Is authority ever justified?". Scenarios are
   invented or generic, not real events.""",
    """2. **Concrete, not abstract — and at tier 1, familiar.**

   **Tier 1:** an everyday situation the respondent has been in or can picture
   from their own life — a job, a landlord, a hospital, a school, a will, a
   police stop, a strike, a bill, looking after a relative. **No invented
   revolutions, no new governments, no movements, no transitions.** Where a
   proposition works better than a scenario, use the proposition: at tier 1 a
   sentence to agree or disagree with asks less of the reader than a scenario
   they must imagine themselves into.

   **Tiers 2 and 3:** short hypothetical scenarios with real trade-offs ("A new
   government is defending a revolution against real threats. A group of workers
   loyal to its aims starts organising against its decisions. What should it
   do?"), never "Is authority ever justified?". Scenarios are invented or
   generic, not real events.

   Concreteness was never the missing property; familiarity was. The scenario
   quoted above is perfectly concrete and perfectly unanswerable by someone who
   has never thought about revolutions.""")

sub("""3. **Limited history allowance.** Where two ideologies differ only in their
   verdict on a historical class of cases (e.g. 20th-century one-party socialist
   states), phrase it as a verdict on the general class, describe it in plain
   words, put examples in the tooltip, and cap such questions at ~10% of the bank.""",
    """3. **Limited history allowance, at tier 3 only.** Where two ideologies differ
   only in their verdict on a historical class of cases (e.g. 20th-century
   one-party socialist states), phrase it as a verdict on the general class,
   describe it in plain words, put examples in the tooltip, and cap such
   questions at ~10% of the bank. **`history_class: true` is a tier-3
   property:** a verdict on a class of historical cases cannot be given by
   someone who does not know the cases, so such a question belongs in the mode
   that assumes they do.""")

sub("""5. **Every camp must recognise its own view.** Each option is phrased the way a
   committed member of that camp would phrase it. No strawman options; no option
   is obviously the "reasonable" one.""",
    """5. **Every camp must recognise its own view; camp voice at tier 3 only.**

   Each option is a **plain statement of a position some camp would choose**,
   and the option set together covers the range of answers the question admits.
   No strawman options; no option is obviously the "reasonable" one. That is
   achieved by giving every option **equal standing and equal length**, not by
   making each one argue its case.

   **Camp voice** — the option written as a member would put it, carrying its
   own justification clause — is permitted at **tier 3** only. At tiers 1 and 2
   the justification is what turns an option into a small manifesto: it is why
   the depth-1 options that prompted this revision averaged 27 words, and why
   the longest ran to 34.

   What is kept from the older wording: the anti-strawman requirement, and the
   test that a committed member of each camp would recognise their own view in
   the option meant for them. Only the means changes.""")

sub("""6. **Plain stems, glossed jargon.** The stem must be answerable without knowing
   the ideology's vocabulary; describe the idea in plain words and put the
   technical term in a tooltip.""",
    """6. **Plain stems, and less glossing the shallower the tier.**

   **Tier 1: no technical term at all**, in stem or option, glossed or not, and
   **no tooltip**. The banned list is `content/lint/tier1-banned.txt` and a
   match is a lint error. If a position cannot be stated in everyday words, the
   question is not a tier-1 question — that is the rule working, not failing. A
   tooltip at tier 1 is an admission that the question needs vocabulary the
   respondent does not have.

   **Tier 2:** any term the stem or an option still needs is explained **inline
   in under 8 words**, not in a tooltip. A tooltip is a tax on the reader, and
   at tier 2 it is usually avoidable.

   **Tier 3:** the stem must be answerable without knowing the ideology's
   vocabulary; describe the idea in plain words and put the technical term in a
   tooltip.""")

sub("""7. **3–6 options per question (except likert).** Every question has implicit
   "unsure" and "don't know this term" options that never update scores.""",
    """7. **Options per question: 2–5 at tier 1, 3–6 at tiers 2 and 3 (except
   likert).** Two is a legitimate tier-1 question — a genuine binary — and six
   short options is still six positions to hold in mind. Every question has
   implicit "unsure" and "don't know this term" options that never update
   scores.""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
