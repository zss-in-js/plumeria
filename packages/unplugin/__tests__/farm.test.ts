jest.mock('unplugin', () => ({
  createFarmPlugin: (factory: (...args: any[]) => any) => factory,
}));
jest.mock('../src/core', () => ({
  EXTENSION_PATTERN: /\.(?:ts|tsx)$/,
  unpluginFactory: jest.fn(),
}));
jest.mock('../src/disk-css', () => ({ createDiskCssImport: jest.fn() }));

import farm from '../src/farm';

const { unpluginFactory } = jest.requireMock<{ unpluginFactory: jest.Mock }>(
  '../src/core',
);
const { createDiskCssImport } = jest.requireMock<{
  createDiskCssImport: jest.Mock;
}>('../src/disk-css');

const setup = (coreConfig?: jest.Mock) => {
  const internal = {
    targets: [{ id: '/a.tsx' }, { id: '/b.ts' }, { id: '/a.tsx' }],
    setCssImport: jest.fn(),
    setRoot: jest.fn(),
    setDev: jest.fn(),
  };
  const diskImport = jest.fn(() => 'disk import');
  createDiskCssImport.mockReturnValue(diskImport);
  const corePlugin = {
    __plumeriaInternal: internal,
    farm: coreConfig ? { config: coreConfig } : undefined,
  };
  unpluginFactory.mockReturnValue(corePlugin);
  const plugin = farm({} as never) as any;
  const cssImport = internal.setCssImport.mock.calls[0][0];

  return { plugin, corePlugin, internal, cssImport, diskImport };
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('forwards options and adapts the plugin name', () => {
  const { plugin } = setup();

  expect(unpluginFactory).toHaveBeenCalledWith({}, undefined);
  expect(plugin.name).toBe('@plumeria/unplugin:farm');
});

it('uses disk CSS imports in development with the configured root', () => {
  const coreConfig = jest.fn();
  const { plugin, internal, cssImport, diskImport } = setup(coreConfig);
  const config = { root: '/project', compilation: { mode: 'development' } };

  expect(plugin.farm.config(config)).toBe(config);
  expect(coreConfig).toHaveBeenCalledWith(config);
  expect(internal.setRoot).toHaveBeenCalledWith('/project');
  expect(internal.setDev).toHaveBeenCalledWith(true);
  expect(cssImport({ cssId: '/sheet.css' })).toBe('disk import');
  expect(diskImport).toHaveBeenCalledWith({ cssId: '/sheet.css' });
  expect(createDiskCssImport.mock.calls[0][0]()).toBe('/project');
});

it('uses a direct CSS import in production and updates the compiler mode', () => {
  const { plugin, internal, cssImport, diskImport } = setup();

  expect(cssImport({ cssId: '/sheet.css' })).toBe('\nimport "/sheet.css";');
  plugin.farm.config({ compilation: { mode: 'production' } });
  expect(internal.setRoot).not.toHaveBeenCalled();
  expect(internal.setDev).toHaveBeenLastCalledWith(false);
  expect(cssImport({ cssId: '/sheet.css' })).toBe('\nimport "/sheet.css";');
  expect(diskImport).not.toHaveBeenCalled();

  plugin.farm.configureCompiler({
    config: { compilation: { mode: 'development' } },
  });
  expect(internal.setDev).toHaveBeenLastCalledWith(true);
  plugin.farm.configureCompiler({});
  expect(internal.setDev).toHaveBeenLastCalledWith(true);
});

it('adds affected targets once and skips dependencies and unrelated files', () => {
  const { plugin } = setup();

  expect(
    plugin.farm.updateModules.executor({
      paths: [
        ['/a.tsx', 'updated'],
        ['/a.tsx', 'updated again'],
        ['/project/node_modules/dependency.tsx', 'updated'],
        ['/note.md', 'updated'],
      ],
    }),
  ).toEqual([
    '/a.tsx',
    '/b.ts',
    '/project/node_modules/dependency.tsx',
    '/note.md',
  ]);
});

it('handles missing core hooks and internal state', () => {
  const { plugin, corePlugin } = setup();
  delete (corePlugin as { __plumeriaInternal?: unknown }).__plumeriaInternal;

  expect(plugin.farm.config(undefined)).toBeUndefined();
  expect(() => plugin.farm.configureCompiler({})).not.toThrow();
  expect(plugin.farm.updateModules.executor({ paths: [] })).toEqual([]);
});
