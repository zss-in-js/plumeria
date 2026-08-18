import * as fs from 'node:fs';
import * as path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { EXPORTED_ORIGIN, PLUMERIA_ORIGIN } from '../../playwright.config';

/**
 * The same page built twice: once by Plumeria, once after
 * `migrate --from plumeria` has exported it to CSS Modules. Class names differ
 * on both sides and none of them are read here — what is compared is what the
 * browser paints, which is the only part a reader of the site would notice.
 */

const PAGES = ['/', '/server'];

const settle = async (page: Page, origin: string, route: string) => {
  await page.goto(`${origin}${route}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
};

test.describe('the exported site paints the same page', () => {
  for (const route of PAGES) {
    test(`${route} is unchanged by the export`, async ({ page }, info) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      // Plumeria's own render is written as the baseline on the spot, so the
      // comparison is between two live builds rather than a stored image.
      const name = `${route === '/' ? 'home' : route.slice(1)}.png`;
      await settle(page, PLUMERIA_ORIGIN, route);
      const baseline = info.snapshotPath(name);
      fs.mkdirSync(path.dirname(baseline), { recursive: true });
      fs.writeFileSync(
        baseline,
        // `toHaveScreenshot` reads in CSS pixels, so the baseline is taken the
        // same way rather than at the device scale.
        await page.screenshot({
          fullPage: true,
          animations: 'disabled',
          scale: 'css',
        }),
      );

      await settle(page, EXPORTED_ORIGIN, route);
      await expect(page).toHaveScreenshot(name, {
        fullPage: true,
        animations: 'disabled',
        scale: 'css',
      });
    });
  }
});
