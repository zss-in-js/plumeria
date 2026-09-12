import { createVitePlugin } from 'unplugin';
import { unpluginFactory, EXTENSION_PATTERN } from './core';
import type { PluginOptions } from './core';
import { scanAll, optimizer } from '@plumeria/utils';
import * as path from 'path';
import type {
  ViteDevServer,
  ModuleNode,
  ResolvedConfig,
  HmrContext,
  Plugin,
  UserConfig,
} from 'vite';
import { createDiskCssImport } from './disk-css';

function isRscConfig(userConfig: UserConfig): boolean {
  if ((userConfig as any).environments?.rsc) return true;

  const plugins = ((userConfig.plugins ?? []) as unknown[])
    .flat(Infinity)
    .filter((p): p is { name?: string } => !!p && typeof p === 'object');

  return plugins.some((p) => p.name === 'rsc' || !!p.name?.startsWith('rsc:'));
}

function attachViteHooks(plugin: any, options?: VitePluginOptions) {
  let devServer: ViteDevServer | undefined;
  const { cssLookup, cssFileLookup, targets, setDev, setRoot, setCssImport } =
    plugin.__plumeriaInternal;

  const useDiskEmit = options?.devEmitToDisk ?? false;
  let isDev = false;
  let viteRoot = process.cwd();

  const diskCssImport = useDiskEmit
    ? createDiskCssImport(() => viteRoot)
    : null;

  setCssImport((ctx: any) => {
    if (isRsc && isBuild) return null;
    if (isDev && diskCssImport) return diskCssImport(ctx);
    return `\nimport ${JSON.stringify(ctx.cssId)};`;
  });

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

  let isRsc = false;
  let isBuild = false;
  let sheetRef: string | undefined;

  const clientCssModules = (cssFilename: string) => {
    const clientEnv = (devServer as any)?.environments?.client;
    const graph = clientEnv?.moduleGraph;
    if (!graph) return null;

    const mods = new Set<any>(graph.getModulesByFile(cssFilename) ?? []);
    const byId = graph.getModuleById(cssFilename);
    if (byId) mods.add(byId);
    return { clientEnv, graph, mods };
  };

  const invalidateClientCss = (cssFilename: string) => {
    const found = clientCssModules(cssFilename);
    if (!found || found.mods.size === 0) return;

    found.mods.forEach((m) => found.graph.invalidateModule(m));

    const cssId = `/${path.relative(viteRoot, cssFilename).replace(/\\/g, '/')}`;
    found.clientEnv.hot.send({
      type: 'update',
      updates: [
        {
          type: 'css-update',
          timestamp: Date.now(),
          path: cssId,
          acceptedPath: cssId,
        },
      ],
    });
  };

  const reloadClientCss = (cssFilename: string) => {
    const found = clientCssModules(cssFilename);
    if (found && found.mods.size > 0) {
      found.mods.forEach((m) => found.clientEnv.reloadModule(m));
      return true;
    }
    return false;
  };

  const baseTransform = plugin.transform;
  plugin.transform = async function (this: any, code: string, id: string) {
    const result = await baseTransform.call(this, code, id);

    if (
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
      const cssContent = cssLookup.get(cssFilename) ?? '';
      const envName = (this as any).environment?.name;
      const seenKey = `${envName ?? ''}:${cssFilename}`;

      if (envName && envName !== 'client') {
        if (lastServedCss.get(seenKey) !== cssContent) {
          lastServedCss.set(seenKey, cssContent);
          invalidateClientCss(cssFilename);
        }
      } else if (lastServedCss.get(seenKey) !== cssContent) {
        if (reloadClientCss(cssFilename)) {
          lastServedCss.set(seenKey, cssContent);
        } else {
          const mod = devServer.moduleGraph.getModuleById(cssFilename);
          if (mod) {
            lastServedCss.set(seenKey, cssContent);
            devServer.reloadModule(mod);
          }
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

      isBuild = command === 'build';
      isRsc = isRscConfig(userConfig);

      if (isBuild && !isRsc) {
        configToReturn.build = {
          ...(userConfig.build ?? {}),
          cssCodeSplit: false,
        };
      }

      if (isBuild && isRsc) {
        configToReturn.environments = {
          rsc: { build: { cssCodeSplit: false } },
        };
      }

      return configToReturn;
    },

    buildStart() {
      sheetRef = undefined;
    },

    async buildEnd(this: any) {
      if (!isRsc || !isBuild) return;
      if (this.environment?.name !== 'rsc') return;

      const source = await optimizer(
        [...cssLookup.keys()]
          .sort()
          .map((key) => cssLookup.get(key))
          .join(''),
      );
      if (!source.trim()) return;

      sheetRef = this.emitFile({
        type: 'asset',
        name: 'plumeria.css',
        source,
      });
    },

    renderChunk(this: any, _code: string, chunk: any) {
      if (!sheetRef) return null;
      if (this.environment?.name !== 'rsc') return null;
      chunk.viteMetadata.importedCss.add(this.getFileName(sheetRef));
      return null;
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
      const queryIndex = importeeUrl.indexOf('?');
      const id =
        queryIndex === -1 ? importeeUrl : importeeUrl.slice(0, queryIndex);
      const query = queryIndex === -1 ? '' : importeeUrl.slice(queryIndex);
      if (cssLookup.has(id)) {
        return id + query;
      }
      const resolved = cssFileLookup.get(id);
      if (resolved) {
        return resolved + query;
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
