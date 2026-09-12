jest.mock('@plumeria/utils', () => ({
  DEFAULT_STYLE_PROP: 'classStyle',
  optimizer: async (css: string) => css,
  resolvePropertyPolicy: () => ({}),
  scanAll: jest.fn(() => ({ componentPropsTable: {} })),
  transformSource: async ({ source }: { source: string }) => ({
    code: 'transformed',
    sheets: [source.includes('blue') ? '.box { color: blue; }' : '.box {}'],
  }),
}));
jest.mock('../src/disk-css', () => ({
  ensureVirtualCssFile: jest.fn(),
  resolveVirtualCssPath: () => '/package/zero-virtual.css',
  rewriteImportPath: jest.fn(() => './zero-virtual.css'),
  writeCssBlock: jest.fn(),
  createDiskCssImport: jest.fn(() => () => '\nimport "./zero-virtual.css";'),
}));

import vite from '../src/vite';

const { scanAll: mockScanAll } = jest.requireMock<{ scanAll: jest.Mock }>(
  '@plumeria/utils',
);
const { createDiskCssImport: mockCreateDiskCssImport } = jest.requireMock<{
  createDiskCssImport: jest.Mock;
}>('../src/disk-css');

const SOURCE = `import '@plumeria/core';`;
const ID = '/project/src/Card.tsx';
const CSS_ID = '/project/src/Card.zero.css';

afterEach(() => jest.clearAllMocks());

it('merges Vite config for serve and build commands', () => {
  const plugin = vite() as any;

  expect(
    plugin.config(
      { optimizeDeps: { exclude: ['existing'] } },
      { command: 'serve' },
    ),
  ).toEqual({ optimizeDeps: { exclude: ['existing', '@plumeria/core'] } });
  expect(
    plugin.config({ build: { minify: false } }, { command: 'build' }),
  ).toMatchObject({ build: { minify: false, cssCodeSplit: false } });
});

it('reloads a changed virtual stylesheet only when it exists', async () => {
  const moduleNode = { id: CSS_ID };
  const reloadModule = jest.fn();
  const plugin = vite() as any;
  plugin.configResolved({ root: '/project', command: 'serve' });
  plugin.configureServer({
    moduleGraph: { getModuleById: jest.fn(() => moduleNode) },
    reloadModule,
  });

  await plugin.transform(SOURCE, ID);
  await plugin.transform(SOURCE, ID);
  await plugin.transform(`${SOURCE} blue`, ID);
  await plugin.transform(SOURCE, `${ID}?raw`);

  expect(reloadModule).toHaveBeenCalledTimes(3);
  expect(plugin.resolveId('/src/Card.zero.css')).toBe(CSS_ID);

  plugin.configureServer({
    moduleGraph: { getModuleById: jest.fn(() => null) },
    reloadModule,
  });
  await plugin.transform(SOURCE, ID);

  expect(plugin.resolveId('/missing.zero.css')).toBeNull();
  expect(plugin.load('/missing.zero.css')).toBeNull();
});

it('imports the shared disk file when development CSS is emitted to disk', async () => {
  const plugin = vite({ devEmitToDisk: true }) as any;
  plugin.configResolved({ root: '/project', command: 'serve' });

  const result = await plugin.transform(SOURCE, ID);

  expect(result.code).toContain('import "./zero-virtual.css";');
  expect(result.code).not.toContain('/src/Card.zero.css');
  expect(mockCreateDiskCssImport).toHaveBeenCalled();
});

it('imports the virtual module when CSS is not emitted to disk', async () => {
  const plugin = vite() as any;
  plugin.configResolved({ root: '/project', command: 'serve' });

  const result = await plugin.transform(SOURCE, ID);

  expect(result.code).toContain('import "/src/Card.zero.css";');
});

it('adds affected components and dependent targets to a hot update', () => {
  const child = { id: '/project/src/Child.tsx' };
  const dependent = { id: '/project/src/Dependent.tsx' };
  const original = { id: ID };
  const plugin = vite() as any;

  expect(plugin.handleHotUpdate({ modules: [], file: ID })).toBeUndefined();

  plugin.__plumeriaInternal.targets.push({
    id: dependent.id,
    dependencies: [ID],
  });
  plugin.__plumeriaInternal.targets.push(
    { id: ID, dependencies: [ID] },
    { id: '/project/src/Unrelated.tsx', dependencies: [] },
  );
  mockScanAll.mockReturnValue({
    componentPropsTable: {
      '/project/src/Child.tsx-Child': {
        classStyle: [{ key: 'b' }, { key: 'a' }],
      },
    },
  });
  plugin.configureServer({
    moduleGraph: {
      getModulesByFile: jest.fn(() => new Set([child, original])),
      getModuleById: jest.fn(() => dependent),
    },
  });

  expect(plugin.handleHotUpdate({ modules: [original], file: ID })).toEqual([
    original,
    child,
    dependent,
  ]);
  expect(plugin.handleHotUpdate({ modules: [original], file: ID })).toEqual([
    original,
    dependent,
  ]);
  expect(
    plugin.handleHotUpdate({
      modules: [original],
      file: '/project/node_modules/pkg/index.ts',
    }),
  ).toEqual([original]);

  mockScanAll.mockReturnValue({ componentPropsTable: undefined });
  plugin.configureServer({
    moduleGraph: {
      getModulesByFile: jest.fn(() => undefined),
      getModuleById: jest.fn(() => null),
    },
  });
  expect(plugin.handleHotUpdate({ modules: [], file: '/other.ts' })).toEqual(
    [],
  );
});

it('keeps build mode out of development behavior', () => {
  const plugin = vite() as any;
  plugin.configResolved({ root: '/project', command: 'build' });
  expect(plugin.__plumeriaInternal.devCssSheets.size).toBe(0);
});
