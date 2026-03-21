import type {
  NextConfig,
  TurbopackLoaderItem,
} from 'next/dist/server/config-shared';
import fs from 'fs';

const PLACEHOLDER = '/** Placeholder file */\n';

export const withPlumeria = (nextConfig: NextConfig = {}): NextConfig => {
  const VIRTUAL_FILE_PATH =
    require.resolve('@plumeria/turbopack-loader/zero-virtual.css');

  if (process.env.NODE_ENV === 'production') {
    fs.writeFileSync(VIRTUAL_FILE_PATH, PLACEHOLDER, 'utf-8');
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
