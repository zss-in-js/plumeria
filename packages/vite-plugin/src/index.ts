import type { Plugin } from 'vite';

export default function plumeria(): Plugin {
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
            'util',
          ],
        },
      },
    }),
  };
}
