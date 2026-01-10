import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { plumeria } from '@plumeria/vite-plugin';

export default defineConfig({
  plugins: [solid(), plumeria()],
});
