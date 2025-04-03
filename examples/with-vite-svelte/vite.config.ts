import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import plumeria from '@plumeria/vite';

export default defineConfig({
  plugins: [svelte(), plumeria()],
});
