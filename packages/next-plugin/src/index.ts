import type { NextConfig } from 'next';
import type { LoaderOptions } from '@plumeria/turbopack-loader';
import type { TurbopackLoaderItem } from 'next/dist/server/config-shared';
import type { Configuration } from 'webpack';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';
import { lintOverrides } from '@plumeria/eslint-plugin/guard';
import { startNextLintGuard } from './lint';

type TurbopackConfig = NonNullable<NextConfig['turbopack']>;
type TurbopackRules = NonNullable<TurbopackConfig['rules']>;
type TurbopackRuleValue = TurbopackRules[string];

const isRuleConfigItem = (
  rule: TurbopackRuleValue,
): rule is Extract<TurbopackRuleValue, { loaders?: TurbopackLoaderItem[] }> =>
  !Array.isArray(rule) && typeof rule === 'object' && rule !== null;

type PlumeriaTurbopackRules = Record<
  string,
  { loaders: TurbopackLoaderItem[]; condition?: unknown; as?: string }
>;

export type PlumeriaOptions = LoaderOptions & { lint?: boolean };

export function withPlumeria(
  nextConfig: NextConfig = {},
  { lint = true, ...options }: PlumeriaOptions = {},
): NextConfig {
  if (lint) startNextLintGuard(lintOverrides(options));

  const originalWebpack = nextConfig.webpack;

  const turbopackLoaders: TurbopackLoaderItem[] = [
    {
      loader: '@plumeria/turbopack-loader',
      options: options as Record<string, never>,
    },
  ];

  const styleProp = options.styleProp ?? 'classStyle';
  const escapedStyleProp = styleProp.replaceAll('$', '\\$');
  const start = /^\w/.test(styleProp) ? '(?:^|[^\\w.])' : '';
  const end = /\w$/.test(styleProp) ? '\\b' : '';
  const content = new RegExp(
    `@plumeria/core|${start}${escapedStyleProp}${end}`,
  );

  const ruleItem = {
    loaders: turbopackLoaders,
    condition: {
      all: [{ not: 'foreign' }, { content }],
    },
  };

  const cssLoader = {
    loader: '@plumeria/turbopack-loader/css',
    options: options as Record<string, never>,
  };

  const plumeriaRules: PlumeriaTurbopackRules = {
    '*.ts': ruleItem,
    '*.tsx': ruleItem,
    '*.js': ruleItem,
    '*.jsx': ruleItem,
    'zero-virtual.css': { loaders: [cssLoader], as: '*.css' },
  };

  const mergeTurbopackRules = (
    existingRules: TurbopackRules = {},
    newRules: PlumeriaTurbopackRules,
  ): TurbopackRules => {
    const mergedRules = { ...existingRules };

    for (const [key, newRule] of Object.entries(newRules)) {
      const existing = mergedRules[key];

      if (existing && isRuleConfigItem(existing)) {
        const newLoaders = newRule.loaders;

        const existingLoaders = Array.isArray(existing.loaders)
          ? existing.loaders
          : existing.loaders
            ? [existing.loaders]
            : [];

        mergedRules[key] = {
          ...existing,
          loaders: [...newLoaders, ...existingLoaders],
        };
      } else {
        mergedRules[key] = newRule as TurbopackRuleValue;
      }
    }
    return mergedRules;
  };

  return {
    ...nextConfig,
    turbopack: {
      ...nextConfig?.turbopack,
      rules: mergeTurbopackRules(nextConfig?.turbopack?.rules, plumeriaRules),
    },

    webpack(config: Configuration, context: WebpackConfigContext) {
      if (typeof originalWebpack === 'function') {
        config = originalWebpack(config, context);
      }

      const existingIgnored = config.watchOptions?.ignored;
      const plumeriaIgnored = ['node_modules', '.next', '.git'];

      const mergedIgnored =
        existingIgnored instanceof RegExp
          ? existingIgnored
          : Array.from(
              new Set([
                ...(Array.isArray(existingIgnored)
                  ? existingIgnored
                  : existingIgnored
                    ? [existingIgnored]
                    : []),
                ...plumeriaIgnored,
              ]),
            );

      config.watchOptions = {
        ...config.watchOptions,
        ignored: mergedIgnored,
      };

      config.module?.rules?.unshift({
        enforce: 'pre',
        test: /\.(tsx|ts|jsx|js)$/,
        exclude: [/node_modules/, /\.next/, /\.git/],
        use: { loader: '@plumeria/turbopack-loader', options },
      });

      config.module?.rules?.unshift({
        enforce: 'pre',
        test: /zero-virtual\.css$/,
        use: { loader: '@plumeria/turbopack-loader/css', options },
      });

      return config;
    },
  };
}
