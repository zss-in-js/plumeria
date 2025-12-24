import type {
  NextConfig,
  TurbopackLoaderItem,
} from 'next/dist/server/config-shared';

export const withPlumeria = (nextConfig: NextConfig = {}): NextConfig => {
  const config: NextConfig = {
    ...nextConfig,
    serverExternalPackages: [
      ...(nextConfig.serverExternalPackages ?? []),
      'zss-engine',
    ],
  };

  const reactLoaders: TurbopackLoaderItem[] = [
    {
      loader: '@plumeria/turbopack-loader',
      options: {},
    },
  ];

  if (process.env.NODE_ENV === 'production') return config;
  return {
    ...config,
    turbopack: {
      ...config?.turbopack,
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
