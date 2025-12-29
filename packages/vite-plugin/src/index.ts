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
import type { StyleRecord } from '@plumeria/utils';

const TARGET_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'];
const EXTENSION_PATTERN = /\.(ts|tsx|js|jsx)$/;

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

    transform(source, id) {
      if (id.includes('node_modules')) return null;
      if (id.includes('?')) return null;

      const ext = id.split('.').pop() || '';
      if (!TARGET_EXTENSIONS.includes(ext)) return null;
      if (!filter(id)) return null;

      const isTSFile = id.endsWith('.ts') && !id.endsWith('.tsx');
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

      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: true,
        target: 'es2022',
      });

      const localConsts = collectLocalConsts(ast);
      Object.assign(tables.staticTable, localConsts);

      const localCreateStyles: Record<
        string,
        {
          name: string;
          type: 'create' | 'constant';
          obj: Record<string, any>;
          hashMap: Record<string, string>;
          hasDynamicAccess: boolean;
          isExported: boolean;
          initSpan: { start: number; end: number };
          declSpan: { start: number; end: number };
        }
      > = {};

      const replacements: Array<{
        start: number;
        end: number;
        content: string;
      }> = [];
      const extractedSheets: string[] = [];
      const processedDecls = new Set<any>();

      const registerStyle = (node: any, declSpan: any, isExported: boolean) => {
        if (
          t.isIdentifier(node.id) &&
          node.init &&
          t.isCallExpression(node.init) &&
          t.isMemberExpression(node.init.callee) &&
          t.isIdentifier(node.init.callee.object, { name: 'css' }) &&
          t.isIdentifier(node.init.callee.property) &&
          node.init.arguments.length >= 1
        ) {
          const propName = node.init.callee.property.value;
          if (
            propName === 'create' &&
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
              const hashMap: Record<string, string> = {};
              Object.entries(obj).forEach(([key, style]) => {
                const records = getStyleRecords(key, style as CSSProperties, 2);
                extractOndemandStyles(style, extractedSheets);
                records.forEach((r: StyleRecord) => {
                  extractedSheets.push(r.sheet);
                });
                hashMap[key] = records.map((r) => r.hash).join(' ');
              });

              localCreateStyles[node.id.value] = {
                name: node.id.value,
                type: 'create',
                obj,
                hashMap,
                hasDynamicAccess: false,
                isExported,
                initSpan: {
                  start: node.init.span.start - ast.span.start,
                  end: node.init.span.end - ast.span.start,
                },
                declSpan: {
                  start: declSpan.start - ast.span.start,
                  end: declSpan.end - ast.span.start,
                },
              };
            }
          } else if (
            (propName === 'createTheme' || propName === 'createStatic') &&
            (t.isObjectExpression(node.init.arguments[0].expression) ||
              t.isStringLiteral(node.init.arguments[0].expression))
          ) {
            localCreateStyles[node.id.value] = {
              name: node.id.value,
              type: 'constant',
              obj: {},
              hashMap: {},
              hasDynamicAccess: false,
              isExported,
              initSpan: {
                start: node.init.span.start - ast.span.start,
                end: node.init.span.end - ast.span.start,
              },
              declSpan: {
                start: declSpan.start - ast.span.start,
                end: declSpan.end - ast.span.start,
              },
            };
          }
        }
      };

      traverse(ast, {
        ExportDeclaration({ node }) {
          if (t.isVariableDeclaration(node.declaration)) {
            processedDecls.add(node.declaration);
            node.declaration.declarations.forEach((decl: any) => {
              registerStyle(decl, node.span, true);
            });
          }
        },
        VariableDeclaration({ node }) {
          if (processedDecls.has(node)) return;
          node.declarations.forEach((decl: any) => {
            registerStyle(decl, node.span, false);
          });
        },
        MemberExpression({ node }) {
          if (t.isIdentifier(node.object)) {
            const styleInfo = localCreateStyles[node.object.value];
            if (styleInfo) {
              if (t.isIdentifier(node.property)) {
                const hash = styleInfo.hashMap[node.property.value];
                if (!hash && styleInfo.type !== 'constant') {
                  styleInfo.hasDynamicAccess = true;
                }
              } else {
                styleInfo.hasDynamicAccess = true;
              }
            }
          }
        },

        CallExpression({ node }) {
          const callee = node.callee;
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object, { name: 'css' }) &&
            t.isIdentifier(callee.property)
          ) {
            const propName = callee.property.value;
            const args = node.arguments;

            if (
              propName === 'keyframes' &&
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
              propName === 'viewTransition' &&
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
              propName === 'createTheme' &&
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
            }
          }
        },
      });

      // Pass 2: Confirm reference replacement
      traverse(ast, {
        MemberExpression({ node }) {
          if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
            const styleInfo = localCreateStyles[node.object.value];
            if (styleInfo && !styleInfo.hasDynamicAccess) {
              const hash = styleInfo.hashMap[node.property.value];
              if (hash) {
                replacements.push({
                  start: node.span.start - ast.span.start,
                  end: node.span.end - ast.span.start,
                  content: JSON.stringify(hash),
                });
              }
            }
          }
        },
        CallExpression({ node }) {
          const callee = node.callee;
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object, { name: 'css' }) &&
            t.isIdentifier(callee.property, { name: 'props' })
          ) {
            const merged: Record<string, any> = {};
            let allStatic = true;
            const args = node.arguments;

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
                obj ? Object.assign(merged, obj) : (allStatic = false);
              } else if (
                t.isMemberExpression(expr) &&
                t.isIdentifier(expr.object) &&
                t.isIdentifier(expr.property)
              ) {
                const styleInfo = localCreateStyles[expr.object.value];
                if (
                  styleInfo &&
                  !styleInfo.hasDynamicAccess &&
                  styleInfo.obj[expr.property.value]
                ) {
                  Object.assign(merged, styleInfo.obj[expr.property.value]);
                } else {
                  allStatic = false;
                }
              } else if (t.isIdentifier(expr)) {
                const styleInfo = localCreateStyles[expr.value];
                if (styleInfo && !styleInfo.hasDynamicAccess) {
                  Object.assign(merged, styleInfo.obj);
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
              const records = getStyleRecords(hash, merged, 2);
              records.forEach((r: StyleRecord) =>
                extractedSheets.push(r.sheet),
              );
              const resultHash = records
                .map((r: StyleRecord) => r.hash)
                .join(' ');
              replacements.push({
                start: node.span.start - ast.span.start,
                end: node.span.end - ast.span.start,
                content: JSON.stringify(resultHash),
              });
            }
          }
        },
      });

      // Confirm the replacement of the styles declaration
      Object.values(localCreateStyles).forEach((info) => {
        if (info.isExported) {
          const content =
            isTSFile || info.hasDynamicAccess
              ? JSON.stringify(info.hashMap)
              : JSON.stringify('');

          replacements.push({
            start: info.initSpan.start,
            end: info.initSpan.end,
            content,
          });
        } else {
          if (info.hasDynamicAccess) {
            replacements.push({
              start: info.initSpan.start,
              end: info.initSpan.end,
              content: JSON.stringify(info.hashMap),
            });
          } else {
            replacements.push({
              start: info.declSpan.start,
              end: info.declSpan.end,
              content: '',
            });
          }
        }
      });

      // Apply replacements
      const buffer = Buffer.from(source);
      let offset = 0;
      const parts: Buffer[] = [];

      replacements
        .sort((a, b) => a.start - b.start || b.end - a.end)
        .forEach((r) => {
          if (r.start < offset) return;
          parts.push(buffer.subarray(offset, r.start));
          parts.push(Buffer.from(r.content));
          offset = r.end;
        });
      parts.push(buffer.subarray(offset));
      const transformedCode = Buffer.concat(parts).toString();

      if (extractedSheets.length > 0) {
        const generatedCSS = extractedSheets.join('');
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

function injectImport(code: string, _id: string, importPath: string): string {
  const importStmt = `\nimport ${JSON.stringify(importPath)};`;
  return `${code}${importStmt}`;
}
