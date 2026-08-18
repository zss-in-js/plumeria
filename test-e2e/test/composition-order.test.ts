import { test, expect } from '@playwright/test';

/**
 * `classStyle={[a, b]}` gives `b` the last word whatever order the rules reach
 * the stylesheet in. These pairs are each composed in both directions, so they
 * only pass while the array decides the winner rather than the declaration
 * order — the property `@plumeria/codemod` has to carry into a CSS Module.
 */

test.describe('composition order', () => {
  test('the array decides, in both directions', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="cycle-surface-first"]');

    await expect(page.locator('[data-testid="cycle-surface-first"]')).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
    await expect(page.locator('[data-testid="cycle-raised-first"]')).toHaveCSS(
      'color',
      'rgb(0, 0, 0)',
    );
  });

  test('three deep, every pair inverted at once', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="triple-ascending"]');

    await expect(page.locator('[data-testid="triple-ascending"]')).toHaveCSS(
      'color',
      'rgb(0, 128, 0)',
    );
    await expect(page.locator('[data-testid="triple-descending"]')).toHaveCSS(
      'color',
      'rgb(255, 0, 0)',
    );
  });

  test('a pair that shares no property keeps both declarations', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="disjoint-alpha-first"]');

    for (const id of ['disjoint-alpha-first', 'disjoint-beta-first']) {
      await expect(page.locator(`[data-testid="${id}"]`)).toHaveCSS(
        'color',
        'rgb(255, 0, 0)',
      );
      await expect(page.locator(`[data-testid="${id}"]`)).toHaveCSS(
        'font-weight',
        '700',
      );
    }
  });

  test('an at-rule outranks a base declaration either way round', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="buckets-wide-first"]');

    for (const id of ['buckets-wide-first', 'buckets-narrow-first']) {
      await expect(page.locator(`[data-testid="${id}"]`)).toHaveCSS(
        'width',
        '200px',
      );
    }
  });
});
