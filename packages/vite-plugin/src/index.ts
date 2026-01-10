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
  MemberExpression,
  Identifier,
} from '@swc/core';
import path from 'path';

import { type CSSProperties, genBase36Hash } from 'zss-engine';

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
} from '@plumeria/utils';
import type {
  StyleRecord,
  StaticTable,
  KeyframesHashTable,
  ViewTransitionHashTable,
  ThemeTable,
  CreateHashTable,
  VariantsHashTable,
} from '@plumeria/utils';

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

      const localConsts = collectLocalConsts(ast);
      const resourcePath = id;
      const importMap: Record<string, any> = {};
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
                if (scannedTables.themeTable[uniqueKey]) {
                  importMap[localName] = scannedTables.themeTable[uniqueKey];
                }
                if (scannedTables.createHashTable[uniqueKey]) {
                  importMap[localName] =
                    scannedTables.createHashTable[uniqueKey];
                }
                if (scannedTables.variantsHashTable[uniqueKey]) {
                  importMap[localName] =
                    scannedTables.variantsHashTable[uniqueKey];
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

      const mergedThemeTable: ThemeTable = {};
      for (const key of Object.keys(scannedTables.themeTable)) {
        mergedThemeTable[key] = scannedTables.themeTable[key];
      }
      for (const key of Object.keys(importMap)) {
        mergedThemeTable[key] = importMap[key];
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

      const localCreateStyles: Record<
        string,
        {
          name: string;
          type: 'create' | 'constant' | 'variant';
          obj: Record<string, any>;
          hashMap: Record<string, Record<string, string>>;
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
      const addSheet = (sheet: string) => {
        if (!extractedSheets.includes(sheet)) {
          extractedSheets.push(sheet);
        }
      };
      const processedDecls = new Set<any>();
      const idSpans = new Set<number>();
      const excludedSpans = new Set<number>();
      if (scannedTables.extractedSheet) {
        addSheet(scannedTables.extractedSheet);
      }

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
              `Plumeria: Assigning the return value of "css.variants" to a variable is not supported.\nPlease pass the variant function directly to "css.props". Found assignment to: ${
                t.isIdentifier(decl.id) ? decl.id.value : 'unknown'
              }`,
            );
          }
        }
      };

      const registerStyle = (node: any, declSpan: any, isExported: boolean) => {
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

            if (alias === 'NAMESPACE' || objectName === 'css') {
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
              mergedThemeTable,
              mergedCreateTable,
              mergedVariantsTable,
            );
            if (obj) {
              const hashMap: Record<string, Record<string, string>> = {};
              Object.entries(obj).forEach(([key, style]) => {
                const records = getStyleRecords(key, style as CSSProperties, 2);
                extractOndemandStyles(style, extractedSheets, scannedTables);
                records.forEach((r: StyleRecord) => {
                  addSheet(r.sheet);
                });
                const atomMap: Record<string, string> = {};
                records.forEach((r) => (atomMap[r.key] = r.hash));
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
          } else if (
            propName === 'variants' &&
            t.isObjectExpression(node.init.arguments[0].expression)
          ) {
            const obj = objectExpressionToObject(
              node.init.arguments[0].expression as ObjectExpression,
              mergedStaticTable,
              mergedKeyframesTable,
              mergedViewTransitionTable,
              mergedThemeTable,
              mergedCreateTable,
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
            localCreateStyles[node.id.value] = {
              name: node.id.value,
              type: 'variant',
              obj,
              hashMap: {},
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

            if (alias === 'NAMESPACE' || objectName === 'css') {
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
                mergedThemeTable,
                mergedCreateTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.keyframesObjectTable[hash] = obj;
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
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedThemeTable,
                mergedCreateTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.viewTransitionObjectTable[hash] = obj;
              extractOndemandStyles(obj, extractedSheets, scannedTables);
              extractOndemandStyles(
                { vt: `vt-${hash}` },
                extractedSheets,
                scannedTables,
              );
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
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedThemeTable,
                mergedCreateTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.createThemeObjectTable[hash] = obj;
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
                mergedThemeTable,
                mergedCreateTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.createObjectTable[hash] = obj;
              Object.entries(obj).forEach(([key, style]) => {
                if (typeof style === 'object' && style !== null) {
                  const records = getStyleRecords(
                    key,
                    style as CSSProperties,
                    2,
                  );
                  extractOndemandStyles(style, extractedSheets, scannedTables);
                  records.forEach((r: StyleRecord) => addSheet(r.sheet));
                }
              });
            }
          }
        },
      });

      // Pass 2: Confirm reference replacement
      traverse(ast, {
        MemberExpression({ node }) {
          if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
            const varName = node.object.value;
            const propName = node.property.value;
            const uniqueKey = `${id}-${varName}`;

            // Prioritize scanAll tables for local variables
            let hash = scannedTables.createHashTable[uniqueKey];
            if (!hash) {
              hash = mergedCreateTable[varName];
            }

            if (hash) {
              let atomMap: Record<string, any> | undefined;

              if (scannedTables.createAtomicMapTable[hash]) {
                atomMap = scannedTables.createAtomicMapTable[hash][propName];
              }

              if (atomMap) {
                replacements.push({
                  start: node.span.start - ast.span.start,
                  end: node.span.end - ast.span.start,
                  content: JSON.stringify(atomMap),
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
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(styleInfo.hashMap),
            });
            return;
          }

          const varName = node.value;
          const uniqueKey = `${this.resourcePath}-${varName}`;

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
                start: node.span.start - ast.span.start,
                end: node.span.end - ast.span.start,
                content: JSON.stringify(hashMap),
              });
            }
          }
        },
        CallExpression({ node }) {
          const callee = node.callee;
          let isPropsCall = false;

          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            const objectName = callee.object.value;
            const propertyName = callee.property.value;
            const alias = plumeriaAliases[objectName];
            if (
              (alias === 'NAMESPACE' || objectName === 'css') &&
              propertyName === 'props'
            ) {
              isPropsCall = true;
            }
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName === 'props') {
              isPropsCall = true;
            }
          }

          if (isPropsCall) {
            const args = node.arguments;

            const resolveStyleObject = (
              expr: Expression,
            ): Record<string, any> | null => {
              if (t.isObjectExpression(expr)) {
                return objectExpressionToObject(
                  expr,
                  mergedStaticTable,
                  mergedKeyframesTable,
                  mergedViewTransitionTable,
                  mergedThemeTable,
                  mergedCreateTable,
                  mergedVariantsTable,
                );
              } else if (
                t.isMemberExpression(expr) &&
                t.isIdentifier(expr.object) &&
                (t.isIdentifier(expr.property) ||
                  expr.property.type === 'Computed')
              ) {
                if (expr.property.type === 'Computed') {
                  // Ignore bracket notation for complete staticization
                  return {};
                }
                const varName = (
                  (expr as MemberExpression).object as Identifier
                ).value;
                const propName = (
                  (expr as MemberExpression).property as Identifier
                ).value;

                const styleInfo = localCreateStyles[varName];
                if (styleInfo && styleInfo.obj[propName]) {
                  const style = styleInfo.obj[propName];
                  if (typeof style === 'object' && style !== null) {
                    return style;
                  }
                }

                const hash = mergedCreateTable[varName];
                if (hash) {
                  const obj = scannedTables.createObjectTable[hash];
                  if (obj && obj[propName]) {
                    const style = obj[propName];
                    if (typeof style === 'object' && style !== null) {
                      return style as Record<string, any>;
                    }
                  }
                }
              } else if (t.isIdentifier(expr)) {
                const varName = expr.value;

                const styleInfo = localCreateStyles[varName];
                if (styleInfo && styleInfo.obj) {
                  return styleInfo.obj;
                }

                const hash = mergedCreateTable[varName];
                if (hash) {
                  const obj = scannedTables.createObjectTable[hash];
                  if (obj && typeof obj === 'object') {
                    return obj;
                  }
                }

                if (localCreateStyles[varName]) {
                  return localCreateStyles[varName].obj;
                }
                const vHash = mergedVariantsTable[varName];
                if (vHash) {
                  return scannedTables.variantsObjectTable[vHash];
                }
              }
              return null;
            };

            const conditionals: Array<{
              test: Expression;
              testString?: string;
              truthy: Record<string, any>;
              falsy: Record<string, any>;
              groupId?: number;
            }> = [];

            let groupIdCounter = 0;

            let baseStyle: Record<string, any> = {};
            let isOptimizable = true;

            for (const arg of args) {
              const expr = arg.expression;

              if (t.isCallExpression(expr) && t.isIdentifier(expr.callee)) {
                const varName = expr.callee.value;
                let variantObj: Record<string, any> | undefined;

                if (
                  localCreateStyles[varName] &&
                  localCreateStyles[varName].obj
                ) {
                  variantObj = localCreateStyles[varName].obj;
                } else if (mergedVariantsTable[varName]) {
                  const hash = mergedVariantsTable[varName];
                  if (scannedTables.variantsObjectTable[hash]) {
                    variantObj = scannedTables.variantsObjectTable[hash];
                  }
                }

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
                          const valStart =
                            (valExpr as any).span.start - ast.span.start;
                          const valEnd =
                            (valExpr as any).span.end - ast.span.start;
                          const valSource = source.substring(valStart, valEnd);

                          // Static optimization
                          if (valExpr.type === 'StringLiteral') {
                            if (groupVariants[valExpr.value]) {
                              baseStyle = deepMerge(
                                baseStyle,
                                groupVariants[valExpr.value],
                              );
                            }
                            continue;
                          }

                          // Dynamic selection
                          Object.entries(
                            groupVariants as Record<string, any>,
                          ).forEach(([optionName, style]) => {
                            conditionals.push({
                              test: valExpr,
                              testString: `${valSource} === '${optionName}'`,
                              truthy: style as Record<string, any>,
                              falsy: {},
                              groupId: currentGroupId,
                            });
                          });
                        }
                      }
                      continue;
                    }
                    const argStart = (arg as any).span.start - ast.span.start;
                    const argEnd = (arg as any).span.end - ast.span.start;
                    const argSource = source.substring(argStart, argEnd);

                    if (t.isStringLiteral(arg)) {
                      if (variantObj[arg.value]) {
                        baseStyle = deepMerge(baseStyle, variantObj[arg.value]);
                      }
                      continue;
                    }

                    const currentGroupId = ++groupIdCounter;
                    Object.entries(variantObj).forEach(([key, style]) => {
                      conditionals.push({
                        test: arg,
                        testString: `${argSource} === '${key}'`,
                        truthy: style,
                        falsy: {},
                        groupId: currentGroupId,
                      });
                    });
                    continue;
                  }

                  // Fallback if arguments are complex (e.g. spread)
                  isOptimizable = false;
                  break;
                }
              }

              const staticStyle = resolveStyleObject(expr);
              if (staticStyle) {
                baseStyle = deepMerge(baseStyle, staticStyle);
                continue;
              } else if (expr.type === 'ConditionalExpression') {
                const truthyStyle = resolveStyleObject(expr.consequent);
                const falsyStyle = resolveStyleObject(expr.alternate);

                if (truthyStyle !== null && falsyStyle !== null) {
                  conditionals.push({
                    test: expr.test,
                    truthy: truthyStyle,
                    falsy: falsyStyle,
                  });
                  continue;
                }
              } else if (
                expr.type === 'BinaryExpression' &&
                expr.operator === '&&'
              ) {
                const truthyStyle = resolveStyleObject(expr.right);
                if (truthyStyle !== null) {
                  conditionals.push({
                    test: expr.left,
                    truthy: truthyStyle,
                    falsy: {},
                  });
                  continue;
                }
              } else if (expr.type === 'ParenthesisExpression') {
                const inner = expr.expression;
                const innerStatic = resolveStyleObject(inner);
                if (innerStatic) {
                  baseStyle = deepMerge(baseStyle, innerStatic);
                  continue;
                }
              }

              isOptimizable = false;
              break;
            }

            if (
              isOptimizable &&
              (args.length > 0 || Object.keys(baseStyle).length > 0)
            ) {
              if (conditionals.length === 0) {
                extractOndemandStyles(
                  baseStyle,
                  extractedSheets,
                  scannedTables,
                );
                const hash = genBase36Hash(baseStyle, 1, 8);
                const records = getStyleRecords(hash, baseStyle, 2);
                records.forEach((r: StyleRecord) => addSheet(r.sheet));
                const className = records
                  .map((r: StyleRecord) => r.hash)
                  .join(' ');

                replacements.push({
                  start: node.span.start - ast.span.start,
                  end: node.span.end - ast.span.start,
                  content: JSON.stringify(className),
                });
              } else {
                const table: Record<number, string> = {};
                const combinations = 1 << conditionals.length;

                for (let i = 0; i < combinations; i++) {
                  let currentStyle = { ...baseStyle };
                  const seenGroups = new Set<number>();
                  let impossible = false;

                  for (let j = 0; j < conditionals.length; j++) {
                    if ((i >> j) & 1) {
                      if (conditionals[j].groupId !== undefined) {
                        if (seenGroups.has(conditionals[j].groupId!)) {
                          impossible = true;
                          break;
                        }
                        seenGroups.add(conditionals[j].groupId!);
                      }
                      currentStyle = deepMerge(
                        currentStyle,
                        conditionals[j].truthy,
                      );
                    } else {
                      currentStyle = deepMerge(
                        currentStyle,
                        conditionals[j].falsy,
                      );
                    }
                  }

                  if (impossible) {
                    table[i] = '';
                    continue;
                  }

                  extractOndemandStyles(
                    currentStyle,
                    extractedSheets,
                    scannedTables,
                  );
                  const hash = genBase36Hash(currentStyle, 1, 8);
                  const records = getStyleRecords(hash, currentStyle, 2);
                  records.forEach((r: StyleRecord) => addSheet(r.sheet));
                  const className = records
                    .map((r: StyleRecord) => r.hash)
                    .join(' ');

                  table[i] = className;
                }

                // Generate index expression
                // (!!cond0 << 0) | (!!cond1 << 1) ...
                let indexExpr = '';
                if (conditionals.length === 0) {
                  indexExpr = '0';
                } else {
                  const parts = conditionals.map((c, idx) => {
                    if (c.testString) {
                      return `(!!(${c.testString}) << ${idx})`;
                    }
                    const start = (c.test as any).span.start - ast.span.start;
                    const end = (c.test as any).span.end - ast.span.start;
                    const testStr = source.substring(start, end);
                    return `(!!(${testStr}) << ${idx})`;
                  });
                  indexExpr = parts.join(' | ');
                }

                const tableStr = JSON.stringify(table);
                const replacement = `${tableStr}[${indexExpr}]`;

                replacements.push({
                  start: node.span.start - ast.span.start,
                  end: node.span.end - ast.span.start,
                  content: replacement,
                });
              }
            }
          }
        },
      });

      // Confirm the replacement of the styles declaration
      Object.values(localCreateStyles).forEach((info) => {
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
