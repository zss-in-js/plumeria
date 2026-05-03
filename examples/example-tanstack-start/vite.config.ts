import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import rsc from '@vitejs/plugin-rsc';
import plumeria from '@plumeria/unplugin';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      rsc: {
        enabled: true,
      },
    }),
    viteReact(),
    rsc(),
    plumeria.vite(),
  ],
});

export default config;
