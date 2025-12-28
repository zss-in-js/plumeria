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
  });
});
