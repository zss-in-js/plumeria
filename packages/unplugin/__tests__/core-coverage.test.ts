jest.mock('@plumeria/utils', () => ({
  DEFAULT_STYLE_PROP: 'classStyle',
  optimizer: async (css: string) => css,
  resolvePropertyPolicy: () => ({}),
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
        sheets: source.includes('EMPTY') ? [] : ['.generated {}'],
      };
    },
  ),
}));

import { unpluginFactory } from '../src/core';

const { transformSource: mockTransformSource } = jest.requireMock<{
  transformSource: jest.Mock;
}>('@plumeria/utils');

const SOURCE = `import '@plumeria/core';`;
const createPlugin = (options?: Parameters<typeof unpluginFactory>[0]) =>
  unpluginFactory(options, { framework: 'rollup' } as never) as any;

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
