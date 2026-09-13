jest.mock('@plumeria/utils', () => ({
  DEFAULT_STYLE_PROP: 'classStyle',
  optimizer: jest.fn(async (css: string) => css),
  resolvePropertyPolicy: jest.fn(() => ({ policy: true })),
  transformSource: jest.fn(
    async ({
      source,
      addDependency,
    }: {
      source: string;
      addDependency: (path: string) => void;
    }) => {
      addDependency('/dependency.ts');
      return {
        code: 'transformed',
        sheets: source.includes('EMPTY')
          ? []
          : source.includes('SECOND')
            ? ['.second {}']
            : ['.generated {}'],
      };
    },
  ),
}));

import { unpluginFactory } from '../src/core';

const { transformSource: mockTransformSource } = jest.requireMock<{
  transformSource: jest.Mock;
}>('@plumeria/utils');
const { optimizer: mockOptimizer, resolvePropertyPolicy: mockPolicy } =
  jest.requireMock<{
    optimizer: jest.Mock;
    resolvePropertyPolicy: jest.Mock;
  }>('@plumeria/utils');

const SOURCE = `import '@plumeria/core';`;
const createPlugin = (options?: Parameters<typeof unpluginFactory>[0]) =>
  unpluginFactory(options, { framework: 'rollup' } as never) as any;

beforeEach(() => jest.clearAllMocks());

it('exposes metadata and applies plugin options', () => {
  const plugin = createPlugin({
    include: '**/*.tsx',
    styleProp: 'css',
    withoutPhysicalProperties: true,
  });

  expect(plugin).toMatchObject({ name: '@plumeria/unplugin', enforce: 'pre' });
  expect(plugin.__plumeriaInternal.unpluginMeta).toEqual({
    framework: 'rollup',
  });
  expect(plugin.transformInclude('/project/Card.tsx')).toBe(true);
  expect(plugin.transformInclude('/project/Card.ts')).toBe(false);
  expect(mockPolicy).toHaveBeenCalledWith(
    expect.objectContaining({ withoutPhysicalProperties: true }),
  );
});

it('resolves and identifies virtual CSS ids', () => {
  const plugin = createPlugin();

  expect(plugin.resolveId('/project/Card.zero.css?direct')).toBe(
    '/project/Card.zero.css?direct',
  );
  expect(plugin.resolveId('./Card.zero.css?direct', '/project/source.ts')).toBe(
    '/project/Card.zero.css?direct',
  );
  expect(plugin.resolveId('./Card.zero.css', '/project/source.ts')).toBe(
    '/project/Card.zero.css',
  );
  expect(plugin.resolveId('/project/source.ts')).toBeNull();
  expect(plugin.loadInclude('/project/Card.zero.css?direct')).toBe(true);
  expect(plugin.loadInclude('/project/Card.tsx')).toBe(false);
});

it('keeps unresolved relative virtual CSS ids intact', () => {
  const plugin = createPlugin();

  expect(plugin.resolveId('Card.zero.css')).toBe('Card.zero.css');
  expect(plugin.resolveId('Card.zero.css?direct')).toBe('Card.zero.css?direct');
});

it('skips dependencies, unrelated sources, and excluded files', async () => {
  const plugin = createPlugin({ exclude: '**/excluded.ts' });

  await expect(
    plugin.transform(SOURCE, '/project/node_modules/pkg/index.ts'),
  ).resolves.toBeNull();
  await expect(
    plugin.transform('export {};', '/project/source.ts'),
  ).resolves.toBeNull();
  await expect(
    plugin.transform(SOURCE, '/project/excluded.ts?raw'),
  ).resolves.toBeNull();

  expect(mockTransformSource).not.toHaveBeenCalled();
});

it('updates and removes an existing target without a watch callback', async () => {
  const plugin = createPlugin();
  const id = '/project/source.ts';

  await plugin.transform.call({}, SOURCE, id);
  await plugin.transform.call({}, SOURCE, id);
  expect(plugin.__plumeriaInternal.targets).toEqual([
    { id, dependencies: ['/dependency.ts'] },
  ]);

  await plugin.transform.call({}, `${SOURCE} EMPTY`, id);
  expect(plugin.__plumeriaInternal.targets).toEqual([]);
});

it('stores and loads generated CSS through virtual and filesystem ids', async () => {
  const plugin = createPlugin({ styleProp: 'css' });
  const addWatchFile = jest.fn();
  const id = '/project/source.tsx?raw';

  plugin.__plumeriaInternal.setRoot('/project');
  const result = await plugin.transform.call({ addWatchFile }, SOURCE, id);

  expect(result).toEqual({
    code: 'transformed\nimport "/source.zero.css";',
    map: null,
  });
  expect(addWatchFile).toHaveBeenCalledWith('/dependency.ts');
  expect(mockTransformSource).toHaveBeenCalledWith(
    expect.objectContaining({
      moduleId: id,
      filePath: '/project/source.tsx',
      root: '/project',
      styleProp: 'css',
      propertyPolicy: { policy: true },
      isDev: false,
      collectOndemandSheets: true,
    }),
  );
  expect(plugin.load('/source.zero.css?direct')).toBe('.generated {}');
  expect(plugin.load('/project/source.zero.css')).toBe('.generated {}');
  expect(plugin.load('/missing.zero.css')).toBe('');
});

it('uses a custom CSS import formatter and permits omitting the import', async () => {
  const plugin = createPlugin();
  const formatter = jest.fn(() => null);
  plugin.__plumeriaInternal.setRoot('/project');
  plugin.__plumeriaInternal.setCssImport(formatter);

  await expect(plugin.transform(SOURCE, '/project/Card.ts')).resolves.toEqual({
    code: 'transformed',
    map: null,
  });
  expect(formatter).toHaveBeenCalledWith({
    id: '/project/Card.ts',
    cssId: '/Card.zero.css',
    cssFilename: '/project/Card.zero.css',
    css: '.generated {}',
  });

  plugin.__plumeriaInternal.setCssImport(null);
  await expect(plugin.transform(SOURCE, '/project/Card.ts')).resolves.toEqual(
    expect.objectContaining({ code: 'transformed\nimport "/Card.zero.css";' }),
  );
});

it('falls back to empty CSS for a formatter and handles an empty first pass', async () => {
  const plugin = createPlugin();
  const formatter = jest.fn(() => '');
  plugin.__plumeriaInternal.setCssImport(formatter);
  mockOptimizer.mockResolvedValueOnce(undefined);

  await plugin.transform(SOURCE, '/project/Card.ts');
  expect(formatter).toHaveBeenCalledWith(expect.objectContaining({ css: '' }));

  const emptyPlugin = createPlugin();
  await expect(
    emptyPlugin.transform(`${SOURCE} EMPTY`, '/project/Empty.ts'),
  ).resolves.toEqual({ code: 'transformed', map: null });
  expect(emptyPlugin.__plumeriaInternal.targets).toEqual([]);
});

it('accumulates development CSS and keeps re-added sheets latest', async () => {
  const plugin = createPlugin();
  plugin.__plumeriaInternal.setRoot('/project');
  plugin.__plumeriaInternal.setDev(true);

  await plugin.transform(SOURCE, '/project/Card.ts');
  await plugin.transform(`${SOURCE} SECOND`, '/project/Card.ts');
  await plugin.transform(SOURCE, '/project/Card.ts');

  expect(plugin.load('/Card.zero.css')).toBe('.second {}.generated {}');
  expect(
    plugin.__plumeriaInternal.devCssSheets.get('/project/Card.zero.css'),
  ).toEqual(new Set(['.second {}', '.generated {}']));
  expect(mockOptimizer).toHaveBeenLastCalledWith('.second {}.generated {}');
});
