import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import plumeria from '@plumeria/unplugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), plumeria.vite()],
});
