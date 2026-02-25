import { test, expect } from '@playwright/test';

test('Conditional styles apply correctly through state changes', async ({
  page,
}) => {
  await page.goto('http://localhost:4000');
  await page.waitForSelector('[data-testid="conditional-div"]');
  const div = page.locator('[data-testid="conditional-div"]');

  // Initial state (inactive, not large)
  await expect(div).toHaveCSS('background-color', 'rgb(255, 0, 0)'); // red
  await expect(div).toHaveCSS('color', 'rgb(0, 0, 0)'); // black

  // Toggle Active
  await page.click('[data-testid="toggle-active"]');
  await expect(div).toHaveCSS('background-color', 'rgb(0, 128, 0)'); // green
  await expect(div).toHaveCSS('color', 'rgb(255, 255, 255)'); // white

  // Toggle Large
  await page.click('[data-testid="toggle-large"]');
  await expect(div).toHaveCSS('font-size', '24px');

  // Toggle Large back
  await page.click('[data-testid="toggle-large"]');
  await expect(div).toHaveCSS('font-size', '16px'); // default or inherited
});
