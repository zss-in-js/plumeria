import { defineConfig, devices } from '@playwright/test';

const isProduction = process.env.E2E_TARGET === 'production';
// The same site after `migrate --from plumeria`, so the browser can be asked
// whether the exported CSS still answers the way Plumeria did.
const isExported = process.env.E2E_TARGET === 'exported';
const port = isExported ? 4002 : isProduction ? 4001 : 4000;
const built = isProduction || isExported;

export default defineConfig({
  globalSetup: './test-e2e/global.setup.ts',
  webServer: {
    command: built
      ? `pnpm build && pnpm next start --port ${port}`
      : `pnpm dev --port ${port}`,
    cwd: isExported ? './test-e2e/.migrated' : './test-e2e/site',
    reuseExistingServer: !built,
    timeout: built ? 180 * 1000 : 60 * 1000,
    port,
  },
  testDir: './test-e2e',
  // Only the assertions that read a composed result survive the export: the
  // rest name Plumeria's own hashes or its dev-server behaviour.
  ...(isExported ? { testMatch: /composition-order\.test\.ts/ } : {}),
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
      testIgnore: /hmr-rule-order\.test\.ts/,
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  /* Run your local dev server before starting the tests */
});
