import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      '@plumeria/core': '@plumeria/core/dist/index.js',
      '@plumeria/collection': '@plumeria/collection/dist/index.js',
      'zss-engine': 'zss-engine/dist/index.js',
    },
  },
});
