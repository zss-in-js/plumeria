import { test, expect } from '@playwright/test';

test('Stylesheet is correctly inserted in the head at Server Component', async ({
  page,
}) => {
  // 1. initial page access
  await page.goto('http://localhost:4000');

  // 2. "Server Page" Link click and transition
  await page.click('text=Server Page');

  await page.waitForSelector('[data-testid="e2e-test-p"]');

  const styleElements = await page.locator('head > style').count();
  expect(styleElements).toBeGreaterThan(0);

  const colorStyle = await page.evaluate(() => {
    const element = document.querySelector(
      '[data-testid="e2e-test-p"]',
    ) as HTMLElement;
    const style = window.getComputedStyle(element);
    return style.color;
  });
  expect(colorStyle).toBe('rgb(0, 128, 0)');
});
