import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { plumeria } from '@plumeria/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    plumeria(),
    qwikVite({
      csr: true,
    }),
  ],
});
