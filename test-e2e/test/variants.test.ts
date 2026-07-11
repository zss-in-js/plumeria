import { test, expect } from '@playwright/test';

test('Variants are correctly staticized and applied', async ({ page }) => {
  await page.goto('http://localhost:4000');
  await page.waitForSelector('[data-testid="variant-div-1"]');

  const div1 = page.locator('[data-testid="variant-div-1"]');
  await expect(div1).toHaveCSS('font-size', '12px');
  await expect(div1).toHaveCSS('color', 'rgb(0, 0, 255)'); // blue

  const div2 = page.locator('[data-testid="variant-div-2"]');
  await expect(div2).toHaveCSS('font-size', '20px');
  await expect(div2).toHaveCSS('color', 'rgb(128, 128, 128)'); // gray

  const bdiv1 = page.locator('[data-testid="bracket-div-1"]');
  await expect(bdiv1).toHaveCSS('color', 'rgb(0, 128, 0)'); // green

  const bdiv2 = page.locator('[data-testid="bracket-div-2"]');
  await expect(bdiv2).toHaveCSS('color', 'rgb(128, 0, 128)'); // purple

  const bdiv3 = page.locator('[data-testid="bracket-div-3"]');
  await expect(bdiv3).toHaveCSS('color', 'rgb(0, 128, 0)'); // green
});
