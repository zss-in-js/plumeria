import { createFarmPlugin } from 'unplugin';
import { unpluginFactory, EXTENSION_PATTERN } from './core';
import type { PluginOptions } from './core';
import { createDiskCssImport } from './disk-css';

function attachFarmHooks(plugin: any) {
  const { targets, setCssImport } = plugin.__plumeriaInternal;
  let isDev = false;
  let farmRoot = process.cwd();

  const diskCssImport = createDiskCssImport(() => farmRoot);

  setCssImport((ctx: any) =>
    isDev ? diskCssImport(ctx) : `\nimport ${JSON.stringify(ctx.cssId)};`,
  );

  plugin.farm = {
    config(config: any) {
      if (plugin.__plumeriaInternal) {
        if (config?.root) {
          farmRoot = config.root;
          plugin.__plumeriaInternal.setRoot(config.root);
        }
        isDev = config?.compilation?.mode !== 'production';
        plugin.__plumeriaInternal.setDev(isDev);
      }
      return config;
    },
    configureCompiler(compiler: any) {
      if (plugin.__plumeriaInternal) {
        isDev = compiler.config?.compilation?.mode !== 'production';
        plugin.__plumeriaInternal.setDev(isDev);
      }
    },
    updateModules: {
      executor(param: { paths: [string, string][] }) {
        const modules: string[] = [];

        for (const [file] of param.paths) {
          if (!modules.includes(file)) {
            modules.push(file);
          }

          if (!file.includes('node_modules') && EXTENSION_PATTERN.test(file)) {
            for (const target of targets) {
              if (target.id !== file && !modules.includes(target.id)) {
                modules.push(target.id);
              }
            }
          }
        }

        return modules;
      },
    },
  };

  return {
    ...plugin,
    name: '@plumeria/unplugin:farm',
  };
}

const farmPlugin: (options?: PluginOptions) => any = createFarmPlugin<
  PluginOptions | undefined
>((options, metaOptions) =>
  attachFarmHooks(unpluginFactory(options, metaOptions)),
);

export default farmPlugin;
