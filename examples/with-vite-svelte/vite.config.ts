import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import plumeria from '@plumeria/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), plumeria()],
});
