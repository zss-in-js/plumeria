import { createRolldownPlugin } from 'unplugin';
import { unpluginFactory, type PluginOptions } from './core';

export default createRolldownPlugin<PluginOptions | undefined>(unpluginFactory);
