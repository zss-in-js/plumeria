import * as path from 'path';

const mockCompileCSS = jest.fn(() => '.production {}');
const mockTransformSource = jest.fn(async () => ({
  code: 'transformed',
  sheets: ['.generated {}'],
}));
const mockWriteFileSync = jest.fn();
let mockSharedCss: string | undefined;
let mockTemporaryCss: string | undefined;

jest.mock('@plumeria/compiler', () => ({ compileCSS: mockCompileCSS }));
jest.mock('@plumeria/utils', () => ({
  DEFAULT_STYLE_PROP: 'classStyle',
  optimizer: async (css: string) => css,
  resolvePropertyPolicy: () => ({}),
  transformSource: mockTransformSource,
}));
jest.mock('../src/file-lock', () => ({
  acquireLock: async () => {},
  releaseLockSync: () => {},
}));
jest.mock('fs', () => ({
  readFileSync: (file: string) => {
    if (file.includes('zero-virtual.css')) {
      if (mockSharedCss === undefined) throw new Error('ENOENT');
      return mockSharedCss;
    }
    return jest.requireActual('fs').readFileSync(file, 'utf-8');
  },
  writeFileSync: (file: string, content: string) => {
    mockWriteFileSync(file, content);
    if (file.endsWith('.tmp')) mockTemporaryCss = content;
    else if (file.includes('zero-virtual.css')) mockSharedCss = content;
  },
  renameSync: (_from: string, to: string) => {
    if (to.includes('zero-virtual.css')) mockSharedCss = mockTemporaryCss;
  },
}));

type Loader = (this: unknown, source: string) => Promise<void>;

const freshLoader = (): Loader => {
  let loader: Loader | undefined;
  jest.isolateModules(() => {
    loader = require('../src/index').default;
  });
  return loader as Loader;
};

const runLoader = (
  loader: Loader,
  source: string,
  context: Record<string, unknown> = {},
): Promise<string> =>
  new Promise((resolve, reject) => {
    loader.call(
      {
        resourcePath: path.resolve(__dirname, '..', 'fixture.tsx'),
        async: () => (error: Error | null, content?: string) =>
          error ? reject(error) : resolve(content as string),
        addDependency: () => {},
        clearDependencies: () => {},
        ...context,
      },
      source,
    );
  });

const SOURCE = `import '@plumeria/core';`;
const originalNodeEnv = process.env.NODE_ENV;
const setNodeEnv = (value: string | undefined) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

afterEach(() => {
  setNodeEnv(originalNodeEnv);
  mockCompileCSS.mockClear();
  mockTransformSource.mockClear();
  mockWriteFileSync.mockClear();
  mockSharedCss = undefined;
  mockTemporaryCss = undefined;
});

it('returns sources outside the loader scope unchanged', async () => {
  const loader = freshLoader();

  await expect(runLoader(loader, 'export {};')).resolves.toBe('export {};');
  await expect(
    runLoader(loader, SOURCE, {
      resourcePath: '/project/node_modules/dependency.ts',
    }),
  ).resolves.toBe(SOURCE);

  expect(mockTransformSource).not.toHaveBeenCalled();
});

it('supports query options and prefixes a same-directory virtual import', async () => {
  setNodeEnv('test');

  const output = await runLoader(freshLoader(), SOURCE, {
    query: { styleProp: 'sx' },
  });

  expect(mockTransformSource).toHaveBeenCalledWith(
    expect.objectContaining({ styleProp: 'sx' }),
  );
  expect(output).toBe('transformed\nimport "./zero-virtual.css";');
});

it('does not rewrite a development rule that already exists', async () => {
  setNodeEnv('development');
  const loader = freshLoader();

  await runLoader(loader, SOURCE);
  await runLoader(loader, SOURCE);

  expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
});

it('skips an already generated production stylesheet', async () => {
  setNodeEnv('production');
  mockSharedCss = '/* plumeria: generated */\n.existing {}';

  await runLoader(freshLoader(), SOURCE);

  expect(mockCompileCSS).not.toHaveBeenCalled();
});

it('reuses the completed production generation', async () => {
  setNodeEnv('production');
  const loader = freshLoader();

  await runLoader(loader, SOURCE);
  await runLoader(loader, SOURCE);

  expect(mockCompileCSS).toHaveBeenCalledTimes(1);
});
