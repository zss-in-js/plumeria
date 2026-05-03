import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import plumeria from '@plumeria/unplugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    plumeria.vite(),
    qwikVite({
      csr: true,
    }),
  ],
});
