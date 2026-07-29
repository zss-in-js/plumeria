jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { parseSync } from '@swc/core';
import loader from '../src/index';

const INLINED = '{"box":{"color":"xq96bg3w"}}';

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const styles = css.create({
  box: { color: 'red' },
});

export const A = () => <div classStyle={styles.box} />;

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

const expectParsable = (code: string) => {
  expect(() =>
    parseSync(code, { syntax: 'typescript', tsx: true, target: 'es2022' }),
  ).not.toThrow();
};

describe('turbopack-loader: identifiers that only look like style references', () => {
  it.each([
    ['an object literal key', 'export const c = { styles: 123 };'],
    ['a member property', 'export const v = foo.styles;'],
    [
      'a const shadowed in a function',
      'export function h() {\n  const styles = { anything: 1 };\n  return styles.anything;\n}',
    ],
    [
      'a function parameter',
      'export function h(styles) {\n  return styles;\n}',
    ],
    ['a JSX attribute name', 'export const B = () => <Foo styles={1} />;'],
    ['an interface member', 'export interface I {\n  styles: string;\n}'],
  ])('leaves %s untouched', async (_label, body) => {
    const code = await run(body);
    expectParsable(code);
    expect(code.split(INLINED)).toHaveLength(1);
  });

  it('still inlines a computed member', async () => {
    const code = await run('export const v = foo[styles];');
    expectParsable(code);
    expect(code).toContain(INLINED);
  });

  it('expands an object shorthand into an explicit key', async () => {
    const code = await run('export const c = { styles };');
    expectParsable(code);
    expect(code).toContain(`{ styles: (${INLINED}) }`);
  });
});
