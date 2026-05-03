import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import plumeria from '@plumeria/unplugin';
import type { Plugin } from 'vite';

export default defineConfig({
  plugins: [solid(), plumeria.vite() as Plugin],
});
