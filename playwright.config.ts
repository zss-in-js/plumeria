import { defineConfig, devices } from '@playwright/test';

const isProduction = process.env.E2E_TARGET === 'production';
// The same site after `migrate --from plumeria`, so the browser can be asked
// whether the exported CSS still answers the way Plumeria did.
const isExported = process.env.E2E_TARGET === 'exported';
// A server component's styles reach the page by a route no other target takes:
// the module is transformed in the `rsc` environment, and its stylesheet has to
// be linked by the server render and gathered into one sheet for a build.
const isRsc = process.env.E2E_TARGET === 'rsc';
const isRscProduction = process.env.E2E_TARGET === 'rsc-production';
const rsc = isRsc || isRscProduction;
const port = rsc
  ? isRscProduction
    ? 4004
    : 4003
  : isExported
    ? 4002
    : isProduction
      ? 4001
      : 4000;
const built = isProduction || isExported;

// Plumeria's own build stays up beside the exported one, so a test can put the
// two pages side by side rather than against a stored image.
export const PLUMERIA_ORIGIN = 'http://localhost:4001';
export const EXPORTED_ORIGIN = `http://localhost:${port}`;

const server = (cwd: string, at: number) => ({
  command: `pnpm build && pnpm next start --port ${at}`,
  cwd,
  reuseExistingServer: false,
  timeout: 180 * 1000,
  port: at,
});

const rscServer = {
  command: isRscProduction
    ? `pnpm build && pnpm start --port ${port} --strictPort`
    : `pnpm dev --port ${port} --strictPort`,
  cwd: './test-e2e/vite-react-rsc',
  reuseExistingServer: !isRscProduction,
  timeout: 180 * 1000,
  port,
};

export default defineConfig({
  globalSetup: './test-e2e/global.setup.ts',
  webServer: rsc
    ? rscServer
    : isExported
      ? [
          server('./test-e2e/nextjs', 4001),
          server('./test-e2e/.migrated', port),
        ]
      : {
          command: built
            ? `pnpm build && pnpm next start --port ${port}`
            : `pnpm dev --port ${port}`,
          cwd: './test-e2e/nextjs',
          reuseExistingServer: !built,
          timeout: built ? 180 * 1000 : 60 * 1000,
          port,
        },
  testDir: './test-e2e',
  // Only the assertions that read a composed result survive the export: the
  // rest name Plumeria's own hashes or its dev-server behaviour.
  // The parity run needs both builds side by side, so it belongs to the
  // exported target alone.
  ...(rsc
    ? { testMatch: /rsc-.*\.test\.ts/ }
    : isExported
      ? { testMatch: /(composition-order|keyframes|exported-parity)\.test\.ts/ }
      : { testIgnore: /(exported-parity|rsc-.*)\.test\.ts/ }),
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */

  /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
  use: {
    trace: process.env.CI ? 'on-first-retry' : 'on',
    ...(isExported ? { baseURL: EXPORTED_ORIGIN } : {}),
    ...(rsc ? { baseURL: `http://localhost:${port}` } : {}),
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'Mobile Chrome',
      // A project's `testIgnore` replaces the one above rather than adding to
      // it, so every pattern that run needs is repeated here.
      testIgnore: rsc
        ? /hmr-rule-order\.test\.ts/
        : isExported
          ? /hmr-rule-order\.test\.ts/
          : [
              /hmr-rule-order\.test\.ts/,
              /exported-parity\.test\.ts/,
              /rsc-.*\.test\.ts/,
            ],
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  /* Run your local dev server before starting the tests */
});
