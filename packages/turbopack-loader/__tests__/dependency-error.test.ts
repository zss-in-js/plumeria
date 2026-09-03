import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);
const files: string[] = [];

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => files),
}));

import loader from '../src/index';

let fixtureCount = 0;

const BROKEN = `export const styles = css.create({
  good: { color: 'green' },
  1: { color: 'red' },
});`;

const SOUND = `export const styles = css.create({
  good: { color: 'green' },
});`;

const run = (
  definition: string,
  usage = 'styles.good',
  through: 'the file itself' | 'a re-export' = 'the file itself',
): Promise<string> => {
  const id = fixtureCount++;
  const stylesPath = path.join(FIXTURE_DIR, `styles-${id}.ts`);
  const barrelPath = path.join(FIXTURE_DIR, `barrel-${id}.ts`);
  const appPath = path.join(FIXTURE_DIR, `app-${id}.tsx`);
  const from = through === 'a re-export' ? `barrel-${id}` : `styles-${id}`;
  const source =
    `import * as css from '@plumeria/core';\n` +
    `import { styles } from './${from}';\n` +
    `function Test() { return 'x'; }\n` +
    `export const App = () => <div classStyle={${usage}} />;\n`;

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
  fs.writeFileSync(appPath, source, 'utf-8');

  files.length = 0;
  files.push(stylesPath, barrelPath, appPath);

  return new Promise((resolve, reject) => {
    const ctx = {
      resourcePath: appPath,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, source);
  });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('turbopack-loader: an error in the file a style comes from', () => {
  it('reports that error instead of the style that could not be read', async () => {
    await expect(run(BROKEN)).rejects.toThrow(/The style key 1 is a number/);
  });

  it('names the declaring file, not the one being loaded', async () => {
    await expect(run(BROKEN)).rejects.toThrow(/\(styles-\d+\.ts\)/);
  });

  it('names it through a file that only re-exports the style', async () => {
    await expect(run(BROKEN, 'styles.good', 'a re-export')).rejects.toThrow(
      /The style key 1 is a number.+\(styles-\d+\.ts\)/,
    );
  });

  it('keeps the unresolvable-style message when that file is sound', async () => {
    await expect(run(SOUND, '[styles.good, Test()]')).rejects.toThrow(
      /Dynamic or unresolvable style object "Test\(\)" is not supported/,
    );
  });
});
