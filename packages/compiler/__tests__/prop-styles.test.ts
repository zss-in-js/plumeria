import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const FIXTURE_PATH = path.join(FIXTURE_DIR, 'fixture.tsx');

// compileCSS globs with `include`; scanAll globs the project root. Only the
// former should see the fixture, so scanAll stays empty and fast.
jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn((pattern: string | string[]) =>
    (Array.isArray(pattern) ? pattern : [pattern]).includes('fixture.tsx')
      ? [FIXTURE_PATH]
      : [],
  ),
}));

import { compileCSS } from '../src/index';

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const s = css.create({
  boxed: { color: 'purple' },
});

${body}
`;

const compile = (body: string, styleProp?: string) => {
  fs.writeFileSync(FIXTURE_PATH, wrap(body), 'utf-8');
  return compileCSS({ include: ['fixture.tsx'], exclude: ['**'], styleProp });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('compiler: styles passed through component props', () => {
  it('emits CSS for a style handed to a component, whatever the prop is called', () => {
    const css = compile(`export const A = () => <Card boxStyle={s.boxed} />;`);
    expect(css).toContain('color: purple');
  });

  it('emits CSS for a component prop that happens to be called style', () => {
    // The scanner registers prop styles by component, not by prop name, so
    // `style` on a component is a real styling channel and must survive.
    const css = compile(`export const A = () => <Card style={s.boxed} />;`);
    expect(css).toContain('color: purple');
  });

  it('emits CSS for a style handed to a member-chain tag', () => {
    // `<svg.Card />` is a component too, however deep the chain runs.
    const css = compile(
      `export const A = () => <icons.svg.Card boxStyle={s.boxed} />;`,
    );
    expect(css).toContain('color: purple');
  });

  it('ignores a host element attribute, which is React’s own DOM prop', () => {
    // Nothing renders these class names: the scanner only registers prop
    // styles for capitalised names, so emitting them is dead CSS.
    const css = compile(
      `export const A = () => <div style={{ display: 'flex', gap: '2px' }} />;`,
    );
    expect(css).not.toContain('display: flex');
    expect(css).not.toContain('gap: 2px');
  });

  it('still emits classStyle on a host element', () => {
    const css = compile(`export const A = () => <div classStyle={s.boxed} />;`);
    expect(css).toContain('color: purple');
  });
});

describe('compiler: a configured styleProp', () => {
  it('collects the configured prop on a host element', () => {
    const css = compile(`export const A = () => <div sx={s.boxed} />;`, 'sx');
    expect(css).toContain('color: purple');
  });

  it('stops treating the default name as the styling prop', () => {
    // With `sx` configured, `classStyle` on a host element is just an attribute
    // the transform will not rewrite, so collecting its CSS would be dead output.
    const css = compile(
      `export const A = () => <div classStyle={s.boxed} />;`,
      'sx',
    );
    expect(css).not.toContain('color: purple');
  });

  it('still exempts the configured prop from the component-prop pass', () => {
    // The component branch skips the styling prop so it is not collected twice;
    // that exemption has to follow the configured name, not the default.
    const css = compile(`export const A = () => <Card sx={s.boxed} />;`, 'sx');
    expect(css).toContain('color: purple');
  });
});
