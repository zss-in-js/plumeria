import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
let current = '';

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => [current]),
}));

import { compileCSS } from '../src/index';

let n = 0;
const compile = (body: string) => {
  current = path.join(FIXTURE_DIR, `f${n++}.tsx`);
  fs.writeFileSync(current, body, 'utf-8');
  return compileCSS({ include: ['**'], exclude: [] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

const theme = (selector: string) => `
import * as css from '@plumeria/core';
const DARK = '.dark';
export const tokens = css.createStatic({ dark: '.dark' });
export const theme = css.createTheme(${selector}, {
  fg: { default: 'black', theme: 'white' },
});
export const s = css.create({ a: { color: theme.fg } });
export const A = () => <div classStyle={s.a} />;
`;

describe('compiler: the createTheme selector', () => {
  it('emits the theme rule for a string literal', () => {
    const css = compile(theme(`'.dark'`));
    expect(css).toContain('.dark {');
  });

  it('emits the theme rule for a template literal', () => {
    const css = compile(theme('`.dark`'));
    expect(css).toContain('.dark {');
  });

  it('emits the theme rule for a name the file declares', () => {
    const css = compile(theme('DARK'));
    expect(css).toContain('.dark {');
  });

  it('emits the theme rule for a createStatic value', () => {
    const css = compile(theme('tokens.dark'));
    expect(css).toContain('.dark {');
  });

  // Two themes that differ only by selector used to hash alike, because an
  // unread selector collapsed both to ''.
  it('keeps two themes apart when only their selectors differ', () => {
    const css = compile(`
import * as css from '@plumeria/core';
const ONE = '.one';
const TWO = '.two';
export const t1 = css.createTheme(ONE, { fg: { default: 'black', theme: 'white' } });
export const t2 = css.createTheme(TWO, { fg: { default: 'black', theme: 'white' } });
export const s = css.create({ a: { color: t1.fg }, b: { color: t2.fg } });
export const A = () => <div classStyle={s.a} />;
export const B = () => <div classStyle={s.b} />;
`);
    expect(css).toContain('.one {');
    expect(css).toContain('.two {');
  });

  it('reports a selector it cannot read instead of dropping the theme', () => {
    expect(() =>
      compile(`
import * as css from '@plumeria/core';
export const theme = css.createTheme(readSelector(), {
  fg: { default: 'black', theme: 'white' },
});
export const s = css.create({ a: { color: theme.fg } });
export const A = () => <div classStyle={s.a} />;
`),
    ).toThrow(/needs a selector it can read at build time/);
  });
});
