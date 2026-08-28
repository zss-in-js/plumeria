import { test, expect } from '@playwright/test';

/**
 * The box is what the exported parity screenshot reads the `@keyframes`
 * through, so the animation has to be finite and hold the frame it ends on.
 * One that never reaches `to`, or that snaps back once it is over, paints the
 * same box whether or not the export carried the rule across.
 */

test('a finite animation holds the frame it ends on', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="keyframes-box"]');
  const box = page.locator('[data-testid="keyframes-box"]');

  await expect(box).not.toHaveCSS('animation-name', 'none');
  await expect(box).toHaveCSS('background-color', 'rgb(0, 128, 0)');
  await expect(box).toHaveCSS('translate', '120px');
});
