import { defineConfig } from '@playwright/test';

const PORT = 4179;

/**
 * End-to-end tests run against the fixture roster (`vite --mode fixture`), not
 * the real bank, so they neither break as the bank grows nor wait for it.
 *
 * Uses the installed Chrome rather than a downloaded browser. Where Chrome is
 * not installed, run `npx playwright install chromium` and set PW_CHANNEL to
 * an empty string.
 */
const channel = process.env['PW_CHANNEL'] ?? 'chrome';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: process.env['CI'] ? 'line' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...(channel ? { channel } : {}),
  },
  webServer: {
    command: `npx vite --mode fixture --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
