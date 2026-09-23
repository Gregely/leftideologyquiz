import io


def patch(path, edits):
    s = io.open(path, encoding='utf-8').read()
    for old, new in edits:
        assert s.count(old) == 1, (path, s.count(old), old[:70])
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8', newline='').write(s)
    print('patched', path)


# --- src/lib/result-view.test.ts -------------------------------------------
# These tests are about the view, not about mode report caps. Standard and
# Quick can no longer name a sect (`maxReportLevel`), so the runs that assert
# sect-level output move to Deep, which is the mode that names sects. What each
# test asserts is unchanged.
patch('src/lib/result-view.test.ts', [
    ("""describe('a resolved result', () => {
  const view = buildResultView(rosterModel(), RED_LEFT, 'standard', 'exhausted');""",
     """describe('a resolved result', () => {
  // Deep, because naming a sect is what Deep is for: Standard's report cap
  // stops at the tendency (SPEC.md §8.1).
  const view = buildResultView(rosterModel(), RED_LEFT, 'deep', 'exhausted');"""),
    ("""  it('carries the stop reason, mode and count through', () => {
    expect(view.stopReason).toBe('exhausted');
    expect(view.mode).toBe('standard');""",
     """  it('carries the stop reason, mode and count through', () => {
    expect(view.stopReason).toBe('exhausted');
    expect(view.mode).toBe('deep');"""),
    ("""      'standard',
      'exhausted',
    );
    expect(against.why?.ideology.id).toBe('red_left');""",
     """      'deep',
      'exhausted',
    );
    expect(against.why?.ideology.id).toBe('red_left');"""),
    ("""  it('names the node it stopped at and the candidates inside it', () => {
    const view = buildResultView(rosterModel(), RED_TIE, 'quick', 'user');""",
     """  it('names the node it stopped at and the candidates inside it', () => {
    const view = buildResultView(rosterModel(), RED_TIE, 'deep', 'user');"""),
    ("""  it('calls a tendency that is its own candidate "itself"', () => {
    const view = buildResultView(rosterModel(), RED_TIE, 'quick', 'user');""",
     """  it('calls a tendency that is its own candidate "itself"', () => {
    const view = buildResultView(rosterModel(), RED_TIE, 'deep', 'user');"""),
    ("""    const view = buildResultView(rosterModel({ minAnswersForSect: 8 }), RED_LEFT, 'quick', 'budget');""",
     """    const view = buildResultView(rosterModel({ minAnswersForSect: 8 }), RED_LEFT, 'deep', 'budget');"""),
    ("""  it('with no answers, reports the whole field rather than a family', () => {
    const view = buildResultView(rosterModel(), [], 'quick', 'user');
    expect(view.level).toBe('field');
    expect(view.node.name).toBe('Several families');
    // The root always holds all the mass; that must not read as confidence.
    expect(view.confidence).toBe(1);
    expect(view.confidenceText).toMatch(/do not favour one family/);""",
     """  it('with no answers, reports the whole field rather than a group', () => {
    const view = buildResultView(rosterModel(), [], 'quick', 'user');
    expect(view.level).toBe('field');
    expect(view.node.name).toBe('Several parts of the left');
    // The root always holds all the mass; that must not read as confidence.
    expect(view.confidence).toBe(1);
    expect(view.confidenceText).toMatch(/do not favour one part of the left/);"""),
    ("""    const view = buildResultView(m, RED_TIE, 'standard', 'exhausted');
    expect(view.inseparable).toEqual([""",
     """    const view = buildResultView(m, RED_TIE, 'deep', 'exhausted');
    expect(view.inseparable).toEqual(["""),
    ("""    const view = buildResultView(m, RED_LEFT, 'standard', 'exhausted');
    expect(view.boundary).toEqual([{ id: 'red_left', name: 'Red left' }]);""",
     """    const view = buildResultView(m, RED_LEFT, 'deep', 'exhausted');
    expect(view.boundary).toEqual([{ id: 'red_left', name: 'Red left' }]);"""),
    ("""      [a('q_family', 'pick_blue'), a('q_blue_split', 'blue_c')],
      'standard',
      'exhausted',
    );""",
     """      [a('q_family', 'pick_blue'), a('q_blue_split', 'blue_c')],
      'deep',
      'exhausted',
    );"""),
])

# --- tests/engine-resolve.test.ts ------------------------------------------
patch('tests/engine-resolve.test.ts', [
    ("""  it('stops at family level when no family separates either', () => {
    const result = resultOf([answer('q_family', 'pick_neither')]);
    expect(result.kind).toBe('undecided');
    expect(result.level).toBe('family');
    expect(result.node.kind).toBe('root');
    expect(result.candidates.map((c) => c.id).sort()).toEqual(['blue', 'red']);
  });""",
     """  it('stops at the top when nothing separates the groups', () => {
    // The root enumerates groups now, not families, so backing off all the way
    // reports the groups that are tied rather than the families inside them.
    const result = resultOf([answer('q_family', 'pick_neither')]);
    expect(result.kind).toBe('undecided');
    expect(result.level).toBe('group');
    expect(result.node.kind).toBe('root');
    expect(result.candidates.map((c) => c.id).sort()).toEqual(['cool', 'warm']);
  });"""),
])

# --- tests/perfect-respondent.test.ts --------------------------------------
patch('tests/perfect-respondent.test.ts', [
    ("""judges Quick at the family: any node in the right family passes""",
     """judges Quick at the group: any node in the right group passes"""),
])

# --- tests/schema.test.ts ---------------------------------------------------
# The tier-1 option cap moved from the schema to the lint, because a schema
# error drops the record and takes every stance that names it with it. The
# schema now enforces only the structural bound; the design caps are lint
# errors, tested in tests/lint.test.ts.
patch('tests/schema.test.ts', [
    ("""    expect(result.text).toMatch(/multi needs 3-6 options/);""",
     """    expect(result.text).toMatch(/multi needs 2-6 options/);"""),
])

io.open('.tmp-pilot/tests-patch.done', 'w').write('ok')
print('done')
