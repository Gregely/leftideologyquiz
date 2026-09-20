<script lang="ts">
  import { MODE_INFO, STAGE_LABELS, type InterstitialView } from '../lib/quiz.js';
  import { focusOnArrival } from './focus.js';

  let {
    view,
    ondeeper,
    onfinish,
    onback,
  }: {
    view: InterstitialView;
    ondeeper: () => void;
    onfinish: () => void;
    onback: () => void;
  } = $props();

  const done = $derived(
    view.reason === 'mode_end'
      ? `That is everything ${MODE_INFO[view.mode].name} mode asks.`
      : `That is the ${STAGE_LABELS[view.completedDepth].toLowerCase()} done.`,
  );

  const next = $derived(
    view.reason === 'mode_end' && view.nextMode
      ? `${MODE_INFO[view.nextMode].name} mode keeps all ${view.answeredCount} of your answers and carries on from here. ${MODE_INFO[view.nextMode].blurb}`
      : view.nextDepth === 2
        ? 'The next questions work within a family, to find which of its branches fits you.'
        : 'The next questions separate close neighbours — traditions that agree on almost everything.',
  );

  // How settled the family is, in words rather than a number.
  const hedge = $derived(
    !view.family
      ? ''
      : view.family.share >= 0.7
        ? ''
        : view.family.share >= 0.4
          ? ' — though that is not settled yet'
          : ' — though only just, and other families are close',
  );
</script>

<section class="checkpoint" aria-labelledby="checkpoint-heading">
  <p class="kicker">Checkpoint</p>
  <h1 id="checkpoint-heading" tabindex="-1" use:focusOnArrival>
    {#if view.family}
      You look like <em>{view.family.name}</em>{hedge}.
    {:else}
      Your answers so far do not lean towards any one family.
    {/if}
  </h1>
  <p class="done">{done}</p>
  <h2>Go deeper?</h2>
  <p class="next">{next}</p>

  <div class="actions">
    <button type="button" class="btn btn-primary" onclick={ondeeper}>
      {view.reason === 'mode_end' && view.nextMode ? `Go deeper: ${MODE_INFO[view.nextMode].name}` : 'Go deeper'}
    </button>
    <button type="button" class="btn" onclick={onfinish}>See my result</button>
  </div>

  <nav class="back" aria-label="Question navigation">
    <button type="button" class="btn btn-quiet" onclick={onback}>
      <span aria-hidden="true">←</span> Back
    </button>
  </nav>
</section>

<style>
  .checkpoint {
    display: grid;
    gap: var(--space-4);
  }

  h1 {
    font-size: var(--text-2xl);
  }

  h1 em {
    font-style: normal;
    color: var(--accent);
  }

  h2 {
    font-size: var(--text-lg);
    margin-top: var(--space-3);
  }

  .done,
  .next {
    color: var(--ink-soft);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-2);
  }

  .back {
    border-top: 1px solid var(--rule);
    padding-top: var(--space-2);
    margin-top: var(--space-4);
  }

  .back .btn {
    padding-inline: 0;
  }
</style>
