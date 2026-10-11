import * as path from 'path';

const mockCompileCSS = jest.fn((_options: unknown) => '.production {}');
const mockTransformSource = jest.fn((_options: unknown) => ({
  code: 'transformed',
}));
const mockWriteFileSync = jest.fn();

jest.mock('@plumeria/compiler', () => ({
  compileCSS: (options: unknown) => mockCompileCSS(options),
  DEFAULT_STYLE_PROP: 'classStyle',
  needsCompile: jest.requireActual('@plumeria/compiler').needsCompile,
  optimizer: (css: string) => css,
  resolvePropertyPolicy: () => ({}),
  transformSource: (options: unknown) => mockTransformSource(options),
}));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
}));

import loader from '../src/index';

type Loader = (this: unknown, source: string) => Promise<void>;

const runLoader = (
  source: string,
  context: Record<string, unknown> = {},
): Promise<string> =>
  new Promise((resolve, reject) => {
    (loader as unknown as Loader).call(
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
});

it('returns sources outside the loader scope unchanged', async () => {
  await expect(runLoader('export {};')).resolves.toBe('export {};');
  await expect(
    runLoader(SOURCE, {
      resourcePath: '/project/node_modules/dependency.ts',
    }),
  ).resolves.toBe(SOURCE);

  expect(mockTransformSource).not.toHaveBeenCalled();
});

it('supports query options and prefixes a same-directory virtual import', async () => {
  const output = await runLoader(SOURCE, {
    query: { styleProp: 'sx' },
  });

  expect(mockTransformSource).toHaveBeenCalledWith(
    expect.objectContaining({ styleProp: 'sx' }),
  );
  expect(output).toBe('transformed\nimport "./zero-virtual.css";');
});

it.each(['development', 'production'])(
  'leaves the stylesheet to the CSS loader in %s',
  async (mode) => {
    setNodeEnv(mode);

    await runLoader(SOURCE);

    expect(mockTransformSource).toHaveBeenCalled();
    expect(mockCompileCSS).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  },
);
