import { test, expect } from '@playwright/test';

test('Class conflict resolution works correctly', async ({ page }) => {
  await page.goto('http://localhost:4000');
  await page.waitForSelector('[data-testid="e2e-test-span"]');
  const span = page.locator('[data-testid="e2e-test-span"]');
  await span.evaluate((node) => node.classList.add('test_conflict'));
  await expect(span).toHaveCSS('font-size', '14px');
});
