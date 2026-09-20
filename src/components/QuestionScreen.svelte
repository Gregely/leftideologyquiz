<script lang="ts">
  import { untrack } from 'svelte';
  import type { QuestionView } from '../lib/quiz.js';
  import { focusOnArrival } from './focus.js';

  let {
    view,
    onanswer,
    onback,
  }: {
    view: QuestionView;
    onanswer: (optionIds: string[]) => void;
    onback: () => void;
  } = $props();

  // The screen remounts for every question, so the initial value is the
  // question's own: whatever was chosen before the respondent went back.
  let selected = $state<string[]>(untrack(() => [...view.preselected]));
  let tipOpen = $state(false);

  const headingId = $derived(`q-${view.questionId}`);
  const tipId = $derived(`tip-${view.questionId}`);

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (selected.length > 0) onanswer(selected);
  }

  function toggle(id: string, checked: boolean) {
    selected = checked ? [...selected, id] : selected.filter((s) => s !== id);
  }
</script>

<section class="question" aria-labelledby={headingId}>
  <p class="progress">
    <span class="kicker">{view.stageLabel}</span>
    <span class="count">Question {view.number}</span>
  </p>

  {#if view.reasonLine}
    <p class="reason">{view.reasonLine}</p>
  {/if}

  <div class="stem">
    <h1 id={headingId} tabindex="-1" use:focusOnArrival>{view.text}</h1>
    {#if view.tooltip}
      <button
        type="button"
        class="info"
        aria-expanded={tipOpen}
        aria-controls={tipId}
        onclick={() => (tipOpen = !tipOpen)}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20">
          <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5" />
          <circle cx="10" cy="6.2" r="1.1" fill="currentColor" />
          <path d="M10 9v5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <span class="visually-hidden">What does this mean?</span>
      </button>
    {/if}
  </div>

  {#if view.tooltip}
    <div id={tipId} class="tip" hidden={!tipOpen}>
      <p>{view.tooltip}</p>
      <button type="button" class="btn btn-quiet tip-skip" onclick={() => onanswer(['unknown_term'])}>
        Still unclear? Skip this one as a term I don't know
      </button>
    </div>
  {/if}

  <form onsubmit={submit}>
    <fieldset aria-labelledby={headingId}>
      {#if view.input === 'multi'}
        <p class="hint">Choose all that apply.</p>
      {/if}
      <div class="options" class:ordered={view.ordered}>
        {#each view.options as option (option.id)}
          <label class="option" class:chosen={selected.includes(option.id)}>
            {#if view.input === 'multi'}
              <input
                type="checkbox"
                name={view.questionId}
                value={option.id}
                checked={selected.includes(option.id)}
                onchange={(e) => toggle(option.id, e.currentTarget.checked)}
              />
            {:else}
              <input
                type="radio"
                name={view.questionId}
                value={option.id}
                checked={selected.includes(option.id)}
                onchange={() => (selected = [option.id])}
              />
            {/if}
            <span>{option.label}</span>
          </label>
        {/each}
      </div>
    </fieldset>

    <div class="actions">
      <button type="submit" class="btn btn-primary" disabled={selected.length === 0}>Next</button>
      <button type="button" class="btn" onclick={() => onanswer(['unsure'])}>I'm not sure</button>
      {#if view.tooltip}
        <button
          type="button"
          class="btn btn-quiet"
          aria-expanded={tipOpen}
          aria-controls={tipId}
          onclick={() => (tipOpen = !tipOpen)}
        >
          What does this mean?
        </button>
      {/if}
    </div>
  </form>

  <nav class="back" aria-label="Question navigation">
    <button type="button" class="btn btn-quiet" onclick={onback}>
      <span aria-hidden="true">←</span> Back
    </button>
  </nav>
</section>

<style>
  .question {
    display: grid;
    gap: var(--space-4);
  }

  .progress {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    border-bottom: 1px solid var(--rule);
    padding-bottom: var(--space-2);
  }

  .count {
    font-size: var(--text-sm);
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }

  .reason {
    font-family: var(--font-serif);
    font-style: italic;
    color: var(--ink-soft);
    border-left: 3px solid var(--accent);
    padding-left: var(--space-3);
  }

  .stem {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
  }

  h1 {
    flex: 1;
    font-size: var(--text-xl);
    font-weight: 500;
    line-height: 1.3;
  }

  .info {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-top: -6px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-soft);
    cursor: pointer;
  }

  .info:hover,
  .info[aria-expanded='true'] {
    color: var(--accent);
  }

  .tip {
    background: var(--notice);
    border-left: 3px solid var(--notice-rule);
    padding: var(--space-3) var(--space-4);
    border-radius: 0 var(--radius) var(--radius) 0;
    font-size: var(--text-sm);
    display: grid;
    gap: var(--space-2);
  }

  .tip[hidden] {
    display: none;
  }

  .tip-skip {
    justify-self: start;
    justify-content: flex-start;
    text-align: left;
    padding-inline: 0;
    min-height: 32px;
  }

  fieldset {
    border: none;
    margin: 0;
    padding: 0;
    min-width: 0;
  }

  .hint {
    font-size: var(--text-sm);
    color: var(--ink-soft);
    margin-bottom: var(--space-2);
  }

  .options {
    display: grid;
    gap: var(--space-2);
  }

  .option {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--paper-raised);
    border: 1.5px solid var(--rule);
    border-radius: var(--radius);
    cursor: pointer;
    transition: border-color var(--duration) var(--ease);
  }

  .option:hover {
    border-color: var(--rule-strong);
  }

  .option.chosen {
    border-color: var(--accent);
    background: var(--accent-wash);
  }

  .option:has(input:focus-visible) {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }

  .option input {
    margin: 0.3em 0 0;
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--accent);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
    margin-top: var(--space-4);
  }

  .back {
    border-top: 1px solid var(--rule);
    padding-top: var(--space-2);
  }

  .back .btn {
    padding-inline: 0;
  }
</style>
