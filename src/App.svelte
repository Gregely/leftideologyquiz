<script lang="ts">
  import type { EngineModel } from './engine/index.js';
  import { createQuizStore } from './lib/quiz-store.svelte.js';
  import { buildResultView } from './lib/result-view.js';
  import StartScreen from './components/StartScreen.svelte';
  import QuestionScreen from './components/QuestionScreen.svelte';
  import Interstitial from './components/Interstitial.svelte';
  import ResultScreen from './components/ResultScreen.svelte';

  let { model, newSeed }: { model: EngineModel; newSeed: () => number } = $props();

  // svelte-ignore state_referenced_locally
  const quiz = createQuizStore(model, newSeed);
  const view = $derived(quiz.view);

  const result = $derived(
    view.screen === 'result' ? buildResultView(model, view.answers, view.mode, view.stopReason) : null,
  );

  /** Changes whenever a different screen is up, so each one mounts fresh. */
  const screenKey = $derived(
    view.screen === 'question'
      ? `q:${view.questionId}:${view.number}`
      : view.screen === 'interstitial'
        ? `i:${view.reason}:${view.answeredCount}:${view.mode}`
        : view.screen === 'result'
          ? `r:${view.mode}:${view.answers.length}`
          : 'start',
  );

  const announcement = $derived(
    view.screen === 'question'
      ? `Question ${view.number}. ${view.stageLabel}.`
      : view.screen === 'interstitial'
        ? 'Checkpoint.'
        : view.screen === 'result'
          ? 'Your result.'
          : '',
  );
</script>

<div class="shell">
  <header class="masthead">
    <p class="title">Leftist Ideology Test</p>
    {#if view.screen !== 'start'}
      <button type="button" class="btn btn-quiet restart" onclick={() => quiz.restart()}>
        Start over
      </button>
    {/if}
  </header>

  <div class="visually-hidden" aria-live="polite" aria-atomic="true">{announcement}</div>

  <main>
    {#key screenKey}
      {#if view.screen === 'start'}
        <StartScreen onstart={(mode) => quiz.start(mode)} />
      {:else if view.screen === 'question'}
        <QuestionScreen
          {view}
          onanswer={(optionIds) => quiz.answer(view.questionId, optionIds)}
          onback={() => quiz.back()}
        />
      {:else if view.screen === 'interstitial'}
        <Interstitial
          {view}
          ondeeper={() =>
            view.reason === 'stage' && view.nextDepth ? quiz.enterStage(view.nextDepth) : quiz.escalate()}
          onfinish={() => quiz.finish()}
          onback={() => quiz.back()}
        />
      {:else if view.screen === 'result' && result}
        <ResultScreen
          {result}
          canGoDeeperTo={view.canGoDeeperTo}
          ondeeper={() => quiz.escalate()}
          onrestart={() => quiz.restart()}
          onback={() => quiz.back()}
        />
      {/if}
    {/key}
  </main>

  <footer class="colophon">
    <p>Runs entirely in your browser. Nothing you answer is stored or sent anywhere, and a refresh starts over.</p>
  </footer>
</div>

<style>
  .shell {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    max-width: calc(var(--measure) + 2 * var(--gutter));
    margin: 0 auto;
    padding: 0 var(--gutter);
  }

  .masthead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-4) 0 var(--space-3);
    border-bottom: 2px solid var(--ink);
  }

  .title {
    font-family: var(--font-serif);
    font-weight: 700;
    font-size: var(--text-md);
    letter-spacing: 0.01em;
  }

  .restart {
    min-height: 36px;
    font-size: var(--text-sm);
  }

  main {
    flex: 1;
    padding: var(--space-6) 0 var(--space-7);
  }

  .colophon {
    border-top: 1px solid var(--rule);
    padding: var(--space-4) 0 var(--space-5);
    color: var(--ink-faint);
    font-size: var(--text-xs);
  }
</style>
