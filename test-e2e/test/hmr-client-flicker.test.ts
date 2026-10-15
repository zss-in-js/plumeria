import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

/**
 * A client module is re-evaluated before Turbopack delivers the stylesheet with
 * its new rules. The edited module carries the stylesheet of that moment, so no
 * frame renders a class without its rule, a media rule from another file keeps
 * winning over the edited base rule, and the server children inside the client
 * component keep their styles. A style module the client component imports bakes
 * its class names into the component, so editing only the style module has to
 * carry the stylesheet in the component too. Once the delivered stylesheet
 * arrives the carried one is removed.
 *
 * Production has no HMR, so this only runs against the dev server.
 */

const slugOf = (project: string) => project.toLowerCase().replace(/\W+/g, '-');

const componentFile = (slug: string) =>
  path.join(__dirname, `../nextjs/component/hmr-client-${slug}.tsx`);

const styleModuleFile = (slug: string) =>
  path.join(__dirname, `../nextjs/component/hmr-client-${slug}.styles.ts`);

// Each project edits its own file with its own colors, so no two share a class.
const COLORS: Record<string, [string, string, string, string]> = {
  chromium: ['#a3b4c5', '#c5b4a3', '#b4a3c5', '#c5a3b4'],
  'mobile-chrome': ['#a4b5c6', '#c6b5a4', '#b5a4c6', '#c6a4b5'],
};

const STYLE_MODULE_COLORS: Record<string, [string, string, string, string]> = {
  chromium: ['#d1e2f3', '#f3e2d1', '#e2d1f3', '#f3d1e2'],
  'mobile-chrome': ['#d2e3f4', '#f4e3d2', '#e3d2f4', '#f4d2e3'],
};

const MEDIA_COLOR = '#5d5d5d';
const SERVER_CHILD_COLOR = '#4c4c4c';

const rgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

const source = (slug: string, color: string) => `'use client';

import * as css from '@plumeria/core';
import { hmrClientWide } from 'component/hmr-client-wide.styles';
import { hmrClientModule } from 'component/hmr-client-${slug}.styles';

const styles = css.create({
  box: {
    backgroundColor: '${color}',
  },
  text: {
    color: '${color}',
  },
});

export function HmrClientBox({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div data-testid="hmr-client-box" classStyle={styles.box}>
        the client module and the stylesheet update separately
      </div>
      <div
        data-testid="hmr-client-ordered"
        classStyle={[styles.text, hmrClientWide.text]}
      >
        a media rule from another file stays on top
      </div>
      <div data-testid="hmr-client-module" classStyle={hmrClientModule.box}>
        the class names of a style module are baked into this component
      </div>
      {children}
    </section>
  );
}
`;

const styleModuleSource = (
  color: string,
) => `import * as css from '@plumeria/core';

export const hmrClientModule = css.create({
  box: {
    backgroundColor: '${color}',
  },
});
`;

interface Sample {
  box: string;
  ordered: string;
  module: string;
  child: string;
}

const startSampling = (page: Page) =>
  page.evaluate(() => {
    const samples: Sample[] = [];
    const read = (id: string) => {
      const element = document.querySelector(`[data-testid="${id}"]`);
      return element ? getComputedStyle(element) : null;
    };
    const sample = () => {
      samples.push({
        box: read('hmr-client-box')?.backgroundColor ?? 'missing',
        ordered: read('hmr-client-ordered')?.color ?? 'missing',
        module: read('hmr-client-module')?.backgroundColor ?? 'missing',
        child: read('hmr-client-server-child')?.color ?? 'missing',
      });
      requestAnimationFrame(sample);
    };
    Object.assign(window, { hmrClientSamples: samples });
    requestAnimationFrame(sample);
  });

const clearSamples = (page: Page) =>
  page.evaluate(() => {
    (
      window as Window & { hmrClientSamples?: Sample[] }
    ).hmrClientSamples!.length = 0;
  });

const takeSamples = (page: Page) =>
  page.evaluate(
    () => (window as Window & { hmrClientSamples?: Sample[] }).hmrClientSamples,
  );

const bridgeRemoved = (page: Page) =>
  expect
    .poll(() => page.locator('#plumeria-dev-bridge').count(), {
      timeout: 30000,
    })
    .toBe(0);

test.describe('a client component edited by HMR', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(
    process.env.E2E_TARGET === 'production',
    'HMR only exists in development',
  );

  test.afterEach(() => {
    const slug = slugOf(test.info().project.name);
    fs.writeFileSync(
      componentFile(slug),
      source(slug, COLORS[slug][0]),
      'utf-8',
    );
    fs.writeFileSync(
      styleModuleFile(slug),
      styleModuleSource(STYLE_MODULE_COLORS[slug][0]),
      'utf-8',
    );
  });

  test('never renders a frame without its rules, in production order', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120 * 1000);
    const slug = slugOf(testInfo.project.name);
    const file = componentFile(slug);
    const colors = COLORS[slug];

    await page.goto(`/hmr-client/${slug}`);

    const box = page.locator('[data-testid="hmr-client-box"]');
    await expect(box).toHaveCSS('background-color', rgb(colors[0]));
    const wide = await page.evaluate(
      () => matchMedia('(min-width: 600px)').matches,
    );

    await startSampling(page);

    for (let edit = 1; edit < colors.length; edit++) {
      const [previous, next] = [rgb(colors[edit - 1]), rgb(colors[edit])];
      await clearSamples(page);

      fs.writeFileSync(file, source(slug, colors[edit]), 'utf-8');
      await expect(box).toHaveCSS('background-color', next, {
        timeout: 30000,
      });
      await bridgeRemoved(page);

      const samples = await takeSamples(page);
      expect(samples?.length).toBeGreaterThan(0);
      expect(
        samples?.filter(({ box }) => box !== previous && box !== next),
      ).toEqual([]);
      expect(
        samples?.filter(({ ordered }) =>
          wide
            ? ordered !== rgb(MEDIA_COLOR)
            : ordered !== previous && ordered !== next,
        ),
      ).toEqual([]);
      expect(
        samples?.filter(({ child }) => child !== rgb(SERVER_CHILD_COLOR)),
      ).toEqual([]);
      expect(
        samples?.filter(
          ({ module }) => module !== rgb(STYLE_MODULE_COLORS[slug][0]),
        ),
      ).toEqual([]);
      await expect(box).toHaveCSS('background-color', next);
    }
  });

  test('never renders a frame without the rules of an edited style module', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120 * 1000);
    const slug = slugOf(testInfo.project.name);
    const file = styleModuleFile(slug);
    const colors = STYLE_MODULE_COLORS[slug];

    await page.goto(`/hmr-client/${slug}`);

    const moduleBox = page.locator('[data-testid="hmr-client-module"]');
    await expect(moduleBox).toHaveCSS('background-color', rgb(colors[0]));

    await startSampling(page);

    for (let edit = 1; edit < colors.length; edit++) {
      const [previous, next] = [rgb(colors[edit - 1]), rgb(colors[edit])];
      await clearSamples(page);

      fs.writeFileSync(file, styleModuleSource(colors[edit]), 'utf-8');
      await expect(moduleBox).toHaveCSS('background-color', next, {
        timeout: 30000,
      });
      await bridgeRemoved(page);

      const samples = await takeSamples(page);
      expect(samples?.length).toBeGreaterThan(0);
      expect(
        samples?.filter(({ module }) => module !== previous && module !== next),
      ).toEqual([]);
      expect(
        samples?.filter(({ box }) => box !== rgb(COLORS[slug][0])),
      ).toEqual([]);
      expect(
        samples?.filter(({ child }) => child !== rgb(SERVER_CHILD_COLOR)),
      ).toEqual([]);
      await expect(moduleBox).toHaveCSS('background-color', next);
    }
  });
});
