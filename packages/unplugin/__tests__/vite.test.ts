jest.mock('@plumeria/utils', () => ({
  DEFAULT_STYLE_PROP: 'classStyle',
  optimizer: jest.fn(async (css: string) => css),
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
  createDiskCssImport: jest.fn((getRoot: () => string) => {
    getRoot();
    return () => '\nimport "./zero-virtual.css";';
  }),
}));

import vite from '../src/vite';

const { scanAll: mockScanAll } = jest.requireMock<{ scanAll: jest.Mock }>(
  '@plumeria/utils',
);
const { optimizer: mockOptimizer } = jest.requireMock<{ optimizer: jest.Mock }>(
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
  expect((vite() as any).config({}, { command: 'build' })).toMatchObject({
    build: { cssCodeSplit: false },
  });
});

it('configures RSC builds detected from environments and nested plugins', () => {
  const environmentPlugin = vite() as any;
  expect(
    environmentPlugin.config(
      { environments: { rsc: {} } },
      { command: 'build' },
    ),
  ).toMatchObject({
    environments: { rsc: { build: { cssCodeSplit: false } } },
  });

  const namedPlugin = vite() as any;
  expect(
    namedPlugin.config(
      { plugins: [null, 'ignored', [{ name: 'rsc:server' }]] },
      { command: 'build' },
    ),
  ).toMatchObject({
    environments: { rsc: { build: { cssCodeSplit: false } } },
  });

  const exactPlugin = vite() as any;
  expect(
    exactPlugin.config({ plugins: [{ name: 'rsc' }] }, { command: 'build' }),
  ).toHaveProperty('environments.rsc.build.cssCodeSplit', false);
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

it('uses the client environment graph for CSS updates', async () => {
  const cssModule = { id: CSS_ID };
  const invalidateModule = jest.fn();
  const reloadModule = jest.fn();
  const send = jest.fn();
  const clientGraph = {
    getModulesByFile: jest.fn<Set<typeof cssModule> | undefined, []>(
      () => new Set([cssModule]),
    ),
    getModuleById: jest.fn<typeof cssModule | null, []>(() => cssModule),
    invalidateModule,
  };
  const plugin = vite() as any;
  plugin.configResolved({ root: '/project', command: 'serve' });
  plugin.configureServer({
    environments: {
      client: { moduleGraph: clientGraph, hot: { send }, reloadModule },
    },
    moduleGraph: { getModuleById: jest.fn(() => null) },
  });

  await plugin.transform.call({ environment: { name: 'rsc' } }, SOURCE, ID);
  await plugin.transform.call({ environment: { name: 'rsc' } }, SOURCE, ID);
  expect(invalidateModule).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'update',
      updates: [expect.objectContaining({ path: '/src/Card.zero.css' })],
    }),
  );

  await plugin.transform.call({ environment: { name: 'client' } }, SOURCE, ID);
  await plugin.transform.call({ environment: { name: 'client' } }, SOURCE, ID);
  expect(reloadModule).toHaveBeenCalledTimes(1);
  expect(plugin.resolveId(`${CSS_ID}?direct`)).toBe(`${CSS_ID}?direct`);

  clientGraph.getModulesByFile.mockReturnValue(undefined);
  clientGraph.getModuleById.mockReturnValue(null);
  await plugin.transform.call(
    { environment: { name: 'rsc' } },
    `${SOURCE} blue`,
    ID,
  );
  expect(send).toHaveBeenCalledTimes(1);
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

it('omits CSS imports and emits one sorted stylesheet for an RSC build', async () => {
  const plugin = vite() as any;
  plugin.config({ environments: { rsc: {} } }, { command: 'build' });
  plugin.configResolved({ root: '/project', command: 'build' });

  const result = await plugin.transform(SOURCE, ID);
  expect(result.code).toBe('transformed');

  plugin.__plumeriaInternal.cssLookup.clear();
  plugin.__plumeriaInternal.cssLookup.set('/project/z.zero.css', '.z {}');
  plugin.__plumeriaInternal.cssLookup.set('/project/a.zero.css', '.a {}');
  const emitFile = jest.fn(() => 'sheet-ref');

  await plugin.buildEnd.call({ environment: { name: 'client' }, emitFile });
  await plugin.buildEnd.call({ environment: { name: 'rsc' }, emitFile });
  expect(mockOptimizer).toHaveBeenLastCalledWith('.a {}.z {}');
  expect(emitFile).toHaveBeenCalledWith({
    type: 'asset',
    name: 'plumeria.css',
    source: '.a {}.z {}',
  });

  const importedCss = { add: jest.fn() };
  const chunk = { viteMetadata: { importedCss } };
  expect(
    plugin.renderChunk.call({ environment: { name: 'client' } }, '', chunk),
  ).toBeNull();
  plugin.renderChunk.call(
    { environment: { name: 'rsc' }, getFileName: () => 'plumeria.css' },
    '',
    chunk,
  );
  expect(importedCss.add).toHaveBeenCalledWith('plumeria.css');

  plugin.buildStart();
  expect(
    plugin.renderChunk.call({ environment: { name: 'rsc' } }, '', chunk),
  ).toBeNull();
});

it('does not emit an empty RSC stylesheet or run build hooks outside RSC', async () => {
  const regularPlugin = vite() as any;
  const emitFile = jest.fn();
  await regularPlugin.buildEnd.call({ environment: { name: 'rsc' }, emitFile });
  expect(emitFile).not.toHaveBeenCalled();

  const rscPlugin = vite() as any;
  rscPlugin.config({ plugins: [{ name: 'rsc' }] }, { command: 'build' });
  mockOptimizer.mockResolvedValueOnce('');
  await rscPlugin.buildEnd.call({ environment: { name: 'rsc' }, emitFile });
  expect(emitFile).not.toHaveBeenCalled();
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

it('ignores hot updates before a development server is configured', () => {
  const plugin = vite() as any;
  expect(plugin.handleHotUpdate({ modules: [], file: ID })).toBeUndefined();
});

it('keeps build mode out of development behavior', () => {
  const plugin = vite() as any;
  plugin.configResolved({ root: '/project', command: 'build' });
  expect(plugin.__plumeriaInternal.devCssSheets.size).toBe(0);
});
