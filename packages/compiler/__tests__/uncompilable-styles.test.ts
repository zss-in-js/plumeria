// The bundler plugins refuse a style declaration they cannot register and a
// dynamic function key handed to `css.use()`. The compiler used to accept both:
// it skipped the declaration and emitted nothing for it, or emitted a rule
// reading a custom property that nothing on the page would ever set. Either way
// the styles went missing with no diagnostic.
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

const compile = (body: string) => {
  fs.writeFileSync(
    FIXTURE_PATH,
    `import * as css from '@plumeria/core';\n${body}\n`,
    'utf-8',
  );
  return compileCSS({ include: ['fixture.tsx'], exclude: ['**'] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

const UNNAMED = /must be assigned to a named top-level variable/;

describe('compiler: a style declaration it cannot register', () => {
  it.each([
    [
      'a default-exported call',
      `export default css.create({ a: { color: 'teal' } });`,
    ],
    [
      'a destructured call',
      `const { a } = css.create({ a: { color: 'purple' } });\n` +
        `export const A = () => <div classStyle={a} />;`,
    ],
    [
      'a call that is only a statement',
      `css.createTheme('.dark', { color: { default: 'red', theme: 'blue' } });`,
    ],
  ])('refuses %s instead of skipping it', (_name, body) => {
    expect(() => compile(body)).toThrow(UNNAMED);
  });

  it('still compiles the styles of a sound declaration beside one it refuses', () => {
    expect(() =>
      compile(
        `const ok = css.create({ b: { color: 'olive' } });\n` +
          `export default css.create({ a: { color: 'teal' } });\n` +
          `export const A = () => <div classStyle={ok.b} />;`,
      ),
    ).toThrow(UNNAMED);
  });
});

describe('compiler: a dynamic function key handed to css.use()', () => {
  const STYLES = `const s = css.create({\n  flat: { color: 'navy' },\n  box: (w: number) => ({ width: w }),\n});\n`;

  // A call would resolve to a class name and a custom property the element
  // carries. `css.use()` returns only the class name, so the property is never
  // set and the rule reads a variable nothing defines.
  it('refuses a called function key', () => {
    expect(() =>
      compile(`${STYLES}export const cls = css.use(s.box(4));`),
    ).toThrow(/does not support dynamic function keys/);
  });

  it('refuses an uncalled function key', () => {
    expect(() =>
      compile(`${STYLES}export const cls = css.use(s.box);`),
    ).toThrow(
      /Dynamic or unresolvable style object "css\.use\(s\.box\)" is not supported/,
    );
  });

  it('refuses one listed beside a plain key', () => {
    expect(() =>
      compile(`${STYLES}export const cls = css.use([s.flat, s.box]);`),
    ).toThrow(/is not supported/);
  });

  it('keeps compiling a plain key', () => {
    expect(compile(`${STYLES}export const cls = css.use(s.flat);`)).toContain(
      'color: navy',
    );
  });

  // The element carries the custom property, so the same key is sound there.
  it('keeps compiling a called function key on an element', () => {
    expect(
      compile(`${STYLES}export const A = () => <div classStyle={s.box(4)} />;`),
    ).toContain('width: var(');
  });
});
