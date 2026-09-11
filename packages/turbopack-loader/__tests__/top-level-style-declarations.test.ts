jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import loader from '../src/index';

const run = (source: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const ctx = {
      resourcePath: `${__dirname}/fixture.tsx`,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, source);
  });

const definitions = [
  ['create', "{ box: { color: 'red' } }"],
  ['createTheme', "'.dark', { color: { default: 'red', theme: 'blue' } }"],
  ['createStatic', "{ color: 'red' }"],
] as const;

it.each(definitions)(
  'rejects nested css.%s before overwriting a module binding',
  async (method, argument) => {
    for (const nested of [
      `export function Component() { const styles = css.${method}(${argument}); return null; }`,
      `if (flag) { const styles = css.${method}(${argument}); }`,
      `export function Component() { const styles = (css.${method}(${argument}) as any); return null; }`,
    ]) {
      await expect(
        run(
          `import * as css from '@plumeria/core'; const styles = css.${method}(${argument}); ${nested}`,
        ),
      ).rejects.toThrow(
        `css.${method} must be assigned to a top-level variable`,
      );
    }
  },
);

it('recognizes a renamed API import in a nested declaration', async () => {
  await expect(
    run(
      `import { create as defineStyles } from '@plumeria/core'; export function Component() { const styles = defineStyles({ box: { color: 'red' } }); return null; }`,
    ),
  ).rejects.toThrow('css.create must be assigned to a top-level variable');
});

it.each(definitions)(
  'accepts top-level css.%s declarations with and without export',
  async (method, argument) => {
    for (const exported of ['', 'export ']) {
      await expect(
        run(
          `import * as css from '@plumeria/core'; ${exported}const styles = css.${method}(${argument});`,
        ),
      ).resolves.toEqual(expect.any(String));
    }
  },
);
