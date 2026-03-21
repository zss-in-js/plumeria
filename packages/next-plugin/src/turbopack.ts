import type {
  NextConfig,
  TurbopackLoaderItem,
} from 'next/dist/server/config-shared';
import fs from 'fs';

const PLACEHOLDER = '/** Placeholder file */\n';

export const withPlumeria = (nextConfig: NextConfig = {}): NextConfig => {
  const VIRTUAL_FILE_PATH =
    require.resolve('@plumeria/turbopack-loader/zero-virtual.css');

  const writeIfChanged = (path: string, content: string) => {
    try {
      // no-op if already correct
      const current = fs.readFileSync(path, 'utf-8');
      if (current === content) return;
    } catch {
      // file doesn't exist yet, fall through to write
    }
    fs.writeFileSync(path, content, 'utf-8');
  };

  if (process.env.NODE_ENV === 'development') {
    process.on('SIGINT', () => {
      writeIfChanged(VIRTUAL_FILE_PATH, PLACEHOLDER);
      process.exit(0);
    });
  }

  if (process.env.NODE_ENV === 'production') {
    writeIfChanged(VIRTUAL_FILE_PATH, PLACEHOLDER);
  }

  const reactLoaders: TurbopackLoaderItem[] = [
    { loader: '@plumeria/turbopack-loader', options: {} },
  ];

  return {
    ...nextConfig,
    turbopack: {
      ...nextConfig?.turbopack,
      rules: {
        '*.ts': {
          loaders: reactLoaders,
        },
        '*.tsx': {
          loaders: reactLoaders,
        },
        '*.js': {
          loaders: reactLoaders,
        },
        '*.jsx': {
          loaders: reactLoaders,
        },
      },
    },
  };
};
