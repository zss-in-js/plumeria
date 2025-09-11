import type { PluginOption } from 'vite';

export default function plumeria(): PluginOption {
  return {
    name: '@plumeria/vite-plugin',
    config: ({ build = {} }) => ({
      build: {
        ...build,
        rollupOptions: {
          ...build.rollupOptions,
          external: [
            ...((build.rollupOptions?.external || []) as string[]),
            'fs',
          ],
        },
      },
    }),
  };
}
