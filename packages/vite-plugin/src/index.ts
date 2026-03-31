import type {
  Plugin,
  ResolvedConfig,
  ViteDevServer,
  ModuleNode,
  FilterPattern,
} from 'vite';
import { createFilter } from 'vite';
import { parseSync } from '@swc/core';
import type {
  Declaration,
  Expression,
  ImportSpecifier,
  ObjectExpression,
  Identifier,
} from '@swc/core';
import * as path from 'path';

import { applyCssValue, type CSSProperties, genBase36Hash } from 'zss-engine';

import {
  traverse,
  getStyleRecords,
  collectLocalConsts,
  objectExpressionToObject,
  t,
  extractOndemandStyles,
  deepMerge,
  scanAll,
  resolveImportPath,
  optimizer,
  processVariants,
} from '@plumeria/utils';
import type {
  StyleRecord,
  StaticTable,
  KeyframesHashTable,
  ViewTransitionHashTable,
  CreateHashTable,
  VariantsHashTable,
  CreateThemeHashTable,
  CreateStaticHashTable,
} from '@plumeria/utils';
import { getLeadingCommentLength } from '@plumeria/utils';

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

    config(userConfig, { command }) {
      if (command === 'build') {
        const build = userConfig.build || {};
        build.cssCodeSplit = false;
        return { build };
      }
    },

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
      const [id] = importeeUrl.split('?', 1);
      if (cssLookup.has(id)) {
        return id;
      }
      return cssFileLookup.get(id);
    },

    load(url) {
      const [id] = url.split('?', 1);
      return cssLookup.get(id);
    },

    // --- HMR Handling ---
    handleHotUpdate(ctx) {
      if (!isDev) return;

      const modules = [...ctx.modules];

      // If a local file changes, we must invalidate all Plumeria providers (targets)
      // because global usage tracking (tuples) might have changed, affecting their output.
      if (!ctx.file.includes('node_modules')) {
        const affectedProviders = targets
          .filter((t) => t.id !== ctx.file)
          .map((t) => devServer.moduleGraph.getModuleById(t.id))
          .filter((m): m is ModuleNode => !!m);

        // Add unique providers
        affectedProviders.forEach((p) => {
          if (!modules.includes(p)) {
            modules.push(p);
          }
        });
      }

      return modules;
    },

    async transform(source, id) {
      if (id.includes('node_modules')) return null;
      if (!source.includes('@plumeria/core')) return null;
      if (id.includes('?')) return null;

      const ext = id.split('.').pop() || '';
      if (!TARGET_EXTENSIONS.includes(ext)) return null;
      if (!filter(id)) return null;

      const dependencies: string[] = [];
      const addDependency = (depPath: string) => {
        dependencies.push(depPath);
        this.addWatchFile(depPath);
      };

      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: true,
        target: 'es2022',
      });

      const leadingLen = getLeadingCommentLength(source);
      const sourceBuffer = Buffer.from(source, 'utf-8');
      const leadingBytes = Buffer.byteLength(
        source.slice(0, leadingLen),
        'utf-8',
      );
      const baseByteOffset = ast.span.start - leadingBytes;

      for (const node of ast.body) {
        if (node.type === 'ImportDeclaration') {
          const sourcePath = node.source.value;
          const actualPath = resolveImportPath(sourcePath, id);
          if (actualPath) {
            addDependency(actualPath);
          }
        }
      }

      const scannedTables = scanAll();

      const extractedSheets: string[] = [];
      const addSheet = (sheet: string) => {
        if (!extractedSheets.includes(sheet)) {
          extractedSheets.push(sheet);
        }
      };

      const localConsts = collectLocalConsts(ast);
      const resourcePath = id;
      const importMap: Record<string, any> = {};
      const createThemeImportMap: Record<string, any> = {};
      const createStaticImportMap: Record<string, any> = {};

      const plumeriaAliases: Record<string, string> = {};

      traverse(ast, {
        ImportDeclaration({ node }) {
          const sourcePath = node.source.value;

          if (sourcePath === '@plumeria/core') {
            node.specifiers.forEach((specifier: any) => {
              if (specifier.type === 'ImportNamespaceSpecifier') {
                plumeriaAliases[specifier.local.value] = 'NAMESPACE';
              } else if (specifier.type === 'ImportDefaultSpecifier') {
                plumeriaAliases[specifier.local.value] = 'NAMESPACE';
              } else if (specifier.type === 'ImportSpecifier') {
                const importedName = specifier.imported
                  ? specifier.imported.value
                  : specifier.local.value;
                plumeriaAliases[specifier.local.value] = importedName;
              }
            });
          }

          const actualPath = resolveImportPath(sourcePath, resourcePath);

          if (actualPath) {
            node.specifiers.forEach((specifier: ImportSpecifier) => {
              if (specifier.type === 'ImportSpecifier') {
                const importedName = specifier.imported
                  ? specifier.imported.value
                  : specifier.local.value;
                const localName = specifier.local.value;
                const uniqueKey = `${actualPath}-${importedName}`;

                if (scannedTables.staticTable[uniqueKey]) {
                  importMap[localName] = scannedTables.staticTable[uniqueKey];
                }
                if (scannedTables.keyframesHashTable[uniqueKey]) {
                  importMap[localName] =
                    scannedTables.keyframesHashTable[uniqueKey];
                }
                if (scannedTables.viewTransitionHashTable[uniqueKey]) {
                  importMap[localName] =
                    scannedTables.viewTransitionHashTable[uniqueKey];
                }
                if (scannedTables.createHashTable[uniqueKey]) {
                  importMap[localName] =
                    scannedTables.createHashTable[uniqueKey];
                }
                if (scannedTables.variantsHashTable[uniqueKey]) {
                  importMap[localName] =
                    scannedTables.variantsHashTable[uniqueKey];
                }
                if (scannedTables.createThemeHashTable[uniqueKey]) {
                  createThemeImportMap[localName] =
                    scannedTables.createThemeHashTable[uniqueKey];
                }
                if (scannedTables.createStaticHashTable[uniqueKey]) {
                  createStaticImportMap[localName] =
                    scannedTables.createStaticHashTable[uniqueKey];
                }
              }
            });
          }
        },
      });

      const mergedStaticTable: StaticTable = {};
      for (const key of Object.keys(scannedTables.staticTable)) {
        mergedStaticTable[key] = scannedTables.staticTable[key];
      }
      for (const key of Object.keys(localConsts)) {
        mergedStaticTable[key] = localConsts[key];
      }
      for (const key of Object.keys(importMap)) {
        mergedStaticTable[key] = importMap[key];
      }

      const mergedKeyframesTable: KeyframesHashTable = {};
      for (const key of Object.keys(scannedTables.keyframesHashTable)) {
        mergedKeyframesTable[key] = scannedTables.keyframesHashTable[key];
      }
      for (const key of Object.keys(importMap)) {
        mergedKeyframesTable[key] = importMap[key];
      }

      const mergedViewTransitionTable: ViewTransitionHashTable = {};
      for (const key of Object.keys(scannedTables.viewTransitionHashTable)) {
        mergedViewTransitionTable[key] =
          scannedTables.viewTransitionHashTable[key];
      }
      for (const key of Object.keys(importMap)) {
        mergedViewTransitionTable[key] = importMap[key];
      }

      const mergedCreateTable: CreateHashTable = {};
      for (const key of Object.keys(scannedTables.createHashTable)) {
        mergedCreateTable[key] = scannedTables.createHashTable[key];
      }
      for (const key of Object.keys(importMap)) {
        mergedCreateTable[key] = importMap[key];
      }

      const mergedVariantsTable: VariantsHashTable = {};
      for (const key of Object.keys(scannedTables.variantsHashTable)) {
        mergedVariantsTable[key] = scannedTables.variantsHashTable[key];
      }
      for (const key of Object.keys(importMap)) {
        mergedVariantsTable[key] = importMap[key];
      }

      const mergedCreateThemeHashTable: CreateThemeHashTable = {};
      for (const key of Object.keys(scannedTables.createThemeHashTable)) {
        mergedCreateThemeHashTable[key] =
          scannedTables.createThemeHashTable[key];
        if (key.startsWith(`${resourcePath}-`)) {
          const varName = key.slice(resourcePath.length + 1);
          mergedCreateThemeHashTable[varName] =
            scannedTables.createThemeHashTable[key];
        }
      }
      for (const key of Object.keys(createThemeImportMap)) {
        mergedCreateThemeHashTable[key] = createThemeImportMap[key];
      }

      const mergedCreateStaticHashTable: CreateStaticHashTable = {};
      for (const key of Object.keys(scannedTables.createStaticHashTable)) {
        mergedCreateStaticHashTable[key] =
          scannedTables.createStaticHashTable[key];
        if (key.startsWith(`${resourcePath}-`)) {
          const varName = key.slice(resourcePath.length + 1);
          mergedCreateStaticHashTable[varName] =
            scannedTables.createStaticHashTable[key];
        }
      }
      for (const key of Object.keys(createStaticImportMap)) {
        mergedCreateStaticHashTable[key] = createStaticImportMap[key];
      }

      const localCreateStyles: Record<
        string,
        {
          name: string;
          type: 'create' | 'constant' | 'variant';
          obj: Record<string, any>;
          hashMap: Record<string, any>;
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

      const processedDecls = new Set<any>();
      const idSpans = new Set<number>();
      const excludedSpans = new Set<number>();

      const checkVariantAssignment = (decl: any) => {
        if (
          decl.init &&
          t.isCallExpression(decl.init) &&
          t.isIdentifier(decl.init.callee)
        ) {
          const varName = decl.init.callee.value;
          if (
            (localCreateStyles[varName] &&
              localCreateStyles[varName].type === 'variant') ||
            mergedVariantsTable[varName]
          ) {
            throw new Error(
              `Plumeria: Assigning the return value of "css.variants" to a variable is not supported.\nPlease pass the variant function directly to "css.use". Found assignment to: ${
                t.isIdentifier(decl.id) ? decl.id.value : 'unknown'
              }`,
            );
          }
        }
      };

      const registerStyle = (
        node: any,
        declSpan: { start: number; end: number },
        isExported: boolean,
      ) => {
        let propName: string | undefined;

        if (
          t.isIdentifier(node.id) &&
          node.init &&
          t.isCallExpression(node.init) &&
          node.init.arguments.length >= 1
        ) {
          const callee = node.init.callee;

          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            const objectName = callee.object.value;
            const propertyName = callee.property.value;
            const alias = plumeriaAliases[objectName];

            if (alias === 'NAMESPACE') {
              propName = propertyName;
            }
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName) {
              propName = originalName;
            }
          }
        }

        if (propName) {
          if (
            propName === 'create' &&
            t.isObjectExpression(node.init.arguments[0].expression)
          ) {
            const obj = objectExpressionToObject(
              node.init.arguments[0].expression as ObjectExpression,
              mergedStaticTable,
              mergedKeyframesTable,
              mergedViewTransitionTable,
              mergedCreateThemeHashTable,
              scannedTables.createThemeObjectTable,
              mergedCreateTable,
              mergedCreateStaticHashTable,
              scannedTables.createStaticObjectTable,
              mergedVariantsTable,
            );

            if (obj) {
              const hashMap: Record<string, Record<string, string>> = {};
              Object.entries(obj).forEach(([key, style]) => {
                if (typeof style !== 'object' || style === null) return;
                const records = getStyleRecords(style as CSSProperties);
                extractOndemandStyles(style, extractedSheets, scannedTables);
                records.forEach((r: StyleRecord) => {
                  addSheet(r.sheet);
                });
                const atomMap: Record<string, string> = {};
                records.forEach((r) => (atomMap[r.key] = r.hash));
                hashMap[key] = atomMap;
              });

              // Detect function properties directly from the AST
              const objExpr = node.init.arguments[0]
                .expression as ObjectExpression;
              objExpr.properties.forEach((prop: any) => {
                if (
                  prop.type !== 'KeyValueProperty' ||
                  prop.key.type !== 'Identifier'
                )
                  return;

                const isArrow = prop.value.type === 'ArrowFunctionExpression';
                const isFunc = prop.value.type === 'FunctionExpression';
                if (!isArrow && !isFunc) return;

                const key = prop.key.value;
                const params: string[] = prop.value.params.map((p: any) =>
                  p.type === 'Identifier' ? p.value : (p.pat?.value ?? 'arg'),
                );

                interface CssVarMappings {
                  [paramName: string]: {
                    cssVar: string;
                    propKey: string;
                  };
                }

                const cssVarInfo: CssVarMappings = {};

                // Parse the function body object (replace arguments with var(--xxx))
                const tempStaticTable = { ...mergedStaticTable };
                const substitutedArgs = params.map((paramName) => {
                  const cssVar = `--${key}-${paramName}`;
                  cssVarInfo[paramName] = { cssVar, propKey: '' };
                  return `var(${cssVar})`;
                });
                params.forEach((paramName, i) => {
                  tempStaticTable[paramName] = substitutedArgs[i];
                });

                let actualBody = prop.value.body;
                if (actualBody?.type === 'ParenthesisExpression')
                  actualBody = actualBody.expression;
                if (actualBody?.type === 'BlockStatement') {
                  const first = actualBody.stmts?.[0];
                  if (first?.type === 'ReturnStatement')
                    actualBody = first.argument;
                  if (actualBody?.type === 'ParenthesisExpression')
                    actualBody = actualBody.expression;
                }
                if (!actualBody || actualBody.type !== 'ObjectExpression')
                  return;

                const substituted = objectExpressionToObject(
                  actualBody,
                  tempStaticTable,
                  mergedKeyframesTable,
                  mergedViewTransitionTable,
                  mergedCreateThemeHashTable,
                  scannedTables.createThemeObjectTable,
                  mergedCreateTable,
                  mergedCreateStaticHashTable,
                  scannedTables.createStaticObjectTable,
                  mergedVariantsTable,
                );

                if (!substituted) return;

                for (const [, info] of Object.entries(cssVarInfo)) {
                  const cssVar = info.cssVar;
                  const propKey = Object.keys(substituted).find(
                    (k) =>
                      typeof substituted[k] === 'string' &&
                      substituted[k].includes(cssVar),
                  );
                  if (propKey) {
                    info.propKey = propKey;
                  }
                }

                const records = getStyleRecords(substituted as CSSProperties);
                records.forEach((r: StyleRecord) => addSheet(r.sheet));

                const atomMap: Record<string, string> = {};
                records.forEach((r) => (atomMap[r.key] = r.hash));
                atomMap['__cssVars__'] = JSON.stringify(cssVarInfo);
                hashMap[key] = atomMap;
              });

              if (t.isIdentifier(node.id)) {
                idSpans.add(node.id.span.start);
              }

              localCreateStyles[node.id.value] = {
                name: node.id.value,
                type: 'create',
                obj,
                hashMap,
                isExported,
                initSpan: {
                  start: node.init.span.start - baseByteOffset,
                  end: node.init.span.end - baseByteOffset,
                },
                declSpan: {
                  start: declSpan.start - baseByteOffset,
                  end: declSpan.end - baseByteOffset,
                },
              };
            }
          } else if (
            propName === 'variants' &&
            t.isObjectExpression(node.init.arguments[0].expression)
          ) {
            if (t.isIdentifier(node.id)) {
              idSpans.add(node.id.span.start);
            }
            const obj = objectExpressionToObject(
              node.init.arguments[0].expression as ObjectExpression,
              mergedStaticTable,
              mergedKeyframesTable,
              mergedViewTransitionTable,
              mergedCreateThemeHashTable,
              scannedTables.createThemeObjectTable,
              mergedCreateTable,
              mergedCreateStaticHashTable,
              scannedTables.createStaticObjectTable,
              mergedVariantsTable,
              (name: string) => {
                if (localCreateStyles[name]) {
                  return localCreateStyles[name].obj;
                }
                if (mergedCreateTable[name]) {
                  const hash = mergedCreateTable[name];
                  if (scannedTables.createObjectTable[hash]) {
                    return scannedTables.createObjectTable[hash];
                  }
                }
                return undefined;
              },
            );
            const { hashMap } = processVariants(obj as any);

            localCreateStyles[node.id.value] = {
              name: node.id.value,
              type: 'variant',
              obj,
              hashMap,
              isExported,
              initSpan: {
                start: node.init.span.start - baseByteOffset,
                end: node.init.span.end - baseByteOffset,
              },
              declSpan: {
                start: declSpan.start - baseByteOffset,
                end: declSpan.end - baseByteOffset,
              },
            };
          } else if (
            propName === 'createTheme' &&
            t.isObjectExpression(node.init.arguments[0].expression)
          ) {
            if (t.isIdentifier(node.id)) {
              idSpans.add(node.id.span.start);
            }

            const obj = objectExpressionToObject(
              node.init.arguments[0].expression as ObjectExpression,
              mergedStaticTable,
              mergedKeyframesTable,
              mergedViewTransitionTable,
              mergedCreateThemeHashTable,
              scannedTables.createThemeObjectTable,
              mergedCreateTable,
              mergedCreateStaticHashTable,
              scannedTables.createStaticObjectTable,
              mergedVariantsTable,
            );

            const hash = genBase36Hash(obj, 1, 8);
            const uniqueKey = `${resourcePath}-${node.id.value}`;

            scannedTables.createThemeHashTable[uniqueKey] = hash;
            scannedTables.createThemeObjectTable[hash] = obj;

            localCreateStyles[node.id.value] = {
              name: node.id.value,
              type: 'constant',
              obj,
              hashMap: scannedTables.createAtomicMapTable[hash],
              isExported,
              initSpan: {
                start: node.init.span.start - baseByteOffset,
                end: node.init.span.end - baseByteOffset,
              },
              declSpan: {
                start: declSpan.start - baseByteOffset,
                end: declSpan.end - baseByteOffset,
              },
            };
          }
        }
      };

      traverse(ast, {
        ImportDeclaration({ node }) {
          if (node.specifiers) {
            node.specifiers.forEach((specifier: any) => {
              if (specifier.local) {
                excludedSpans.add(specifier.local.span.start);
              }
              if (specifier.imported) {
                excludedSpans.add(specifier.imported.span.start);
              }
            });
          }
        },
        ExportDeclaration({ node }) {
          if (t.isVariableDeclaration(node.declaration)) {
            processedDecls.add(node.declaration);
            node.declaration.declarations.forEach((decl: Declaration) => {
              checkVariantAssignment(decl);
              registerStyle(decl, node.span, true);
            });
          }
        },
        VariableDeclaration({ node }) {
          if (processedDecls.has(node)) return;
          node.declarations.forEach((decl: Declaration) => {
            checkVariantAssignment(decl);
            registerStyle(decl, node.span, false);
          });
        },

        CallExpression({ node }) {
          const callee = node.callee;
          let propName: string | undefined;

          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            const objectName = callee.object.value;
            const propertyName = callee.property.value;
            const alias = plumeriaAliases[objectName];

            if (alias === 'NAMESPACE') {
              propName = propertyName;
            }
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName) {
              propName = originalName;
            }
          }

          if (propName) {
            const args = node.arguments;

            if (
              propName === 'keyframes' &&
              args.length > 0 &&
              t.isObjectExpression(args[0].expression)
            ) {
              const obj = objectExpressionToObject(
                args[0].expression as ObjectExpression,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedCreateThemeHashTable,
                scannedTables.createThemeObjectTable,
                mergedCreateTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.keyframesObjectTable[hash] = obj;
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: JSON.stringify(`kf-${hash}`),
              });
            } else if (
              propName === 'viewTransition' &&
              args.length > 0 &&
              t.isObjectExpression(args[0].expression)
            ) {
              const obj = objectExpressionToObject(
                args[0].expression as ObjectExpression,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedCreateThemeHashTable,
                scannedTables.createThemeObjectTable,
                mergedCreateTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.viewTransitionObjectTable[hash] = obj;
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: JSON.stringify(`vt-${hash}`),
              });
            } else if (
              (propName === 'createTheme' || propName === 'createStatic') &&
              args.length > 0 &&
              t.isObjectExpression(args[0].expression)
            ) {
              const obj = objectExpressionToObject(
                args[0].expression as ObjectExpression,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedCreateThemeHashTable,
                scannedTables.createThemeObjectTable,
                mergedCreateTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              if (propName === 'createTheme') {
                scannedTables.createThemeObjectTable[hash] = obj;
              } else {
                scannedTables.createStaticObjectTable[hash] = obj;
              }
              const prefix = propName === 'createTheme' ? 'tm-' : 'st-';
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: JSON.stringify(`${prefix}${hash}`),
              });
            } else if (
              propName === 'create' &&
              args.length > 0 &&
              t.isObjectExpression(args[0].expression)
            ) {
              const obj = objectExpressionToObject(
                args[0].expression as ObjectExpression,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedCreateThemeHashTable,
                scannedTables.createThemeObjectTable,
                mergedCreateTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.createObjectTable[hash] = obj;
            }
          }
        },
      });

      const jsxOpeningElementMap = new Map<number, any[]>();

      interface StyleConditional {
        test: Expression;
        testString?: string;
        testLHS?: string;
        truthy: Record<string, any>;
        falsy: Record<string, any>;
        groupId?: number;
        groupName?: string;
        valueName?: string;
        varName?: string;
      }

      const getSource = (node: any): string => {
        const start = node.span.start - baseByteOffset;
        const end = node.span.end - baseByteOffset;
        return sourceBuffer.subarray(start, end).toString('utf-8');
      };

      const resolveStyleObject = (
        expr: Expression,
      ): Record<string, any> | null => {
        if (t.isObjectExpression(expr)) {
          return objectExpressionToObject(
            expr,
            mergedStaticTable,
            mergedKeyframesTable,
            mergedViewTransitionTable,
            mergedCreateThemeHashTable,
            scannedTables.createThemeObjectTable,
            mergedCreateTable,
            mergedCreateStaticHashTable,
            scannedTables.createStaticObjectTable,
            mergedVariantsTable,
          );
        } else if (
          t.isMemberExpression(expr) &&
          t.isIdentifier((expr as any).object) &&
          (t.isIdentifier((expr as any).property) ||
            (expr as any).property.type === 'Computed')
        ) {
          if ((expr as any).property.type === 'Computed') return {};
          const varName = ((expr as any).object as Identifier).value;
          const propName = ((expr as any).property as Identifier).value;
          const styleInfo = localCreateStyles[varName];
          if (styleInfo?.obj[propName]) {
            const style = styleInfo.obj[propName];
            if (typeof style === 'object' && style !== null) return style;
          }
          const hash = mergedCreateTable[varName];
          if (hash) {
            const obj = scannedTables.createObjectTable[hash];
            if (obj?.[propName] && typeof obj[propName] === 'object')
              return obj[propName] as Record<string, any>;
          }
        } else if (t.isIdentifier(expr)) {
          const varName = (expr as Identifier).value;
          const uniqueKey = `${resourcePath}-${varName}`;
          let hash = scannedTables.createHashTable[uniqueKey];
          if (!hash) hash = mergedCreateTable[varName];
          if (hash) {
            const obj = scannedTables.createObjectTable[hash];
            if (obj && typeof obj === 'object') return obj;
          }
          const styleInfo = localCreateStyles[varName];
          if (styleInfo?.obj) return styleInfo.obj;
          const vHash = mergedVariantsTable[varName];
          if (vHash) return scannedTables.variantsObjectTable[vHash];
        }
        return null;
      };

      const buildClassParts = (
        args: Array<{ expression: Expression }>,
        dynamicClassParts: string[] = [],
        existingClass: string = '',
      ): {
        classParts: string[];
        isOptimizable: boolean;
        baseStyle: Record<string, any>;
      } => {
        const conditionals: StyleConditional[] = [];
        let groupIdCounter = 0;
        let baseStyle: Record<string, any> = {};
        let isOptimizable = true;

        const collectConditions = (
          node: Expression,
          currentTestStrings: string[] = [],
        ): boolean => {
          const staticStyle = resolveStyleObject(node);
          if (staticStyle) {
            if (currentTestStrings.length === 0) {
              baseStyle = deepMerge(baseStyle, staticStyle);
            } else {
              conditionals.push({
                test: node,
                testString: currentTestStrings.join(' && '),
                truthy: staticStyle,
                falsy: {},
                varName: undefined,
              });
            }
            return true;
          }
          if (node.type === 'ConditionalExpression') {
            const testSource = getSource(node.test);
            if (currentTestStrings.length === 0) {
              const trueStyle = resolveStyleObject(node.consequent);
              const falseStyle = resolveStyleObject(node.alternate);
              if (trueStyle && falseStyle) {
                conditionals.push({
                  test: node,
                  testString: testSource,
                  truthy: trueStyle,
                  falsy: falseStyle,
                  varName: undefined,
                });
                return true;
              }
            }
            collectConditions(node.consequent, [
              ...currentTestStrings,
              `(${testSource})`,
            ]);
            collectConditions(node.alternate, [
              ...currentTestStrings,
              `!(${testSource})`,
            ]);
            return true;
          } else if (
            node.type === 'BinaryExpression' &&
            node.operator === '&&'
          ) {
            collectConditions(node.right, [
              ...currentTestStrings,
              `(${getSource(node.left)})`,
            ]);
            return true;
          } else if (node.type === 'ParenthesisExpression') {
            return collectConditions(node.expression, currentTestStrings);
          }
          return false;
        };

        for (const arg of args) {
          const expr = arg.expression;

          if (t.isCallExpression(expr) && t.isIdentifier(expr.callee)) {
            const varName = expr.callee.value;
            const uniqueKey = `${resourcePath}-${varName}`;
            let variantObj: Record<string, any> | undefined;

            let hash = scannedTables.variantsHashTable[uniqueKey];
            if (!hash) hash = mergedVariantsTable[varName];
            if (hash && scannedTables.variantsObjectTable[hash])
              variantObj = scannedTables.variantsObjectTable[hash];
            if (!variantObj && localCreateStyles[varName]?.obj)
              variantObj = localCreateStyles[varName].obj;

            if (variantObj) {
              const callArgs = expr.arguments;
              if (callArgs.length === 1 && !callArgs[0].spread) {
                const arg = callArgs[0].expression;
                if (arg.type === 'ObjectExpression') {
                  for (const prop of arg.properties) {
                    let groupName: string | undefined;
                    let valExpr: any;
                    if (
                      prop.type === 'KeyValueProperty' &&
                      prop.key.type === 'Identifier'
                    ) {
                      groupName = prop.key.value;
                      valExpr = prop.value;
                    } else if (prop.type === 'Identifier') {
                      groupName = prop.value;
                      valExpr = prop;
                    }
                    if (groupName && valExpr) {
                      const groupVariants = variantObj[groupName];
                      if (!groupVariants) continue;
                      const currentGroupId = ++groupIdCounter;
                      const valSource = getSource(valExpr);
                      if (valExpr.type === 'StringLiteral') {
                        if (groupVariants[valExpr.value])
                          baseStyle = deepMerge(
                            baseStyle,
                            groupVariants[valExpr.value],
                          );
                        continue;
                      }
                      Object.entries(
                        groupVariants as Record<string, any>,
                      ).forEach(([optionName, style]) => {
                        conditionals.push({
                          test: valExpr,
                          testLHS: valSource,
                          testString: `${valSource} === '${optionName}'`,
                          truthy: style as Record<string, any>,
                          falsy: {},
                          groupId: currentGroupId,
                          groupName,
                          valueName: optionName,
                          varName,
                        });
                      });
                    }
                  }
                  continue;
                }
                const argSource = getSource(arg);
                if (t.isStringLiteral(arg)) {
                  if (variantObj[arg.value])
                    baseStyle = deepMerge(baseStyle, variantObj[arg.value]);
                  continue;
                }
                const currentGroupId = ++groupIdCounter;
                Object.entries(variantObj).forEach(([key, style]) => {
                  conditionals.push({
                    test: arg,
                    testLHS: argSource,
                    testString: `${argSource} === '${key}'`,
                    truthy: style,
                    falsy: {},
                    groupId: currentGroupId,
                    groupName: undefined,
                    valueName: key,
                    varName,
                  });
                });
                continue;
              }
              isOptimizable = false;
              break;
            }
          } else if (t.isIdentifier(expr)) {
            const varName = expr.value;
            const uniqueKey = `${resourcePath}-${varName}`;
            let variantObj: Record<string, any> | undefined;

            let hash = scannedTables.variantsHashTable[uniqueKey];
            if (!hash) hash = mergedVariantsTable[varName];
            if (hash && scannedTables.variantsObjectTable[hash])
              variantObj = scannedTables.variantsObjectTable[hash];
            if (!variantObj && localCreateStyles[varName]?.obj)
              variantObj = localCreateStyles[varName].obj;

            if (variantObj) {
              Object.entries(variantObj).forEach(
                ([groupName, groupVariants]) => {
                  if (!groupVariants) return;
                  const currentGroupId = ++groupIdCounter;
                  Object.entries(groupVariants).forEach(
                    ([optionName, style]) => {
                      conditionals.push({
                        test: expr,
                        testLHS: `props["${groupName}"]`,
                        testString: `props["${groupName}"] === '${optionName}'`,
                        truthy: style as Record<string, any>,
                        falsy: {},
                        groupId: currentGroupId,
                        groupName,
                        valueName: optionName,
                        varName,
                      });
                    },
                  );
                },
              );
              continue;
            }
          }

          const handled = collectConditions(expr);
          if (handled) continue;
          isOptimizable = false;
          break;
        }

        if (
          !isOptimizable ||
          (args.length === 0 && Object.keys(baseStyle).length === 0)
        ) {
          return {
            classParts: [...dynamicClassParts],
            isOptimizable,
            baseStyle,
          };
        }

        const participation: Record<string, Set<string>> = {};
        const registerParticipation = (
          style: Record<string, any>,
          sourceId: string,
        ) => {
          Object.keys(style).forEach((key) => {
            if (!participation[key]) participation[key] = new Set();
            participation[key].add(sourceId);
          });
        };

        registerParticipation(baseStyle, 'base');
        conditionals
          .filter((c) => c.groupId === undefined)
          .forEach((c, idx) => {
            registerParticipation(c.truthy, `std_${idx}`);
            registerParticipation(c.falsy, `std_${idx}`);
          });

        const variantGroups: Record<number, StyleConditional[]> = {};
        conditionals.forEach((c) => {
          if (c.groupId !== undefined) {
            if (!variantGroups[c.groupId]) variantGroups[c.groupId] = [];
            variantGroups[c.groupId].push(c);
          }
        });
        Object.entries(variantGroups).forEach(([groupId, opts]) => {
          opts.forEach((opt) =>
            registerParticipation(opt.truthy, `var_${groupId}`),
          );
        });

        const conflictingKeys = new Set<string>();
        Object.entries(participation).forEach(([key, sources]) => {
          if (sources.size > 1) conflictingKeys.add(key);
        });

        const baseIndependent: Record<string, any> = {};
        const baseConflict: Record<string, any> = {};
        Object.entries(baseStyle).forEach(([key, val]) => {
          if (conflictingKeys.has(key)) baseConflict[key] = val;
          else baseIndependent[key] = val;
        });

        const indepConditionals: StyleConditional[] = [];
        const conflictConditionals: StyleConditional[] = [];
        conditionals.forEach((c) => {
          const truthyIndep: Record<string, any> = {};
          const truthyConf: Record<string, any> = {};
          const falsyIndep: Record<string, any> = {};
          const falsyConf: Record<string, any> = {};
          let hasIndep = false;
          let hasConf = false;
          Object.entries(c.truthy).forEach(([k, v]) => {
            if (conflictingKeys.has(k)) {
              truthyConf[k] = v;
              hasConf = true;
            } else {
              truthyIndep[k] = v;
              hasIndep = true;
            }
          });
          Object.entries(c.falsy).forEach(([k, v]) => {
            if (conflictingKeys.has(k)) {
              falsyConf[k] = v;
              hasConf = true;
            } else {
              falsyIndep[k] = v;
              hasIndep = true;
            }
          });
          if (hasIndep)
            indepConditionals.push({
              ...c,
              truthy: truthyIndep,
              falsy: falsyIndep,
            });
          if (hasConf)
            conflictConditionals.push({
              ...c,
              truthy: truthyConf,
              falsy: falsyConf,
            });
        });

        const classParts: string[] = [];

        if (existingClass) classParts.push(JSON.stringify(existingClass));

        if (Object.keys(baseIndependent).length > 0) {
          const className = getStyleRecords(baseIndependent)
            .map((r) => r.hash)
            .join(' ');
          if (className) classParts.push(JSON.stringify(className));
        }

        indepConditionals
          .filter((c) => c.groupId === undefined)
          .forEach((c) => {
            const processBranch = (style: Record<string, any>) => {
              if (Object.keys(style).length === 0) return '""';
              return JSON.stringify(
                getStyleRecords(style)
                  .map((r) => r.hash)
                  .join(' '),
              );
            };
            const testStr = c.testString ?? getSource(c.test);
            classParts.push(
              `(${testStr} ? ${processBranch(c.truthy)} : ${processBranch(c.falsy)})`,
            );
          });

        const indepVarGroups: Record<number, StyleConditional[]> = {};
        indepConditionals.forEach((c) => {
          if (c.groupId !== undefined) {
            if (!indepVarGroups[c.groupId]) indepVarGroups[c.groupId] = [];
            indepVarGroups[c.groupId].push(c);
          }
        });
        Object.values(indepVarGroups).forEach((options) => {
          const commonTestExpr =
            options[0].testLHS ??
            options[0].testString ??
            getSource(options[0].test);
          const lookupMap: Record<string, string> = {};
          options.forEach((opt) => {
            if (opt.valueName && opt.truthy) {
              const className = getStyleRecords(opt.truthy)
                .map((r) => r.hash)
                .join(' ');
              if (className) lookupMap[opt.valueName] = className;
            }
          });
          if (Object.keys(lookupMap).length > 0) {
            const entries = Object.entries(lookupMap)
              .map(([k, v]) => `"${k}":"${v}"`)
              .join(',');
            classParts.push(`({${entries}}[${commonTestExpr}] || "")`);
          }
        });

        if (
          Object.keys(baseConflict).length > 0 ||
          conflictConditionals.length > 0
        ) {
          interface Dimension {
            type: 'std' | 'var';
            options: Array<{
              value: any;
              style: Record<string, any>;
              label: string;
            }>;
            testExpr?: string;
          }
          const dimensions: Dimension[] = [];

          conflictConditionals
            .filter((c) => c.groupId === undefined)
            .forEach((c) => {
              dimensions.push({
                type: 'std',
                testExpr: c.testString ?? getSource(c.test),
                options: [
                  { value: 0, style: c.falsy, label: 'false' },
                  { value: 1, style: c.truthy, label: 'true' },
                ],
              });
            });

          const conflictVarGroups: Record<number, StyleConditional[]> = {};
          conflictConditionals.forEach((c) => {
            if (c.groupId !== undefined) {
              if (!conflictVarGroups[c.groupId])
                conflictVarGroups[c.groupId] = [];
              conflictVarGroups[c.groupId].push(c);
            }
          });
          Object.entries(conflictVarGroups).forEach(([, opts]) => {
            dimensions.push({
              type: 'var',
              testExpr:
                opts[0].testLHS ??
                opts[0].testString ??
                getSource(opts[0].test),
              options: opts.map((opt) => ({
                value: opt.valueName,
                style: opt.truthy,
                label: opt.valueName || 'default',
              })),
            });
          });

          const results: Record<string, string> = {};
          const recurse = (
            dimIndex: number,
            currentStyle: Record<string, any>,
            keyParts: string[],
          ) => {
            if (dimIndex >= dimensions.length) {
              const className = getStyleRecords(currentStyle)
                .map((r) => r.hash)
                .join(' ');
              if (className) results[keyParts.join('__')] = className;
              return;
            }
            dimensions[dimIndex].options.forEach((opt) =>
              recurse(dimIndex + 1, deepMerge(currentStyle, opt.style), [
                ...keyParts,
                String(opt.value),
              ]),
            );
          };
          recurse(0, baseConflict, []);

          const baseConflictClass =
            Object.keys(baseConflict).length > 0
              ? getStyleRecords(baseConflict)
                  .map((r) => r.hash)
                  .join(' ')
              : '';
          const masterKeyExpr = dimensions
            .map((dim) =>
              dim.type === 'std'
                ? `(${dim.testExpr} ? "1" : "0")`
                : dim.testExpr || '""',
            )
            .join(' + "__" + ');

          classParts.push(
            `(${JSON.stringify(results)}[${masterKeyExpr || '""'}] || ${baseConflictClass ? JSON.stringify(baseConflictClass) : '""'})`,
          );
        }

        classParts.push(...dynamicClassParts);
        return { classParts, isOptimizable, baseStyle };
      };

      // Pass 2: Confirm reference replacement
      traverse(ast, {
        JSXOpeningElement({ node }) {
          jsxOpeningElementMap.set(node.span.start, node.attributes);
        },
        MemberExpression({ node }) {
          if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
            const varName = node.object.value;
            const propName = node.property.value;
            const uniqueKey = `${resourcePath}-${varName}`;

            // Prioritize scanAll tables for local variables
            let hash = scannedTables.createHashTable[uniqueKey];
            if (!hash) {
              hash = mergedCreateTable[varName];
            }

            if (hash) {
              let atomMap: Record<string, any> | undefined;

              // Check atomic map first
              if (scannedTables.createAtomicMapTable[hash]) {
                atomMap = scannedTables.createAtomicMapTable[hash][propName];
              }

              if (atomMap) {
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(atomMap)})`,
                });
              }
            }

            // Check createTheme using atomic map
            let themeHash = scannedTables.createThemeHashTable[uniqueKey];
            if (!themeHash) {
              themeHash = mergedCreateThemeHashTable[varName];
            }

            if (themeHash) {
              // Use createAtomicMapTable for consistency with parser
              const atomicMap = scannedTables.createAtomicMapTable[themeHash];
              if (atomicMap && atomicMap && atomicMap[propName]) {
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(atomicMap[propName])})`,
                });
              }
            }

            // Check createStatic
            let staticHash = scannedTables.createStaticHashTable[uniqueKey];
            if (!staticHash) {
              staticHash = mergedCreateStaticHashTable[varName];
            }

            if (staticHash) {
              const staticObj =
                scannedTables.createStaticObjectTable[staticHash];
              if (staticObj && staticObj[propName] !== undefined) {
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(staticObj[propName])})`,
                });
              }
            }
          }
        },
        Identifier({ node }) {
          if (excludedSpans.has(node.span.start)) return;
          if (idSpans.has(node.span.start)) return;

          const styleInfo = localCreateStyles[node.value];
          if (styleInfo) {
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: `(${JSON.stringify(styleInfo.hashMap)})`,
            });
            return;
          }

          const varName = node.value;
          const uniqueKey = `${resourcePath}-${varName}`;

          let hash = scannedTables.createHashTable[uniqueKey];
          if (!hash) {
            hash = mergedCreateTable[varName];
          }

          if (hash) {
            const obj = scannedTables.createObjectTable[hash];
            const atomicMap = scannedTables.createAtomicMapTable[hash];

            if (obj && atomicMap) {
              // Reconstruct hashMap from createObjectTable + createAtomicMapTable
              const hashMap: Record<string, Record<string, string>> = {};
              Object.keys(obj).forEach((key) => {
                if (atomicMap[key]) {
                  hashMap[key] = atomicMap[key];
                }
              });

              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: `(${JSON.stringify(hashMap)})`,
              });
            }
          }

          // Check createTheme using atomic map
          let themeHash = scannedTables.createThemeHashTable[uniqueKey];
          if (!themeHash) {
            themeHash = mergedCreateThemeHashTable[varName];
          }

          if (themeHash) {
            // Use createAtomicMapTable to get resolved CSS variables
            const atomicMap = scannedTables.createAtomicMapTable[themeHash];
            if (atomicMap) {
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: `(${JSON.stringify(atomicMap)})`,
              });
              return;
            }
          }

          // Check createStatic
          let staticHash = scannedTables.createStaticHashTable[uniqueKey];
          if (!staticHash) {
            staticHash = mergedCreateStaticHashTable[varName];
          }

          if (staticHash) {
            const staticObj = scannedTables.createStaticObjectTable[staticHash];
            if (staticObj) {
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: `(${JSON.stringify(staticObj)})`,
              });
            }
          }
        },
        JSXAttribute({ node }) {
          if (
            node.name.type !== 'Identifier' ||
            node.name.value !== 'styleName'
          )
            return;

          if (!node.value || node.value.type !== 'JSXExpressionContainer')
            return;

          const expr = node.value.expression;
          let args =
            expr.type === 'ArrayExpression'
              ? expr.elements
                  .filter(Boolean)
                  .map((el: any) => ({ expression: el.expression ?? el }))
              : [{ expression: expr }];

          // Collect dynamic styles (styles.text(state) format)
          const dynamicClassParts: string[] = [];
          const dynamicStyleParts: string[] = [];

          let attributes: any[] = [];
          for (const [, attrs] of jsxOpeningElementMap) {
            const found = attrs.find(
              (a: any) => a.span?.start === node.span.start,
            );
            if (found) {
              attributes = attrs;
              break;
            }
          }

          const classNameAttr = attributes.find(
            (attr: any) => attr.name?.value === 'className',
          );
          let existingClass = '';
          if (classNameAttr?.value?.type === 'StringLiteral') {
            existingClass = classNameAttr.value.value;
            replacements.push({
              start: classNameAttr.span.start - baseByteOffset,
              end: classNameAttr.span.end - baseByteOffset,
              content: '',
            });
          }

          const styleAttrExisting = attributes.find(
            (attr: any) => attr.name?.value === 'style',
          );
          if (styleAttrExisting) {
            replacements.push({
              start: styleAttrExisting.span.start - baseByteOffset,
              end: styleAttrExisting.span.end - baseByteOffset,
              content: '',
            });
            // Extract the contents of existing style attributes from the source and place them in dynamicStyleParts
            const innerExpr = styleAttrExisting.value?.expression;
            if (innerExpr?.type === 'ObjectExpression') {
              const start = innerExpr.span.start - baseByteOffset;
              const end = innerExpr.span.end - baseByteOffset;
              const innerSource = sourceBuffer
                .subarray(start, end)
                .toString('utf-8');
              const stripped = innerSource.slice(1, -1).trim();
              if (stripped) dynamicStyleParts.push(stripped);
            }
          }

          args = args.filter((arg: any) => {
            const expr = arg.expression;
            if (!t.isCallExpression(expr) || !t.isMemberExpression(expr.callee))
              return true;
            const callee = expr.callee;
            if (
              !t.isIdentifier(callee.object) ||
              !t.isIdentifier(callee.property)
            )
              return true;

            const varName = callee.object.value;
            const propKey = callee.property.value;
            const styleInfo = localCreateStyles[varName];
            const atomMap = styleInfo?.hashMap?.[propKey];
            if (!atomMap?.['__cssVars__']) return true;

            const cssVarInfo: Record<
              string,
              { cssVar: string; propKey: string }
            > = JSON.parse(atomMap['__cssVars__']);
            const hashes = Object.entries(atomMap)
              .filter(([k]) => k !== '__cssVars__')
              .map(([, v]) => v)
              .join(' ');
            if (hashes) dynamicClassParts.push(JSON.stringify(hashes));

            const callArgs = (expr as any).arguments;
            Object.entries(cssVarInfo).forEach(
              ([_, { cssVar, propKey: targetProp }], i) => {
                const callArg = callArgs[i];
                if (!callArg) return;
                const argStart = callArg.expression.span.start - baseByteOffset;
                const argEnd = callArg.expression.span.end - baseByteOffset;
                const argSource = sourceBuffer
                  .subarray(argStart, argEnd)
                  .toString('utf-8');

                let valueExpr: string;
                const maybeNumber = Number(argSource);
                if (
                  !isNaN(maybeNumber) &&
                  argSource.trim() === String(maybeNumber)
                ) {
                  valueExpr = JSON.stringify(
                    applyCssValue(maybeNumber, targetProp),
                  );
                } else if (
                  argSource.startsWith('"') &&
                  argSource.endsWith('"')
                ) {
                  valueExpr = JSON.stringify(
                    applyCssValue(argSource.slice(1, -1), targetProp),
                  );
                } else {
                  const exception = [
                    'animationIterationCount',
                    'aspectRatio',
                    'columnCount',
                    'columns',
                    'fillOpacity',
                    'flex',
                    'flexGrow',
                    'flexShrink',
                    'floodOpacity',
                    'fontSizeAdjust',
                    'fontWeight',
                    'gridColumn',
                    'gridColumnEnd',
                    'gridColumnStart',
                    'gridRow',
                    'gridRowEnd',
                    'gridRowStart',
                    'hyphenateLimitChars',
                    'initialLetter',
                    'lineHeight',
                    'mathDepth',
                    'opacity',
                    'order',
                    'orphans',
                    'scale',
                    'shapeImageThreshold',
                    'stopOpacity',
                    'strokeMiterlimit',
                    'strokeOpacity',
                    'tabSize',
                    'widows',
                    'zIndex',
                    'zoom',
                  ];
                  valueExpr = exception.includes(targetProp)
                    ? argSource
                    : `(typeof ${argSource} === 'number' ? ${argSource} + 'px' : ${argSource})`;
                }
                dynamicStyleParts.push(`"${cssVar}": ${valueExpr}`);
              },
            );

            return false;
          });

          const styleAttr =
            dynamicStyleParts.length > 0
              ? ` style={{${dynamicStyleParts.join(', ')}}}`
              : '';

          const { classParts, isOptimizable, baseStyle } = buildClassParts(
            args,
            dynamicClassParts,
            existingClass,
          );

          if (
            isOptimizable &&
            (args.length > 0 ||
              Object.keys(baseStyle).length > 0 ||
              dynamicClassParts.length > 0)
          ) {
            const replacement =
              classParts.length > 0 ? classParts.join(' + " " + ') : '""';
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: `className={${replacement}}${styleAttr}`,
            });
          } else {
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: styleAttr || '',
            });
          }
        },
        CallExpression({ node }) {
          const callee = node.callee;
          let isUseCall = false;

          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            const objectName = callee.object.value;
            const propertyName = callee.property.value;
            const alias = plumeriaAliases[objectName];
            if (alias === 'NAMESPACE' && propertyName === 'use') {
              isUseCall = true;
            }
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName === 'use') {
              isUseCall = true;
            }
          }

          if (!isUseCall) return;

          const args = node.arguments as Array<{ expression: Expression }>;
          for (const arg of args) {
            const expr = arg.expression;
            if (!t.isCallExpression(expr) || !t.isMemberExpression(expr.callee))
              continue;
            const callee = expr.callee;
            if (
              !t.isIdentifier(callee.object) ||
              !t.isIdentifier(callee.property)
            )
              continue;

            const varName = callee.object.value;
            const propKey = callee.property.value;
            const styleInfo = localCreateStyles[varName];
            const atomMap = styleInfo?.hashMap?.[propKey];
            if (atomMap?.['__cssVars__']) {
              throw new Error(
                `Plumeria: css.use(${getSource(expr)}) does not support dynamic function keys.\n`,
              );
            }
          }

          const { classParts, isOptimizable, baseStyle } =
            buildClassParts(args);

          if (
            isOptimizable &&
            (args.length > 0 || Object.keys(baseStyle).length > 0)
          ) {
            const replacement =
              classParts.length > 0 ? classParts.join(' + " " + ') : '""';
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: replacement,
            });
          }
        },
      });

      // Confirm the replacement of the styles declaration
      Object.values(localCreateStyles).forEach((info) => {
        if (info.type === 'constant') {
          return;
        }
        if (info.isExported) {
          replacements.push({
            start: info.declSpan.start,
            end: info.declSpan.end,
            content: JSON.stringify(''),
          });
        } else {
          replacements.push({
            start: info.declSpan.start,
            end: info.declSpan.end,
            content: '',
          });
        }
      });

      const optInCSS = await optimizer(extractedSheets.join(''));

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
      const transformedSource = Buffer.concat(parts).toString();

      if (extractedSheets.length > 0) {
        const baseId = id.replace(EXTENSION_PATTERN, '');
        const cssFilename = `${baseId}.zero.css`;
        const cssRelativePath = path
          .relative(config.root, cssFilename)
          .replace(/\\/g, '/');
        const cssId = `/${cssRelativePath}`;

        cssLookup.set(cssFilename, optInCSS);
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
          code: injectImport(transformedSource, id, cssFilename),
          map: null,
        };
      }

      return {
        code: transformedSource,
        map: null,
      };
    },
  };
}

function injectImport(code: string, _id: string, importPath: string): string {
  const importStmt = `\nimport ${JSON.stringify(importPath)};`;
  return `${code}${importStmt}`;
}
