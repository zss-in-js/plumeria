import { createVitePlugin } from 'unplugin';
import { unpluginFactory, EXTENSION_PATTERN } from './core';
import type { PluginOptions } from './core';
import { scanAll } from '@plumeria/utils';
import * as path from 'path';
import type {
  ViteDevServer,
  ModuleNode,
  ResolvedConfig,
  HmrContext,
  Plugin,
  UserConfig,
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

  // Snapshot of componentPropsTable used to detect which child components'
  // prop possibilities changed on an edit (compKey -> propName -> joined keys).
  let propsTableSnapshot: Record<string, Record<string, string>> = {};
  const snapshotPropsTable = (): Record<string, Record<string, string>> => {
    const snap: Record<string, Record<string, string>> = {};
    const table = scanAll().componentPropsTable || {};
    for (const compKey of Object.keys(table)) {
      snap[compKey] = {};
      for (const propName of Object.keys(table[compKey])) {
        snap[compKey][propName] = table[compKey][propName]
          .map((e) => e.key)
          .sort()
          .join(',');
      }
    }
    return snap;
  };

  // Last CSS text pushed per virtual CSS module, to skip no-op reloads.
  const lastServedCss = new Map<string, string>();

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
      // Virtual module HMR: signal Vite to reload the CSS module,
      // but only when its content actually changed (avoids repaint flicker).
      const baseId = id.replace(EXTENSION_PATTERN, '');
      const cssFilename = `${baseId}.zero.css`;
      const mod = devServer.moduleGraph.getModuleById(cssFilename);
      if (mod) {
        const cssContent = cssLookup.get(cssFilename) ?? '';
        if (lastServedCss.get(cssFilename) !== cssContent) {
          lastServedCss.set(cssFilename, cssContent);
          devServer.reloadModule(mod);
        }
      }
    }

    return result;
  };

  const vitePlugin = {
    ...plugin,
    name: '@plumeria/unplugin:vite',

    config(userConfig: UserConfig, { command }: { command: string }) {
      const configToReturn: UserConfig = {
        optimizeDeps: {
          exclude: [
            ...(userConfig.optimizeDeps?.exclude ?? []),
            '@plumeria/core',
          ],
        },
      };

      if (command === 'build') {
        configToReturn.build = {
          ...(userConfig.build ?? {}),
          cssCodeSplit: false,
        };
      }

      return configToReturn;
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
      if (ctx.file.includes('node_modules')) return modules;

      const addModule = (m: ModuleNode | undefined | null) => {
        if (m && !modules.includes(m)) {
          modules.push(m);
        }
      };

      // Re-scan up front so every transform in this batch reads a consistent,
      // already-updated table (scanAll is mtime-incremental, so subsequent
      // calls inside transforms hit the cache).
      const snapshot = snapshotPropsTable();
      const prevSnapshot = propsTableSnapshot;
      propsTableSnapshot = snapshot;

      // Child components whose prop possibilities changed must re-transform
      // so their inlined lookup maps are rebuilt.
      const compKeys = new Set([
        ...Object.keys(prevSnapshot),
        ...Object.keys(snapshot),
      ]);
      for (const compKey of compKeys) {
        const prevProps = prevSnapshot[compKey] || {};
        const nextProps = snapshot[compKey] || {};
        const propNames = new Set([
          ...Object.keys(prevProps),
          ...Object.keys(nextProps),
        ]);
        const changed = [...propNames].some(
          (p) => prevProps[p] !== nextProps[p],
        );
        if (changed) {
          const defFile = compKey.slice(0, compKey.lastIndexOf('-'));
          devServer.moduleGraph.getModulesByFile(defFile)?.forEach(addModule);
        }
      }

      // Only re-queue targets that actually depend on the changed file,
      // instead of every Plumeria module (a blanket re-queue can walk
      // importer chains without an HMR boundary and force a full reload).
      targets
        .filter(
          (t: any) => t.id !== ctx.file && t.dependencies.includes(ctx.file),
        )
        .map((t: any) => devServer!.moduleGraph.getModuleById(t.id))
        .forEach((m: any) => addModule(m as ModuleNode | null));

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
