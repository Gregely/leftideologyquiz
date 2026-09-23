import io

p = 'src/content/validate.ts'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


sub("""function lineOf(
  ctx: Ctx,
  which: 'families' | 'ideologies' | 'questions',""",
    """function lineOf(
  ctx: Ctx,
  which: 'groups' | 'families' | 'ideologies' | 'questions',""")

sub("""  checkIdNamespaces(ctx);
  checkInseparable(ctx);""",
    """  checkGroups(ctx);
  checkIdNamespaces(ctx);
  checkInseparable(ctx);""")

sub("""  checkInterpolation(ctx);
  checkQuestionCoverage(ctx);

  return issues;
}""",
    """  checkInterpolation(ctx);
  checkQuestionCoverage(ctx);
  checkDoubledIssues(ctx);

  return issues;
}

// --- groups ------------------------------------------------------------------

/**
 * Every family names a group that exists, and every group has at least one
 * family.
 *
 * The first is an error because a family whose group is missing hangs off the
 * root, which silently gives Quick mode a thirteen-way choice it was never
 * meant to make. The second is a warning: an empty group is dead content
 * rather than a broken tree, but it will appear in the result page's list of
 * what a respondent could have been.
 */
function checkGroups(ctx: Ctx): void {
  for (const family of ctx.content.families) {
    if (ctx.content.groupById.has(family.group)) continue;
    ctx.push({
      severity: 'error',
      code: 'group/unknown',
      file: FILES.families,
      id: family.id,
      path: 'group',
      line: lineOf(ctx, 'families', family.id, ['group']),
      message: `family names group "${family.group}", which does not exist`,
      hint: `groups are: ${ctx.content.groups.map((g) => g.id).join(', ')}`,
    });
  }

  for (const group of ctx.content.groups) {
    const members = ctx.content.familiesByGroup.get(group.id) ?? [];
    if (members.length > 0) continue;
    ctx.push({
      severity: 'warning',
      code: 'group/empty',
      file: FILES.groups,
      id: group.id,
      line: lineOf(ctx, 'groups', group.id, []),
      message: 'no family belongs to this group, so nothing can ever resolve to it',
      hint: 'give a family this group, or cut the group',
    });
  }

  for (const group of ctx.content.groups) {
    if (!ctx.content.familyById.has(group.id)) continue;
    ctx.push({
      severity: 'warning',
      code: 'id/group-family-collision',
      file: FILES.groups,
      id: group.id,
      line: lineOf(ctx, 'groups', group.id, []),
      message: `"${group.id}" is both a group id and a family id`,
      hint: 'rename the group: a bare id that names both makes every report line and every `requires` clause ambiguous to read',
    });
  }
}

// --- one doctrine, stated twice ----------------------------------------------

/**
 * An ideology that states the same doctrine on two questions is counted twice
 * by the likelihood, which makes it a narrower distribution than the evidence
 * warrants and lets it take its neighbours' respondents.
 *
 * This has happened twice already and both times it was found by hand:
 * `mutualism` carried occupancy-and-use at weight 3 on both `d1_ownership` and
 * `d1_land`, and `democratic_confederalism` stated its answer to the national
 * question at weight 3 on two questions. The optional `issue:` annotation on a
 * stance exists so the validator can say so instead. It is inert — the engine
 * never reads it — so annotating is free and partial annotation is fine.
 *
 * Error, not warning: an unannotated pair is invisible, so the one that *is*
 * annotated is a deliberate statement by the author that these two stances are
 * the same doctrine, and two weight-bearing stances on one doctrine is always
 * a defect (docs/redesign.md §10.2).
 */
function checkDoubledIssues(ctx: Ctx): void {
  for (const ideology of ctx.content.ideologies) {
    const resolved = resolveStances(ctx.content, ideology.id);
    const byIssue = new Map<string, { questionId: string; weight: number }[]>();

    for (const [questionId, entry] of resolved.byQuestion) {
      const issue = entry.stance.issue;
      if (!issue || entry.stance.weight === 0) continue;
      const list = byIssue.get(issue);
      if (list) list.push({ questionId, weight: entry.stance.weight });
      else byIssue.set(issue, [{ questionId, weight: entry.stance.weight }]);
    }

    for (const [issue, entries] of byIssue) {
      if (entries.length < 2) continue;
      const sorted = [...entries].sort((a, b) => b.weight - a.weight);
      const where = sorted.map((e) => `${e.questionId} (weight ${e.weight})`).join(', ');
      ctx.push({
        severity: 'error',
        code: 'stance/doctrine-counted-twice',
        file: FILES.ideologies,
        id: ideology.id,
        path: `stances.${sorted[0]?.questionId ?? issue}`,
        line: lineOf(ctx, 'ideologies', ideology.id, ['stances', sorted[0]?.questionId ?? '']),
        message: `states issue "${issue}" on ${entries.length} questions: ${where}`,
        hint: 'the likelihood counts each one, so the ideology becomes narrower than the evidence warrants. Keep the stance on the question the doctrine actually lives on and drop or clear the other',
      });
    }
  }
}""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
