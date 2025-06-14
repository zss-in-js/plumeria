import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import plumeria from '@plumeria/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), plumeria()],
});
