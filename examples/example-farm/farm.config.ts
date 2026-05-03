import { defineConfig } from '@farmfe/core';
import farmPluginReact from '@farmfe/plugin-react';
import plumeria from '@plumeria/unplugin';

export default defineConfig({
  plugins: [
    farmPluginReact(),
    plumeria.farm({
      devEmitToDisk: true,
    }),
  ],
});
