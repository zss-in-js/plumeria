import { createBunPlugin } from 'unplugin';
import { unpluginFactory, type PluginOptions } from './core';

export default createBunPlugin<PluginOptions | undefined>(unpluginFactory);
