import { test, expect } from '@playwright/test';

/**
 * The query has to be evaluated against the container, not the viewport. Both
 * boxes carry the same style, and the viewport is wider than either container,
 * so a query resolved against the viewport would match for both.
 */

test('a container query resolves against its container', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto('/');
  await page.waitForSelector('[data-testid="container-wide-box"]');

  await expect(page.locator('[data-testid="container-wide-box"]')).toHaveCSS(
    'padding-top',
    '40px',
  );
  await expect(page.locator('[data-testid="container-narrow-box"]')).toHaveCSS(
    'padding-top',
    '4px',
  );
});
