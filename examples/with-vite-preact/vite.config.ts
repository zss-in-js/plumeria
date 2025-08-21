import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import plumeria from '@plumeria/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), plumeria()],
});
