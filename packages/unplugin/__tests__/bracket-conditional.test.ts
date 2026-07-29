jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { unpluginFactory } from '../src/core';

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const s = css.create({
  p1: { color: 'green' },
  p3: { color: 'teal' },
});

${body}
`;

const run = async (body: string): Promise<string> => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const ctx = { addWatchFile: () => {} };
  const result = await plugin.transform.call(
    ctx,
    wrap(body),
    `${__dirname}/fixture.tsx`,
  );
  return typeof result === 'string' ? result : (result?.code ?? '');
};

// Bracket access with a literal key must resolve inside a conditional exactly
// as `.key` does. It used to collapse to an empty className with no error.
describe('unplugin: bracket access inside conditionals', () => {
  it('keeps both branches of a ternary', async () => {
    const out = await run(
      `export const A = ({ on }: { on: boolean }) => <div classStyle={on ? s['p1'] : s['p3']} />;`,
    );
    expect(out).toContain('x3git8yv');
    expect(out).toContain('xxcejlqg');
  });

  it('matches the dot-access output for the same ternary', async () => {
    const bracket = await run(
      `export const A = ({ on }: { on: boolean }) => <div classStyle={on ? s['p1'] : s['p3']} />;`,
    );
    const dot = await run(
      `export const A = ({ on }: { on: boolean }) => <div classStyle={on ? s.p1 : s.p3} />;`,
    );
    expect(bracket.replace(/s\['p1'\]/g, 's.p1')).toEqual(dot);
  });

  it('keeps the right-hand side of a logical &&', async () => {
    const out = await run(
      `export const A = ({ on }: { on: boolean }) => <div classStyle={on && s['p1']} />;`,
    );
    expect(out).toContain('x3git8yv');
  });

  it('keeps a bracket branch nested in an array', async () => {
    const out = await run(
      `export const A = ({ on }: { on: boolean }) => <div classStyle={[s.p3, on && s['p1']]} />;`,
    );
    expect(out).toContain('x3git8yv');
    expect(out).toContain('xxcejlqg');
  });

  // A non-literal key has no place to fold the outer test into, so it must
  // fail loudly rather than compile to an empty className.
  it.each([
    ['a ternary branch', `on ? s[k] : s['p3']`],
    ['the right of a logical &&', `on && s[k]`],
  ])('rejects a non-literal bracket key in %s', async (_label, expr) => {
    await expect(
      run(
        `export const A = ({ on, k }: { on: boolean; k: 'p1' | 'p3' }) => <div classStyle={${expr}} />;`,
      ),
    ).rejects.toThrow(/bracket key is not a literal/);
  });

  it('compiles the same intent with the condition inside the brackets', async () => {
    const out = await run(
      `export const A = ({ on, k }: { on: boolean; k: 'p1' | 'p3' }) => <div classStyle={s[on ? k : 'p3']} />;`,
    );
    expect(out).toContain('x3git8yv');
    expect(out).toContain('xxcejlqg');
  });
});
