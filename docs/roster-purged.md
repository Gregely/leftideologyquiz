# What is deliberately not on the roster

The roster is **full ideologies only**: positions a person could hold as their
politics, which answer the questions this test asks — what should be owned in
common, who should decide, how change happens, what the state is for.

Things get proposed for the roster constantly because they are *left-wing
things*. That is not the test. The test is whether someone could answer a
question about the state, ownership and strategy *as* that thing. You cannot
answer as Georgism (it has no position on the party question), as the Frankfurt
School (it is a way of analysing, not a programme), as platformism (it is an
organisational form several ideologies use), or as a tankie (it is an insult).

Anything listed here stays off unless the case for it beats these reasons. Some
of them belong in the test in another shape — as a modifier tag, a question, or
a family — and where that is true it says so.

---

## Single-issue policies and economic models

Georgism · the Nordic model · MMT · basic income · the Green New Deal ·
degrowth · cybernetic planning · fully automated luxury communism ·
left accelerationism · Parecon · commons and P2P · and similar.

**Why not.** Each is a proposal about one mechanism — land rent, money issuance,
income floors, planning technique, the shape of a transition programme. A person
can hold any of them from inside almost any family on the roster: there are
degrowth anarchists and degrowth social democrats, Parecon-sympathetic
councilists and Parecon-sympathetic market socialists. Returning one as a
*result* would tell a respondent nothing about the questions that actually
divide the left.

**Where they belong instead.** These are what questions are made of, not what
results are made of. Several should become question options that separate real
ideologies — a degrowth-versus-growth question separates ecosocialists from each
other; a planning-technique question separates market socialism from
communisation. `d1_technology_scale` and `d1_ecology_priority` already do some of
this. Ecology already has a `modifier_tag`; others may deserve one.

---

## Academic schools and lenses

Western Marxism · Gramscianism · the Frankfurt School · Althusserianism ·
analytical Marxism · Afro-pessimism · racial capitalism · social reproduction
theory · agonism · and the whole feminist and queer band.

**Why not.** These are ways of analysing the world, not programmes for changing
it. They answer "what is really going on here" rather than "what should be
done", and people who share one can and do disagree about every question this
test asks. An Althusserian can be a Maoist or a Eurocommunist; social
reproduction theory has adherents across the Trotskyist, autonomist and social
democratic families.

**The feminist and queer band specifically.** Excluding it is the decision most
likely to look like an omission, so the reasoning matters. Socialist feminism,
Marxist feminism, materialist feminism and queer liberation are not absent
because they are marginal — they are absent because each is a commitment that
*cuts across* the families rather than constituting one. Someone is a Marxist
feminist by being a Marxist and a feminist, and the test can only tell them
apart from other Marxists by asking the Marxist questions. Returning "Marxist
feminism" as a sect would be claiming a resolution the answers cannot support.

**Where they belong instead.** As modifier tags, which is precisely what the
mechanism is for: `gender` already exists in `MODIFIER_TAGS`, and
`d1_care_work` already awards it. `race` exists and is unused. The result should
be able to say "council communist, with a strong social-reproduction emphasis",
which is both more accurate and more informative than a separate leaf would be.
Gramsci likewise informs questions about consent and hegemony without being an
answer to them.

---

## Tactics and organisational forms

Platformism · especifismo · Blanquism · Lassalleanism · Third Camp ·
cooperativism · left populism · anarchism without adjectives.

**Why not.** Each describes *how* a group organises or what it does, not what it
believes the world should look like. Platformism and especifismo are two answers
to how a specific anarchist organisation should relate to a mass movement; both
are held by anarcho-communists. Third Camp is a position on which side to take
in a war, held across several Trotskyist tendencies. Left populism is a strategy
for building a majority.

**Note.** Platformism and especifismo were on the previous 21-entry roster and
were separated successfully by `d3_specific_organisation`. That question is
worth keeping: it asks a real disagreement, and it can separate ideologies
*within* the anarchist family even though neither side of it is an ideology.
This is the general pattern — a purged entry often survives as a good question.

---

## Internet labels

Dirtbag left · tankie · campism · ML Twitter · BreadTube.

**Why not.** These are affiliations, insults or media formats. Nobody holds
"tankie" as a politics; it is what other people call a position that already has
a name on the roster. Returning one as a result would be either an insult or a
category error, and in several cases both.

---

## Organisations and single-party entries

Healyism · Northite Trotskyism · Johnson-Forest · Socialisme ou Barbarie ·
Kirchnerism · Naxalism · Scottish, Welsh, Catalan and Palestinian left
nationalism.

**Why not.** These name particular organisations, their leaderships, or the left
wing of one country's national movement. The roster already carries the
ideologies they hold: the Trotskyist entries cover the sect splits that have a
distinct *position* rather than a distinct organisation, and
`connollyism` and `abertzale_left` are on the roster because republican
socialism and the abertzale left are worked-out political traditions rather than
simply "the left wing of a national movement".

**The line.** An organisation earns an entry when it produced a position that
outlived it and that someone could hold without any connection to the
organisation — which is why Cliffism is in and Healyism is out.

---

## Duplicates and umbrellas

Left communism as a label · African socialism as a label · neo-Stalinism ·
Khrushchevism · Bukharinism.

**Why not.** Each either names a family the roster already has as a family, or a
period rather than a position. "Left communism" is the family containing council
communism, Bordigism and the rest; adding it as a member as well would let the
test return the container. "African socialism" likewise covers ujamaa,
Nkrumaism, Sankarism. Neo-Stalinism and Khrushchevism describe phases of a state
rather than commitments a person holds today.

---

## Excluded as not left

National Bolshevism · Strasserism · agorism · Kemalism.

**Why not.** The first two are fascist currents that borrow socialist vocabulary;
including them would misrepresent both them and the left. Agorism is
right-libertarian: it wants markets without a state, not common ownership.
Kemalism is authoritarian modernising nationalism with a state sector, which is
not the same thing as socialism.

**Note on scope.** SPEC.md §12 already says respondents whose answers fall
outside the left are told so plainly rather than assigned the nearest left
ideology. That is the mechanism for someone who answers like a National
Bolshevik — not a leaf that would let the test return one.

---

## The boundary cases that *are* on the roster

Twelve entries are marked `boundary: true`: distributism, third_way, baathism,
nasserism, labour_zionism, nehruvian_socialism, peronism, juche,
deng_xiaoping_theory, xi_jinping_thought, pol_potism, egoism.

These are on the roster because people genuinely hold them and they genuinely
overlap with the left, while sitting at its edge for different reasons — some
have abandoned social ownership as an aim, some subordinate class to nation,
some are disputed as socialist by most of the rest of the roster. The `boundary`
flag exists so the result page can say so, and so `boundaryPrior` can hold them
back on level evidence if that is ever wanted. It is not a judgement that they
are not left; it is a record that the question is contested.
