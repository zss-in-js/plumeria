import react from '@vitejs/plugin-react';
import plumeria from '@plumeria/unplugin';
import { defineConfig } from 'waku/config';

export default defineConfig({
  vite: {
    plugins: [react(), plumeria.vite()],
  },
});
