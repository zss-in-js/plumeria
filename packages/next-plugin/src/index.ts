import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';
import fs from 'fs';

export function withPlumeria(nextConfig: NextConfig): NextConfig {
  const VIRTUAL_FILE_PATH =
    require.resolve('@plumeria/turbopack-loader/zero-virtual.css');
  if (process.env.NODE_ENV === 'development') {
    const cleanup = () => {
      fs.writeFileSync(VIRTUAL_FILE_PATH, '/** Placeholder file */\n', 'utf-8');
    };

    process.on('SIGINT', cleanup);
  }

  if (process.env.NODE_ENV === 'production') {
    fs.writeFileSync(VIRTUAL_FILE_PATH, '/** Placeholder file */\n', 'utf-8');
  }

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
        use: require.resolve('@plumeria/turbopack-loader'),
      });

      return config;
    },
  };
}
