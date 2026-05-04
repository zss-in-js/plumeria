import { createEsbuildPlugin } from 'unplugin';
import { unpluginFactory, type PluginOptions } from './core';

export default createEsbuildPlugin<PluginOptions | undefined>(unpluginFactory);
