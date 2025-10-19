import { PlumeriaPlugin } from '@plumeria/webpack-plugin';
import { withPlumeria } from '../src';

describe('withPlumeria', () => {
  it('returns Next.js config with webpack function', () => {
    const result = withPlumeria({});
    expect(result.webpack).toBeDefined();
  });

  it('calls original webpack function if exists', () => {
    const originalWebpack = jest.fn((config) => config);
    withPlumeria({ webpack: originalWebpack }).webpack!({}, {
      dev: true,
    } as any);
    expect(originalWebpack).toHaveBeenCalled();
  });

  it('adds loader and plugin in dev mode', () => {
    const config = { module: { rules: [] }, plugins: [] };
    withPlumeria({}).webpack!(config, { dev: true, isServer: true } as any);
    expect(config.module.rules[0]).toMatchObject({
      test: /\.(tsx|ts|jsx|js)$/,
    });
    expect(
      config.plugins.some(
        (p) => (p as PlumeriaPlugin) instanceof PlumeriaPlugin,
      ),
    ).toBe(true);
  });

  it('does not modify config in production mode', () => {
    const config = { module: { rules: [] }, plugins: [] };
    withPlumeria({}).webpack!(config, { dev: false } as any);
    expect(config.module.rules).toHaveLength(0);
  });

  it('does not add duplicate plugin', () => {
    const config = {
      plugins: [new PlumeriaPlugin({ entryPaths: 'pages/' })],
    };
    withPlumeria({}).webpack!(config, { dev: true, isServer: true } as any);
    expect(
      config.plugins.filter((p) => p instanceof PlumeriaPlugin),
    ).toHaveLength(1);
  });
});
