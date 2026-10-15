import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

const EDITED_FILE = path.join(
  __dirname,
  '../nextjs/component/keyframes.styles.ts',
);

const addedFile = (project: string) =>
  path.join(
    __dirname,
    `../nextjs/component/hmr-added-${project.replace(/\W+/g, '-')}.tsx`,
  );

const offsetFor = (project: string) => 10 + project.length;

const addedSource = (offset: number) => `import * as css from '@plumeria/core';

const hmrAdded = css.create({
  marker: { outlineOffset: ${offset} },
});

export const HmrAdded = () => <div classStyle={hmrAdded.marker} />;
`;

const hasRule = (page: Page, declaration: string) =>
  page.evaluate((text) => {
    const walk = (rules: CSSRuleList): boolean =>
      [...rules].some(
        (rule) =>
          rule.cssText.includes(text) ||
          ('cssRules' in rule && walk((rule as CSSGroupingRule).cssRules)),
      );
    return [...document.styleSheets].some((sheet) => {
      try {
        return walk(sheet.cssRules);
      } catch {
        return false;
      }
    });
  }, declaration);

test.describe('files added to and removed from the project during HMR', () => {
  test.skip(
    process.env.E2E_TARGET === 'production',
    'HMR only exists in development',
  );

  let original: string;

  test.beforeAll(() => {
    original = fs.readFileSync(EDITED_FILE, 'utf-8');
  });

  test.afterEach(() => {
    fs.rmSync(addedFile(test.info().project.name), { force: true });
    fs.rmSync(addedFile(`${test.info().project.name}-next`), { force: true });
    fs.writeFileSync(EDITED_FILE, original, 'utf-8');
  });

  test('serves the rules of a new file once the project recompiles, and drops them after it is deleted', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90 * 1000);
    const added = addedFile(testInfo.project.name);
    const offset = offsetFor(testInfo.project.name);
    const declaration = `outline-offset: ${offset}px`;

    await page.goto('/hmr');
    await expect(page.locator('[data-testid="hmr-box"]')).toBeVisible();
    expect(await hasRule(page, declaration)).toBe(false);

    fs.writeFileSync(added, addedSource(offset), 'utf-8');
    fs.writeFileSync(EDITED_FILE, `${original}\n`, 'utf-8');
    await expect
      .poll(() => hasRule(page, declaration), { timeout: 30000 })
      .toBe(true);

    fs.rmSync(added);
    fs.writeFileSync(
      addedFile(`${testInfo.project.name}-next`),
      addedSource(offset + 100),
      'utf-8',
    );
    fs.writeFileSync(EDITED_FILE, `${original}\n\n`, 'utf-8');
    await expect
      .poll(() => hasRule(page, `outline-offset: ${offset + 100}px`), {
        timeout: 30000,
      })
      .toBe(true);

    // Deletion and addition can compile as one generation. Wait for that
    // generation above, then advance two more so the deleted rule falls out
    // of the three generations development keeps.
    for (const step of [200, 300]) {
      fs.writeFileSync(
        addedFile(`${testInfo.project.name}-next`),
        addedSource(offset + step),
        'utf-8',
      );
      await expect
        .poll(() => hasRule(page, `outline-offset: ${offset + step}px`), {
          timeout: 30000,
        })
        .toBe(true);
    }
    await expect
      .poll(() => hasRule(page, declaration), { timeout: 30000 })
      .toBe(false);
  });
});
