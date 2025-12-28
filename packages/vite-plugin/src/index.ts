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

import { type CSSProperties, genBase36Hash } from 'zss-engine';

import {
  tables,
  traverse,
  getStyleRecords,
  collectLocalConsts,
  objectExpressionToObject,
  scanForCreateStatic,
  scanForCreateTheme,
  scanForKeyframes,
  scanForViewTransition,
  t,
  extractOndemandStyles,
} from '@plumeria/utils';
import type { StyleRecord, CSSObject } from '@plumeria/utils';

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
  let isDev = false;

  return {
    name: '@plumeria/vite-plugin',
    enforce: 'pre', // Process before transpiling

    configResolved(resolvedConfig) {
      isDev = resolvedConfig.command === 'serve';
      config = resolvedConfig;
    },

    configureServer(_server) {
      if (!isDev) return;
      devServer = _server;
    },

    // --- Virtual Module Resolution ---
    resolveId(importeeUrl) {
      if (!isDev) return;
      const [id] = importeeUrl.split('?', 1);
      if (cssLookup.has(id)) {
        return id;
      }
      return cssFileLookup.get(id);
    },

    load(url) {
      if (!isDev) return;
      const [id] = url.split('?', 1);
      return cssLookup.get(id);
    },

    // --- HMR Handling ---
    handleHotUpdate(ctx) {
      if (!isDev) return;
      if (ctx.modules.length) {
        return ctx.modules;
      }
      const affected = targets.filter((target) =>
        target.dependencies.some((dep) => dep === ctx.file),
      );

      return affected
        .map((target) => devServer.moduleGraph.getModuleById(target.id))
        .filter((m): m is ModuleNode => !!m)
        .concat(ctx.modules);
    },

    transform(source, url) {
      const [id] = url.split('?', 1);

      if (id.includes('node_modules')) {
        return null;
      }

      if (url.includes('?')) {
        return null;
      }

      const ext = id.split('.').pop() || '';
      if (!TARGET_EXTENSIONS.includes(ext)) {
        return null;
      }

      if (!filter(id)) {
        return null;
      }

      const dependencies: string[] = [];
      const addDependency = (depPath: string) => {
        dependencies.push(depPath);
        this.addWatchFile(depPath);
      };

      // Reset and scan
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

      const extractedSheets: string[] = [];
      let ast: any;

      const scriptContents = getScriptContents(source, id);

      const replacements: Array<{
        start: number;
        end: number;
        content: string;
      }> = [];

      for (const content of scriptContents) {
        if (!content.trim()) continue;

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

        const localCreateStyles: Record<string, CSSObject> = {};

        traverse(ast, {
          VariableDeclarator({ node }: any) {
            if (
              node.id.type === 'Identifier' &&
              node.init &&
              t.isCallExpression(node.init) &&
              t.isMemberExpression(node.init.callee) &&
              t.isIdentifier(node.init.callee.object, { name: 'css' }) &&
              t.isIdentifier(node.init.callee.property, { name: 'create' }) &&
              node.init.arguments.length === 1 &&
              t.isObjectExpression(node.init.arguments[0].expression)
            ) {
              const obj = objectExpressionToObject(
                node.init.arguments[0].expression as ObjectExpression,
                tables.staticTable,
                tables.keyframesHashTable,
                tables.viewTransitionHashTable,
                tables.themeTable,
              );
              if (obj) {
                localCreateStyles[node.id.value] = obj;

                const hashMap: Record<string, string> = {};
                Object.entries(obj).forEach(([key, style]) => {
                  const records = getStyleRecords(
                    key,
                    style as CSSProperties,
                    1,
                  );
                  const propMap: Record<string, string> = {};
                  extractOndemandStyles(style, extractedSheets);
                  records.forEach((r: StyleRecord) => {
                    propMap[r.key] = r.hash;
                    extractedSheets.push(r.sheet);
                  });
                  hashMap[key] = records.map((r) => r.hash).join(' ');
                });

                replacements.push({
                  start: node.init.span.start - ast.span.start,
                  end: node.init.span.end - ast.span.start,
                  content: JSON.stringify(hashMap),
                });
              }
            }
          },
          CallExpression({ node }: any) {
            const callee = node.callee;
            if (
              t.isMemberExpression(callee) &&
              t.isIdentifier(callee.object, { name: 'css' }) &&
              t.isIdentifier(callee.property)
            ) {
              const args = node.arguments;
              if (callee.property.value === 'props') {
                const merged: Record<string, any> = {};
                let allStatic = true;
                args.forEach((arg: any) => {
                  const expr = arg.expression;
                  if (t.isObjectExpression(expr)) {
                    const obj = objectExpressionToObject(
                      expr,
                      tables.staticTable,
                      tables.keyframesHashTable,
                      tables.viewTransitionHashTable,
                      tables.themeTable,
                    );
                    if (obj) {
                      Object.assign(merged, obj);
                    } else {
                      allStatic = false;
                    }
                  } else if (t.isMemberExpression(expr)) {
                    if (
                      t.isIdentifier(expr.object) &&
                      t.isIdentifier(expr.property)
                    ) {
                      const varName = expr.object.value;
                      const propName = expr.property.value;
                      const styleSet = localCreateStyles[varName];
                      if (styleSet && styleSet[propName]) {
                        Object.assign(merged, styleSet[propName]);
                      } else {
                        allStatic = false;
                      }
                    } else {
                      allStatic = false;
                    }
                  } else if (t.isIdentifier(expr)) {
                    const obj = localCreateStyles[expr.value];
                    if (obj) {
                      Object.assign(merged, obj);
                    } else {
                      allStatic = false;
                    }
                  } else {
                    allStatic = false;
                  }
                });
                if (allStatic && Object.keys(merged).length > 0) {
                  extractOndemandStyles(merged, extractedSheets);
                  const hash = genBase36Hash(merged, 1, 8);
                  const records = getStyleRecords(hash, merged);
                  records.forEach((r: StyleRecord) =>
                    extractedSheets.push(r.sheet),
                  );

                  replacements.push({
                    start: node.span.start - ast.span.start,
                    end: node.span.end - ast.span.start,
                    content: JSON.stringify(
                      records.map((r: StyleRecord) => r.hash).join(' '),
                    ),
                  });
                }
              } else if (
                callee.property.value === 'keyframes' &&
                args.length > 0 &&
                t.isObjectExpression(args[0].expression)
              ) {
                const obj = objectExpressionToObject(
                  args[0].expression as ObjectExpression,
                  tables.staticTable,
                  tables.keyframesHashTable,
                  tables.viewTransitionHashTable,
                  tables.themeTable,
                );
                const hash = genBase36Hash(obj, 1, 8);
                tables.keyframesObjectTable[hash] = obj;

                replacements.push({
                  start: node.span.start - ast.span.start,
                  end: node.span.end - ast.span.start,
                  content: JSON.stringify(`kf-${hash}`),
                });
              } else if (
                callee.property.value === 'viewTransition' &&
                args.length > 0 &&
                t.isObjectExpression(args[0].expression)
              ) {
                const obj = objectExpressionToObject(
                  args[0].expression as ObjectExpression,
                  tables.staticTable,
                  tables.keyframesHashTable,
                  tables.viewTransitionHashTable,
                  tables.themeTable,
                );
                const hash = genBase36Hash(obj, 1, 8);
                tables.viewTransitionObjectTable[hash] = obj;

                replacements.push({
                  start: node.span.start - ast.span.start,
                  end: node.span.end - ast.span.start,
                  content: JSON.stringify(`vt-${hash}`),
                });
              } else if (
                callee.property.value === 'createTheme' &&
                args.length > 0 &&
                t.isObjectExpression(args[0].expression)
              ) {
                const obj = objectExpressionToObject(
                  args[0].expression as ObjectExpression,
                  tables.staticTable,
                  tables.keyframesHashTable,
                  tables.viewTransitionHashTable,
                  tables.themeTable,
                );
                const hash = genBase36Hash(obj, 1, 8);
                tables.createThemeObjectTable[hash] = obj;
                replacements.push({
                  start: node.span.start - ast.span.start,
                  end: node.span.end - ast.span.start,
                  content: JSON.stringify(`theme-${hash}`),
                });
              }
            }
          },
        });
      }

      // Apply replacements
      const buffer = Buffer.from(source);
      let offset = 0;
      const parts: Buffer[] = [];

      replacements
        .sort((a, b) => a.start - b.start)
        .forEach((r) => {
          parts.push(buffer.subarray(offset, r.start));
          parts.push(Buffer.from(r.content));
          offset = r.end;
        });
      parts.push(buffer.subarray(offset));
      const transformedCode = Buffer.concat(parts).toString();

      if (extractedSheets.length > 0) {
        const generatedCSS = extractedSheets.join('\n');
        const baseId = id.replace(EXTENSION_PATTERN, '');
        const cssFilename = `${baseId}.zero.css`;
        const cssRelativePath = path
          .relative(config.root, cssFilename)
          .replace(/\\/g, '/');
        const cssId = `/${cssRelativePath}`;

        cssLookup.set(cssFilename, generatedCSS);
        cssFileLookup.set(cssId, cssFilename);

        const targetIndex = targets.findIndex((t) => t.id === id);
        if (targetIndex !== -1) {
          targets[targetIndex].dependencies = dependencies;
        } else {
          targets.push({ id, dependencies });
        }

        if (devServer?.moduleGraph) {
          const cssModule = devServer.moduleGraph.getModuleById(cssFilename);
          if (cssModule) devServer.reloadModule(cssModule);
        }

        return {
          code: injectImport(transformedCode, id, cssFilename),
          map: null,
        };
      }

      return {
        code: transformedCode,
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
      (_match, open, content, close) =>
        `${open}${content}${importStmt}\n${close}`,
    );
  }
  return `${code}${importStmt}`;
}
