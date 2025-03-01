import { test, expect } from '@playwright/test';

test('Media queries are placed after regular selectors', async ({ page }) => {
  await page.goto('http://localhost:4000');
  await page.waitForSelector('head > style', { state: 'attached' });
  const styleContent = await page.evaluate(() => {
    return Array.from(document.styleSheets)
      .filter(
        (sheet) =>
          sheet.href === null || sheet.href.startsWith(window.location.origin),
      )
      .map((sheet) =>
        Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n'),
      )
      .join('\n');
  });
  expect(styleContent).toMatch(/^[^@]+@media/);
});
