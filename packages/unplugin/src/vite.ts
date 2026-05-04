import { createVitePlugin } from 'unplugin';
import { unpluginFactory, EXTENSION_PATTERN } from './core';
import type { PluginOptions } from './core';
import * as path from 'path';
import type {
  ViteDevServer,
  ModuleNode,
  ResolvedConfig,
  HmrContext,
  Plugin,
} from 'vite';
import {
  resolveVirtualCssPath,
  ensureVirtualCssFile,
  writeCssBlock,
  rewriteImportPath,
} from './disk-css';

function attachViteHooks(plugin: any, options?: VitePluginOptions) {
  let devServer: ViteDevServer | undefined;
  const { cssLookup, cssFileLookup, targets, setDev, setRoot } =
    plugin.__plumeriaInternal;

  const useDiskEmit = options?.devEmitToDisk ?? false;
  let isDev = false;
  let viteRoot = process.cwd();

  const virtualCssPath = useDiskEmit ? resolveVirtualCssPath() : '';

  const baseTransform = plugin.transform;
  plugin.transform = async function (this: any, code: string, id: string) {
    const result = await baseTransform.call(this, code, id);

    if (
      isDev &&
      useDiskEmit &&
      result &&
      typeof result === 'object' &&
      result.code
    ) {
      // Disk-based HMR: rewrite virtual CSS imports to point to real file
      result.code = result.code.replace(
        /import\s+["'](\/[^"']+\.zero\.css)["'];/g,
        (_match: string, cssPath: string) => {
          const absolutePath = cssFileLookup.get(cssPath);
          if (!absolutePath) return _match;

          const cssContent = cssLookup.get(absolutePath);
          if (cssContent == null) return _match;

          ensureVirtualCssFile(virtualCssPath);

          const filePathKey = path
            .relative(viteRoot, absolutePath)
            .replace(/\\/g, '/');
          writeCssBlock(virtualCssPath, filePathKey, cssContent);

          const importPath = rewriteImportPath(id, virtualCssPath);
          return `import "${importPath}";`;
        },
      );
    } else if (
      !useDiskEmit &&
      devServer &&
      result &&
      typeof result === 'object' &&
      result.code.includes('.zero.css')
    ) {
      // Virtual module HMR: signal Vite to reload the CSS module
      const baseId = id.replace(EXTENSION_PATTERN, '');
      const cssFilename = `${baseId}.zero.css`;
      const mod = devServer.moduleGraph.getModuleById(cssFilename);
      if (mod) {
        devServer.reloadModule(mod);
      }
    }

    return result;
  };

  const vitePlugin: any = {
    ...plugin,
    name: '@plumeria/unplugin:vite',

    config(userConfig: any, { command }: { command: string }) {
      if (command === 'build') {
        const build = userConfig.build || {};
        build.cssCodeSplit = false;
        return { build };
      }
    },

    configResolved(config: ResolvedConfig) {
      viteRoot = config.root;
      setRoot(config.root);
      if (config.command === 'serve') {
        isDev = true;
        setDev(true);
      }
    },

    configureServer(server: ViteDevServer) {
      devServer = server;
    },

    handleHotUpdate(ctx: HmrContext) {
      if (!devServer) return;

      const modules = [...ctx.modules];

      if (!ctx.file.includes('node_modules')) {
        const affectedProviders = targets
          .filter((t: any) => t.id !== ctx.file)
          .map((t: any) => devServer!.moduleGraph.getModuleById(t.id))
          .filter((m: any): m is ModuleNode => !!m);

        affectedProviders.forEach((p: any) => {
          if (!modules.includes(p)) {
            modules.push(p);
          }
        });
      }

      return modules;
    },
  };

  // When using disk emission, remove virtual module hooks
  // since CSS is served from a real file on disk
  if (!useDiskEmit) {
    vitePlugin.resolveId = function (importeeUrl: string) {
      const [id] = importeeUrl.split('?', 1);
      if (cssLookup.has(id)) {
        return id;
      }
      const resolved = cssFileLookup.get(id);
      if (resolved) {
        return resolved;
      }
      return null;
    };

    vitePlugin.load = function (url: string) {
      const [id] = url.split('?', 1);
      return cssLookup.get(id) ?? null;
    };
  }

  return vitePlugin;
}

export type VitePluginOptions = {
  [K in keyof PluginOptions]: PluginOptions[K];
} & {};

export default createVitePlugin<VitePluginOptions | undefined>(
  (options, metaOptions) =>
    attachViteHooks(unpluginFactory(options, metaOptions), options),
) as (options?: VitePluginOptions) => Plugin;
