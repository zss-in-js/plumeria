import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import type { WebpackConfigContext } from 'next/dist/server/config-shared';
import * as fs from 'fs';

const PLACEHOLDER = '/** Placeholder file */\n';

export function withPlumeria(nextConfig: NextConfig): NextConfig {
  const VIRTUAL_FILE_PATH =
    require.resolve('@plumeria/turbopack-loader/zero-virtual.css');

  const writeIfChanged = (path: string, content: string) => {
    try {
      const current = fs.readFileSync(path, 'utf-8');
      if (current === content) return; // no-op if already correct
    } catch {
      // file doesn't exist yet, fall through to write
    }
    fs.writeFileSync(path, content, 'utf-8');
  };

  if (process.env.NODE_ENV === 'development') {
    process.on('SIGINT', () => {
      writeIfChanged(VIRTUAL_FILE_PATH, PLACEHOLDER);
      process.exit(0); // <-- also add explicit exit, missing in original
    });
  }

  if (process.env.NODE_ENV === 'production') {
    writeIfChanged(VIRTUAL_FILE_PATH, PLACEHOLDER);
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
