import type { UnpluginFactory } from 'unplugin';
import { createFilter } from '@rollup/pluginutils';
import * as path from 'path';
import compiler from '@plumeria/compiler';
import type { PropertyPolicyOptions } from '@plumeria/compiler';
import { startLintGuard } from '@plumeria/eslint-plugin/guard';

const {
  resolvePropertyPolicy,
  optimizer,
  transformSource,
  DEFAULT_STYLE_PROP,
  needsCompile,
} = compiler;

export type CssImportContext = {
  id: string;
  cssId: string;
  cssFilename: string;
  css: string;
};

export type CssImportFormatter = (ctx: CssImportContext) => string | null;

export interface PluginOptions extends PropertyPolicyOptions {
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  devEmitToDisk?: boolean;
  styleProp?: string;
  lint?: boolean;
}

/* istanbul ignore next -- SWC reports exported constant initializers as uncovered. */
export const EXTENSION_PATTERN =
  /* istanbul ignore next */ /\.(ts|tsx|js|jsx)$/;

export const unpluginFactory: UnpluginFactory<PluginOptions | undefined> = (
  options = {},
  unpluginMeta,
) => {
  const filter = createFilter(options.include, options.exclude);
  const propertyPolicy = resolvePropertyPolicy(options);
  const styleProp = options.styleProp ?? DEFAULT_STYLE_PROP;
  let classProp: string | undefined;

  const cssLookup = new Map<string, string>();
  const cssFileLookup = new Map<string, string>();
  const targets: { id: string; dependencies: string[] }[] = [];

  const devCssSheets = new Map<string, Set<string>>();
  let isDev = false;
  let cssImport: CssImportFormatter | null = null;
  let viteRoot: string = process.cwd();

  const lint = options.lint !== false;
  const lintOnRun = (bundler: {
    hooks: { run: { tap: (name: string, fn: () => void) => void } };
  }) => {
    if (!lint) return;
    bundler.hooks.run.tap('@plumeria/unplugin', () => {
      startLintGuard();
    });
  };
  const lintUnlessWatching = {
    buildStart(this: { meta: { watchMode: boolean } }) {
      if (lint && !this.meta.watchMode) startLintGuard();
    },
  };

  return {
    name: '@plumeria/unplugin',
    enforce: 'pre',

    webpack: lintOnRun,
    rspack: lintOnRun,
    rollup: lintUnlessWatching,
    rolldown: lintUnlessWatching,
    vite: {
      config(_config: unknown, { command }: { command: string }) {
        if (lint && command === 'build') startLintGuard();
      },
    },
    farm: {
      config(config: any) {
        if (lint && config?.compilation?.mode === 'production')
          startLintGuard();
        return config;
      },
    },

    // Internal state for bundler-specific hooks
    __plumeriaInternal: {
      cssLookup,
      cssFileLookup,
      targets,
      devCssSheets,
      unpluginMeta,
      setDev(value: boolean) {
        isDev = value;
      },
      setRoot(root: string) {
        viteRoot = root;
      },
      setCssImport(formatter: CssImportFormatter | null) {
        cssImport = formatter;
      },
      setClassProp(value: string) {
        classProp = value;
      },
    },

    resolveId(id, importer) {
      const [pathId, query] = id.split('?');
      if (pathId.endsWith('.zero.css')) {
        if (pathId.startsWith('/')) {
          return id;
        }
        if (importer && !path.isAbsolute(pathId)) {
          const resolved = path.resolve(path.dirname(importer), pathId);
          return query ? `${resolved}?${query}` : resolved;
        }
        return query ? `${pathId}?${query}` : pathId;
      }
      return null;
    },

    loadInclude(id) {
      const [pathId] = id.split('?');
      return pathId.endsWith('.zero.css');
    },

    load(id) {
      const [pathId] = id.split('?', 1);
      const resolved = cssFileLookup.get(pathId) ?? path.join(viteRoot, pathId);
      return cssLookup.get(resolved) ?? cssLookup.get(pathId) ?? '';
    },

    transformInclude(id) {
      return filter(id);
    },

    transform: {
      order: 'pre',
      async handler(source, id) {
        if (id.includes('node_modules')) return null;
        const [baseId] = id.split('?');
        if (!filter(baseId)) return null;
        if (!needsCompile(source, styleProp, baseId)) return null;

        const dependencies: string[] = [];
        const addDependency = (depPath: string) => {
          dependencies.push(depPath);
          if ((this as any).addWatchFile) {
            (this as any).addWatchFile(depPath);
          }
        };

        const { code: transformedSource, sheets: extractedSheets } =
          transformSource({
            source,
            moduleId: id,
            filePath: baseId,
            root: viteRoot,
            styleProp,
            classProp,
            propertyPolicy,
            isDev,
            collectOndemandSheets: true,
            addDependency,
          });

        const cssFilename = `${baseId.replace(EXTENSION_PATTERN, '')}.zero.css`;
        const cssId = `/${path.relative(viteRoot, cssFilename).replace(/\\/g, '/')}`;

        if (isDev) {
          if (!devCssSheets.has(cssFilename)) {
            devCssSheets.set(cssFilename, new Set());
          }
          const acc = devCssSheets.get(cssFilename)!;

          // Additive in dev: keep previously emitted sheets so classes still
          // referenced by not-yet-retransformed modules never flash away.
          // Re-adding moves a sheet to the end so latest-wins order is kept
          // for :root/theme rules.
          extractedSheets.forEach((sheet) => {
            acc.delete(sheet);
            acc.add(sheet);
          });

          const accCSS = optimizer(Array.from(acc).join(''));
          cssLookup.set(cssFilename, accCSS);
        } else {
          cssLookup.set(cssFilename, optimizer(extractedSheets.join('')));
        }
        cssFileLookup.set(cssId, cssFilename);

        if (extractedSheets.length > 0) {
          const targetIndex = targets.findIndex((t) => t.id === id);
          if (targetIndex !== -1) {
            targets[targetIndex].dependencies = dependencies;
          } else {
            targets.push({ id, dependencies });
          }

          const statement = cssImport
            ? cssImport({
                id,
                cssId,
                cssFilename,
                css: cssLookup.get(cssFilename) ?? '',
              })
            : `\nimport ${JSON.stringify(cssId)};`;

          return {
            code: statement ? transformedSource + statement : transformedSource,
            map: null,
          };
        } else {
          const targetIndex = targets.findIndex((t) => t.id === id);
          if (targetIndex !== -1) {
            targets.splice(targetIndex, 1);
          }

          return {
            code: transformedSource,
            map: null,
          };
        }
      },
    },
  };
};
