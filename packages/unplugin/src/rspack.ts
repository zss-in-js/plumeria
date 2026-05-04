import { createRspackPlugin } from 'unplugin';
import { unpluginFactory, type PluginOptions } from './core';
import { attachWebpackHooks } from './webpack';

export default createRspackPlugin<PluginOptions | undefined>(
  (options, meta) => {
    return attachWebpackHooks(unpluginFactory(options, meta));
  },
);
