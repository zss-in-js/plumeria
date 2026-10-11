import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const mockCompileCSS = jest.fn((_options: unknown) => '');
jest.mock('@plumeria/compiler', () => ({
  ...jest.requireActual('@plumeria/compiler'),
  compileCSS: (options: unknown) => mockCompileCSS(options),
}));

import cssLoader from '../src/css';

const FIXTURE_DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);

const runLoader = (options: Record<string, unknown>): Promise<void> =>
  new Promise((resolve, reject) => {
    const context = {
      getOptions: () => options,
      async: () => (err: Error | null) => (err ? reject(err) : resolve()),
      addDependency: () => {},
    };
    cssLoader.call(context);
  });

describe('turbopack-loader: options handed to compileCSS', () => {
  afterAll(() => {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockCompileCSS.mockClear();
    jest.spyOn(process, 'cwd').mockReturnValue(FIXTURE_DIR);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('forwards include and styleProp', async () => {
    await runLoader({ include: ['src/**'], styleProp: 'sx' });

    expect(mockCompileCSS).toHaveBeenCalledWith(
      expect.objectContaining({ include: ['src/**'], styleProp: 'sx' }),
    );
  });

  it('surfaces a compile error to the bundler', async () => {
    mockCompileCSS.mockImplementationOnce(() => {
      throw new Error('broken source');
    });

    await expect(runLoader({})).rejects.toThrow('broken source');
  });

  it('compiles against the project directory', async () => {
    await runLoader({});

    expect(mockCompileCSS).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: FIXTURE_DIR }),
    );
  });
});
