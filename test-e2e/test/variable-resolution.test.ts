import { test, expect } from '@playwright/test';

test('Variables and imported constants are resolved correctly', async ({
  page,
}) => {
  await page.goto('http://localhost:4000');
  await page.waitForSelector('[data-testid="variable-div"]');
  const div = page.locator('[data-testid="variable-div"]');

  // LOCAL_COLOR = 'purple'
  await expect(div).toHaveCSS('color', 'rgb(128, 0, 128)');

  // SPACING.medium = '8px'
  await expect(div).toHaveCSS('padding', '8px');

  // Responsive check
  await page.setViewportSize({ width: 1200, height: 800 });
  // [breakpoints.lg] (max-width: 1024px) should NOT apply at 1200
  // Actually breakpoints.lg is max-width: 1024px. So it applies if width <= 1024.

  await page.setViewportSize({ width: 800, height: 600 });
  // Now it should apply: margin: SPACING.small ('4px')
  await expect(div).toHaveCSS('margin', '4px');
});
