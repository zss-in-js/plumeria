import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import plumeria from '@plumeria/unplugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), plumeria.vite()],
});
