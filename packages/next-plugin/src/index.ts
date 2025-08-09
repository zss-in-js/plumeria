import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import { PlumeriaPlugin } from '@plumeria/webpack-plugin';

export function withPlumeria(nextConfig: NextConfig = {}): NextConfig {
  const originalWebpack = nextConfig.webpack;

  return {
    ...nextConfig,
    webpack(config: Configuration, context) {
      if (typeof originalWebpack === 'function') {
        config = originalWebpack(config, context);
      }

      if (context.dev && context.isServer) {
        config.module?.rules?.unshift({
          enforce: 'pre',
          test: /\.(tsx|ts|jsx|js)$/,
          exclude: [/node_modules/, /\.next/, /\.git/],
          use: [require.resolve('./virtual-css-loader')],
        });
      }

      config.plugins?.push(new PlumeriaPlugin());

      return config;
    },
  };
}
