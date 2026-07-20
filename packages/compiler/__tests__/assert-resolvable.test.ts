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

const styles = css.create({
  box: { color: 'red' },
});

function Test() {
  return 'x';
}

${body}
`;

const compile = (body: string) => {
  fs.writeFileSync(FIXTURE_PATH, wrap(body), 'utf-8');
  return compileCSS({ include: ['fixture.tsx'], exclude: ['**'] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

const UNSUPPORTED = /is not supported/;

describe('compiler: assertResolvable', () => {
  it.each([
    [
      'a function call in styleName',
      'export const A = () => <div styleName={[styles.box, Test()]} />;',
    ],
    [
      'a function call nested in a ternary',
      'export const A = () => <div styleName={cond ? Test() : styles.box} />;',
    ],
    [
      'an arrow function in styleName',
      'export const A = () => <div styleName={[styles.box, () => styles.box]} />;',
    ],
    [
      'a function call in css.use()',
      'export const cls = css.use(styles.box, Test());',
    ],
  ])('throws on %s', (_label, body) => {
    expect(() => compile(body)).toThrow(UNSUPPORTED);
  });

  // `Conditional` allows undefined, so this must keep compiling.
  it('accepts undefined as a conditional branch', () => {
    expect(() =>
      compile(
        'export const A = () => <div styleName={cond ? styles.box : undefined} />;',
      ),
    ).not.toThrow();
  });
});
