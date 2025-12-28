import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';

export function withPlumeria(nextConfig: NextConfig): NextConfig {
  const originalWebpack = nextConfig.webpack;

  return {
    ...nextConfig,
    webpack(config: Configuration, context: WebpackConfigContext) {
      if (typeof originalWebpack === 'function') {
        config = originalWebpack(config, context);
      }

      config.watchOptions = {
        ignored: ['node_modules', '.next', '.git'],
      };
      config.module?.rules?.unshift({
        enforce: 'pre',
        test: /\.(tsx|ts|jsx|js)$/,
        exclude: [/node_modules/, /\.next/, /\.git/],
        use: require.resolve('@plumeria/webpack-plugin'),
      });

      return config;
    },
  };
}
