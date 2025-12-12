import type {
  Plugin,
  ResolvedConfig,
  ViteDevServer,
  ModuleNode,
  FilterPattern,
} from 'vite';
import { createFilter } from 'vite';
import { parseSync, ObjectExpression } from '@swc/core';

import path from 'path';

import type { CreateStyle, CreateTheme, CSSProperties } from 'zss-engine';
import { transpile } from 'zss-engine';

import type { CSSObject, FileStyles } from '@plumeria/utils';
import {
  createCSS,
  createTheme,
  collectLocalConsts,
  objectExpressionToObject,
  scanForCreateStatic,
  scanForCreateTheme,
  scanForKeyframes,
  scanForViewTransition,
  t,
  tables,
  traverse,
} from '@plumeria/utils';

const TARGET_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'];
const EXTENSION_PATTERN = /\.(ts|tsx|js|jsx|vue|svelte)$/;

export interface PluginOptions {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export function plumeria(options: PluginOptions = {}): Plugin {
  const { include, exclude } = options;
  const filter = createFilter(include, exclude);

  // A two-layer lookup map
  // 1. Absolute path (virtual) -> CSS content
  const cssLookup = new Map<string, string>();
  // 2. Request ID (URL) -> Absolute path (virtual)
  const cssFileLookup = new Map<string, string>();

  // For dependency tracking: { id: source file, dependencies: [dependency file path] }
  const targets: { id: string; dependencies: string[] }[] = [];

  let config: ResolvedConfig;
  let devServer: ViteDevServer;

  return {
    name: '@plumeria/vite-plugin',
    apply: 'serve',
    enforce: 'pre', // Process before transpiling

    config: ({ build = {} }) => ({
      build: {
        ...build,
        rollupOptions: {
          ...build.rollupOptions,
          external: [
            ...((build.rollupOptions?.external || []) as string[]),
            'fs',
          ],
        },
      },
    }),

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(_server) {
      devServer = _server;
    },

    // --- Virtual Module Resolution ---
    resolveId(importeeUrl) {
      // Remove queries etc. and get the ID
      const [id] = importeeUrl.split('?', 1);

      // If it is already registered as generated CSS, return its ID (do not treat it as an external file)
      if (cssLookup.has(id)) {
        return id;
      }
      // Resolve URL format to file path
      return cssFileLookup.get(id);
    },

    load(url) {
      const [id] = url.split('?', 1);
      // Return the in-memory CSS
      return cssLookup.get(id);
    },

    // --- HMR Handling ---
    handleHotUpdate(ctx) {
      // If the module itself has changed, leave it to Vite
      if (ctx.modules.length) {
        return ctx.modules;
      }
      // If a dependent file (such as a token definition) is changed,
      // identify the files that depend on it and update them.
      const affected = targets.filter((target) =>
        // Is the changed file in the dependency list?
        target.dependencies.some((dep) => dep === ctx.file),
      );

      // Identify and return the affected modules
      return affected
        .map((target) => devServer.moduleGraph.getModuleById(target.id))
        .filter((m): m is ModuleNode => !!m)
        .concat(ctx.modules);
    },

    transform(source, url) {
      const [id] = url.split('?', 1);

      // excluding node_modules
      if (id.includes('node_modules')) {
        return null;
      }

      // excluding virtual modules (e.g. ?astro&type=style)
      if (url.includes('?')) {
        return null;
      }

      // Check the extension
      const ext = path.extname(id).slice(1);
      if (!TARGET_EXTENSIONS.includes(ext)) {
        return null;
      }

      // Custom filter
      if (!filter(id)) {
        return null;
      }

      // --- Prepare for dependency collection ---
      const dependencies: string[] = [];
      const addDependency = (depPath: string) => {
        dependencies.push(depPath);
        // Also added to Vite's watch list
        this.addWatchFile(depPath);
      };

      // --- Parser Logic (Previous Context) ---

      // Reset and scan the global table
      tables.staticTable = scanForCreateStatic(addDependency);

      const { keyframesHashTableLocal, keyframesObjectTableLocal } =
        scanForKeyframes(addDependency);
      tables.keyframesHashTable = keyframesHashTableLocal;
      tables.keyframesObjectTable = keyframesObjectTableLocal;

      const { viewTransitionHashTableLocal, viewTransitionObjectTableLocal } =
        scanForViewTransition(addDependency);
      tables.viewTransitionHashTable = viewTransitionHashTableLocal;
      tables.viewTransitionObjectTable = viewTransitionObjectTableLocal;

      const { themeTableLocal, createThemeObjectTableLocal } =
        scanForCreateTheme(addDependency);
      tables.themeTable = themeTableLocal;
      tables.createThemeObjectTable = createThemeObjectTableLocal;

      const extractedObjects: CSSObject[] = [];
      let ast;

      const scriptContents = getScriptContents(source, id);

      for (const content of scriptContents) {
        if (!content.trim()) {
          continue;
        }

        try {
          ast = parseSync(content, {
            syntax: 'typescript',
            tsx: true,
            target: 'es2022',
          });
        } catch (err) {
          console.warn(`Zero Styled: Parse error in ${id}`, err);
          continue;
        }

        const localConsts = collectLocalConsts(ast);
        Object.assign(tables.staticTable, localConsts);

        traverse(ast, {
          CallExpression({ node }) {
            const callee = node.callee;
            if (
              t.isMemberExpression(callee) &&
              t.isIdentifier(callee.object, { name: 'css' }) &&
              t.isIdentifier(callee.property)
            ) {
              const args = node.arguments;
              if (
                callee.property.value === 'create' &&
                args.length === 1 &&
                t.isObjectExpression(args[0].expression)
              ) {
                const obj = objectExpressionToObject(
                  args[0].expression as ObjectExpression,
                  tables.staticTable,
                  tables.keyframesHashTable,
                  tables.viewTransitionHashTable,
                  tables.themeTable,
                );
                if (obj) {
                  extractedObjects.push(obj);
                }
              }
            }
          },
        });
      }

      // --- CSS Generation ---
      const fileStyles: FileStyles = {};

      if (extractedObjects.length > 0) {
        const combinedStyles = extractedObjects.reduce<CSSObject>(
          (acc, obj) => Object.assign(acc, obj),
          {},
        );
        const base = createCSS(combinedStyles as CreateStyle);
        if (base) fileStyles.baseStyles = base;
      }

      if (Object.keys(tables.keyframesObjectTable).length > 0) {
        fileStyles.keyframeStyles = Object.entries(tables.keyframesObjectTable)
          .map(
            ([hash, obj]) =>
              transpile(
                { [`@keyframes kf-${hash}`]: obj },
                undefined,
                '--global',
              ).styleSheet,
          )
          .join('\n');
      }

      if (Object.keys(tables.viewTransitionObjectTable).length > 0) {
        fileStyles.viewTransitionStyles = Object.entries(
          tables.viewTransitionObjectTable,
        )
          .map(
            ([hash, obj]) =>
              transpile(
                {
                  [`::view-transition-group(vt-${hash})`]:
                    obj.group as CSSProperties,
                  [`::view-transition-image-pair(vt-${hash})`]:
                    obj.imagePair as CSSProperties,
                  [`::view-transition-old(vt-${hash})`]:
                    obj.old as CSSProperties,
                  [`::view-transition-new(vt-${hash})`]:
                    obj.new as CSSProperties,
                },
                undefined,
                '--global',
              ).styleSheet,
          )
          .join('\n');
      }

      if (Object.keys(tables.createThemeObjectTable).length > 0) {
        fileStyles.themeStyles = Object.values(tables.createThemeObjectTable)
          .map(
            (obj) =>
              transpile(createTheme(obj as CreateTheme), undefined, '--global')
                .styleSheet,
          )
          .join('\n');
      }

      const sections: string[] = [];
      if (fileStyles.keyframeStyles?.trim())
        sections.push(fileStyles.keyframeStyles);
      if (fileStyles.viewTransitionStyles?.trim())
        sections.push(fileStyles.viewTransitionStyles);
      if (fileStyles.themeStyles?.trim()) sections.push(fileStyles.themeStyles);
      if (fileStyles.baseStyles?.trim()) sections.push(fileStyles.baseStyles);

      const generatedCSS = sections.join('\n');

      if (!generatedCSS) {
        return null;
      }

      // --- Register Virtual CSS File (Modifier Logic) ---

      const baseId = id.replace(EXTENSION_PATTERN, '');

      // Generate a virtual file name (eg: src/App.tsx -> src/App.zero.css)
      const cssFilename = `${baseId}.zero.css`;

      // Relative path from config.root
      const cssRelativePath = path
        .relative(config.root, cssFilename)
        .replace(/\\/g, '/');

      // ID in the URL (eg: /src/App.zero.css)
      const cssId = `/${cssRelativePath}`;

      // Add to map
      cssLookup.set(cssFilename, generatedCSS);
      cssFileLookup.set(cssId, cssFilename);

      // Update dependencies target
      const targetIndex = targets.findIndex((t) => t.id === id);
      if (targetIndex !== -1) {
        targets[targetIndex].dependencies = dependencies;
      } else {
        targets.push({ id, dependencies });
      }

      // --- HMR ---
      // Even if the import statement in the JS file itself has not changed,
      // it will notify you that the contents of the associated CSS have changed.
      if (devServer?.moduleGraph) {
        const cssModule = devServer.moduleGraph.getModuleById(cssFilename);
        if (cssModule) {
          devServer.reloadModule(cssModule);
        }
      }

      //  Insert import source
      return {
        code: injectImport(source, id, cssFilename),
        map: null,
      };
    },
  };
}

function getScriptContents(code: string, id: string): string[] {
  if (id.endsWith('.vue') || id.endsWith('.svelte')) {
    const matches = code.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g);
    return Array.from(matches).map((match) => match[1]);
  }
  return [code];
}

function injectImport(code: string, id: string, importPath: string): string {
  const importStmt = `\nimport ${JSON.stringify(importPath)};`;

  if (id.endsWith('.vue') || id.endsWith('.svelte')) {
    return code.replace(
      /(<script[^>]*>)([\s\S]*?)(<\/script>)/,
      (_match, open, content, close) => {
        return `${open}${content}${importStmt}\n${close}`;
      },
    );
  }

  return `${code}${importStmt}`;
}
