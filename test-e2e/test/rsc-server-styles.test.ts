// A server component is transformed in the `rsc` environment and rendered on
// the server, so its styles reach the browser without the module ever being
// loaded there. Nothing else in this suite takes that route, and every failure
// it has had looked the same from the outside: the element renders, carries its
// class names, and is unstyled.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('a server component carries the styles it declared', async ({ page }) => {
  const box = page.locator('[data-testid="rsc-server-box"]');

  await expect(box).toHaveCSS('color', 'rgb(125, 211, 252)');
  await expect(box).toHaveCSS('font-weight', '700');
  await expect(box).toHaveCSS('padding', '16px');
});

test('a pseudo class on a server component resolves in the browser', async ({
  page,
}) => {
  const box = page.locator('[data-testid="rsc-server-box"]');

  await expect(box).toHaveCSS('color', 'rgb(125, 211, 252)');
  await box.hover();
  await expect(box).toHaveCSS('color', 'rgb(248, 113, 113)');
});

test('a style whose every declaration is nested still reaches it', async ({
  page,
}) => {
  const nested = page.locator('[data-testid="rsc-server-nested"]');

  await expect(nested).toHaveCSS('outline-style', 'solid');
  await expect(nested).toHaveCSS('outline-width', '4px');
  await expect(nested).toHaveCSS('outline-color', 'rgb(34, 197, 94)');
});

test('a client component carries its own styles', async ({ page }) => {
  const counter = page.locator('[data-testid="rsc-client-counter"]');

  await expect(counter).toHaveCSS('color', 'rgb(255, 59, 239)');
  await expect(counter).toHaveCSS('letter-spacing', '3px');
});

test('a client component is hydrated, not only rendered', async ({ page }) => {
  const counter = page.locator('[data-testid="rsc-client-counter"]');

  await expect(counter).toHaveText('Client Counter: 0');

  // A click before hydration lands on markup and does nothing, so the button is
  // asked until it answers rather than once at a moment chosen for it.
  await expect(async () => {
    await counter.click();
    await expect(counter).not.toHaveText('Client Counter: 0');
  }).toPass();
});

// The two components are transformed in different environments, and both read
// the styles from one module. The atoms it produces have to be present for each
// of them, whichever environment emitted the rule.
test('a style shared by both environments applies in each', async ({
  page,
}) => {
  const server = page.locator('[data-testid="rsc-server-shared"]');
  const client = page.locator('[data-testid="rsc-client-counter"]');

  for (const element of [server, client]) {
    await expect(element).toHaveCSS('border-style', 'solid');
    await expect(element).toHaveCSS('border-width', '2px');
    await expect(element).toHaveCSS('border-color', 'rgb(10, 20, 30)');
  }

  const classes = (locator: typeof server) =>
    locator.evaluate((element: Element) => [...element.classList]);

  // One atom, so the class name the server element carries is the one the
  // client element carries, not a second rule that happens to say the same.
  const onServer = await classes(server);
  const onClient = await classes(client);
  expect(onClient).toEqual(expect.arrayContaining(onServer));
});
