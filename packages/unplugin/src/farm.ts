import { createFarmPlugin } from 'unplugin';
import { unpluginFactory, EXTENSION_PATTERN } from './core';
import type { PluginOptions } from './core';
import * as path from 'path';
import {
  resolveVirtualCssPath,
  ensureVirtualCssFile,
  writeCssBlock,
  rewriteImportPath,
} from './disk-css';

function attachFarmHooks(plugin: any) {
  const { targets } = plugin.__plumeriaInternal;
  let isDev = false;
  let farmRoot = process.cwd();

  const virtualCssPath = resolveVirtualCssPath();

  const baseTransform = plugin.transform;

  plugin.transform = async function (this: any, code: string, id: string) {
    const result = await baseTransform.call(this, code, id);

    if (isDev && result && typeof result === 'object' && result.code) {
      const { cssLookup, cssFileLookup } = plugin.__plumeriaInternal;

      result.code = result.code.replace(
        /import\s+["'](\/[^"']+\.zero\.css)["'];/g,
        (_match: string, cssPath: string) => {
          const absolutePath = cssFileLookup.get(cssPath);
          if (!absolutePath) return _match;

          const cssContent = cssLookup.get(absolutePath);
          if (cssContent == null) return _match;

          ensureVirtualCssFile(virtualCssPath);

          const filePathKey = path
            .relative(farmRoot, absolutePath)
            .replace(/\\/g, '/');
          writeCssBlock(virtualCssPath, filePathKey, cssContent);

          const importPath = rewriteImportPath(id, virtualCssPath);
          return `import "${importPath}";`;
        },
      );
    }
    return result;
  };

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
