import type { Plugin } from 'vite';

export default function plumeria(): Plugin {
  return {
    name: '@plumeria/vite',
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
