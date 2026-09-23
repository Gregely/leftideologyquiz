import io

p = 'src/lib/result-view.ts'
s = io.open(p, encoding='utf-8').read()


def sub(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


sub("""  level: 'sect' | 'tendency' | 'family' | 'field';""",
    """  level: 'sect' | 'tendency' | 'family' | 'group' | 'field';""")

sub("""  // The whole field always holds all the mass; that is not confidence in anything.
  if (level === 'field') return 'Your answers so far do not favour one family of the left over the others.';""",
    """  // The whole field always holds all the mass; that is not confidence in anything.
  if (level === 'field') return 'Your answers so far do not favour one part of the left over the others.';
  if (level === 'group' && kind === 'resolved') {
    if (confidence >= 0.6) return 'Your answers point clearly to this part of the left.';
    if (confidence >= 0.4) return 'This is the part of the left your answers fit best.';
    return 'This is where your answers lean, though not by much.';
  }""")

sub("""    case 'lineage-not-established':
      return 'The closest tradition is defined by who it descends from as much as by what it holds, and nothing you answered yet speaks to that.';
  }
}""",
    """    case 'lineage-not-established':
      return 'The closest tradition is defined by who it descends from as much as by what it holds, and nothing you answered yet speaks to that.';
    case 'mode-reports-no-deeper':
      // Only reachable on a resolved result, which returns above. Kept so the
      // switch stays exhaustive if that ever changes.
      return null;
  }
}

/**
 * What a respondent is told about where the answer stops.
 *
 * A group result is not a back-off — the evidence supported it — but it is not
 * the whole story either, and saying so is the point of stopping there.
 */
function nextStepText(result: Result, model: EngineModel): string | null {
  if (result.backOffReason !== 'mode-reports-no-deeper') return null;
  const names = result.candidates.slice(0, 3).map((c) => c.name);
  if (names.length === 0) return null;
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const deeper = model.content.groupById.has(result.node.id)
    ? 'These traditions agree on most of what this mode asked about.'
    : 'The traditions inside it are close on what this mode asked about.';
  return `Closest within it: ${list}. ${deeper} Going further takes more questions.`;
}""")

sub("""function levelOf(result: Result): ResultView['level'] {
  if (result.node.kind === 'root') return 'field';
  if (result.node.kind === 'family') return 'family';
  return result.kind === 'resolved' ? 'sect' : 'tendency';
}""",
    """function levelOf(result: Result): ResultView['level'] {
  if (result.node.kind === 'root') return 'field';
  if (result.node.kind === 'group') return 'group';
  if (result.node.kind === 'family') return 'family';
  return result.kind === 'resolved' && result.candidates.length === 0 ? 'sect' : 'tendency';
}""")

sub("""  const posterior = computePosterior(model, answers);
  const result = resolve(posterior);

  const summary =
    result.node.kind === 'ideology'
      ? (content.ideologyById.get(result.node.id)?.summary ?? null)
      : result.node.kind === 'family'
        ? (content.familyById.get(result.node.id)?.summary ?? null)
        : null;""",
    """  const posterior = computePosterior(model, answers);
  const result = resolve(posterior, DEFAULT_FLOW_CONFIG.modes[mode].maxReportLevel);

  const summary =
    result.node.kind === 'ideology'
      ? (content.ideologyById.get(result.node.id)?.summary ?? null)
      : result.node.kind === 'family'
        ? (content.familyById.get(result.node.id)?.summary ?? null)
        : result.node.kind === 'group'
          ? (content.groupById.get(result.node.id)?.description ?? null)
          : null;""")

sub("""      name: result.node.kind === 'root' ? 'Several families' : result.node.name,""",
    """      name: result.node.kind === 'root' ? 'Several parts of the left' : result.node.name,""")

sub("""    backOffText: backOffText(result.backOffReason, result, model),""",
    """    backOffText: backOffText(result.backOffReason, result, model) ?? nextStepText(result, model),""")

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
