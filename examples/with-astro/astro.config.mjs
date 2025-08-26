// @ts-check
import { defineConfig } from 'astro/config';
import { plumeria } from '@plumeria/vite-plugin';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [plumeria()],
  },
});
