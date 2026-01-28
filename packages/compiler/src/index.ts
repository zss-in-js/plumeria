import {
  parseSync,
  ObjectExpression,
  Expression,
  ImportSpecifier,
  MemberExpression,
  Identifier,
  ConditionalExpression,
  BinaryExpression,
  ParenthesisExpression,
} from '@swc/core';
import { type CSSProperties, genBase36Hash } from 'zss-engine';

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

    const ast = parseSync(source, {
      syntax: 'typescript',
      tsx: true,
      target: 'es2022',
    });

    const scannedTables = scanAll(false);
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

    const processCall = (node: any) => {
      node._processed = true;

      // Resolve propName logic (similar to existing)
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
        if (alias === 'NAMESPACE' || objectName === 'css')
          propName = propertyName;
      } else if (t.isIdentifier(callee)) {
        const originalName = plumeriaAliases[callee.value];
        if (originalName) propName = originalName;
      }

      // Special handling for local styling calls (styles({...}))
      let localVariantName: string | undefined;
      if (!propName && t.isIdentifier(callee)) {
        const varName = callee.value;
        if (
          localCreateStyles[varName] &&
          localCreateStyles[varName].type === 'variant'
        ) {
          localVariantName = varName;
          propName = 'props'; // Treat as usage
        }
      }

      if (propName) {
        const args = node.arguments;
        // Helper to extract styles (recursive)
        const extractStylesFromExpression = (
          expression: Expression,
        ): CSSObject[] => {
          const results: CSSObject[] = [];
          if (t.isObjectExpression(expression)) {
            const object = objectExpressionToObject(
              expression,
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
            if (object) results.push(object);
          } else if (t.isMemberExpression(expression)) {
            const memberExpr = expression as MemberExpression;
            // Handle static member access logic
            if (
              t.isIdentifier(memberExpr.object) &&
              t.isIdentifier(memberExpr.property)
            ) {
              const variableName = (memberExpr.object as Identifier).value;
              const propertyName = (memberExpr.property as Identifier).value;
              const styleSet = localCreateStyles[variableName];
              if (styleSet && styleSet.obj[propertyName]) {
                results.push(styleSet.obj[propertyName] as CSSObject);
              } else {
                const hash = mergedCreateTable[variableName];
                if (hash) {
                  const object = scannedTables.createObjectTable[hash];
                  if (object && object[propertyName]) {
                    results.push(object[propertyName] as CSSObject);
                  }
                }
              }
            }
          } else if (t.isIdentifier(expression)) {
            const identifier = expression as Identifier;
            const object = localCreateStyles[identifier.value];
            if (object) results.push(object.obj);
            else {
              const hash = mergedCreateTable[identifier.value];
              if (hash) {
                const objectFromTable = scannedTables.createObjectTable[hash];
                if (objectFromTable) results.push(objectFromTable as CSSObject);
              }
            }
          } else if (t.isConditionalExpression(expression)) {
            const conditionalExpr = expression as ConditionalExpression;
            results.push(
              ...extractStylesFromExpression(conditionalExpr.consequent),
            );
            results.push(
              ...extractStylesFromExpression(conditionalExpr.alternate),
            );
          } else if (
            t.isBinaryExpression(expression) &&
            ['&&', '||', '??'].includes(
              (expression as BinaryExpression).operator,
            )
          ) {
            const binaryExpr = expression as BinaryExpression;
            results.push(...extractStylesFromExpression(binaryExpr.left));
            results.push(...extractStylesFromExpression(binaryExpr.right));
          } else if (expression.type === 'ParenthesisExpression') {
            const parenExpr = expression as unknown as ParenthesisExpression;
            results.push(...extractStylesFromExpression(parenExpr.expression));
          }
          return results;
        };

        const processStyle = (style: CSSObject) => {
          extractOndemandStyles(style, extractedSheets, scannedTables);
          const records = getStyleRecords(style as CSSProperties);
          records.forEach((r: StyleRecord) => extractedSheets.push(r.sheet));
        };

        if (propName === 'props') {
          const conditionals: Array<{
            test: Expression;
            testString?: string;
            truthy: Record<string, any>;
            falsy: Record<string, any>;
            groupId?: number;
            groupName?: string;
            valueName?: string;
            varName?: string;
          }> = [];
          let groupIdCounter = 0;
          let baseStyle: Record<string, any> = {};

          const resolveStyleObject = (
            expression: Expression,
          ): Record<string, any> | null => {
            const styles = extractStylesFromExpression(expression);
            return styles.length === 1
              ? (styles[0] as Record<string, any>)
              : null;
          };

          for (const arg of args) {
            const expr = arg.expression;

            // Variant Usage Logic (styles({ variant: ... }))
            // Handle if ARGUMENT is ObjectExpression (direct usage) - for localVariantName case
            let handledAsObjectArg = false;
            if (localVariantName && t.isObjectExpression(expr)) {
              // This is styles({ ... }) where styles is local variants wrapper
              // We can reuse the logic that parses object arguments for variants
              // But logic below expects "expr" to be CallExpression usually?
              // Actually logic below handles `t.isCallExpression(expr)` which is `styles( variants(...) )`.
              // We need to handle `t.isObjectExpression(expr)`.

              const variantObj = localCreateStyles[localVariantName].obj;
              // Reuse logic?
              if (variantObj) {
                const props = expr.properties;

                // Handle "base" styles if they exist
                if (variantObj.base && typeof variantObj.base === 'object') {
                  baseStyle = deepMerge(baseStyle, variantObj.base);
                }

                // Determine where variants are located
                const variantsMap = (variantObj.variants ||
                  variantObj) as Record<string, any>;

                for (const prop of props) {
                  let groupName: string | undefined;
                  let valueExpression: any;
                  if (
                    prop.type === 'KeyValueProperty' &&
                    prop.key.type === 'Identifier'
                  ) {
                    groupName = prop.key.value;
                    valueExpression = prop.value;
                  } else if (prop.type === 'Identifier') {
                    groupName = prop.value;
                    valueExpression = prop;
                  }

                  if (groupName && valueExpression && variantsMap[groupName]) {
                    const groupVariants = variantsMap[groupName];
                    if (!groupVariants || typeof groupVariants !== 'object')
                      continue;

                    const currentGroupId = ++groupIdCounter;

                    if (valueExpression.type === 'StringLiteral') {
                      // @ts-ignore
                      if (
                        (groupVariants as Record<string, any>)[
                          valueExpression.value
                        ]
                      ) {
                        baseStyle = deepMerge(
                          baseStyle,
                          (groupVariants as Record<string, any>)[
                            valueExpression.value
                          ],
                        );
                      }
                      continue;
                    }

                    Object.entries(
                      groupVariants as unknown as Record<string, any>,
                    ).forEach(([optionName, style]) => {
                      conditionals.push({
                        test: valueExpression,
                        truthy: style as any,
                        falsy: {},
                        groupId: currentGroupId,
                        groupName: groupName,
                        valueName: optionName,
                        varName: localVariantName,
                      });
                    });
                  }
                }
                handledAsObjectArg = true;
              }
            }
            if (handledAsObjectArg) continue;

            // Recursive Conditionals
            const getSource = (node: any) =>
              source.substring(
                node.span.start - ast.span.start,
                node.span.end - ast.span.start,
              );
            const collectConditions = (
              node: Expression,
              testStrings: string[] = [],
            ): boolean => {
              const staticStyle = resolveStyleObject(node);
              if (staticStyle) {
                if (testStrings.length === 0)
                  baseStyle = deepMerge(baseStyle, staticStyle);
                else
                  conditionals.push({
                    test: node,
                    testString: testStrings.join(' && '),
                    truthy: staticStyle,
                    falsy: {},
                  });
                return true;
              }
              if (node.type === 'ConditionalExpression') {
                const testSource = getSource(node.test);
                collectConditions(node.consequent, [
                  ...testStrings,
                  `(${testSource})`,
                ]);
                collectConditions(node.alternate, [
                  ...testStrings,
                  `!(${testSource})`,
                ]);
                return true;
              } else if (
                node.type === 'BinaryExpression' &&
                node.operator === '&&'
              ) {
                collectConditions(node.right, [
                  ...testStrings,
                  `(${getSource(node.left)})`,
                ]);
                return true;
              } else if (node.type === 'ParenthesisExpression') {
                return collectConditions(node.expression, testStrings);
              }
              return false;
            };

            if (collectConditions(expr)) continue;

            // Fallback
            const extractedStyles = extractStylesFromExpression(expr);
            if (extractedStyles.length > 0) {
              extractedStyles.forEach(processStyle);
              continue;
            }
          }

          if (Object.keys(baseStyle).length > 0) {
            processStyle(baseStyle);
          }

          // Generate styles for all conditionals independently
          // This aligns with the new independent map-based class generation in loaders
          // and avoids combinatorial explosion + pruning issues.
          for (const cond of conditionals) {
            if (cond.truthy && Object.keys(cond.truthy).length > 0) {
              processStyle(cond.truthy);
            }
            if (cond.falsy && Object.keys(cond.falsy).length > 0) {
              processStyle(cond.falsy);
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
          const hash = genBase36Hash(obj, 1, 8);
          scannedTables.createThemeObjectTable[hash] = obj;
          extractOndemandStyles(obj, extractedSheets, scannedTables);
        }
      }
    };

    const traverseInternal = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (t.isCallExpression(node)) processCall(node);
      for (const k in node)
        if (k !== 'span' && k !== 'loc') traverseInternal(node[k]);
    };

    traverse(ast, {
      VariableDeclarator({ node }: { node: any }) {
        // Definition Logic
        if (
          t.isIdentifier(node.id) &&
          node.init &&
          t.isCallExpression(node.init)
        ) {
          const callee = node.init.callee;
          let pName: string | undefined;
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            if (
              callee.object.value === 'css' ||
              plumeriaAliases[callee.object.value] === 'NAMESPACE'
            )
              pName = callee.property.value;
          } else if (t.isIdentifier(callee) && plumeriaAliases[callee.value]) {
            pName = plumeriaAliases[callee.value];
          }

          if (
            pName &&
            node.init.arguments.length === 1 &&
            t.isObjectExpression(node.init.arguments[0].expression)
          ) {
            const arg = node.init.arguments[0].expression as ObjectExpression;
            const resolveVariable = (name: string) =>
              localCreateStyles[name]?.obj ||
              (mergedCreateThemeHashTable[name]
                ? scannedTables.createAtomicMapTable[
                    mergedCreateThemeHashTable[name]
                  ]
                : undefined);

            if (pName === 'create') {
              const obj = objectExpressionToObject(
                arg,
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
                Object.entries(obj).forEach(([, s]) => {
                  extractOndemandStyles(s, extractedSheets, scannedTables);
                  getStyleRecords(s as CSSProperties).forEach(
                    (r: StyleRecord) => extractedSheets.push(r.sheet),
                  );
                });
              }
            } else if (pName === 'variants') {
              const obj = objectExpressionToObject(
                arg,
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
              if (obj)
                localCreateStyles[node.id.value] = { type: 'variant', obj };
            } else if (pName === 'createTheme') {
              const obj = objectExpressionToObject(
                arg,
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
              const uKey = `${resourcePath}-${node.id.value}`;
              scannedTables.createThemeHashTable[uKey] = hash;
              scannedTables.createThemeObjectTable[hash] = obj;
              localCreateStyles[node.id.value] = {
                type: 'create',
                obj: scannedTables.createAtomicMapTable[hash],
              };
            }
          }
        }
        // Scope Tracking
        if (t.isIdentifier(node.id)) {
          if (node.init) traverseInternal(node.init);
        }
      },
      FunctionDeclaration({ node }: { node: any }) {
        if (node.identifier) traverseInternal(node.body);
      },
      CallExpression: (path: any) => {
        if (!path.node._processed) processCall(path.node);
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
