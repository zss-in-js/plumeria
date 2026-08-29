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

const keyframes = `
import * as css from '@plumeria/core';
export const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
`;

const viewTransition = `
import * as css from '@plumeria/core';
export const vt = css.viewTransition({ old: { animationDuration: '1s' }, new: { animationDuration: '2s' } });
`;

// A binding read through a template or a concatenation is the same value as
// the binding read on its own, so it has to compile to the same name and pull
// the same rule into the sheet.
describe('compiler: a keyframes or viewTransition binding read inside a value', () => {
  it('names the animation and emits its keyframes from a shorthand', () => {
    const css = compile(
      keyframes +
        `
export const s = css.create({ a: { animation: \`\${fade} 1s ease\` } });
export const A = () => <div classStyle={s.a} />;
`,
    );
    expect(css).toMatch(/animation: kf-\w+ 1s ease/);
    expect(css).toContain('@keyframes kf-');
  });

  it('gives a template the same animation name as animationName', () => {
    const direct = compile(
      keyframes +
        `
export const s = css.create({ a: { animationName: fade } });
export const A = () => <div classStyle={s.a} />;
`,
    );
    const templated = compile(
      keyframes +
        `
export const s = css.create({ a: { animationName: \`\${fade}\` } });
export const A = () => <div classStyle={s.a} />;
`,
    );
    const nameOf = (css: string) => css.match(/animation-name: (\S+);/)?.[1];
    expect(nameOf(templated)).toBe(nameOf(direct));
    expect(nameOf(templated)).toMatch(/^kf-/);
  });

  it('emits the view transition rules for a name read through a template', () => {
    const css = compile(
      viewTransition +
        `
export const s = css.create({ a: { viewTransitionName: \`\${vt}\` } });
export const A = () => <div classStyle={s.a} />;
`,
    );
    expect(css).toMatch(/view-transition-name: vt-\w+;/);
    expect(css).toContain('::view-transition-old(vt-');
    expect(css).toContain('::view-transition-new(vt-');
  });

  it('emits the keyframes for a binding concatenated onto a string', () => {
    const css = compile(
      keyframes +
        `
export const s = css.create({ a: { animation: fade + ' 2s linear' } });
export const A = () => <div classStyle={s.a} />;
`,
    );
    expect(css).toMatch(/animation: kf-\w+ 2s linear/);
    expect(css).toContain('@keyframes kf-');
  });
});
