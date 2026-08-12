import { test, expect } from '@playwright/test';

/**
 * The two style objects live in separate modules, so the order their rules reach
 * the stylesheet is the compile order in development and the scan order in
 * production. Every assertion here has to hold in both, which is only true while
 * specificity and the conditional hoist decide these pairs instead of source order.
 */

test.describe('cascade order across modules', () => {
  test('a condition overrides the base declaration it shares a property with', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="cascade-box"]');

    await expect(page.locator('[data-testid="cascade-box"]')).toHaveCSS(
      'padding-top',
      '40px',
    );
    await expect(
      page.locator('[data-testid="cascade-box-reversed"]'),
    ).toHaveCSS('padding-top', '40px');
  });

  test('the base declaration applies when the condition does not match', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 500, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="cascade-box"]');

    await expect(page.locator('[data-testid="cascade-box"]')).toHaveCSS(
      'padding-top',
      '4px',
    );
    await expect(
      page.locator('[data-testid="cascade-box-reversed"]'),
    ).toHaveCSS('padding-top', '4px');
  });

  /**
   * A longhand keeps its edge even when the shorthand that would reset it sits
   * inside a matching condition. The condition raises the shorthand by one, and
   * the longhand is already deeper than that, so the condition cannot reach it.
   */
  test('a base longhand survives a matching conditional shorthand', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/');
    await page.waitForSelector('[data-testid="cascade-edge"]');

    const edge = page.locator('[data-testid="cascade-edge"]');
    await expect(edge).toHaveCSS('padding-top', '4px');
    await expect(edge).toHaveCSS('padding-bottom', '40px');
  });

  test('a nested selector inside a condition overrides a bare nested selector', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/');
    const text = page.locator('[data-testid="cascade-text"]');

    await text.hover();
    await expect(text).toHaveCSS('color', 'rgb(0, 0, 255)');
  });

  test('the bare nested selector applies when the condition does not match', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 500, height: 600 });
    await page.goto('/');
    const text = page.locator('[data-testid="cascade-text"]');

    await text.hover();
    await expect(text).toHaveCSS('color', 'rgb(255, 0, 0)');
  });
});
