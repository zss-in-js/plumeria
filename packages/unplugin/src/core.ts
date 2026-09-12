import type { UnpluginFactory } from 'unplugin';
import { createFilter } from '@rollup/pluginutils';
import * as path from 'path';
import {
  resolvePropertyPolicy,
  optimizer,
  transformSource,
  DEFAULT_STYLE_PROP,
} from '@plumeria/utils';
import type { PropertyPolicyOptions } from '@plumeria/utils';

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

  const cssLookup = new Map<string, string>();
  const cssFileLookup = new Map<string, string>();
  const targets: { id: string; dependencies: string[] }[] = [];

  const devCssSheets = new Map<string, Set<string>>();
  let isDev = false;
  let skipCssImport = false;
  let cssImport: CssImportFormatter | null = null;
  let viteRoot: string = process.cwd();

  return {
    name: '@plumeria/unplugin',
    enforce: 'pre',

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
      setSkipCssImport(value: boolean) {
        skipCssImport = value;
      },
      setCssImport(formatter: CssImportFormatter | null) {
        cssImport = formatter;
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

    async transform(source, id) {
      if (id.includes('node_modules')) return null;
      if (!source.includes('@plumeria/core')) return null;

      const [baseId] = id.split('?');
      if (!filter(baseId)) return null;

      const dependencies: string[] = [];
      const addDependency = (depPath: string) => {
        dependencies.push(depPath);
        if ((this as any).addWatchFile) {
          (this as any).addWatchFile(depPath);
        }
      };

      const { code: transformedSource, sheets: extractedSheets } =
        await transformSource({
          source,
          moduleId: id,
          filePath: baseId,
          root: viteRoot,
          styleProp,
          propertyPolicy,
          isDev,
          collectOndemandSheets: true,
          addDependency,
        });
      const optInCSS = await optimizer(extractedSheets.join(''));

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

        const accCSS = await optimizer(Array.from(acc).join(''));
        cssLookup.set(cssFilename, accCSS);
      } else {
        cssLookup.set(cssFilename, optInCSS);
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
          : skipCssImport
            ? null
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
  };
};
