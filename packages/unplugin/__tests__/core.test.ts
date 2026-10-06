jest.mock('@plumeria/eslint-plugin/guard', () => ({
  startLintGuard: jest.fn(),
}));
jest.mock('@plumeria/compiler', () => ({
  DEFAULT_STYLE_PROP: 'classStyle',
  needsCompile: jest.requireActual('@plumeria/compiler').needsCompile,
  optimizer: jest.fn((css: string) => css),
  resolvePropertyPolicy: jest.fn(() => ({ policy: true })),
  transformSource: jest.fn(
    ({
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
}>('@plumeria/compiler');
const { optimizer: mockOptimizer, resolvePropertyPolicy: mockPolicy } =
  jest.requireMock<{
    optimizer: jest.Mock;
    resolvePropertyPolicy: jest.Mock;
  }>('@plumeria/compiler');

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
    plugin.transform.handler(SOURCE, '/project/node_modules/pkg/index.ts'),
  ).resolves.toBeNull();
  await expect(
    plugin.transform.handler('export {};', '/project/source.ts'),
  ).resolves.toBeNull();
  await expect(
    plugin.transform.handler(SOURCE, '/project/excluded.ts?raw'),
  ).resolves.toBeNull();

  expect(mockTransformSource).not.toHaveBeenCalled();
});

it('updates and removes an existing target without a watch callback', async () => {
  const plugin = createPlugin();
  const id = '/project/source.ts';

  await plugin.transform.handler.call({}, SOURCE, id);
  await plugin.transform.handler.call({}, SOURCE, id);
  expect(plugin.__plumeriaInternal.targets).toEqual([
    { id, dependencies: ['/dependency.ts'] },
  ]);

  await plugin.transform.handler.call({}, `${SOURCE} EMPTY`, id);
  expect(plugin.__plumeriaInternal.targets).toEqual([]);
});

it('stores and loads generated CSS through virtual and filesystem ids', async () => {
  const plugin = createPlugin({ styleProp: 'css' });
  const addWatchFile = jest.fn();
  const id = '/project/source.tsx?raw';

  plugin.__plumeriaInternal.setRoot('/project');
  const result = await plugin.transform.handler.call(
    { addWatchFile },
    SOURCE,
    id,
  );

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

  await expect(
    plugin.transform.handler(SOURCE, '/project/Card.ts'),
  ).resolves.toEqual({
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
  await expect(
    plugin.transform.handler(SOURCE, '/project/Card.ts'),
  ).resolves.toEqual(
    expect.objectContaining({ code: 'transformed\nimport "/Card.zero.css";' }),
  );
});

it('falls back to empty CSS for a formatter and handles an empty first pass', async () => {
  const plugin = createPlugin();
  const formatter = jest.fn(() => '');
  plugin.__plumeriaInternal.setCssImport(formatter);
  mockOptimizer.mockReturnValueOnce(undefined);

  await plugin.transform.handler(SOURCE, '/project/Card.ts');
  expect(formatter).toHaveBeenCalledWith(expect.objectContaining({ css: '' }));

  const emptyPlugin = createPlugin();
  await expect(
    emptyPlugin.transform.handler(`${SOURCE} EMPTY`, '/project/Empty.ts'),
  ).resolves.toEqual({ code: 'transformed', map: null });
  expect(emptyPlugin.__plumeriaInternal.targets).toEqual([]);
});

it('accumulates development CSS and keeps re-added sheets latest', async () => {
  const plugin = createPlugin();
  plugin.__plumeriaInternal.setRoot('/project');
  plugin.__plumeriaInternal.setDev(true);

  await plugin.transform.handler(SOURCE, '/project/Card.ts');
  await plugin.transform.handler(`${SOURCE} SECOND`, '/project/Card.ts');
  await plugin.transform.handler(SOURCE, '/project/Card.ts');

  expect(plugin.load('/Card.zero.css')).toBe('.second {}.generated {}');
  expect(
    plugin.__plumeriaInternal.devCssSheets.get('/project/Card.zero.css'),
  ).toEqual(new Set(['.second {}', '.generated {}']));
  expect(mockOptimizer).toHaveBeenLastCalledWith('.second {}.generated {}');
  expect(mockOptimizer).toHaveBeenCalledTimes(3);
});

describe('the lint guard', () => {
  const { startLintGuard } = jest.requireMock<{ startLintGuard: jest.Mock }>(
    '@plumeria/eslint-plugin/guard',
  );
  const create = (lint?: boolean) =>
    unpluginFactory(lint === undefined ? {} : { lint }, {} as never) as any;
  const run = () => ({
    hooks: { run: { tap: (_name: string, fn: () => void) => fn() } },
  });

  beforeEach(() => startLintGuard.mockClear());

  it('starts on a webpack or rspack run', () => {
    create().webpack(run());
    create().rspack(run());
    expect(startLintGuard).toHaveBeenCalledTimes(2);
  });

  it('starts on a rollup or rolldown build outside watch mode', () => {
    const plugin = create();
    plugin.rollup.buildStart.call({ meta: { watchMode: true } });
    plugin.rolldown.buildStart.call({ meta: { watchMode: true } });
    expect(startLintGuard).not.toHaveBeenCalled();
    plugin.rollup.buildStart.call({ meta: { watchMode: false } });
    plugin.rolldown.buildStart.call({ meta: { watchMode: false } });
    expect(startLintGuard).toHaveBeenCalledTimes(2);
  });

  it('starts on a vite build and a farm production build', () => {
    const plugin = create();
    plugin.vite.config({}, { command: 'serve' });
    plugin.farm.config({ compilation: { mode: 'development' } });
    expect(startLintGuard).not.toHaveBeenCalled();
    plugin.vite.config({}, { command: 'build' });
    plugin.farm.config({ compilation: { mode: 'production' } });
    expect(startLintGuard).toHaveBeenCalledTimes(2);
  });

  it('does not start with lint: false', () => {
    const plugin = create(false);
    plugin.webpack(run());
    plugin.rollup.buildStart.call({ meta: { watchMode: false } });
    plugin.vite.config({}, { command: 'build' });
    plugin.farm.config({ compilation: { mode: 'production' } });
    expect(startLintGuard).not.toHaveBeenCalled();
  });
});
