import type {
  NextConfig,
  TurbopackLoaderItem,
} from 'next/dist/server/config-shared';

export const withPlumeria = (nextConfig: NextConfig = {}): NextConfig => {
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
