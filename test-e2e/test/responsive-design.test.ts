import { test, expect } from '@playwright/test';

test('Responsive design applies correct styles based on viewport size', async ({
  page,
}) => {
  await page.goto('http://localhost:4000');
  await page.waitForSelector('[data-testid="e2e-test-div"]');
  const div = page.locator('[data-testid="e2e-test-div"]');

  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(div).toHaveCSS('color', 'rgb(255, 192, 203)');

  await page.setViewportSize({ width: 800, height: 600 });
  await expect(div).toHaveCSS('color', 'rgb(0, 255, 255)');
});
