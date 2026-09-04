import * as os from 'os';
import * as path from 'path';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

const mockCompileCSS = jest.fn(() => '');
jest.mock('@plumeria/compiler', () => ({ compileCSS: mockCompileCSS }));

import * as fs from 'fs';

const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');
const FIXTURE_DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);

const SOURCE = `import * as css from '@plumeria/core';
const styles = css.create({ box: { color: 'red' } });
export const Box = () => <div classStyle={styles.box} />;
`;

let fixtureCount = 0;

/** The production compile is memoised per module instance, so each case needs a fresh one. */
const freshLoader = (): ((this: unknown, source: string) => Promise<void>) => {
  let mod: { default?: unknown } = {};
  jest.isolateModules(() => {
    mod = require('../src/index');
  });
  return mod.default as (this: unknown, source: string) => Promise<void>;
};

const runLoader = (options: Record<string, unknown>): Promise<void> =>
  new Promise((resolve, reject) => {
    const context = {
      resourcePath: path.join(FIXTURE_DIR, `p-${fixtureCount++}.tsx`),
      getOptions: () => options,
      async: () => (err: Error | null) => (err ? reject(err) : resolve()),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    Promise.resolve(freshLoader().call(context, SOURCE)).catch(reject);
  });

/**
 * The production path re-scans every file through compileCSS rather than
 * through the loader, so it is the one place a loader option has to be handed
 * across a package boundary by name. A field dropped here applies the policy
 * in dev and silently skips it in the build.
 */
describe('turbopack-loader: options handed to the production compile', () => {
  const NODE_ENV = process.env.NODE_ENV;
  let backup: string | null = null;

  beforeAll(() => {
    try {
      backup = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');
    } catch {
      backup = null;
    }
    (process.env as Record<string, string>).NODE_ENV = 'production';
  });

  afterAll(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = NODE_ENV;
    if (backup === null) fs.rmSync(VIRTUAL_FILE_PATH, { force: true });
    else fs.writeFileSync(VIRTUAL_FILE_PATH, backup, 'utf-8');
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockCompileCSS.mockClear();
    fs.rmSync(VIRTUAL_FILE_PATH, { force: true });
  });

  it('forwards withoutLogicalProperties', async () => {
    await runLoader({ withoutLogicalProperties: { sizes: true } });

    expect(mockCompileCSS).toHaveBeenCalledWith(
      expect.objectContaining({ withoutLogicalProperties: { sizes: true } }),
    );
  });

  it('forwards withoutPhysicalProperties', async () => {
    await runLoader({ withoutPhysicalProperties: true });

    expect(mockCompileCSS).toHaveBeenCalledWith(
      expect.objectContaining({ withoutPhysicalProperties: true }),
    );
  });

  it('still forwards the options it carried before', async () => {
    await runLoader({ include: ['src/**'], styleProp: 'sx' });

    expect(mockCompileCSS).toHaveBeenCalledWith(
      expect.objectContaining({ include: ['src/**'], styleProp: 'sx' }),
    );
  });
});
