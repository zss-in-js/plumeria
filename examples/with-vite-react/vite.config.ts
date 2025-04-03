import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import plumeria from '@plumeria/vite';

export default defineConfig({
  plugins: [react(), plumeria()],
});
