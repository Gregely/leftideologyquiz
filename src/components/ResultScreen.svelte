<script lang="ts">
  import type { Mode } from '../engine/index.js';
  import { MODE_INFO } from '../lib/quiz.js';
  import type { ResultView } from '../lib/result-view.js';
  import { focusOnArrival } from './focus.js';

  let {
    result,
    canGoDeeperTo,
    ondeeper,
    onrestart,
    onback,
  }: {
    result: ResultView;
    canGoDeeperTo: Mode | null;
    ondeeper: () => void;
    onrestart: () => void;
    onback: () => void;
  } = $props();

  const kicker = $derived(
    result.kind === 'resolved'
      ? 'Your closest match'
      : result.level === 'field'
        ? 'Not settled yet'
        : 'Your answers place you in',
  );

  const maxMass = $derived(Math.max(...result.matches.map((m) => m.mass), 1e-9));
</script>

<article class="result" aria-labelledby="result-heading">
  <header class="head">
    <p class="kicker">{kicker}</p>
    <h1 id="result-heading" tabindex="-1" use:focusOnArrival>{result.node.name}</h1>
    <p class="confidence">{result.confidenceText}</p>
    {#if result.summary}
      <p class="summary">{result.summary}</p>
    {/if}

    {#if result.modifiers.length > 0}
      <ul class="chips" aria-label="Emphases in your answers">
        {#each result.modifiers as modifier (modifier.tag)}
          <li class="chip" data-testid="modifier-chip">{modifier.label}</li>
        {/each}
      </ul>
    {/if}
  </header>

  {#if result.backOffText || result.candidates.length > 0}
    <section class="block" aria-labelledby="within-heading">
      <h2 id="within-heading">{result.level === 'field' ? 'Closest families' : 'Within that'}</h2>
      {#if result.backOffText}
        <p>{result.backOffText}</p>
      {/if}
      {#if result.candidates.length > 0}
        <ul class="candidates">
          {#each result.candidates as candidate (candidate.id)}
            <li>
              <span>{candidate.name}</span>
              <span class="pct">{candidate.percent}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}

  {#each result.inseparable as pair (pair.ideologies[0].id + pair.ideologies[1].id)}
    <aside class="notice" aria-label="Two names for one position">
      <p class="notice-title">{pair.ideologies[0].name} and {pair.ideologies[1].name}</p>
      <p>
        The test returns these two together on purpose. {pair.note}
      </p>
    </aside>
  {/each}

  {#each result.boundary as item (item.id)}
    <aside class="notice" aria-label="Boundary case">
      <p class="notice-title">Boundary case: {item.name}</p>
      <p>
        {item.name} sits at the edge of the left, and not everyone would count it as part of it. It is included so
        the test can say honestly when answers land there, not as a verdict either way.
      </p>
    </aside>
  {/each}

  {#each result.lineage as item (item.id)}
    <aside class="notice" aria-label="Defined by lineage">
      <p class="notice-title">A note on {item.name}</p>
      <p>
        {item.name} is defined by where it comes from — its movement and its teachers — as much as by what it
        holds. Your answers can show that you share its positions; positions alone cannot fully settle whether you
        belong to it.
      </p>
    </aside>
  {/each}

  {#if result.why}
    <section class="block" aria-labelledby="why-heading">
      <h2 id="why-heading">Why you matched {result.why.ideology.name}</h2>
      {#if result.why.for.length > 0}
        <h3>Answers that pushed you towards it</h3>
        <ol class="evidence">
          {#each result.why.for as row (row.questionId)}
            <li>
              <p class="evidence-q">{row.question}</p>
              <p class="evidence-a"><span class="visually-hidden">You answered: </span>{row.answer}</p>
            </li>
          {/each}
        </ol>
      {/if}
      {#if result.why.against}
        <h3>The answer that pushed hardest against it</h3>
        <div class="evidence against">
          <p class="evidence-q">{result.why.against.question}</p>
          <p class="evidence-a"><span class="visually-hidden">You answered: </span>{result.why.against.answer}</p>
        </div>
      {/if}
    </section>
  {/if}

  <section class="block" aria-labelledby="matches-heading">
    <h2 id="matches-heading">Closest matches</h2>
    <ol class="matches">
      {#each result.matches as match (match.id)}
        <li>
          <span class="match-name">{match.name}</span>
          <span class="pct">{match.percent}</span>
          <span class="bar" aria-hidden="true"><span style:width="{(match.mass / maxMass) * 100}%"></span></span>
        </li>
      {/each}
    </ol>
    <p class="fineprint">
      Rough shares of the evidence across every tradition the test knows. Read them as a ranking more than a
      measurement.
    </p>
  </section>

  <p class="fineprint">
    {MODE_INFO[result.mode].name} mode · {result.answeredCount}
    {result.answeredCount === 1 ? 'answer' : 'answers'}{result.stopReason === 'user' ? ' · you stopped early' : ''}
  </p>

  <div class="actions">
    {#if canGoDeeperTo}
      <button type="button" class="btn btn-primary" onclick={ondeeper}>
        Go deeper: {MODE_INFO[canGoDeeperTo].name}
      </button>
    {/if}
    <!--
      TODO(share): sharing attaches here. serialiseSession(session) from
      src/engine/session.ts gives the URL-fragment encoding; a share button
      goes beside "Go deeper", and main.ts would read the fragment back with
      deserialiseSession on load. Not built: out of scope for this pass.
    -->
    <button type="button" class="btn" onclick={onrestart}>Start over</button>
  </div>

  <nav class="back" aria-label="Question navigation">
    <button type="button" class="btn btn-quiet" onclick={onback}>
      <span aria-hidden="true">←</span> Back
    </button>
  </nav>
</article>

<style>
  .result {
    display: grid;
    gap: var(--space-6);
  }

  .head {
    display: grid;
    gap: var(--space-3);
  }

  h1 {
    font-size: var(--text-2xl);
    color: var(--accent);
  }

  h2 {
    font-size: var(--text-lg);
    border-bottom: 1px solid var(--rule);
    padding-bottom: var(--space-2);
  }

  h3 {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
    margin-top: var(--space-2);
  }

  .confidence {
    font-family: var(--font-serif);
    font-size: var(--text-lg);
  }

  .summary {
    color: var(--ink-soft);
  }

  .chips {
    list-style: none;
    margin: var(--space-2) 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .chip {
    font-size: var(--text-xs);
    font-weight: 600;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-pill);
    border: 1px solid var(--ink);
    background: var(--paper-raised);
  }

  .block {
    display: grid;
    gap: var(--space-3);
  }

  .candidates,
  .matches {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }

  .candidates li {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    border-bottom: 1px dotted var(--rule-strong);
    padding-bottom: var(--space-1);
  }

  .matches li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-1) var(--space-3);
    align-items: baseline;
  }

  .match-name {
    font-weight: 600;
  }

  .pct {
    font-variant-numeric: tabular-nums;
    color: var(--ink-soft);
  }

  .bar {
    grid-column: 1 / -1;
    height: 6px;
    background: var(--rule);
    border-radius: var(--radius-pill);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--ink);
    border-radius: var(--radius-pill);
  }

  .matches li:first-child .bar span {
    background: var(--accent);
  }

  .evidence {
    margin: 0;
    padding-left: 1.25rem;
    display: grid;
    gap: var(--space-3);
  }

  .evidence.against {
    padding-left: var(--space-3);
    border-left: 3px solid var(--rule-strong);
  }

  .evidence-q {
    color: var(--ink-soft);
    font-size: var(--text-sm);
  }

  .evidence-a {
    font-family: var(--font-serif);
    font-size: var(--text-md);
  }

  .notice {
    background: var(--notice);
    border-left: 3px solid var(--notice-rule);
    border-radius: 0 var(--radius) var(--radius) 0;
    padding: var(--space-3) var(--space-4);
    display: grid;
    gap: var(--space-1);
    font-size: var(--text-sm);
  }

  .notice-title {
    font-weight: 700;
  }

  .fineprint {
    font-size: var(--text-xs);
    color: var(--ink-faint);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .back {
    border-top: 1px solid var(--rule);
    padding-top: var(--space-2);
  }

  .back .btn {
    padding-inline: 0;
  }
</style>
