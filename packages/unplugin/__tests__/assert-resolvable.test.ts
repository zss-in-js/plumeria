jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { unpluginFactory } from '../src/core';

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

const run = (body: string): Promise<unknown> => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const ctx = { addWatchFile: () => {} };
  return plugin.transform.call(ctx, wrap(body), `${__dirname}/fixture.tsx`);
};

const UNSUPPORTED = /is not supported/;

describe('unplugin: assertResolvable', () => {
  it.each([
    [
      'a function call in styleName',
      'export const A = () => <div styleName={[styles.box, Test()]} />;',
    ],
    [
      'a function call nested in a ternary',
      'export const A = () => <div styleName={cond ? Test() : styles.box} />;',
    ],
    [
      'an arrow function in styleName',
      'export const A = () => <div styleName={[styles.box, () => styles.box]} />;',
    ],
    [
      'a function call in css.use()',
      'export const cls = css.use(styles.box, Test());',
    ],
  ])('rejects %s', async (_label, body) => {
    await expect(run(body)).rejects.toThrow(UNSUPPORTED);
  });

  // `Conditional` allows undefined, so this must keep compiling.
  it('accepts undefined as a conditional branch', async () => {
    await expect(
      run(
        'export const A = () => <div styleName={cond ? styles.box : undefined} />;',
      ),
    ).resolves.toBeTruthy();
  });
});
