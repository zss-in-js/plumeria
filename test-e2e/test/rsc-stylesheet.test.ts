// The sheet a server component's styles land in is requested as a stylesheet by
// the server-rendered `<link>`. In dev that request carries Vite's `?direct`,
// and answering it with the module wrapper instead of CSS left every rule
// unparsed while the link still reported as loaded.
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const PLUMERIA_SHEET = /zero\.css|plumeria-[^/]*\.css/;

type SheetReport = { href: string; rules: number };

const plumeriaSheets = (page: Page) =>
  page.evaluate<SheetReport[]>(() =>
    [...document.styleSheets]
      .filter((sheet): sheet is CSSStyleSheet & { href: string } =>
        Boolean(sheet.href),
      )
      .filter((sheet) => /zero\.css|plumeria-[^/]*\.css/.test(sheet.href))
      .map((sheet) => ({ href: sheet.href, rules: sheet.cssRules.length })),
  );

// The request the browser makes is the one that matters: in dev it carries
// Vite's `?direct`, and asking for the same path without it answers with the
// module wrapper by design. This test navigates itself so it sees the first
// response rather than the 304 a second visit is answered with.
test('the browser is answered with a CSS content type', async ({ page }) => {
  const served: string[] = [];
  page.on('response', (response) => {
    if (!PLUMERIA_SHEET.test(response.url())) return;
    if (response.request().resourceType() !== 'stylesheet') return;
    if (response.status() !== 200) return;
    served.push(response.headers()['content-type'] ?? '');
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  expect(served.length).toBeGreaterThan(0);
  for (const type of served) {
    expect(type).toContain('text/css');
  }
});

test.describe('a loaded page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('parses every Plumeria stylesheet it links as CSS', async ({ page }) => {
    const sheets = await plumeriaSheets(page);

    expect(sheets.length).toBeGreaterThan(0);
    for (const sheet of sheets) {
      expect(sheet.rules, `${sheet.href} parsed no rules`).toBeGreaterThan(0);
    }
  });

  // A build gathers the whole app's atoms into one sheet rather than letting
  // them follow the chunks, where the client references were left without CSS.
  test('ships the app as one sheet when built', async ({ page }) => {
    test.skip(
      process.env.E2E_TARGET !== 'rsc-production',
      'the dev server serves a sheet per module',
    );

    expect(await plumeriaSheets(page)).toHaveLength(1);
  });
});
