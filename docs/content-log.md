# Content log

One line per change under `/content`, newest last, with the reason the content
needed to change (not what the diff shows). Required by CLAUDE.md § Content
rules. Every entry must have passed `npm run validate`.

---

```
2026-09-19  content/questions.yaml     +19 seed questions (d1 6, d2 6, d3 7)
            Seed bank for the schema and validator phase. Sized to exercise every
            field in the schema with real content — gating, forced and boosted
            follow-ups, unlock, exclusive_with, modifier_tags, likert5, multi,
            answer interpolation — not to be a share of the 250-300 target.
            Written to SPEC.md §11: no proper nouns or dates in any stem or
            option, scenarios rather than propositions, every option phrased as
            its own camp would phrase it.

2026-09-19  content/families.yaml      +6 families with default stances
            social_democracy, marxism_leninism, trotskyism, left_communism,
            anarchism, eco_left. Family defaults carry the positions every
            member shares, so sect records hold only what actually distinguishes
            them — which is also what makes an undistinguished sect visible.

2026-09-19  content/ideologies.yaml    +21 ideologies across those 6 families
            Chosen to cover the near-neighbour pairs SPEC.md §1 names as the
            success criterion: council_communism/bordigism (d3_party_vs_class,
            d3_council_or_programme), cliffism/orthodox_trotskyism
            (d3_bureaucratic_planned_economy, d3_war_between_such_states),
            platformism/especifismo (d3_specific_organisation),
            democratic_socialism/nordic_social_democracy (d2_reform_horizon),
            maoism/soviet_orthodox_ml (d3_class_struggle_under_socialism),
            eco_socialism/degrowth (d1_technology_scale). Each of those pairs has
            at least one question where their stances oppose directly.

2026-09-19  content/ideologies.yaml    posadism added with no stances of its own
            Deliberate: it is `lineage: true` and the question bank has nothing
            that separates it from orthodox_trotskyism. `npm run validate` warns
            about it, which is the correct behaviour and is left standing rather
            than silenced. See docs/inseparable.md.
```

```
2026-09-19  content/families.yaml       12 families replace the previous 6
            Rebuilt from the purged roster. The eco_left family is gone; ecology
            is now a `green_and_historical` member plus the existing `ecology`
            modifier tag, which resolves the open question in
            docs/coverage-gaps.md about whether it was a family or an axis.
            Family stances emptied: the previous ones were authored against a
            different family composition and would have put positions in the
            mouths of ideologies that never held them.

2026-09-19  content/ideologies.yaml     93 ideologies replace the previous 21
            The final purged roster, built exactly as given: nothing added,
            dropped or merged. 47 core, 34 niche, 12 boundary. 28 entries carry
            a `tendency` parent; the rest are flat because no descent was
            uncontested. Tiering and every dual-family call are recorded in
            docs/roster-decisions.md; exclusions in docs/roster-purged.md.
            Stances left empty — this is a skeleton, and `npm run validate`
            warns once per ideology until they are authored.

2026-09-19  (no content change)         note on the question bank
            content/questions.yaml is unchanged and still valid, but its 19
            questions were written against the old 21-ideology roster and now
            carry no stances at all. It needs rebuilding against the new roster
            before the test can place anyone. docs/roster-todo.md tracks it.
```

```
2026-09-19  content/lint/*.txt          +3 lint word lists
            226 named entities, 108 jargon terms, 70 loaded words, to enforce
            principles 1, 5 and 6 mechanically. Named entities and jargon are
            errors in a stem; loaded words are warnings, because an option
            written in a camp's own voice may legitimately carry one and
            flattening that would break principle 5.
            Removed "plainly" from loaded-words.txt after its first run: it
            fired on "say so plainly", which is ordinary English, and two false
            positives out of five warnings is how a list stops being read.

2026-09-19  content/questions.yaml      d2_who_is_the_agent 7 options -> 6
            `npm run lint:content` caught it on its first run. Principle 7 caps
            options at 6 for every kind except likert; the schema had been
            allowing `multi` up to 8, which was an invention of mine that
            quietly contradicted a binding principle. Fixed the schema to 3-6
            and dropped `students_and_intellectuals`: no ideology on the roster
            treats students as the primary agent of change, so it was the option
            with the weakest claim to a camp.
```

```
2026-09-19  content/ideologies.yaml     bundism: religious_left -> anti_colonial
            Bundism was explicitly secular and often anti-clerical; it is Jewish
            in a national-cultural sense, not a religious one. Its defining
            position is an answer to the national question — autonomy in the
            diaspora rather than territorial separation or assimilation — which
            is the same kind of answer connollyism and abertzale_left give. In
            religious_left it would have inherited family defaults grounding the
            politics in faith, which it does not.

2026-09-19  content/families.yaml       anti_colonial renamed (id unchanged)
            "Anti-colonial and national liberation" -> "National-liberation and
            national-question left", and the summary widened to cover internal
            and diaspora national domination, not colonial rule alone. Needed to
            make Bundism's placement honest rather than a stretch. The id is
            load-bearing — `requires: family_mass_gte` clauses in questions.yaml
            refer to it — so only the display name moved.

2026-09-19  content/ideologies.yaml     kautskyism: marxism_leninism -> social_democracy
            Family stances are inherited, so an ML default of vanguard party and
            one-party state would be attributed to Kautsky unless every one were
            overridden — and his whole position is that the parliamentary road
            makes them unnecessary. Inheriting positions an ideology exists to
            reject is a misrepresentation, not a near miss. Still no `tendency`:
            Leninism is a break from Kautskyism, so that descent runs the wrong
            way for inheritance, and Kautskyism is older than the post-war
            settlement classical_social_democracy describes.

2026-09-19  content/ideologies.yaml     peronism: marxism_leninism -> anti_colonial
            Same reason. It has no Leninist lineage and is class-conciliationist
            by design — organised labour allied to a national state that mediates
            between classes — so ML defaults would have misdescribed it on the
            party question and on class struggle alike. Its actual content is
            economic sovereignty and national independence.

2026-09-19  SPEC.md                     reconciled with the 93-entry roster
            §1's criterion table named platformism, especifismo and degrowth,
            all purged, and "Soviet-line Marxism–Leninism", which is not an id.
            Replaced with six pairs that exist, written as ids, plus a standing
            constraint that every pair in that table must be on the roster: a
            criterion naming an ideology the test cannot return is a criterion
            nothing can be measured against. §2.1 and §2.2 replaced the
            15-family/139-leaf draft taxonomy with the live 12 families and 93
            leaves. §2.3's node record used kebab-case path ids that no longer
            exist; rewritten against IdeologySchema, with the missing
            `commitments`/`contrasts` fields marked as not yet built rather than
            described as though they were. §6 and §13 counts updated.
```

```
2026-09-19  content/ideologies.yaml     chavismo: marxism_leninism -> anti_colonial
            It took power by winning elections and rewrote the state it
            inherited rather than seizing it, and the PSUV was assembled after
            taking office rather than being the vanguard that took it. Under ML
            defaults it would have inherited the party question, the rupture
            question and the ownership question and had to override all three.
            Runner-up recorded as post_marxist: the left-populist theory behind
            it is Laclau's and its electoral road resembles Eurocommunism's.
            Placed by its anti-imperial and resource-sovereignty content.

2026-09-19  content/ideologies.yaml     mariateguism: marxism_leninism -> anti_colonial
            Its defining content is the land and indigenous question and an
            explicit refusal to copy European models. The vanguard party is
            incidental to it, so ML defaults would have described it by the part
            of it that matters least.

2026-09-19  content/families.yaml       green_and_historical dissolved
            Its seven members shared no position on the state, ownership or
            strategy, so under the new 75% rule no family default could have
            been written for any question at all — it could only ever have been
            an empty container. owenism, fourierism, saint_simonianism and
            narodnism -> new family early_socialism ("Pre-Marxist and early
            socialism"); ecosocialism -> post_marxist; guild_socialism ->
            market_socialism; revolutionary_syndicalism -> anarchism. Narodnism
            recorded as the weakest fit: it is post-Marx and argued with Marx,
            so it belongs by method rather than by date.

2026-09-19  content/families.yaml       post_marxist and market_socialism renamed
            "Post-Marxism and the new left" -> "Post-Marxist and new left" to
            cover ecosocialism. "Market socialism" -> "Market and cooperative
            socialism", since what the family actually commits to is distinct
            enterprises coordinating with each other, not markets specifically —
            which is what lets guild socialism sit in it.

2026-09-19  content/families.yaml       anti_colonial split in two
            The family mixed two claims that overlap but are not the same:
            colonial domination is the structure to break, and the nation is the
            unit of emancipation. A default for either would have been overridden
            by the members holding the other. New family national_question
            ("National-question left") takes connollyism, abertzale_left,
            labour_zionism, bundism, peronism, baathism and nasserism.
            anti_colonial keeps the nine decolonial entries plus chavismo and
            mariateguism, and its name and summary revert to the anti-colonial
            framing — keeping the clause about domination reproduced internally,
            which is what justifies ambedkarism being there at all.

2026-09-19  content/families.yaml       left_communism: no parliamentary default
            Recorded in the file as a comment, not just in docs. De Leonism
            seeks a mandate at the ballot box, Impossibilism stands candidates
            and Luxemburg argued for contesting elections against her own
            party's majority — three of eight, far past the 75% rule. That
            question is authored per member.

2026-09-19  content/*.yaml              no tendency parents needed clearing
            All 16 moved ideologies were flat (no `tendency`), so no parent
            crossed a family boundary. Checked rather than assumed.
```

```
2026-09-19  content/ideologies.yaml     connollyism, abertzale_left: niche -> core
            Both are live positions a real respondent can hold today — there
            are people organising under each now — which is the tiering
            criterion in docs/roster-decisions.md. The niche marking was a
            mistake, not a judgement. national_question now has two core members
            rather than none. No other tier changed. roster_tier is not read by
            the engine (priors come from `boundary`, and nothing gates which
            results a mode may return by tier), so this changes the docs and the
            coverage/todo tables, not any result the test gives.

2026-09-19  (tooling) fitnessReport     weight-only differences no longer overrides
            A member restating a family default's exact accept/reject sets at a
            different weight was being counted as an override, toward both the
            30% default warning and the 40% misfiling flag. It now counts toward
            neither and is reported in its own column. A defining ideology
            restates a family position at weight 3 to make it a shibboleth; the
            old counting reported the default as misfitting exactly where it fit
            best, and would have pushed authors to weaken correct defaults.
            Only a different accept or reject set, or a `null` clear, counts.
```

```
2026-09-19  docs/question-inventory.md  +one row per planned question (130)
            The blueprint's ~273 double-counted: all 84 of §5's sect-level grid
            questions were also inside §4's depth-2 budgets, and §4's 135 held
            ~51 slots no question filled. A further 43 grid columns re-asked a
            depth-1 dimension under another name. Unique: 47 depth-1, 55 depth-2,
            28 depth-3. Depth assigned by a new rule in SPEC §3.3; close calls
            listed for review. Nothing padded to reach a target.

2026-09-19  SPEC.md §9                  ranges set from the unique count
            42-52 / 50-60 / 25-31, total 117-143 (about ±10%). The old 250-300
            fitted a ~130-leaf draft taxonomy and a plan that counted twice.
            Effective-stance rule keeps 15+ per leaf but drops "5+ at depth 3",
            which the depth rule makes impossible for most leaves.

2026-09-19  question-blueprint.md §2    depth-1 reconciled: 45 -> 47
            The dimension table summed to 45, not the 44 stated (D14 counted
            once). Added a second D16 question (gender division of work) so
            `gender` has two depth-1 feeders, and a second D23 question
            (reserved places for hereditary lower-ranked groups) so `caste` is
            measurable without the gated Indian-subcontinent questions.

2026-09-19  src/content/schema.ts       +modifier tags anti_colonial, caste; labels
            `caste` kept separate from `race`: Ambedkarite writers distinguish
            them and principle 5 requires each camp to recognise its own view.
            Every tag now has a display name; `nation` is shown as "Emphasis on
            national self-determination", avoiding "nationalist".

2026-09-19  content/questions.yaml      three mis-tagged options fixed
            peasants_and_rural_poor lost `nation` (a peasant base is not a
            national claim); colonised_nations became `anti_colonial`;
            break_it_up_for_local_control lost `ecology` (scale is a technology
            position). No other existing tag disagreed with its option's text.

2026-09-19  content/ideologies.yaml     +inseparable_from on four ideologies
            connollyism / abertzale_left and zapatismo / democratic_confederalism
            recorded in docs/inseparable.md: neither pair has two independent
            position separators. The new field lets the resolver name both and
            say why. A shared tendency node would be more precise but means a
            94th roster entry; proposed in roster-decisions.md §6, not added.

2026-09-19  docs/inseparable.md         posadism resolved; standard stated
            A nuclear-war position question (would a general war between blocs
            advance or set back socialism) gives posadism a second separator
            from orthodox Trotskyism alongside historical inevitability. Stalinism
            gets a purges-verdict question as its second separator. Leninism /
            Marxism-Leninism uses the self-ID question as its second. Deng / Xi
            keep two emphasis-level separators. None of these is recorded.

2026-09-19  question-blueprint.md §5    five grid cells corrected
            Leninism E6 (factions) was "allowed"; Lenin's party banned them, and
            with the fix E6 separated nothing, so it was dropped. Sandinismo R5,
            individualist A5, insurrectionary S4 and revolutionary syndicalism S5
            were guesses the doctrines do not clearly support; all set to
            silence and logged in docs/review/boundary-stance-notes.md.

2026-09-19  (engine) src/engine/flow.ts selection and the modifier quota
            Not content, but it changes what respondents see. Modifier-only
            questions have zero information gain and would never be selected,
            leaving tags empty. Each mode now has a quota (3 / 6 / 8) that
            counts toward its budget and blocks an early stop.
```

```
2026-09-20  content/questions.yaml      depth-1 core: 26 questions, 4 ids renamed
            The smallest set that puts posterior mass on all 13 families through
            ungated questions (docs/question-blueprint.md §3). Renames, all
            breaking id changes: d2_planning_or_market -> d1_planning_or_market,
            d2_party_role -> d1_party_role, d2_state_after_transition ->
            d1_state_after_transition (it does family work, not within-family
            work), and d2_who_is_the_agent, the bank's only `multi`, rewritten as
            d1_decisive_agent plus the likert d1_peasantry. d1_state_role gains
            "win a state of our own", without which national_question and much of
            anti_colonial had no option they would choose — a principle-5 failure.
            d1_ownership gains widely-held small property, d1_planning_or_market a
            regulated-market option so it can be asked ungated, d1_change_route a
            protracted-armed-struggle option. d1_technology_scale rewritten to
            ask about scale alone. Nine follow-ups: four force, four boost, one
            unlock; three stems quote an earlier answer.

2026-09-20  content/families.yaml       family defaults for the depth-1 core
            Written only where the 75% rule holds, with the count and the
            dissenters named in each family's comment. early_socialism,
            national_question, maoism and trotskyism carry none: the first two
            because their members disagree about the questions that define them,
            the last two because every member descends from one node that carries
            the shared positions instead.

2026-09-20  content/ideologies.yaml     stances for all 93 on the depth-1 core
            Authored per ideology where the family default does not hold, and
            left silent where the tradition has no position — d1_violence is the
            clearest case, with no default in any family (SPEC.md §5.2a).
            Shared Leninist, Maoist and Trotskyist positions sit on leninism,
            mao_zedong_thought and orthodox_trotskyism and are inherited down the
            tendency tree rather than repeated.

2026-09-20  content/questions.yaml      +d1_religion_and_liberation, +d1_wealth_from_periphery
            Commissioned by the first `npm run check -- --mode quick` run.
            Religious-left members were returned as social democrats or market
            socialists because a single faith question could not hold them, and
            the anti-colonial family had one depth-1 feeder against Maoism's
            several. Both are depth-1 rows of docs/question-inventory.md (30 and
            21) that this pass had deferred. They also give `religion` its second
            modifier feeder and `anti_colonial` its third.

2026-09-20  content/ideologies.yaml     three stances corrected, found by check
            marxism_leninism_maoism's weight-3 restatement of protracted people's
            war and gonzalo_thought's of armed struggle now removed: both accept
            exactly the option their parent accepts, so the weight-3 restatement
            claimed a difference the question cannot express and moved
            respondents off the parent. What separates them is depth-2 and
            depth-3 work (d2_universal_stage, d2_peoples_war). castroism's
            guiding-leader cell changed from "the leader's thought settles it" to
            collective leadership: Cuba's party is formally collective and
            Castroism claims no guiding doctrine, and the old cell had a perfect
            Castroist respondent returned as gonzalo_thought.

2026-09-20  content/ideologies.yaml     restatements aligned with their defaults
            Members restating a family default with the accept set intact but the
            reject list dropped were counted as position overrides by the fitness
            report — d1_state_role read as 100% overridden in anarchism and
            d1_party_role as 92% in marxism_leninism, both of which are positions
            every member holds. Duplicated restatements removed; the rest now
            carry the default's reject list. Defaults over the 30% threshold fell
            from six to three, and members over 40% from eleven to six.
```
