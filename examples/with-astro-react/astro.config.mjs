/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import plumeria from '@plumeria/vite-plugin';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [plumeria()],
  },
});
