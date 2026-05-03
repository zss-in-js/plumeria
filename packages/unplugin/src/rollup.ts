import { createRollupPlugin } from 'unplugin';
import { unpluginFactory, type PluginOptions } from './core';

export default createRollupPlugin<PluginOptions | undefined>(unpluginFactory);
