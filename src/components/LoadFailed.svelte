<script lang="ts">
  // Shown only when the bundled content fails to parse; see main.ts.
</script>

<main class="failed">
  <h1>The question bank did not load</h1>
  <p>This is a fault in this build of the test, not anything you did. Reloading will not fix it.</p>
</main>

<style>
  .failed {
    max-width: 40rem;
    margin: 0 auto;
    padding: var(--space-7) var(--gutter);
    display: grid;
    gap: var(--space-3);
  }
</style>
