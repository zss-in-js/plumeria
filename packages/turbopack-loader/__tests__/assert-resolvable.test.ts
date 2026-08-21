jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import loader from '../src/index';

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const styles = css.create({
  box: { color: 'red' },
});

function Test() {
  return 'x';
}

${body}
`;

const run = (body: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const ctx = {
      resourcePath: `${__dirname}/fixture.tsx`,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, wrap(body));
  });

const UNSUPPORTED = /is not supported/;

describe('turbopack-loader: assertResolvable', () => {
  it.each([
    [
      'a function call in classStyle',
      'export const A = () => <div classStyle={[styles.box, Test()]} />;',
    ],
    [
      'a function call nested in a ternary',
      'export const A = () => <div classStyle={cond ? Test() : styles.box} />;',
    ],
    [
      'an arrow function in classStyle',
      'export const A = () => <div classStyle={[styles.box, () => styles.box]} />;',
    ],
    [
      'a function call in css.use()',
      'export const cls = css.use(styles.box, Test());',
    ],
    [
      'an unresolvable member in css.use()',
      'export const cls = css.use(styles.box.missing);',
    ],
    [
      'a keyframes call with no argument applied as a style',
      'const spin = css.keyframes();\nexport const A = () => <div classStyle={spin} />;',
    ],
  ])('rejects %s', async (_label, body) => {
    await expect(run(body)).rejects.toThrow(UNSUPPORTED);
  });

  // `use` is variadic, so calling it with nothing is legal. @plumeria/core has
  // no runtime, so the call has to be compiled away rather than left behind.
  it('compiles css.use() with no arguments away', async () => {
    const out = await run('export const cls = css.use();');
    expect(out).toContain('export const cls = ""');
    expect(out).not.toMatch(/\bcss\.use\(/);
  });

  // A malformed call is TypeScript's to reject. The compiler skips it, the way
  // it already skips create(), viewTransition(), createStatic() and createTheme().
  it('skips a keyframes call with no argument that is never applied', async () => {
    await expect(
      run('const spin = css.keyframes();\nexport const name = String(spin);'),
    ).resolves.toEqual(expect.any(String));
  });

  // `Conditional` allows undefined, so this must keep compiling.
  it('accepts undefined as a conditional branch', async () => {
    await expect(
      run(
        'export const A = () => <div classStyle={cond ? styles.box : undefined} />;',
      ),
    ).resolves.toEqual(expect.any(String));
  });
});
