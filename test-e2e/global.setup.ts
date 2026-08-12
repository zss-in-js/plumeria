import { chromium } from '@playwright/test';

export default async function globalSetup() {
  if (process.env.E2E_TARGET === 'production') return;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      await page.goto('http://localhost:4000');
      const ready = await page
        .locator('[data-testid="conditional-div"]')
        .evaluate(
          (element) =>
            getComputedStyle(element).backgroundColor === 'rgb(255, 0, 0)',
        );

      if (ready) return;
      await page.waitForTimeout(250);
    }

    throw new Error('Plumeria development CSS did not become ready');
  } finally {
    await browser.close();
  }
}
