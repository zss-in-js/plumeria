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
