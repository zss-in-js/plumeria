jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { parseSync } from '@swc/core';
import { unpluginFactory } from '../src/core';

const HASH = 'xq96bg3w';
const INLINED = `{"box":{"color":"${HASH}"}}`;

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const styles = css.create({
  box: { color: 'red' },
});

export const A = () => <div styleName={styles.box} />;

${body}
`;

const run = async (body: string): Promise<string> => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const ctx = { addWatchFile: () => {} };
  const out = await plugin.transform.call(
    ctx,
    wrap(body),
    `${__dirname}/fixture.tsx`,
  );
  return out.code as string;
};

// The transform emits source text, so a rewrite in the wrong slot shows up as
// unparsable output rather than a failed assertion on the visitor.
const expectParsable = (code: string) => {
  expect(() =>
    parseSync(code, { syntax: 'typescript', tsx: true, target: 'es2022' }),
  ).not.toThrow();
};

describe('unplugin: identifiers that only look like style references', () => {
  // Every one of these used to be rewritten into `({"box":...})`, producing a
  // SyntaxError, because any Identifier matching a style name was replaced.
  it.each([
    ['an object literal key', 'export const c = { styles: 123 };'],
    ['a member property', 'export const v = foo.styles;'],
    ['a nested member property', 'export const v = foo.styles.box;'],
    ['an optional member property', 'export const v = foo?.styles;'],
    [
      'a const shadowed in a function',
      'export function h() {\n  const styles = { anything: 1 };\n  return styles.anything;\n}',
    ],
    [
      'a function parameter',
      'export function h(styles) {\n  return styles;\n}',
    ],
    ['an arrow parameter', 'export const h = (styles) => styles;'],
    [
      'a destructured binding',
      'export function h(props) {\n  const { styles } = props;\n  return styles;\n}',
    ],
    [
      'a renamed destructured key',
      'export function h(props) {\n  const { styles: s } = props;\n  return s;\n}',
    ],
    ['a class method name', 'export class K {\n  styles() { return 1; }\n}'],
    ['a class property name', 'export class K {\n  styles = 1;\n}'],
    ['a JSX attribute name', 'export const B = () => <Foo styles={1} />;'],
    [
      'a catch parameter',
      'export function h() {\n  try { g(); } catch (styles) { return styles; }\n}',
    ],
    [
      'a statement label',
      'export function h() {\n  styles: for (;;) { break styles; }\n}',
    ],
    ['an interface member', 'export interface I {\n  styles: string;\n}'],
    ['a type literal member', 'export type T = { styles: number };'],
    ['a type reference', 'export const x = y as styles;'],
    ['an enum member', 'export enum E {\n  styles = 1,\n}'],
    [
      'a for-of binding',
      'export function h(l) {\n  for (const styles of l) g(styles);\n}',
    ],
    [
      'a var shadowed in a function',
      'export function h() {\n  var styles = 1;\n  return styles;\n}',
    ],
    [
      'a binding shadowed in a nested block',
      'export function h() {\n  { let styles = 1; return styles; }\n}',
    ],
    [
      'a named function expression',
      'export const f = function styles() { return styles; };',
    ],
  ])('leaves %s untouched', async (_label, body) => {
    const code = await run(body);
    expectParsable(code);
    // `styles.box` in the fixture is still inlined; nothing else should be.
    expect(code.split(INLINED)).toHaveLength(1);
  });

  it.each([
    ['a computed member', 'export const v = foo[styles];'],
    ['a computed key', 'export const c = { [styles]: 1 };'],
    ['a spread', 'export const c = { ...styles };'],
    ['a call argument', 'export const v = g(styles);'],
  ])('still inlines %s', async (_label, body) => {
    const code = await run(body);
    expectParsable(code);
    expect(code).toContain(INLINED);
  });

  it('expands an object shorthand into an explicit key', async () => {
    const code = await run('export const c = { styles };');
    expectParsable(code);
    expect(code).toContain(`{ styles: (${INLINED}) }`);
  });

  it('inlines an outer reference that a later block-scoped binding does not shadow', async () => {
    const code = await run(
      'export function h() {\n  const a = styles;\n  { const styles = 1; g(styles); }\n  return a;\n}',
    );
    expectParsable(code);
    expect(code).toContain(`const a = (${INLINED});`);
    expect(code).toContain('{ const styles = 1; g(styles); }');
  });
});
