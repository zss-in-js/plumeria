/* eslint-disable @plumeria/validate-values */
import { parseSync } from '@swc/core';
import type {
  Declaration,
  Expression,
  ImportSpecifier,
  ObjectExpression,
  MemberExpression,
  Identifier,
} from '@swc/core';
import fs from 'fs';
import path from 'path';
import { genBase36Hash } from 'zss-engine';
import type { CSSProperties } from 'zss-engine';

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

interface LoaderContext {
  resourcePath: string;
  context: string;
  rootContext: string;
  async: () => (err: Error | null, content?: string) => void;
  addDependency: (path: string) => void;
  clearDependencies: () => void;
}

const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');
if (process.env.NODE_ENV === 'production') {
  fs.writeFileSync(VIRTUAL_FILE_PATH, '/** Placeholder file */', 'utf-8');
}

export default async function loader(this: LoaderContext, source: string) {
  const loaderContext = this;
  const callback = this.async();
  const isProduction = process.env.NODE_ENV === 'production';

  if (
    this.resourcePath.includes('node_modules') ||
    !source.includes('@plumeria/core')
  ) {
    return callback(null, source);
  }

  this.clearDependencies();
  this.addDependency(this.resourcePath);
  const scannedTables = scanAll();

  const ast = parseSync(source, {
    syntax: 'typescript',
    tsx: true,
    target: 'es2022',
  });

  const localConsts = collectLocalConsts(ast);
  const resourcePath = this.resourcePath;
  const importMap: Record<string, any> = {};

  traverse(ast, {
    ImportDeclaration({ node }) {
      const sourcePath = node.source.value;
      const actualPath = resolveImportPath(sourcePath, resourcePath);

      if (actualPath) {
        loaderContext.addDependency(actualPath);
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
              importMap[localName] = scannedTables.createHashTable[uniqueKey];
            }
            if (scannedTables.variantsHashTable[uniqueKey]) {
              importMap[localName] = scannedTables.variantsHashTable[uniqueKey];
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
    mergedViewTransitionTable[key] = scannedTables.viewTransitionHashTable[key];
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

  const replacements: Array<{ start: number; end: number; content: string }> =
    [];
  const extractedSheets: string[] = [];
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
          `Plumeria: Assigning the return value of "css.variants" to a variable is not supported.\nPlease pass the variant function directly to "css.props". Found assignment to: ${
            t.isIdentifier(decl.id) ? decl.id.value : 'unknown'
          }`,
        );
      }
    }
  };

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
            if (!isProduction) {
              extractOndemandStyles(style, extractedSheets, scannedTables);
              records.forEach((r: StyleRecord) => {
                extractedSheets.push(r.sheet);
              });
            }
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
          type: 'variant', // reused for simple object storage
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
          if (!isProduction) {
            extractOndemandStyles(obj, extractedSheets, scannedTables);
            extractOndemandStyles(
              { vt: `vt-${hash}` },
              extractedSheets,
              scannedTables,
            );
          }
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
              const records = getStyleRecords(key, style as CSSProperties, 2);
              if (!isProduction) {
                extractOndemandStyles(style, extractedSheets, scannedTables);
                records.forEach((r: StyleRecord) =>
                  extractedSheets.push(r.sheet),
                );
              }
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

        // First check local styles
        const styleInfo = localCreateStyles[varName];
        if (styleInfo) {
          const atomMap = styleInfo.hashMap[propName];
          if (atomMap) {
            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(atomMap),
            });
            return;
          }
        }

        // If not found locally, check if it's an imported/exported style
        const hash = mergedCreateTable[varName];
        if (hash) {
          const obj = scannedTables.createObjectTable[hash];
          if (obj && obj[propName]) {
            // Generate atomMap for the style
            const style = obj[propName];
            if (typeof style === 'object' && style !== null) {
              const records = getStyleRecords(propName, style as any, 2);
              if (!isProduction) {
                extractOndemandStyles(style, extractedSheets, scannedTables);

                records.forEach((r: StyleRecord) =>
                  extractedSheets.push(r.sheet),
                );
              }
              const atomMap: Record<string, string> = {};
              records.forEach((r: any) => (atomMap[r.key] = r.hash));

              if (Object.keys(atomMap).length > 0) {
                replacements.push({
                  start: node.span.start - ast.span.start,
                  end: node.span.end - ast.span.start,
                  content: JSON.stringify(atomMap),
                });
              }
            }
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
            (t.isIdentifier(expr.property) || expr.property.type === 'Computed')
          ) {
            if (expr.property.type === 'Computed') {
              // Ignore bracket notation for complete staticization
              return {};
            }
            const varName = ((expr as MemberExpression).object as Identifier)
              .value;
            const propName = ((expr as MemberExpression).property as Identifier)
              .value;

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

            // Checks for direct variant object reference if passed as variable
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

            if (localCreateStyles[varName] && localCreateStyles[varName].obj) {
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
                      const valEnd = (valExpr as any).span.end - ast.span.start;
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
                    test: arg, // We repurpose the arg node, but rely on testString for the output
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
            if (!isProduction) {
              extractOndemandStyles(baseStyle, extractedSheets, scannedTables);
            }
            const hash = genBase36Hash(baseStyle, 1, 8);
            const records = getStyleRecords(hash, baseStyle, 2);
            if (!isProduction) {
              records.forEach((r: StyleRecord) =>
                extractedSheets.push(r.sheet),
              );
            }
            const className = records.map((r: StyleRecord) => r.hash).join(' ');

            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(className),
            });
          } else {
            const table: Record<number, string> = {};
            const combinations = 1 << conditionals.length;

            for (let i = 0; i < combinations; i++) {
              const currentClassNames: string[] = [];
              const seenGroups = new Set<number>();
              let impossible = false;

              // 1. Process baseStyle first (if any)
              if (Object.keys(baseStyle).length > 0) {
                if (!isProduction) {
                  extractOndemandStyles(
                    baseStyle,
                    extractedSheets,
                    scannedTables,
                  );
                }
                const hash = genBase36Hash(baseStyle, 1, 8);
                const records = getStyleRecords(hash, baseStyle, 2);
                if (!isProduction) {
                  records.forEach((r: StyleRecord) =>
                    extractedSheets.push(r.sheet),
                  );
                }
                currentClassNames.push(
                  ...records.map((r: StyleRecord) => r.hash),
                );
              }

              // 2. Process conditionals
              for (let j = 0; j < conditionals.length; j++) {
                let targetStyle: Record<string, any> = {};

                if ((i >> j) & 1) {
                  // Truthy case
                  if (conditionals[j].groupId !== undefined) {
                    if (seenGroups.has(conditionals[j].groupId!)) {
                      impossible = true;
                      break;
                    }
                    seenGroups.add(conditionals[j].groupId!);
                  }
                  targetStyle = conditionals[j].truthy;
                } else {
                  // Falsy case
                  targetStyle = conditionals[j].falsy;
                }

                if (Object.keys(targetStyle).length > 0) {
                  if (!isProduction) {
                    extractOndemandStyles(
                      targetStyle,
                      extractedSheets,
                      scannedTables,
                    );
                  }
                  const hash = genBase36Hash(targetStyle, 1, 8);
                  const records = getStyleRecords(hash, targetStyle, 2);
                  if (!isProduction) {
                    records.forEach((r: StyleRecord) =>
                      extractedSheets.push(r.sheet),
                    );
                  }
                  currentClassNames.push(
                    ...records.map((r: StyleRecord) => r.hash),
                  );
                }
              }

              if (impossible) {
                table[i] = '';
                continue;
              }

              table[i] = currentClassNames.join(' ');
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
  const transformedSource = Buffer.concat(parts).toString();

  const VIRTUAL_CSS_PATH = require.resolve(VIRTUAL_FILE_PATH);

  function stringifyRequest(loaderContext: LoaderContext, request: string) {
    const context = loaderContext.context || loaderContext.rootContext;
    const relativePath = path.relative(context, request);
    const requestPath = relativePath.startsWith('.')
      ? relativePath
      : './' + relativePath;
    return JSON.stringify(requestPath);
  }

  const virtualCssImportPath = path.posix.join(
    path.posix.relative(
      path.dirname(this.resourcePath),
      path.resolve(__dirname, '..', VIRTUAL_CSS_PATH),
    ),
  );

  let importPath = virtualCssImportPath;
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }

  const virtualCssRequest = stringifyRequest(this, `${VIRTUAL_CSS_PATH}`);
  const postfix = `\nimport ${virtualCssRequest};`;

  if (process.env.NODE_ENV === 'production')
    return callback(null, transformedSource);

  if (extractedSheets.length > 0 && process.env.NODE_ENV === 'development') {
    fs.appendFileSync(VIRTUAL_FILE_PATH, extractedSheets.join(''), 'utf-8');
  }

  return callback(null, transformedSource + postfix);
}
