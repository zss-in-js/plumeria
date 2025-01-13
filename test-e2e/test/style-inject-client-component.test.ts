import { test, expect } from '@playwright/test';

test('Stylesheet is correctly inserted in the head', async ({ page }) => {
  await page.goto('http://localhost:4000');
  await page.waitForSelector('head > style', { state: 'attached' });
  const styleElements = await page.locator('head > style').count();
  expect(styleElements).toBeGreaterThan(0);
});
