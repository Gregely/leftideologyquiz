<script lang="ts">
  import type { Mode } from '../engine/index.js';
  import { MODE_INFO, MODES } from '../lib/quiz.js';
  import { focusOnArrival } from './focus.js';

  let { onstart }: { onstart: (mode: Mode) => void } = $props();
</script>

<section class="start" aria-labelledby="start-heading">
  <h1 id="start-heading" tabindex="-1" use:focusOnArrival>Where on the left do you stand?</h1>
  <p class="lede">
    Most political tests stop at a family: "libertarian socialist", "social democrat". This one keeps going
    where your answers allow — to the tendency, sometimes to the sect — and tells you plainly when they don't.
  </p>
  <p class="lede">
    Questions adapt to what you have already said, so there is no fixed length. You can go back at any time,
    and you can go deeper after any result without losing your answers.
  </p>

  <h2 class="choose">Choose how far to go</h2>
  <ul class="modes">
    {#each MODES as mode (mode)}
      <li>
        <button type="button" class="mode" onclick={() => onstart(mode)}>
          <span class="mode-name">{MODE_INFO[mode].name}</span>
          <span class="mode-blurb">{MODE_INFO[mode].blurb}</span>
        </button>
      </li>
    {/each}
  </ul>
</section>

<style>
  .start {
    display: grid;
    gap: var(--space-4);
  }

  h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-2);
  }

  .lede {
    color: var(--ink-soft);
    max-width: 36rem;
  }

  .choose {
    font-size: var(--text-lg);
    margin-top: var(--space-5);
  }

  .modes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-3);
  }

  .mode {
    width: 100%;
    display: grid;
    gap: var(--space-1);
    text-align: left;
    padding: var(--space-4) var(--space-5);
    background: var(--paper-raised);
    border: 1.5px solid var(--rule-strong);
    border-radius: var(--radius);
    cursor: pointer;
    transition:
      border-color var(--duration) var(--ease),
      transform var(--duration) var(--ease);
  }

  .mode:hover {
    border-color: var(--accent);
  }

  .mode:active {
    transform: translateY(1px);
  }

  .mode-name {
    font-family: var(--font-serif);
    font-size: var(--text-lg);
    font-weight: 700;
  }

  .mode-blurb {
    color: var(--ink-soft);
    font-size: var(--text-sm);
  }
</style>
