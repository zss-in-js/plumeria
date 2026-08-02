import { createBunPlugin } from 'unplugin';
import { unpluginFactory, type PluginOptions } from './core';
import { stripCssMarkersIn } from './css-marker';

const createPlugin = (outputs: Set<string>) =>
  createBunPlugin<PluginOptions | undefined>((options, metaOptions) => ({
    ...unpluginFactory(options, metaOptions),
    writeBundle() {
      stripCssMarkersIn(outputs);
    },
  }));

export default (options?: PluginOptions) => {
  const outputs = new Set<string>();
  const plugin = createPlugin(outputs)(options) as any;
  const setup = plugin.setup;

  return {
    ...plugin,
    async setup(build: any) {
      const outdir = build?.config?.outdir;
      if (outdir) outputs.add(outdir);
      return setup.call(plugin, build);
    },
  };
};
