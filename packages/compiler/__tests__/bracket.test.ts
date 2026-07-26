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
  p1: { color: 'green' },
  p2: { color: 'purple' },
  p3: { color: 'teal' },
});

${body}
`;

const compile = (body: string) => {
  fs.writeFileSync(FIXTURE_PATH, wrap(body), 'utf-8');
  return compileCSS({ include: ['fixture.tsx'], exclude: ['**'] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('compiler: bracket notation emits CSS', () => {
  it('emits only the selected rule for a string literal key', () => {
    const css = compile(`export const A = () => <div styleName={s['p2']} />;`);
    expect(css).toContain('color: purple');
    expect(css).not.toContain('color: green');
  });

  // A non-literal key is not narrowed here: extraction stays conservative and
  // emits every candidate, because the runtime lookup picks one of them.
  it('emits every candidate for a local const key', () => {
    const css = compile(`
      export const A = () => {
        const k = 'p1';
        return <div styleName={s[k]} />;
      };
    `);
    expect(css).toContain('color: green');
    expect(css).toContain('color: purple');
  });

  it('emits every branch for a dynamic key', () => {
    const css = compile(`
      export const A = ({ k }: { k: 'p1' | 'p2' | 'p3' }) => (
        <div styleName={s[k]} />
      );
    `);
    expect(css).toContain('color: green');
    expect(css).toContain('color: purple');
    expect(css).toContain('color: teal');
  });

  it('emits bracket entries combined in a styleName array', () => {
    const css = compile(`
      const t = css.create({ big: { fontSize: '20px' } });
      export const A = ({ k }: { k: 'p1' | 'p2' }) => (
        <div styleName={[t.big, s[k]]} />
      );
    `);
    expect(css).toContain('font-size: 20px');
    expect(css).toContain('color: green');
    expect(css).toContain('color: purple');
  });

  it('emits bracket entries passed through css.use()', () => {
    const css = compile(`
      export const cls = ({ k }: { k: 'p1' | 'p2' }) => css.use(s[k]);
    `);
    expect(css).toContain('color: green');
    expect(css).toContain('color: purple');
  });

  it('emits bracket access assigned to an intermediate variable', () => {
    const css = compile(`
      export const A = () => {
        const alias = s['p3'];
        return <div styleName={alias} />;
      };
    `);
    expect(css).toContain('color: teal');
  });
});
