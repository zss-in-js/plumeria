import type { NextConfig } from 'next';
import type { TurbopackLoaderItem } from 'next/dist/server/config-shared';
import type { Configuration } from 'webpack';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';

type TurbopackConfig = NonNullable<NextConfig['turbopack']>;
type TurbopackRules = NonNullable<TurbopackConfig['rules']>;
type TurbopackRuleValue = TurbopackRules[string];

const isRuleConfigItem = (
  rule: TurbopackRuleValue,
): rule is Extract<TurbopackRuleValue, { loaders?: TurbopackLoaderItem[] }> =>
  !Array.isArray(rule) && typeof rule === 'object' && rule !== null;

type PlumeriaTurbopackRules = Record<
  string,
  { loaders: TurbopackLoaderItem[] }
>;

export function withPlumeria(nextConfig: NextConfig = {}): NextConfig {
  const originalWebpack = nextConfig.webpack;

  const turbopackLoaders: TurbopackLoaderItem[] = [
    { loader: '@plumeria/turbopack-loader', options: {} },
  ];

  const plumeriaRules: PlumeriaTurbopackRules = {
    '*.ts': { loaders: turbopackLoaders },
    '*.tsx': { loaders: turbopackLoaders },
    '*.js': { loaders: turbopackLoaders },
    '*.jsx': { loaders: turbopackLoaders },
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
        mergedRules[key] = newRule;
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
        use: '@plumeria/turbopack-loader',
      });

      return config;
    },
  };
}
