import { createUnloaderPlugin } from 'unplugin';
import { unpluginFactory, type PluginOptions } from './core';

export default createUnloaderPlugin<PluginOptions | undefined>(unpluginFactory);
