jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import loader from '../src/index';

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const s = css.create({
  p1: { color: 'green' },
  p3: { color: 'teal' },
});

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

// Bracket access with a literal key must resolve inside a conditional exactly
// as `.key` does. It used to collapse to an empty className with no error.
describe('turbopack-loader: bracket access inside conditionals', () => {
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

  it('keeps a bracket branch mixed with dot access', async () => {
    const out = await run(
      `export const A = ({ on }: { on: boolean }) => <div classStyle={on ? s['p1'] : s.p3} />;`,
    );
    expect(out).toContain('x3git8yv');
    expect(out).toContain('xxcejlqg');
  });

  it('keeps a bracket branch nested in an array', async () => {
    const out = await run(
      `export const A = ({ on }: { on: boolean }) => <div classStyle={[s.p3, on && s['p1']]} />;`,
    );
    expect(out).toContain('x3git8yv');
    expect(out).toContain('xxcejlqg');
  });

  // The branches of a condition are mutually exclusive, so a group under one
  // stays a single lookup: the condition folds into the key expression and the
  // slot no key claims carries whatever the other branch contributes.
  it.each([
    [
      'a ternary branch',
      `on ? s[k] : s['p3']`,
      `{"p1":"x3git8yv","p3":"xxcejlqg","#0":"xxcejlqg"}[((on) ? k : "#0")]`,
    ],
    [
      'the right of a logical &&',
      `on && s[k]`,
      `{"p1":"x3git8yv","p3":"xxcejlqg"}[((on) ? k : "")]`,
    ],
    [
      'an array element',
      `[s.p3, on && s[k]]`,
      `{"p1":"x3git8yv","p3":"xxcejlqg"}[((on) ? k : "")] || "xxcejlqg"`,
    ],
  ])('folds an outer condition into the key in %s', async (_l, expr, want) => {
    const out = await run(
      `export const A = ({ on, k }: { on: boolean; k: 'p1' | 'p3' }) => <div classStyle={${expr}} />;`,
    );
    expect(out).toContain(want);
  });

  it('compiles the same intent with the condition inside the brackets', async () => {
    const out = await run(
      `export const A = ({ on, k }: { on: boolean; k: 'p1' | 'p3' }) => <div classStyle={s[on ? k : 'p3']} />;`,
    );
    expect(out).toContain('x3git8yv');
    expect(out).toContain('xxcejlqg');
  });

  it('still compiles a non-literal key outside any condition', async () => {
    const out = await run(
      `export const A = ({ k }: { k: 'p1' | 'p3' }) => <div classStyle={s[k]} />;`,
    );
    expect(out).toContain('x3git8yv');
    expect(out).toContain('xxcejlqg');
  });
});
