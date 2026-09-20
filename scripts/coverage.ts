/**
 * `npm run coverage` — the ideology x question matrix and the separation report
 * (SPEC.md §10.4, §10.5).
 *
 * Reports; never fails the build. A gap here is content to author, and the
 * decision about whether to author it or record it in docs/inseparable.md is a
 * human one.
 *
 * Flags:
 *   --json               machine-readable output
 *   --family <id>        restrict to one family
 *   --all                do not cap long lists
 *   --no-matrix          separation report only
 */

import {
  buildMatrix,
  fitnessReport,
  separationReport,
  SEPARATION_THRESHOLD,
} from '../src/content/coverage.js';
import {
  asJson,
  bold,
  dim,
  flagValue,
  flags,
  green,
  loadContent,
  pct,
  plural,
  red,
  showAll,
  table,
  yellow,
} from './report.js';

const familyFilter = flagValue('family');
const noMatrix = flags.has('--no-matrix');
const CAP = showAll ? Number.POSITIVE_INFINITY : 25;

const loaded = loadContent();
const content = loaded.content;
if (!content) {
  console.error(red('content failed to load; run `npm run validate` first'));
  process.exit(1);
}

if (familyFilter && !content.familyById.has(familyFilter)) {
  console.error(red(`no family "${familyFilter}"`));
  console.error(dim(`known: ${[...content.familyById.keys()].join(', ')}`));
  process.exit(1);
}

const matrix = buildMatrix(loaded);
const separation = separationReport(loaded);

const rows = familyFilter ? matrix.rows.filter((r) => r.familyId === familyFilter) : matrix.rows;
const pairs = familyFilter
  ? separation.pairs.filter((p) => p.familyId === familyFilter)
  : separation.pairs;
const unseparated = pairs.filter((p) => p.separatingQuestions.length === 0);
const fragile = pairs.filter((p) => p.separatingQuestions.length === 1);

if (asJson) {
  console.log(
    JSON.stringify(
      {
        matrix: { ...matrix, rows },
        separation: {
          threshold: SEPARATION_THRESHOLD,
          pairs: pairs.length,
          wellSeparated: pairs.length - unseparated.length - fragile.length,
          unseparated,
          fragile,
        },
        fitness: fitnessReport(loaded),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!noMatrix) printMatrix();
printSeparation();
printFitness();

// -----------------------------------------------------------------------------

function printMatrix(): void {
  console.log(bold('\nstance matrix'));
  console.log(
    dim(
      'columns are questions in bank order; a digit is the effective stance weight. ' +
        'lowercase marks inheritance: · none, S self, T tendency, F family',
    ),
  );

  // One column per question, labelled by index; the legend carries the ids so
  // the grid stays narrow enough to read.
  console.log(`\n${dim('legend')}`);
  for (const [i, questionId] of matrix.questionIds.entries()) {
    const used = matrix.rows.some((r) => r.cells[i]?.weight !== null);
    const marker = used ? ' ' : yellow('!');
    console.log(`  ${dim(String(i + 1).padStart(2))}${marker} ${questionId}`);
  }
  if (matrix.unusedQuestions.length > 0) {
    console.log(dim(`  ! = no ideology holds a stance on it (${matrix.unusedQuestions.length})`));
  }

  const header = ['ideology', 'tier', ...matrix.questionIds.map((_, i) => String(i + 1)), 'n', 'd3'];
  const body = rows.map((row) => [
    row.ideologyId,
    row.tier === 'boundary' ? 'bnd' : row.tier.slice(0, 4),
    ...row.cells.map((cell) => {
      if (cell.weight === null) return dim('·');
      const source = cell.source === 'self' ? 'S' : cell.source === 'tendency' ? 'T' : 'F';
      return `${cell.weight}${dim(source)}`;
    }),
    String(row.stanceCount),
    String(row.depth3Count),
  ]);

  console.log('');
  for (const line of table(header, body, ['l', 'l'])) console.log(line);

  const filled = familyFilter
    ? rows.reduce((n, r) => n + r.stanceCount, 0)
    : matrix.filledCells;
  const total = rows.length * matrix.questionIds.length;
  console.log(
    `\n${dim(`${filled} of ${total} cells filled (${total === 0 ? '—' : pct(filled / total)})`)}`,
  );
}

function printSeparation(): void {
  console.log(bold('\n\nseparation report'));
  console.log(
    dim(
      `same-family pairs only. A question separates a pair when their stances on it differ ` +
        `by at least ${SEPARATION_THRESHOLD} (accept counts +weight, reject -weight).`,
    ),
  );

  const wellSeparated = pairs.length - unseparated.length - fragile.length;
  console.log('');
  for (const line of table(
    ['', 'pairs', 'share'],
    [
      [green('separated (2+ questions)'), String(wellSeparated), share(wellSeparated)],
      [yellow('fragile (exactly 1)'), String(fragile.length), share(fragile.length)],
      [red('unseparated (none)'), String(unseparated.length), share(unseparated.length)],
      [dim('total'), String(pairs.length), ''],
    ],
    ['l', 'r', 'r'],
  )) {
    console.log(line);
  }

  if (fragile.length > 0) {
    console.log(`\n${bold('fragile pairs')} ${dim('— one wrong answer collapses the distinction')}`);
    for (const pair of fragile.slice(0, CAP)) {
      const only = pair.separatingQuestions[0];
      console.log(
        `  ${yellow(`${pair.a} / ${pair.b}`)} ${dim(`(${pair.familyId})`)}` +
          `  ${dim(`only ${only?.questionId} (gap ${only?.gap})`)}`,
      );
    }
    if (fragile.length > CAP) console.log(dim(`  … and ${fragile.length - CAP} more (--all)`));
  }

  if (unseparated.length > 0) {
    console.log(`\n${bold('unseparated pairs')} ${dim('— the test will always return these together')}`);
    const identical = unseparated.filter((p) => p.sharesAllStances);
    for (const pair of unseparated.slice(0, CAP)) {
      const note = pair.sharesAllStances ? dim(' — identical stances') : '';
      console.log(`  ${red(`${pair.a} / ${pair.b}`)} ${dim(`(${pair.familyId})`)}${note}`);
    }
    if (unseparated.length > CAP) {
      console.log(dim(`  … and ${unseparated.length - CAP} more (--all)`));
    }
    console.log(
      dim(
        `\n  ${plural(identical.length, 'pair')} resolve to identical stances. ` +
          'Fix by writing a question that states a real disagreement, or by correcting a stance ' +
          'that misrepresents one of them. If neither applies, record the pair in ' +
          'docs/inseparable.md — never by nudging a weight (CLAUDE.md rule 4).',
      ),
    );
  }

  if (pairs.length > 0 && unseparated.length === 0 && fragile.length === 0) {
    console.log(green('\nevery same-family pair has two or more separating questions'));
  }

  console.log('');
}

function share(n: number): string {
  return pairs.length === 0 ? '—' : pct(n / pairs.length);
}

function printFitness(): void {
  const report = fitnessReport(loaded);
  const shown = familyFilter
    ? report.families.filter((f) => f.familyId === familyFilter)
    : report.families;

  console.log(bold('\nfamily default fitness'));
  console.log(
    dim(
      'the 75% rule (SPEC.md §5.2a): a family default is written only when about three ' +
        'quarters of the family would give that answer with conviction. A default is inherited ' +
        'by everyone who does not override it, so one the family disagrees with is attributed to ' +
        'members that never said it.',
    ),
  );

  if (shown.length === 0) {
    console.log(
      dim(
        `\n  no family declares a stance default yet, so there is nothing to fit. ` +
          `${report.familiesWithoutDefaults.length} families without defaults.`,
      ),
    );
    console.log('');
    return;
  }

  for (const family of shown) {
    console.log(
      `\n${bold(family.familyId)} ${dim(`— ${family.defaultCount} defaults across ${plural(family.memberCount, 'member')}`)}`,
    );

    const rows = family.defaults.map((d) => [
      d.questionId,
      `${d.overriddenBy.length}/${family.memberCount}`,
      pct(d.overrideShare),
      d.warn ? red('over 30%') : green('ok'),
      // Weight-only is shown but never counted: it is agreement, emphasised.
      d.weightOnlyBy.length > 0 ? dim(String(d.weightOnlyBy.length)) : dim('·'),
      d.overriddenBy.length > 0 ? dim(d.overriddenBy.slice(0, 4).join(', ')) : '',
    ]);
    for (const line of table(
      ['default on', 'overridden', 'share', '', 'weight-only', 'overridden by'],
      rows,
      ['l', 'r', 'r', 'l', 'r', 'l'],
    )) {
      console.log(`  ${line}`);
    }

    const flagged = family.members.filter((m) => m.candidateMisfiling);
    if (flagged.length > 0) {
      console.log(`\n  ${bold('candidate misfilings')} ${dim('— defined mostly by exceptions')}`);
      for (const member of flagged) {
        console.log(
          `    ${yellow(member.ideologyId)} ${dim(
            `takes a different position on ${member.overrides}/${member.ofDefaults} of its family's defaults (${pct(member.overrideShare)})` +
              (member.weightOnly > 0 ? `; ${member.weightOnly} more at a different weight only, not counted` : ''),
          )}`,
        );
      }
    }
  }

  console.log('');
  if (report.flaggedDefaults === 0 && report.flaggedMembers === 0) {
    console.log(green('every family default fits its family, and no member is mostly exceptions'));
  } else {
    console.log(
      `${report.flaggedDefaults > 0 ? red(`${plural(report.flaggedDefaults, 'default')} over the 30% override threshold`) : ''}` +
        `${report.flaggedDefaults > 0 && report.flaggedMembers > 0 ? dim(' · ') : ''}` +
        `${report.flaggedMembers > 0 ? yellow(`${plural(report.flaggedMembers, 'member')} over 40% — candidate misfiling`) : ''}`,
    );
    console.log(
      dim(
        '  a flagged default should usually be deleted and authored per member (the 75% rule), ' +
          'not reworded until the numbers move.',
      ),
    );
  }

  if (report.familiesWithoutDefaults.length > 0 && !familyFilter) {
    console.log(
      dim(
        `\n  ${plural(report.familiesWithoutDefaults.length, 'family')} declare no defaults: ` +
          `${report.familiesWithoutDefaults.join(', ')}`,
      ),
    );
  }
  console.log('');
}
