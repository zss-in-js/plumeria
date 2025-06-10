import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import plumeria from '@plumeria/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), plumeria()],
});
