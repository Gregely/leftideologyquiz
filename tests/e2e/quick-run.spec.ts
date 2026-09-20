/**
 * A full Quick run on the fixture roster, through the real UI: start, answer
 * until the mode ends, take the result, and check it renders with a modifier
 * chip. Options are shuffled per session, so choices are made by label.
 */

import { expect, test } from '@playwright/test';

/** Labels of fixture options that earn a modifier tag (q_tech and q_eco). */
const MODIFIER_LABELS = ['Run it.', 'Strongly agree'];

test('a Quick run on fixture content reaches a result with a modifier chip', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Quick/ }).click();

  const result = page.locator('#result-heading');
  const checkpoint = page.locator('#checkpoint-heading');
  const next = page.getByRole('button', { name: 'Next', exact: true });

  for (let step = 0; step < 30; step++) {
    await expect(result.or(checkpoint).or(next)).toBeVisible();
    if (await result.isVisible()) break;

    if (await checkpoint.isVisible()) {
      await page.getByRole('button', { name: 'See my result' }).click();
      continue;
    }

    // A question: pick a modifier-earning option when there is one.
    const radios = page.getByRole('radio');
    let chosen = false;
    for (const label of MODIFIER_LABELS) {
      const option = page.getByRole('radio', { name: label, exact: true });
      if ((await option.count()) > 0) {
        await option.check();
        chosen = true;
        break;
      }
    }
    if (!chosen) await radios.first().check();
    await next.click();
  }

  await expect(result).toBeVisible();
  await expect(result).not.toBeEmpty();
  await expect(page.getByTestId('modifier-chip').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Closest matches' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Go deeper: Standard/ })).toBeVisible();
});
