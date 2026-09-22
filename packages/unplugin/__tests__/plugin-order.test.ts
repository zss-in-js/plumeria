jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import vite from '../src/vite';
import { unpluginFactory } from '../src/core';

type Hooked = {
  name: string;
  enforce?: 'pre' | 'post';
  transform: { order?: 'pre' | 'post'; handler: unknown } | unknown;
};

const rank = (value: 'pre' | 'post' | undefined) =>
  value === 'pre' ? 0 : value === 'post' ? 2 : 1;

const hookOrder = (plugin: Hooked) => {
  const hook = plugin.transform;
  return typeof hook === 'function'
    ? undefined
    : (hook as { order?: 'pre' | 'post' }).order;
};

const resolveTransformOrder = (plugins: Hooked[]) =>
  plugins
    .map((plugin, index) => ({ plugin, index }))
    .sort(
      (a, b) =>
        rank(a.plugin.enforce) - rank(b.plugin.enforce) ||
        rank(hookOrder(a.plugin)) - rank(hookOrder(b.plugin)) ||
        a.index - b.index,
    )
    .map(({ plugin }) => plugin.name);

const framework = (name: string): Hooked => ({
  name,
  enforce: 'pre',
  transform: () => null,
});

it('declares the transform hook as a pre-ordered object on the core plugin', () => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as Hooked;

  expect(plugin.enforce).toBe('pre');
  expect(typeof plugin.transform).toBe('object');
  expect((plugin.transform as { order?: string }).order).toBe('pre');
  expect(typeof (plugin.transform as { handler?: unknown }).handler).toBe(
    'function',
  );
});

it('keeps the pre order after the vite adapter rewraps the transform', () => {
  const plugin = vite() as unknown as Hooked;

  expect(hookOrder(plugin)).toBe('pre');
  expect(typeof (plugin.transform as { handler?: unknown }).handler).toBe(
    'function',
  );
});

it('transforms before a framework plugin that also enforces pre and is listed first', () => {
  const plugin = vite() as unknown as Hooked;

  expect(
    resolveTransformOrder([framework('vite-plugin-solid'), plugin]),
  ).toEqual(['@plumeria/unplugin:vite', 'vite-plugin-solid']);
});

it('would run second without the pre order, which is the regression this guards', () => {
  const plugin = vite() as unknown as Hooked;
  const withoutOrder: Hooked = {
    name: plugin.name,
    enforce: plugin.enforce,
    transform: (plugin.transform as { handler: unknown }).handler,
  };

  expect(
    resolveTransformOrder([framework('vite-plugin-solid'), withoutOrder]),
  ).toEqual(['vite-plugin-solid', '@plumeria/unplugin:vite']);
});
