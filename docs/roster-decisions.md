# Roster decisions

Judgement calls made while turning the purged roster into
`content/families.yaml` and `content/ideologies.yaml`. Everything here is
overrulable — that is why it is written down rather than left in the YAML.

Roster as built: **93 ideologies in 13 families**, matching the source list
exactly. Nothing added, dropped or merged.

---

## 1. Tiering

Target was core ≈ 40–55. Result: **49 core, 32 niche, 12 boundary**.

"Core" means an ideology a real test-taker could plausibly land on — a position
someone holds, rather than one they study. The test is not whether the tradition
is important but whether a living person answering honestly could come out as
it. That is why Kautskyism is core (the democratic road to socialism is a live
position) while Bernsteinian revisionism is niche (almost everyone who holds it
today would call it social democracy), and why the Trotskyist splits are mostly
niche while the two big analytical divisions — orthodox and Cliffite, plus
Shachtman's third answer — are core.

**Core (49)**

| Family | Core | Core members |
| --- | ---: | --- |
| `early_socialism` | 0 | — |
| `liberal_left` | 2 | social_liberalism, liberal_socialism |
| `social_democracy` | 3 | kautskyism, classical_social_democracy, democratic_socialism |
| `market_socialism` | 2 | market_socialism, guild_socialism |
| `post_marxist` | 3 | post_marxism, eurocommunism, ecosocialism |
| `religious_left` | 3 | christian_socialism, liberation_theology, islamic_socialism |
| `anti_colonial` | 4 | third_worldism, fanonism, ambedkarism, chavismo |
| `national_question` | 2 | connollyism, abertzale_left |
| `marxism_leninism` | 6 | leninism, marxism_leninism, stalinism, titoism, guevarism, castroism |
| `maoism` | 2 | mao_zedong_thought, marxism_leninism_maoism |
| `trotskyism` | 3 | orthodox_trotskyism, cliffism, shachtmanism |
| `left_communism` | 7 | council_communism, bordigism, luxemburgism, communization, situationism, autonomism, de_leonism |
| `anarchism` | 12 | mutualism, collectivist_anarchism, anarcho_communism, anarcho_syndicalism, insurrectionary_anarchism, individualist_anarchism, anarcho_primitivism, social_ecology, post_left_anarchy, zapatismo, democratic_confederalism, revolutionary_syndicalism |

**`early_socialism` has no core members at all**, which is the correct reading:
four historical traditions nobody alive holds as their politics, there to be
recognised rather than landed on.

**`national_question` had none either until Connollyism and the abertzale left
were promoted.** Both are live positions someone can hold today — there are
people organising under each right now — which is exactly the tiering criterion,
and the earlier niche marking was a mistake rather than a judgement. The rest of
the family is four boundary entries plus Bundism, so it still has a thinner core
than its size suggests, and a *general* national-question position — one not tied
to a particular people — remains absent from the roster.

**Niche (32)** — everything else not marked boundary: bernsteinian_revisionism,
fabianism, austromarxism, christian_communism, buddhist_socialism, bundism,
gandhian_socialism, cabralism, ujamaa, nkrumaism, sankarism,
lohiaite_socialism, hoxhaism, ho_chi_minh_thought, sandinismo,
mariateguism, gonzalo_thought, prachanda_path, mlm_third_worldism, mao_spontex,
pabloism, grantism, morenism, lambertism, posadism, spartacism, impossibilism,
christian_anarchism, narodnism, owenism, fourierism, saint_simonianism.

**Boundary (12)** — the marked entries, all with `boundary: true` and
`roster_tier: boundary`: distributism, third_way, baathism, nasserism,
labour_zionism, nehruvian_socialism, peronism, juche, deng_xiaoping_theory,
xi_jinping_thought, pol_potism, egoism.

Note that `boundary` occupies the tier slot, so a boundary entry carries no
core/niche judgement. If you want boundary entries tiered as well, the schema
would need a separate field.

**Anarchism is 12 of 49 core.** That is deliberate — the family's internal
divisions are ones ordinary respondents really do sit on either side of — but it
does mean the anarchist family will need proportionally more depth-3 questions
than its size suggests. Worth watching when the bank is authored.

---

## 2. Family placement

Thirteen families. Three of the twelve original placements flagged here have
since been acted on, and two families have been restructured; both are recorded
below with the reasoning, so a later reader can see what moved and why.

### 2.1 Resolved — acted on

| Ideology | Moved | Why |
| --- | --- | --- |
| **Bundism** | religious_left → `national_question` | Explicitly secular and often anti-clerical; Jewish in a national-cultural sense, not a religious one. Its defining position is an answer to the national question — autonomy in the diaspora, *doikayt*, rather than territorial separation or assimilation. |
| **Kautskyism** | marxism_leninism → `social_democracy` | Family defaults are inherited, so ML defaults of vanguard party and one-party state would have been attributed to Kautsky unless every one were overridden — and his position is that the parliamentary road makes them unnecessary. |
| **Peronism** | marxism_leninism → `anti_colonial` → `national_question` | No Leninist lineage and class-conciliationist by design. Its content is economic sovereignty and national independence; within the split it sits on the national-question side, since the nation is the unit it organises around. |
| **Chavismo** | marxism_leninism → `anti_colonial` | Took power by election and rewrote the state it inherited rather than seizing it, and the PSUV was assembled after taking office. It is not a vanguard-party ideology, and would have overridden five ML defaults including the party question. **Runner-up: `post_marxist`** — the left-populist theory it drew on is Laclau's, and its electoral road with a mass party resembles Eurocommunism. Placed by its anti-imperial and resource-sovereignty content instead. |
| **Mariáteguism** | marxism_leninism → `anti_colonial` | Its defining content is the land and indigenous question and an explicit refusal to copy European models; the vanguard party is incidental to it. |

### 2.2 Resolved — `green_and_historical` dissolved

The family grouped ecosocialism, revolutionary syndicalism, guild socialism,
Narodnism, Owenism, Fourierism and Saint-Simonianism. They share no position on
the state, on ownership, or on strategy, which under the 75% rule (SPEC.md
§5.2a) means **no family default could have been written for any question at
all** — the family could only ever have been an empty container that seven
ideologies each carried their full stance load inside.

| Member | Moved to | Why |
| --- | --- | --- |
| Owenism, Fourierism, Saint-Simonianism | `early_socialism` | Worked out before Marx's account settled the field, and share a method: demonstrate the better order and let it spread, rather than contest power for it. |
| **Narodnism** | `early_socialism` | **The weakest fit of the four.** It is post-Marx chronologically and argued *with* Marx about whether the peasant commune could bypass capitalism, so "pre-Marxist" is wrong about it in the literal sense. It belongs by method — the commune as an existing institution to build from, going to the people rather than over them — and because every alternative is worse: it is not anti-colonial, not social-democratic, and not Leninist. Revisit if `early_socialism` ever acquires defaults it has to override. |
| Ecosocialism | `post_marxist` | Holds that ecological crisis follows from production organised for accumulation, and builds a majority across distinct democratic demands rather than from a single class subject. The display name widened to "Post-Marxist and new left" to cover it. |
| Guild socialism | `market_socialism` | Industries run by self-governing guilds, coordinating with a state representing consumers: social ownership in distinct enterprises that negotiate rather than submit to a single plan. The display name widened to "Market and cooperative socialism", since the family's commitment is distinct enterprises, not markets specifically. |
| Revolutionary syndicalism | `anarchism` | The union as the whole of the movement — its school, its weapon and its future administration — with political parties a detour. That is the anarcho-syndicalist position minus the explicit anarchism, and it sits next to `anarcho_syndicalism` where the one question that separates them can be asked. **Alternative: `left_communism`, beside `de_leonism`** — both hold that industrial organisation supersedes the party, and De Leonism differs mainly in accepting the ballot box. A real second choice; placed in anarchism because hostility to political action as such is the sharper commitment. |

### 2.3 Resolved — `anti_colonial` split

The combined family mixed two claims that overlap but are not the same: *colonial
and imperial domination is the structure to be broken*, and *the nation is the
unit of emancipation*. A family default for either would have been overridden by
the members holding the other.

- **`anti_colonial`** (11): third_worldism, fanonism, cabralism, ujamaa,
  nkrumaism, sankarism, ambedkarism, lohiaite_socialism, nehruvian_socialism,
  chavismo, mariateguism.
- **`national_question`** (7): connollyism, abertzale_left, labour_zionism,
  bundism, peronism, baathism, nasserism.

**Could sit in either, recorded so the call can be reversed:**

- **Nkrumaism** — anti-colonial in its target, but continental African unity is
  a claim about which nation is the unit, and Nkrumah's answer is "a larger one
  than the colonisers drew". Placed in `anti_colonial` because the argument is
  driven by neo-colonial economic dependence rather than by national feeling.
- **Ba'athism** and **Nasserism** — both are pan-Arab *and* anti-imperial, and
  the two are not separable in either. Placed in `national_question` because the
  unit of emancipation — the Arab nation, to be unified — is the prior
  commitment, and the anti-imperialism follows from it.
- **Peronism** — the weakest of the three, since its national content is
  sovereignty against foreign capital rather than a people seeking self-rule.
  Placed in `national_question` because it has no colonial situation to speak
  of; Argentina was formally independent throughout.

**Least comfortable fits in `anti_colonial`:**

- **Ambedkarism** — its target is caste, an internal hierarchy, not colonial
  rule; Ambedkar's quarrel with the nationalist movement was precisely that
  independence would leave caste intact. It is here because the family summary
  explicitly covers domination reproduced internally within a liberated country,
  and because no other family fits better — but it is the member most likely to
  override whatever defaults the family acquires.
- **Lohiaite socialism** — the same problem in weaker form: caste and
  decentralisation are its content, anti-colonialism its background. Watch both
  once `anti_colonial` has defaults; if either is flagged as a candidate
  misfiling, the honest answer may be a caste-and-internal-domination family
  rather than forcing them here.

### 2.4 Still open — placements where a different family is defensible

| Ideology | Placed in | Alternative | Why placed there |
| --- | --- | --- | --- |
| **Titoism** | marxism_leninism | market_socialism | Self-management economics are the market-socialist model in practice, and it overrides the ML economic defaults as hard as Deng does. Placed with ML because its identity is the party-state and the break with Moscow. |
| **Eurocommunism** | post_marxist | marxism_leninism, social_democracy | ML parties adopting a democratic road. Placed with post-Marxism because its distinguishing claim — hegemony won across society, pluralism kept — is the new-left break rather than either parent. |
| **Zapatismo** | anarchism | anti_colonial | Indigenous liberation with a national question, but its organising principle (rule by obeying, no seizure of state power) is anarchist in substance. |
| **Democratic confederalism** | anarchism | national_question | A national movement's answer to the national question, but the answer is explicitly stateless and explicitly Bookchinite — hence also its `tendency`. Now that `national_question` exists, this is a closer call than it was. |
| **Christian anarchism** | anarchism | religious_left | Anarchist in its conclusions, religious in its grounds. Placed by conclusion. |
| **De Leonism** | left_communism | market_socialism, anarchism | Industrial unionism plus a political party. Placed with left communism for its hostility to reformist parliamentarism — though it is one of the three members that made the family's parliamentary default unwritable. |
| **Third Worldism** | anti_colonial | maoism | Kept apart from MLM–Third Worldism, which stays in maoism: the general position and the specifically Maoist version are different entries. |
| **Sandinismo** | marxism_leninism | anti_colonial | Took power by armed insurrection led by a front, which is the ML signature. Mixed economy, pluralism and non-alignment were founding commitments rather than concessions, so it will carry real economic overrides. |
| **Guevarism** | marxism_leninism | — | Foquismo says an armed nucleus creates revolutionary conditions rather than a mass party leading them, which is a genuine override of the party question. Stays because the lineage is unambiguous. |
| **Luxemburgism** | left_communism | marxism_leninism, social_democracy | Predates the left-communist split and died a Spartacist. Placed by affinity — spontaneity, mass strike, hostility to substitutionism. |
| **Austromarxism** | social_democracy | marxism_leninism | Second International Marxism; placed by its practice (the democratic road) rather than its theory. |
| **Distributism** | liberal_left | early_socialism | Anti-statist, guild-based, and would override most of what a liberal-left default would say. `early_socialism` is now a plausible second home. |
| **Social ecology**, **anarcho-primitivism** | anarchism | — | Both ecological, both anarchist. Placed by the anarchist commitment, which determines their answers on the state. |
| **Mutualism** | anarchism | market_socialism | Overrides the anarchist defaults on ownership and coordination, but holds the anti-state core, which is the family's defining commitment. |

## 3. Parent nodes (`tendency`)

`tendency` is set only where a descent is genuinely uncontested. 28 of 93
entries have one; the rest are direct family children. **A flat family is more
honest than an invented lineage** — a parent means "inherits this one's stances
unless it overrides them", so a wrong parent silently puts words in an
ideology's mouth.

**Marxism–Leninism**
- `marxism_leninism` → leninism
- `stalinism`, `titoism`, `guevarism`, `castroism`, `ho_chi_minh_thought`,
  `juche`, `deng_xiaoping_theory` → marxism_leninism
- `hoxhaism` → **stalinism** (not marxism_leninism): Hoxhaism is defined by
  defending the Stalin line against everything that followed it
- `xi_jinping_thought` → deng_xiaoping_theory
- `leninism`, `chavismo`, `sandinismo`, `mariateguism` → no parent.

**Social democracy**, on `kautskyism` — no parent there either, and it must
not acquire one. Leninism is a break *from* Kautskyism, so the historical descent
runs Kautsky → Lenin; encoding it would have Leninism inherit Kautskyist stances
by default, which is backwards. Within social democracy the same argument applies
to `classical_social_democracy`: Kautskyism is the older position, not a
descendant of the post-war settlement.

**Maoism**
- `marxism_leninism_maoism`, `mao_spontex`, `pol_potism` → mao_zedong_thought
- `gonzalo_thought`, `prachanda_path`, `mlm_third_worldism` →
  marxism_leninism_maoism. The brief said "under Maoism"; MLM is the more precise
  parent, since all three take the MLM synthesis as given and differ within it.

**Trotskyism** — all eight splits → orthodox_trotskyism. A flat star, which is
accurate: orthodox Trotskyism is the trunk and these are departures from it.
Cliffism and Shachtmanism each reject the thesis that defines the parent, which
is exactly what the override mechanism is for.

**Social democracy**
- `bernsteinian_revisionism` → classical_social_democracy
- `third_way` → bernsteinian_revisionism (the late descendant of revisionism)
- `fabianism`, `austromarxism`, `democratic_socialism` → no parent

**Anarchism**
- `egoism` → individualist_anarchism
- `democratic_confederalism` → social_ecology (Öcalan's adoption of Bookchin is
  documented and explicit, not an inference)
- `anarcho_communism` and `collectivist_anarchism` are **siblings, not
  parent and child.** Kropotkin's communism grew out of Bakuninist collectivism
  historically, but they differ precisely on distribution, and making one the
  parent would have the other inherit a stance it exists to reject.

**Flat by choice:** religious_left, anti_colonial, left_communism,
green_and_historical, liberal_left, post_marxist. In each case the members are
parallel traditions rather than a trunk with branches. `communization` →
`bordigism` was considered and rejected: communisation draws on both the Italian
and German lefts, and picking one would misstate the descent.

---

## 4. Two id collisions, left in place

`marxism_leninism` and `market_socialism` are each both a family id and an
ideology id. This is legal — families and ideologies are separate namespaces,
and `validate` resolves each correctly — and it is accurate: the
Marxism–Leninism family does contain the ideology Marxism–Leninism, and the
market socialism family has exactly one member.

The cost is that a reader skimming `requires: { family_mass_gte: {
marxism_leninism: 0.1 } }` cannot tell from the id alone which is meant. If that
becomes a problem, rename the *families* (`ml_tradition`, `market_socialist`)
rather than the ideologies, and update the `requires` clauses in
`content/questions.yaml` — ideology ids are the share-URL format and should not
churn.

---

## 5. What this roster does not yet have

The question bank in `content/questions.yaml` was written against the previous
21-ideology roster. It is still valid and still loads, but it now covers a small
fraction of the field: 19 questions against 93 ideologies, with no stances
authored at all. `docs/roster-todo.md` tracks the gap.

---

## 6. Proposed, not applied: a shared tendency node for inseparable pairs

Two pairs are recorded in docs/inseparable.md as inseparable by position:
connollyism / abertzale_left and zapatismo / democratic_confederalism.

**What the resolver does today.** Both members of each pair are flat children of
their family (democratic_confederalism hangs off social_ecology). When their
masses tie, the resolver stops at the *family* node and lists the tied members as
candidates, alongside any other family member within the candidate floor. With
the `inseparable_from` field added in this revision, the result also carries the
pair's note, so it names both and explains that the position is the same and the
difference is the people concerned. **That meets the requirement without any
change to the roster.**

**What a shared node would add.** An interior node — for example
"republican socialism of a people governed from outside" over connollyism and
abertzale_left — would let the resolver stop at *that* node rather than the
family, so the reported level would be the shared position itself instead of
"national-question left, with these two candidates". That is a more precise
result.

**Why it is proposed rather than added.** The tree's interior nodes are ideologies
(`tendency` names another ideology), so a shared node means a **94th roster
entry**. The roster is fixed at 93 by your source list, and adding an entry is
your call, not mine. If you want it:

- connollyism / abertzale_left → a new interior ideology in `national_question`,
  with both as its children; it would carry the shared stances and neither child
  would need to restate them.
- zapatismo / democratic_confederalism → harder: democratic_confederalism already
  has a parent (social_ecology), and an ideology has one parent. A shared node
  would mean choosing between its Bookchinite descent and its structural twin.
  Recommend leaving this pair on `inseparable_from` alone.
