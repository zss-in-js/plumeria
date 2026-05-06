import webpack from 'webpack';
import { withPlumeria } from '../src';
import type {
  WebpackConfigContext,
  TurbopackLoaderItem,
  TurbopackRuleConfigCollection,
  TurbopackRuleConfigItem,
} from 'next/dist/server/config-shared';

describe('withPlumeria', () => {
  it('calls original webpack function if exists', () => {
    const originalWebpack = jest.fn((config) => config);
    withPlumeria({ webpack: originalWebpack }).webpack!({}, {
      dev: true,
    } as any);
    expect(originalWebpack).toHaveBeenCalled();
  });

  describe('webpack configuration', () => {
    it('merges watchOptions.ignored (array)', () => {
      const config: webpack.Configuration = {
        watchOptions: {
          ignored: ['foo'],
        },
      };
      withPlumeria({}).webpack!(config, { dev: true } as WebpackConfigContext);
      expect(config.watchOptions!.ignored).toEqual([
        'foo',
        'node_modules',
        '.next',
        '.git',
      ]);
    });

    it('merges watchOptions.ignored (single string)', () => {
      const config = {
        watchOptions: {
          ignored: 'foo',
        },
      };
      withPlumeria({}).webpack!(config, { dev: true } as WebpackConfigContext);
      expect(config.watchOptions.ignored).toEqual([
        'foo',
        'node_modules',
        '.next',
        '.git',
      ]);
    });

    it('adds loader and merges watchOptions.ignored (undefined) by default', () => {
      const config: webpack.Configuration = {
        module: { rules: [] },
        watchOptions: {},
      };
      const result = withPlumeria();
      result.webpack!(config, {
        dev: true,
        isServer: true,
      } as WebpackConfigContext);
      expect(config.module!.rules![0]).toMatchObject({
        enforce: 'pre',
        test: /\.(tsx|ts|jsx|js)$/,
        use: '@plumeria/turbopack-loader',
      });
      expect(config.watchOptions!.ignored).toEqual([
        'node_modules',
        '.next',
        '.git',
      ]);
      expect(result.turbopack?.rules).toBeDefined();
    });

    it('does not merge if watchOptions.ignored is a RegExp', () => {
      const regex = /foo/;
      const config: any = {
        watchOptions: {
          ignored: regex,
        },
      };
      withPlumeria({}).webpack!(config, { dev: true } as WebpackConfigContext);
      expect(config.watchOptions.ignored).toBe(regex);
    });
  });

  describe('turbopack configuration', () => {
    it('merges loaders with existing turbopack rules (array loaders)', () => {
      const result = withPlumeria({
        turbopack: {
          rules: {
            '*.ts': { loaders: ['existing-loader'] },
          },
        },
      });
      const tsRule = result.turbopack?.rules?.['*.ts'] as any;
      expect(tsRule.loaders).toHaveLength(2);
      expect(tsRule.loaders[0]).toEqual({
        loader: '@plumeria/turbopack-loader',
        options: {},
      });
      expect(tsRule.loaders[1]).toBe('existing-loader');
    });

    it('merges loaders with existing turbopack rules (single object loader)', () => {
      const result = withPlumeria({
        turbopack: {
          rules: {
            '*.ts': { loaders: { loader: 'existing-loader' } as any },
          },
        },
      });
      const tsRule = result.turbopack?.rules?.['*.ts'] as any;
      expect(tsRule.loaders).toHaveLength(2);
      expect(tsRule.loaders[1]).toEqual({ loader: 'existing-loader' });
    });

    it('merges loaders with existing turbopack rules (no loaders)', () => {
      const result = withPlumeria({
        turbopack: {
          rules: {
            '*.ts': { as: 'asset' } as TurbopackRuleConfigCollection,
          },
        },
      });
      const tsRule = result.turbopack?.rules?.[
        '*.ts'
      ] as TurbopackRuleConfigItem;
      const firstLoader = tsRule.loaders![0] as Extract<
        TurbopackLoaderItem,
        { loader: string }
      >;
      expect(firstLoader.loader).toBe('@plumeria/turbopack-loader');
    });

    it('overwrites if existing rule is an array (not a config item)', () => {
      const result = withPlumeria({
        turbopack: {
          rules: {
            '*.ts': ['something'],
          },
        },
      });
      const tsRule = result.turbopack?.rules?.[
        '*.ts'
      ] as TurbopackRuleConfigItem;
      expect(tsRule).not.toBeInstanceOf(Array);
      expect(tsRule.loaders).toBeDefined();
    });

    it('handles null or other non-object existing rules', () => {
      const result = withPlumeria({
        turbopack: {
          rules: {
            '*.ts': [null] as TurbopackRuleConfigCollection,
          },
        },
      });
      const tsRule = result.turbopack?.rules?.[
        '*.ts'
      ] as TurbopackRuleConfigItem;
      expect(tsRule.loaders).toBeDefined();
    });

    it('overwrites if existing rule is a string', () => {
      const result = withPlumeria({
        turbopack: {
          rules: {
            '*.ts': 'some-string' as TurbopackRuleConfigCollection,
          },
        },
      });
      const tsRule = result.turbopack?.rules?.[
        '*.ts'
      ] as TurbopackRuleConfigItem;
      expect(tsRule.loaders).toBeDefined();
      expect(tsRule).not.toBe('some-string');
    });
  });
});
