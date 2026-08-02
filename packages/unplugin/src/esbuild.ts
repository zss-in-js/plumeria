import { createEsbuildPlugin } from 'unplugin';
import * as path from 'path';
import { unpluginFactory, type PluginOptions } from './core';
import { stripCssMarkersIn } from './css-marker';

type EsbuildOutputOptions = { outdir?: string; outfile?: string };

function attachEsbuildHooks(plugin: any) {
  const outputs = new Set<string>();

  return {
    ...plugin,

    esbuild: {
      ...plugin.esbuild,
      config(this: unknown, options: EsbuildOutputOptions) {
        plugin.esbuild?.config?.call(this, options);
        if (options.outdir) outputs.add(options.outdir);
        if (options.outfile) outputs.add(path.dirname(options.outfile));
      },
    },

    writeBundle() {
      stripCssMarkersIn(outputs);
    },
  };
}

export default createEsbuildPlugin<PluginOptions | undefined>(
  (options, metaOptions) =>
    attachEsbuildHooks(unpluginFactory(options, metaOptions)),
);
