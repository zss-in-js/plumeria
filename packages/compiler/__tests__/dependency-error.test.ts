import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);
const files: string[] = [];

// The consuming file is the one compiled; the file that declares the styles is
// only scanned, so an error it throws is caught there and never reaches here.
jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn((pattern: string | string[]) =>
    (Array.isArray(pattern) ? pattern : [pattern]).includes('app.tsx')
      ? [files[2]]
      : files,
  ),
}));

import { compileCSS } from '../src/index';

let fixtureCount = 0;

const BROKEN = `export const styles = css.create({
  good: { color: 'green' },
  1: { color: 'red' },
});`;

const SOUND = `export const styles = css.create({
  good: { color: 'green' },
});`;

const compile = (
  definition: string,
  usage = 'styles.good',
  through: 'the file itself' | 'a re-export' = 'the file itself',
) => {
  const id = fixtureCount++;
  const stylesPath = path.join(FIXTURE_DIR, `styles-${id}.ts`);
  const barrelPath = path.join(FIXTURE_DIR, `barrel-${id}.ts`);
  const appPath = path.join(FIXTURE_DIR, `app-${id}.tsx`);
  const from = through === 'a re-export' ? `barrel-${id}` : `styles-${id}`;

  fs.writeFileSync(
    stylesPath,
    `import * as css from '@plumeria/core';\n${definition}\n`,
    'utf-8',
  );
  fs.writeFileSync(
    barrelPath,
    `export { styles } from './styles-${id}';\n`,
    'utf-8',
  );
  fs.writeFileSync(
    appPath,
    `import * as css from '@plumeria/core';\n` +
      `import { styles } from './${from}';\n` +
      `function Test() { return 'x'; }\n` +
      `export const App = () => <div classStyle={${usage}} />;\n`,
    'utf-8',
  );

  files.length = 0;
  files.push(stylesPath, barrelPath, appPath);

  return compileCSS({ include: ['app.tsx'], exclude: ['**'] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('compiler: an error in the file a style comes from', () => {
  it('reports that error instead of the style that could not be read', () => {
    expect(() => compile(BROKEN)).toThrow(/The style key 1 is a number/);
  });

  it('names the declaring file, not the one being compiled', () => {
    expect(() => compile(BROKEN)).toThrow(/\(styles-\d+\.ts\)/);
  });

  it('names it through a file that only re-exports the style', () => {
    expect(() => compile(BROKEN, 'styles.good', 'a re-export')).toThrow(
      /The style key 1 is a number.+\(styles-\d+\.ts\)/,
    );
  });

  it('keeps the unresolvable-style message when that file is sound', () => {
    expect(() => compile(SOUND, '[styles.good, Test()]')).toThrow(
      /Dynamic or unresolvable style object "Test\(\)" is not supported/,
    );
  });
});
