jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    rmdirSync: jest.fn(),
  };
});

import webpack from 'webpack';
import * as fs from 'fs';
import { withPlumeria } from '../src';
import type {
  NextConfig,
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
        use: { loader: '@plumeria/turbopack-loader', options: {} },
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

  describe('development environment initialization', () => {
    let originalEnv: 'development' | 'production' | 'test';

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      delete (global as any).__PLUMERIA_RESET_DONE__;
    });

    afterEach(() => {
      jest.replaceProperty(process.env, 'NODE_ENV', originalEnv);
      delete (global as any).__PLUMERIA_RESET_DONE__;
      jest.mocked(fs.existsSync).mockReset();
      jest.mocked(fs.rmdirSync).mockReset();
      jest.mocked(fs.writeFileSync).mockReset();
    });

    it('runs reset logic in development mode', () => {
      jest.replaceProperty(process.env, 'NODE_ENV', 'development');
      expect((global as any).__PLUMERIA_RESET_DONE__).toBeUndefined();

      withPlumeria();

      expect((global as any).__PLUMERIA_RESET_DONE__).toBe(true);
    });

    it('removes lock directory if it exists and handles file write errors', () => {
      jest.replaceProperty(process.env, 'NODE_ENV', 'development');
      const VIRTUAL_FILE_PATH =
        require.resolve('@plumeria/turbopack-loader/zero-virtual.css');
      const LOCK_DIR_PATH = VIRTUAL_FILE_PATH + '.lock';

      jest.mocked(fs.existsSync).mockReturnValue(true);

      withPlumeria();

      expect(fs.rmdirSync).toHaveBeenCalledWith(LOCK_DIR_PATH);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        VIRTUAL_FILE_PATH,
        '/** Placeholder file */\n',
        'utf-8',
      );

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      jest.mocked(fs.writeFileSync).mockImplementationOnce(() => {
        throw new Error('EACCES: permission denied');
      });

      delete (global as any).__PLUMERIA_RESET_DONE__;
      expect(() => withPlumeria()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('ignores a lock directory that cannot be removed', () => {
      jest.replaceProperty(process.env, 'NODE_ENV', 'development');
      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.rmdirSync).mockImplementationOnce(() => {
        throw new Error('ENOTEMPTY');
      });

      expect(() => withPlumeria()).not.toThrow();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('loader options', () => {
    const loaderItem = (config: NextConfig) => {
      const rule = config.turbopack?.rules?.['*.tsx'] as {
        loaders: { loader: string; options: unknown }[];
      };
      return rule.loaders[0];
    };

    it('reaches the turbopack loader', () => {
      const options = { styleProp: 'sx', include: ['./src/**/*.tsx'] };
      expect(loaderItem(withPlumeria({}, options)).options).toEqual(options);
    });

    it('reaches the webpack loader too, so both bundlers agree', () => {
      const options = { styleProp: 'sx' };
      const config: any = { module: { rules: [] } };
      withPlumeria({}, options).webpack!(config, {
        dev: false,
        isServer: true,
      } as WebpackConfigContext);

      expect(config.module.rules[0].use).toEqual({
        loader: '@plumeria/turbopack-loader',
        options,
      });
    });

    it('defaults to an empty set when the caller passes none', () => {
      expect(loaderItem(withPlumeria()).options).toEqual({});
    });
  });

  describe('turbopack rule conditions', () => {
    const ruleFor = (config: NextConfig) =>
      config.turbopack?.rules?.['*.tsx'] as { condition?: unknown };

    it('applies a condition on next 16 and up', () => {
      expect(ruleFor(withPlumeria()).condition).toEqual({
        all: [{ not: 'foreign' }, { content: /@plumeria\/core/ }],
      });
    });

    it('omits the condition when the next version is unreadable', () => {
      jest.isolateModules(() => {
        jest.doMock('next/package.json', () => {
          throw new Error('unreadable');
        });
        const isolated = require('../src') as typeof import('../src');
        expect(ruleFor(isolated.withPlumeria())).not.toHaveProperty(
          'condition',
        );
      });
    });

    it('omits the condition on next 15', () => {
      jest.isolateModules(() => {
        jest.doMock('next/package.json', () => ({ version: '15.4.2' }));
        const isolated = require('../src') as typeof import('../src');
        expect(ruleFor(isolated.withPlumeria())).not.toHaveProperty(
          'condition',
        );
      });
    });
  });
});
