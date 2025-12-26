import { test, expect } from '@playwright/test';

test('Components have correct classes applied', async ({ page }) => {
  await page.goto('http://localhost:4000');
  await page.waitForSelector('[data-testid="e2e-test-div"]');
  const div = page.locator('[data-testid="e2e-test-div"]');
  await expect(div).toHaveClass('x9khpzv9 xjh5z8ql');
});
