import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
let fixturePath = '';

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => [fixturePath]),
}));

import { compileCSS } from '../src/index';

let fixtureCount = 0;

// The value a constant holds is read out of the table the file's own constants
// are collected into, so a path is only worth as much as both halves together:
// what the collector folded in has to be what the resolver can reach.
const compile = (body: string) => {
  fixturePath = path.join(FIXTURE_DIR, `fixture-${fixtureCount++}.tsx`);
  fs.writeFileSync(
    fixturePath,
    `import * as css from '@plumeria/core';\n${body}\n`,
    'utf-8',
  );
  return compileCSS({ include: ['fixture.tsx'], exclude: ['**'] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('compiler: a constant read through a path', () => {
  it('emits the rule for a value nested deeper than one property', () => {
    const css = compile(
      `const theme = { colors: { brand: { primary: 'blue' } } };\n` +
        `const styles = css.create({ root: { color: theme.colors.brand.primary } });\n` +
        `export const App = () => <div classStyle={styles.root} />;`,
    );
    expect(css).toContain('color: blue');
  });

  it('emits the whole value when a path is interpolated into it', () => {
    // An unresolved interpolation is not dropped: it leaves the rest of the
    // value behind as a rule that renders, so it has to resolve or nothing
    // reports that the padding is wrong.
    const css = compile(
      `const theme = { space: { sm: '4px' } };\n` +
        'const styles = css.create({ root: { padding: `${theme.space.sm} 0` } });\n' +
        `export const App = () => <div classStyle={styles.root} />;`,
    );
    expect(css).toContain('padding: 4px 0');
  });
});
