import type {
  NextConfig,
  TurbopackLoaderItem,
} from 'next/dist/server/config-shared';
import fs from 'fs';

export const withPlumeria = (nextConfig: NextConfig = {}): NextConfig => {
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

  const reactLoaders: TurbopackLoaderItem[] = [
    {
      loader: '@plumeria/turbopack-loader',
      options: {},
    },
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
