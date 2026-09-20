import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

/**
 * `--mode fixture` serves the six-ideology test roster instead of /content.
 * The end-to-end test runs against it so it does not break every time the
 * real bank changes (CLAUDE.md § Testing), and so it can run while the bank is
 * still being written.
 */
export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  resolve: {
    alias: {
      '$content-source': fileURLToPath(
        new URL(
          mode === 'fixture' ? './tests/fixtures/content-source.ts' : './src/app/content-source.ts',
          import.meta.url,
        ),
      ),
    },
  },
  server: {
    // Content is read from /content, outside src; let the dev server see it.
    fs: { allow: ['.'] },
  },
}));
