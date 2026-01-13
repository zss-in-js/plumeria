import {
  parseSync,
  ObjectExpression,
  Expression,
  ImportSpecifier,
} from '@swc/core';
import {
  camelToKebabCase,
  type CSSProperties,
  genBase36Hash,
} from 'zss-engine';
import fs from 'fs';

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
  CSSObject,
  VariantsHashTable,
  CreateHashTable,
  CreateThemeHashTable,
  CreateStaticHashTable,
  ViewTransitionHashTable,
  KeyframesHashTable,
  StaticTable,
} from '@plumeria/utils';

interface CompilerOptions {
  include: string[];
  exclude: string[];
  cwd?: string;
}

export function compileCSS(options: CompilerOptions) {
  const { include, exclude, cwd = process.cwd() } = options;
  const allSheets = new Set<string>();

  const files = fs.globSync(include, {
    cwd,
    exclude: exclude,
  });

  const processFile = (filePath: string): string[] => {
    const source = fs.readFileSync(filePath, 'utf-8');
    const extractedSheets: string[] = [];

    let ast;
    try {
      ast = parseSync(source, {
        syntax: 'typescript',
        tsx: true,
        target: 'es2022',
      });
    } catch (err) {
      console.warn(`Failed to parse ${filePath}:`, err);
      return [];
    }

    const scannedTables = scanAll();
    const localConsts = collectLocalConsts(ast);
    const resourcePath = filePath;
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

              if (scannedTables.createHashTable[uniqueKey]) {
                importMap[localName] = scannedTables.createHashTable[uniqueKey];
              }
              if (scannedTables.variantsHashTable[uniqueKey]) {
                importMap[localName] =
                  scannedTables.variantsHashTable[uniqueKey];
              }
              if (scannedTables.createThemeHashTable[uniqueKey]) {
                importMap[localName] =
                  scannedTables.createThemeHashTable[uniqueKey];
              }
              if (scannedTables.createStaticHashTable[uniqueKey]) {
                importMap[localName] =
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

    const mergedCreateThemeHashTable: CreateThemeHashTable = {};
    for (const key of Object.keys(scannedTables.createThemeHashTable)) {
      mergedCreateThemeHashTable[key] = scannedTables.createThemeHashTable[key];
    }
    for (const key of Object.keys(importMap)) {
      mergedCreateThemeHashTable[key] = importMap[key];
    }

    const mergedCreateStaticHashTable: CreateStaticHashTable = {};
    for (const key of Object.keys(scannedTables.createStaticHashTable)) {
      mergedCreateStaticHashTable[key] =
        scannedTables.createStaticHashTable[key];
    }
    for (const key of Object.keys(importMap)) {
      mergedCreateStaticHashTable[key] = importMap[key];
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
      { type: 'create' | 'variant' | 'theme'; obj: CSSObject }
    > = {};

    traverse(ast, {
      VariableDeclarator({ node }) {
        if (
          node.id.type === 'Identifier' &&
          node.init &&
          t.isCallExpression(node.init)
        ) {
          let propName: string | undefined;
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

          if (
            propName &&
            node.init.arguments.length === 1 &&
            t.isObjectExpression(node.init.arguments[0].expression)
          ) {
            const resolveVariable = (name: string) => {
              if (localCreateStyles[name]) {
                return localCreateStyles[name].obj;
              }
            };

            if (propName === 'create') {
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
                resolveVariable,
              );
              if (obj) {
                localCreateStyles[node.id.value] = { type: 'create', obj };

                Object.entries(obj).forEach(([key, style]) => {
                  const records = getStyleRecords(
                    key,
                    style as CSSProperties,
                    1,
                  );
                  extractOndemandStyles(style, extractedSheets, scannedTables);
                  records.forEach((r: StyleRecord) => {
                    extractedSheets.push(r.sheet);
                  });
                });
              }
            } else if (propName === 'variants') {
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
                resolveVariable,
              );
              if (obj) {
                localCreateStyles[node.id.value] = { type: 'variant', obj };
              }
            } else if (propName === 'createTheme') {
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

              if (!scannedTables.createAtomicMapTable[hash]) {
                const hashMap: Record<string, string> = {};
                for (const [key] of Object.entries(obj)) {
                  const cssVarName = camelToKebabCase(key);
                  hashMap[key] = `var(--${cssVarName})`;
                }
                scannedTables.createAtomicMapTable[hash] = hashMap as any;
              }

              localCreateStyles[node.id.value] = {
                type: 'theme',
                obj: scannedTables.createAtomicMapTable[hash],
              };
            }
          }
        }
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

          const extractStylesFromExpression = (
            expr: Expression,
          ): CSSObject[] => {
            const results: CSSObject[] = [];
            if (t.isObjectExpression(expr)) {
              const obj = objectExpressionToObject(
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
              if (obj) results.push(obj);
            } else if (t.isMemberExpression(expr)) {
              if (
                t.isIdentifier(expr.object) &&
                t.isIdentifier(expr.property)
              ) {
                // styles.main (dot access)
                const varName = expr.object.value;
                const propName = expr.property.value;
                const styleSet = localCreateStyles[varName];
                if (styleSet && styleSet.obj[propName]) {
                  results.push(styleSet.obj[propName] as CSSObject);
                } else {
                  // Check imported
                  const hash = mergedCreateTable[varName];
                  if (hash) {
                    const obj = scannedTables.createObjectTable[hash];
                    if (obj && obj[propName]) {
                      results.push(obj[propName] as CSSObject);
                    }
                  }
                }
              } else if (
                t.isIdentifier(expr.object) &&
                expr.property.type === 'Computed'
              ) {
                // Ignore bracket notation for complete staticization
                return [];
              }
            } else if (t.isIdentifier(expr)) {
              const obj = localCreateStyles[expr.value];
              if (obj) {
                results.push(obj.obj);
              } else {
                const hash = mergedCreateTable[expr.value];
                if (hash) {
                  const obj = scannedTables.createObjectTable[hash];
                  if (obj) results.push(obj as CSSObject);
                }
              }
            } else if (t.isConditionalExpression(expr)) {
              results.push(...extractStylesFromExpression(expr.consequent));
              results.push(...extractStylesFromExpression(expr.alternate));
            } else if (
              t.isBinaryExpression(expr) &&
              (expr.operator === '&&' ||
                expr.operator === '||' ||
                expr.operator === '??')
            ) {
              results.push(...extractStylesFromExpression(expr.left));
              results.push(...extractStylesFromExpression(expr.right));
            } else if (expr.type === 'ParenthesisExpression') {
              results.push(...extractStylesFromExpression(expr.expression));
            }
            return results;
          };

          const processStyle = (style: CSSObject) => {
            extractOndemandStyles(style, extractedSheets, scannedTables);
            const hash = genBase36Hash(style, 1, 8);
            const records = getStyleRecords(hash, style as CSSProperties, 1);
            records.forEach((r: StyleRecord) => extractedSheets.push(r.sheet));
          };

          if (propName === 'props') {
            const conditionals: Array<{
              test: Expression;
              truthy: Record<string, any>;
              falsy: Record<string, any>;
              groupId?: number;
            }> = [];

            let groupIdCounter = 0;
            let baseStyle: Record<string, any> = {};

            const resolveStyleObject = (
              expr: Expression,
            ): Record<string, any> | null => {
              const styles = extractStylesFromExpression(expr);
              if (styles.length === 1) return styles[0] as Record<string, any>;
              return null;
            };

            for (const arg of args) {
              const expr = arg.expression;

              if (t.isCallExpression(expr) && t.isIdentifier(expr.callee)) {
                const varName = expr.callee.value;
                let variantObj: Record<string, any> | undefined;

                if (
                  localCreateStyles[varName] &&
                  localCreateStyles[varName].type === 'variant'
                ) {
                  variantObj = localCreateStyles[varName].obj;
                } else if (mergedVariantsTable[varName]) {
                  const hash = mergedVariantsTable[varName];
                  if (scannedTables.variantsObjectTable[hash]) {
                    variantObj = scannedTables.variantsObjectTable[
                      hash
                    ] as Record<string, any>;
                  }
                }

                if (variantObj) {
                  const callArgs = expr.arguments;
                  if (callArgs.length === 1 && !callArgs[0].spread) {
                    const arg = callArgs[0].expression;

                    if (t.isObjectExpression(arg)) {
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

                          // Dynamic selection - generate all options
                          Object.entries(
                            groupVariants as Record<string, any>,
                          ).forEach(([_optionName, style]) => {
                            conditionals.push({
                              test: valExpr, // Placeholder
                              truthy: style as Record<string, any>,
                              falsy: {},
                              groupId: currentGroupId,
                            });
                          });
                        }
                      }
                      continue;
                    }

                    // Simple variant(string) case
                    if (t.isStringLiteral(arg)) {
                      if (variantObj[arg.value]) {
                        baseStyle = deepMerge(baseStyle, variantObj[arg.value]);
                      }
                      continue;
                    }

                    // Dynamic simple variant
                    const currentGroupId = ++groupIdCounter;
                    Object.entries(variantObj).forEach(([_key, style]) => {
                      conditionals.push({
                        test: arg, // Placeholder
                        truthy: style as Record<string, any>,
                        falsy: {},
                        groupId: currentGroupId,
                      });
                    });
                    continue;
                  }

                  break;
                }
              }

              if (t.isBinaryExpression(expr) && expr.operator === '&&') {
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
              }

              const styles = extractStylesFromExpression(expr);
              if (styles.length > 0) {
                styles.forEach(processStyle);
                continue;
              }
            }

            if (
              Object.keys(baseStyle).length > 0 &&
              conditionals.length === 0
            ) {
              processStyle(baseStyle);
            } else if (conditionals.length > 0) {
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
                  continue;
                }

                if (Object.keys(currentStyle).length > 0) {
                  processStyle(currentStyle);
                }
              }
            }
          } else if (
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
            extractOndemandStyles(
              { kf: `kf-${hash}` },
              extractedSheets,
              scannedTables,
            );
            scannedTables.keyframesObjectTable[hash] = obj;
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
            extractOndemandStyles(
              { vt: `vt-${hash}` },
              extractedSheets,
              scannedTables,
            );
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
              mergedCreateThemeHashTable,
              scannedTables.createThemeObjectTable,
              mergedCreateTable,
              mergedCreateStaticHashTable,
              scannedTables.createStaticObjectTable,
              mergedVariantsTable,
            );
            const themeHash = genBase36Hash(obj, 1, 8);
            scannedTables.createThemeObjectTable[themeHash] = obj;
            extractOndemandStyles(obj, extractedSheets, scannedTables);
          }
        }
      },
    });

    return extractedSheets;
  };

  for (const file of files) {
    const sheets = processFile(file);
    for (const sheet of sheets) {
      allSheets.add(sheet);
    }
  }

  return Array.from(allSheets).join('\n');
}
