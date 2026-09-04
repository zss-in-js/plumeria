import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const FIXTURE_PATH = path.join(FIXTURE_DIR, 'fixture.tsx');

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn((pattern: string | string[]) =>
    (Array.isArray(pattern) ? pattern : [pattern]).includes('fixture.tsx')
      ? [FIXTURE_PATH]
      : [],
  ),
}));

import { compileCSS } from '../src/index';

const compile = (body: string) => {
  fs.writeFileSync(FIXTURE_PATH, body, 'utf-8');
  return compileCSS({ include: ['fixture.tsx'], exclude: ['**'] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('compiler: dynamic function keys', () => {
  it('emits a parameter default as the variable fallback', () => {
    // One class serves both call sites: the default lives in the sheet and an
    // argument overrides it through the variable.
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({ tinted: (c = 'teal') => ({ color: c }) });
export const A = () => <div classStyle={s.tinted()} />;
export const B = (p: any) => <div classStyle={s.tinted(p.c)} />;
`);
    expect(css).toContain('color: var(--xefxcruu-c, teal)');
    expect(css.match(/color: var\(/g)).toHaveLength(1);
  });

  it('keeps the value around a defaulted parameter', () => {
    // The fallback belongs to the variable reference, not to the declaration,
    // so the text on either side of it has to survive.
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({
  grad: (c = 'teal') => ({ background: \`linear-gradient(\${c}, #000)\` }),
  twice: (g = 'red') => ({ background: \`linear-gradient(\${g}, \${g})\` }),
});
export const A = () => <div classStyle={s.grad()} />;
export const B = () => <div classStyle={s.twice()} />;
`);
    expect(css).toMatch(
      /background: linear-gradient\(var\(--[a-z0-9]+-c, teal\), black\)/,
    );
    expect(css).toMatch(
      /background: linear-gradient\(var\(--([a-z0-9]+)-g, red\), var\(--\1-g, red\)\)/,
    );
  });

  it('reaches every declaration the parameter lands in', () => {
    // The unit is decided per declaration, so the fallback cannot be built
    // once from whichever property happens to come first.
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({
  paired: (c = 'red') => ({ color: c, ':hover': { borderColor: c } }),
  units: (n = 4) => ({ padding: n, zIndex: n }),
});
export const A = () => <div classStyle={s.paired()} />;
export const B = () => <div classStyle={s.units()} />;
`);
    expect(css).toMatch(/color: var\(--([a-z0-9]+)-c, red\)/);
    expect(css).toMatch(/border-color: var\(--[a-z0-9]+-c, red\)/);
    expect(css).toMatch(/padding: var\(--[a-z0-9]+-n, 4px\)/);
    expect(css).toMatch(/z-index: var\(--[a-z0-9]+-n-z-index, 4\)/);
  });

  it('gives a numeric default its unit', () => {
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({ spaced: (n = 4) => ({ padding: n }) });
export const A = () => <div classStyle={s.spaced()} />;
`);
    expect(css).toContain('padding: var(--x4zkwd45-n, 4px)');
  });

  it('emits a destructured default as the variable fallback', () => {
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({ toned: ({ tone = 'navy' }) => ({ backgroundColor: tone }) });
export const A = () => <div classStyle={s.toned({})} />;
`);
    expect(css).toMatch(/background-color: var\(--[a-z0-9]+-tone, navy\)/);
  });

  it('emits a plain rule for a style function that takes no parameter', () => {
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({ plain: () => ({ color: 'olive' }) });
export const A = () => <div classStyle={s.plain()} />;
`);
    expect(css).toContain('color: olive');
    expect(css).not.toContain('var(');
  });

  it('emits the variable under the same class the transform writes', () => {
    // The class hash is derived from the declaration text, so the variable
    // name here has to match the one the bundler plugin puts in `style`.
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({ palette: (color: string) => ({ color }) });
export const A = (p: any) => <div classStyle={s.palette(p.c)} />;
`);
    expect(css).toContain('.xokp0532');
    expect(css).toContain('color: var(--x80848wl-color)');
  });

  it('emits the rule for a call that only applies under a condition', () => {
    // The class is chosen at runtime, so the rule behind it has to be in the
    // sheet whichever way the condition goes.
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({ plain: { color: 'gray' }, palette: (color: string) => ({ color }) });
export const A = (p: any) => <div classStyle={p.on ? s.palette(p.c) : s.plain} />;
export const B = (p: any) => <div classStyle={p.on && s.palette(p.d)} />;
`);
    expect(css).toContain('.xokp0532 { color: var(--x80848wl-color); }');
    expect(css).toContain('color: gray');
  });

  it('emits the same rule whether the parameter is named or positional', () => {
    const css = compile(`
import * as css from '@plumeria/core';
const s = css.create({
  positional: (tone: string) => ({ color: tone }),
  named: ({ tone }: { tone: string }) => ({ color: tone }),
});
export const A = (p: any) => (<div>
  <i classStyle={s.positional(p.t)} />
  <b classStyle={s.named({ tone: p.t })} />
</div>);
`);
    // One declaration, so one hash and one custom property, written twice.
    expect(css.match(/color: var\(--[^)]+\)/g)).toEqual([
      'color: var(--x1gfjogo-tone)',
    ]);
  });

  it('keeps two creates that share a key name apart', () => {
    const css = compile(`
import * as css from '@plumeria/core';
const a = css.create({ palette: (color: string) => ({ backgroundColor: color }) });
const b = css.create({ palette: (color: string) => ({ borderColor: color }) });
export const B = (p: any) => <div classStyle={[a.palette(p.x), b.palette(p.y)]} />;
`);
    expect(css).toContain('background-color: var(--xav007xm-color)');
    expect(css).toContain('border-color: var(--xcf1maiq-color)');
  });
});
