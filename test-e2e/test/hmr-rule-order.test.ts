import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * The dev loader accumulates rules from separate module compiles into one shared
 * file, so a rule added by a later edit lands after everything already in it.
 * The conditional rule is compiled first here and the base rule arrives second,
 * which is the order that used to decide the winner. It must not decide it now.
 *
 * Production has no HMR, so this only runs against the dev server.
 */

const STYLE_FILE = path.join(
  __dirname,
  '../site/component/hmr-target.styles.ts',
);

const WITH_BASE_RULE = `import * as css from '@plumeria/core';

export const hmrTarget = css.create({
  box: {
    paddingTop: 4,
    '@media (min-width: 600px)': {
      padding: 40,
    },
  },
});
`;

test.describe('rules added by HMR', () => {
  test.skip(
    process.env.E2E_TARGET === 'production',
    'HMR only exists in development',
  );

  let original: string;

  test.beforeAll(() => {
    original = fs.readFileSync(STYLE_FILE, 'utf-8');
  });

  test.afterEach(() => {
    fs.writeFileSync(STYLE_FILE, original, 'utf-8');
  });

  test('keeps the conditional rule ahead of a base rule added later', async ({
    page,
  }) => {
    test.setTimeout(60 * 1000);

    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/hmr');

    const box = page.locator('[data-testid="hmr-box"]');
    await expect(box).toHaveCSS('padding-top', '40px');

    fs.writeFileSync(STYLE_FILE, WITH_BASE_RULE, 'utf-8');

    // the base rule reaches the shared file only now, after the @media rule
    await expect(box).toHaveCSS('padding-bottom', '40px', { timeout: 30000 });
    await expect(box).toHaveCSS('padding-top', '40px');
  });
});
