import { test, expect } from '@playwright/test';

/**
 * The two queries live in separate modules, and one of them is also used on its
 * own, which is what pinned its rule to whichever position the compiler reached
 * first. The narrower query has to win at a width both of them match, whichever
 * order the array composed them in and whichever module was compiled first.
 */

test.describe('nested media queries across modules', () => {
  test('the narrower query wins where both match', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="query-pair"]');

    await expect(page.locator('[data-testid="query-pair"]')).toHaveCSS(
      'color',
      'rgb(0, 0, 255)',
    );
    await expect(page.locator('[data-testid="query-pair-reversed"]')).toHaveCSS(
      'color',
      'rgb(0, 0, 255)',
    );
  });

  test('the broader query applies alone below the narrower one', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="query-pair"]');

    await expect(page.locator('[data-testid="query-pair"]')).toHaveCSS(
      'color',
      'rgb(255, 0, 0)',
    );
    await expect(page.locator('[data-testid="query-pair-reversed"]')).toHaveCSS(
      'color',
      'rgb(255, 0, 0)',
    );
  });

  test('neither applies below both', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 600 });
    await page.goto('/');
    const pair = page.locator('[data-testid="query-pair"]');

    await expect(pair).not.toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(pair).not.toHaveCSS('color', 'rgb(0, 0, 255)');
  });
});
