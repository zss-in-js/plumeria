import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

/**
 * Turbopack updates the stylesheet and the modules that use it at different
 * times. The dev stylesheet keeps the rules of the two previous generations, so
 * a module still holding an old class name never renders without its rule, and a
 * rule three edits old is gone.
 *
 * Production has no HMR, so this only runs against the dev server.
 */

const slugOf = (project: string) => project.toLowerCase().replace(/\W+/g, '-');

const styleFile = (slug: string) =>
  path.join(__dirname, `../nextjs/component/hmr-value-${slug}.styles.ts`);

// Each project edits its own file with its own colors, so no two share a class.
const COLORS: Record<string, [string, string, string, string]> = {
  chromium: ['#a1b2c3', '#c3b2a1', '#b2a1c3', '#c3a1b2'],
  'mobile-chrome': ['#a2b3c4', '#c4b3a2', '#b3a2c4', '#c4a2b3'],
};

const rgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

const source = (color: string) => `import * as css from '@plumeria/core';

export const hmrValue = css.create({
  box: {
    backgroundColor: '${color}',
  },
});
`;

const hasClassRule = (page: Page, className: string) =>
  page.evaluate((name) => {
    const walk = (rules: CSSRuleList): boolean =>
      [...rules].some(
        (rule) =>
          (rule instanceof CSSStyleRule &&
            rule.selectorText.includes(`.${name}`)) ||
          ('cssRules' in rule && walk((rule as CSSGroupingRule).cssRules)),
      );
    return [...document.styleSheets].some((sheet) => {
      try {
        return walk(sheet.cssRules);
      } catch {
        return false;
      }
    });
  }, className);

test.describe('a value edited by HMR', () => {
  test.skip(
    process.env.E2E_TARGET === 'production',
    'HMR only exists in development',
  );

  test.afterEach(() => {
    const slug = slugOf(test.info().project.name);
    fs.writeFileSync(styleFile(slug), source(COLORS[slug][0]), 'utf-8');
  });

  test('never renders a frame without the old or the new rule, and drops a rule three edits old', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90 * 1000);
    const slug = slugOf(testInfo.project.name);
    const file = styleFile(slug);
    const [first, second, third, fourth] = COLORS[slug];

    await page.goto(`/hmr-value/${slug}`);

    const box = page.locator('[data-testid="hmr-value-box"]');
    await expect(box).toHaveCSS('background-color', rgb(first));
    const firstClass = await box.getAttribute('class');
    expect(firstClass).toBeTruthy();

    // Observe every rendered frame during HMR, not only the settled result.
    await page.evaluate(() => {
      const samples: string[] = [];
      const sample = () => {
        const element = document.querySelector('[data-testid="hmr-value-box"]');
        samples.push(
          element ? getComputedStyle(element).backgroundColor : 'missing',
        );
        requestAnimationFrame(sample);
      };
      Object.assign(window, { hmrValueSamples: samples });
      requestAnimationFrame(sample);
    });

    fs.writeFileSync(file, source(second), 'utf-8');
    await expect(box).toHaveCSS('background-color', rgb(second), {
      timeout: 30000,
    });

    const samples = await page.evaluate(
      () => (window as Window & { hmrValueSamples?: string[] }).hmrValueSamples,
    );
    expect(samples?.length).toBeGreaterThan(0);
    expect(
      samples?.filter((color) => color !== rgb(first) && color !== rgb(second)),
    ).toEqual([]);

    fs.writeFileSync(file, source(third), 'utf-8');
    await expect(box).toHaveCSS('background-color', rgb(third), {
      timeout: 30000,
    });

    fs.writeFileSync(file, source(fourth), 'utf-8');
    await expect(box).toHaveCSS('background-color', rgb(fourth), {
      timeout: 30000,
    });
    await expect
      .poll(() => hasClassRule(page, firstClass!.split(' ')[0]), {
        timeout: 30000,
      })
      .toBe(false);
  });
});
