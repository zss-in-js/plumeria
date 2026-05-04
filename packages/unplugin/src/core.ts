import type { UnpluginFactory } from 'unplugin';
import { createFilter } from '@rollup/pluginutils';
import { parseSync } from '@swc/core';
import type {
  ObjectExpression,
  ImportSpecifier,
  VariableDeclaration,
  VariableDeclarator,
  CallExpression,
  Expression,
  Statement,
  Identifier,
  HasSpan,
  JSXAttribute,
  ExprOrSpread,
} from '@swc/core';
import * as path from 'path';
import { applyCssValue, genBase36Hash, exceptionCamelCase } from 'zss-engine';
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
  processVariants,
  getLeadingCommentLength,
  optimizer,
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
  CSSObject,
} from '@plumeria/utils';

export interface PluginOptions {
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  devEmitToDisk?: boolean;
}

type CreateStyleValue = {
  name: string;
  type: 'create' | 'constant' | 'variant';
  obj: CSSObject;
  hashMap: Record<string, Record<string, string>>;
  isExported: boolean;
  initSpan: { start: number; end: number };
  declSpan: { start: number; end: number };
  functions?: Record<string, { params: string[]; body: ObjectExpression }>;
};

interface StyleConditional {
  test: Expression;
  testString?: string;
  testLHS?: string;
  truthy: CSSObject;
  falsy: CSSObject;
  groupId?: number;
  groupName?: string;
  valueName?: string;
  varName?: string;
}

export const TARGET_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'];
export const EXTENSION_PATTERN = /\.(ts|tsx|js|jsx)$/;

export const unpluginFactory: UnpluginFactory<PluginOptions | undefined> = (
  options = {},
  unpluginMeta,
) => {
  const filter = createFilter(options.include, options.exclude);

  const cssLookup = new Map<string, string>();
  const cssFileLookup = new Map<string, string>();
  const targets: { id: string; dependencies: string[] }[] = [];

  const devCssSheets = new Map<string, Set<string>>();
  let isDev = false;
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
    },

    resolveId(id, importer) {
      const [pathId, query] = id.split('?');
      if (pathId.endsWith('.zero.css')) {
        if (pathId.startsWith('/')) {
          let absolutePath = cssFileLookup.get(pathId);
          if (!absolutePath) {
            absolutePath = path.join(viteRoot, pathId);
          }
          return query ? `${absolutePath}?${query}` : absolutePath;
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
      return cssLookup.get(pathId) || '';
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

      const processStyleRecords = (style: CSSObject) => {
        const records = getStyleRecords(style as CSSProperties);
        extractOndemandStyles(style, extractedSheets, scannedTables);
        records.forEach((r: StyleRecord) => {
          addSheet(r.sheet);
        });
        return records;
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
            node.specifiers.forEach((specifier: ImportSpecifier) => {
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
        const val = importMap[key];
        if (typeof val === 'string') {
          mergedKeyframesTable[key] = val;
        }
      }

      const mergedViewTransitionTable: ViewTransitionHashTable = {};
      for (const key of Object.keys(scannedTables.viewTransitionHashTable)) {
        mergedViewTransitionTable[key] =
          scannedTables.viewTransitionHashTable[key];
      }
      for (const key of Object.keys(importMap)) {
        const val = importMap[key];
        if (typeof val === 'string') {
          mergedViewTransitionTable[key] = val;
        }
      }

      const mergedCreateTable: CreateHashTable = {};
      for (const key of Object.keys(scannedTables.createHashTable)) {
        mergedCreateTable[key] = scannedTables.createHashTable[key];
      }
      for (const key of Object.keys(importMap)) {
        const val = importMap[key];
        if (typeof val === 'string') {
          mergedCreateTable[key] = val;
        }
      }

      const mergedVariantsTable: VariantsHashTable = {};
      for (const key of Object.keys(scannedTables.variantsHashTable)) {
        mergedVariantsTable[key] = scannedTables.variantsHashTable[key];
      }
      for (const key of Object.keys(importMap)) {
        const val = importMap[key];
        if (typeof val === 'string') {
          mergedVariantsTable[key] = val;
        }
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

      const localCreateStyles: Record<string, CreateStyleValue> = {};
      const replacements: Array<{
        start: number;
        end: number;
        content: string;
      }> = [];
      const processedDecls = new Set<VariableDeclaration>();
      const idSpans = new Set<number>();
      const excludedSpans = new Set<number>();

      const getSource = (node: Expression): string => {
        const start = (node as HasSpan).span.start - baseByteOffset;
        const end = (node as HasSpan).span.end - baseByteOffset;
        return sourceBuffer.subarray(start, end).toString('utf-8');
      };

      const resolveStyleObject = (expr: Expression): CSSObject | null => {
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
          t.isIdentifier(expr.object) &&
          (t.isIdentifier(expr.property) || expr.property.type === 'Computed')
        ) {
          if (expr.property.type === 'Computed') return {};
          const varName = (expr.object as Identifier).value;
          const propName = (expr.property as Identifier).value;
          const styleInfo = localCreateStyles[varName];
          if (styleInfo?.obj[propName]) {
            const style = styleInfo.obj[propName];
            if (typeof style === 'object' && style !== null)
              return style as CSSObject;
          }
          const hash = mergedCreateTable[varName];
          if (hash) {
            const obj = scannedTables.createObjectTable[hash];
            if (obj?.[propName] && typeof obj[propName] === 'object')
              return obj[propName] as CSSObject;
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
        baseStyle: CSSObject;
      } => {
        const conditionals: StyleConditional[] = [];
        let groupIdCounter = 0;
        let baseStyle: CSSObject = {};
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
            let variantObj: CSSObject | undefined;

            let hash = scannedTables.variantsHashTable[uniqueKey];
            if (!hash) hash = mergedVariantsTable[varName];
            if (hash && scannedTables.variantsObjectTable[hash])
              variantObj = scannedTables.variantsObjectTable[hash];
            if (!variantObj && localCreateStyles[varName]?.obj)
              variantObj = localCreateStyles[varName].obj;

            if (variantObj) {
              const callArgs = expr.arguments;
              if (callArgs.length === 1 && !callArgs[0].spread) {
                const innerArg = callArgs[0].expression;
                if (innerArg.type === 'ObjectExpression') {
                  for (const prop of innerArg.properties) {
                    let groupName: string | undefined;
                    let valExpr: Expression | undefined;
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
                        const groupVariantsAsObj = groupVariants as CSSObject;
                        if (groupVariantsAsObj[valExpr.value as string])
                          baseStyle = deepMerge(
                            baseStyle,
                            groupVariantsAsObj[
                              valExpr.value as string
                            ] as CSSObject,
                          );
                        continue;
                      }
                      Object.entries(groupVariants as CSSObject).forEach(
                        ([optionName, style]) => {
                          conditionals.push({
                            test: valExpr!,
                            testLHS: valSource,
                            testString: `${valSource} === '${optionName}'`,
                            truthy: style as CSSObject,
                            falsy: {},
                            groupId: currentGroupId,
                            groupName,
                            valueName: optionName,
                            varName,
                          });
                        },
                      );
                    }
                  }
                  continue;
                }
                const argSource = getSource(innerArg);
                if (t.isStringLiteral(innerArg)) {
                  if (variantObj[innerArg.value as string])
                    baseStyle = deepMerge(
                      baseStyle,
                      variantObj[innerArg.value as string] as CSSObject,
                    );
                  continue;
                }
                const currentGroupId = ++groupIdCounter;
                Object.entries(variantObj).forEach(([key, style]) => {
                  conditionals.push({
                    test: innerArg,
                    testLHS: argSource,
                    testString: `${argSource} === '${key}'`,
                    truthy: style as CSSObject,
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
            let variantObj: CSSObject | undefined;

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
                        truthy: style as CSSObject,
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
        const registerParticipation = (style: CSSObject, sourceId: string) => {
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

        const baseIndependent: CSSObject = {};
        const baseConflict: CSSObject = {};
        Object.entries(baseStyle).forEach(([key, val]) => {
          if (conflictingKeys.has(key)) baseConflict[key] = val;
          else baseIndependent[key] = val;
        });

        const indepConditionals: StyleConditional[] = [];
        const conflictConditionals: StyleConditional[] = [];
        conditionals.forEach((c) => {
          const truthyIndep: CSSObject = {};
          const truthyConf: CSSObject = {};
          const falsyIndep: CSSObject = {};
          const falsyConf: CSSObject = {};
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
          const className = processStyleRecords(baseIndependent)
            .map((r) => r.hash)
            .join(' ');
          if (className) classParts.push(JSON.stringify(className));
        }

        indepConditionals
          .filter((c) => c.groupId === undefined)
          .forEach((c) => {
            const processBranch = (style: CSSObject) => {
              if (Object.keys(style).length === 0) return '""';
              return JSON.stringify(
                processStyleRecords(style)
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
        Object.values(indepVarGroups).forEach((opts) => {
          const commonTestExpr =
            opts[0].testLHS ?? opts[0].testString ?? getSource(opts[0].test);
          const lookupMap: Record<string, string> = {};
          opts.forEach((opt) => {
            if (opt.valueName && opt.truthy) {
              const className = processStyleRecords(opt.truthy)
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
              value: number | string | undefined;
              style: CSSObject;
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
            currentStyle: CSSObject,
            keyParts: string[],
          ) => {
            if (dimIndex >= dimensions.length) {
              const className = processStyleRecords(currentStyle)
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
              ? processStyleRecords(baseConflict)
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

      const registerStyle = (
        node: VariableDeclarator,
        declSpan: { start: number; end: number },
        isExported: boolean,
      ) => {
        let propName: string | undefined;
        const init = node.init;
        if (
          t.isIdentifier(node.id) &&
          init &&
          t.isCallExpression(init) &&
          init.arguments.length >= 1
        ) {
          const callee = init.callee;
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            const objectName = callee.object.value;
            const propertyName = callee.property.value;
            const alias = plumeriaAliases[objectName];
            if (alias === 'NAMESPACE') propName = propertyName;
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName) propName = originalName;
          }
        }

        if (propName && init && t.isCallExpression(init)) {
          if (
            propName === 'create' &&
            t.isObjectExpression(init.arguments[0].expression)
          ) {
            const obj = objectExpressionToObject(
              init.arguments[0].expression as ObjectExpression,
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
                const atomMap: Record<string, string> = {};
                records.forEach((r) => (atomMap[r.key] = r.hash));
                hashMap[key] = atomMap;
              });
              const styleFunctions: Record<
                string,
                { params: string[]; body: ObjectExpression }
              > = {};
              const objExpr = init.arguments[0].expression as ObjectExpression;
              objExpr.properties.forEach((prop) => {
                if (
                  prop.type !== 'KeyValueProperty' ||
                  prop.key.type !== 'Identifier'
                )
                  return;
                const func = prop.value;
                if (
                  func.type !== 'ArrowFunctionExpression' &&
                  func.type !== 'FunctionExpression'
                )
                  return;
                const params: string[] = func.params.map((p: any) => {
                  if (t.isIdentifier(p)) return p.value;
                  if (
                    typeof p === 'object' &&
                    p !== null &&
                    'pat' in p &&
                    t.isIdentifier(p.pat)
                  )
                    return p.pat.value;
                  return 'arg';
                });
                let actualBody: Expression | Statement | undefined = func.body;
                if (actualBody?.type === 'ParenthesisExpression')
                  actualBody = actualBody.expression;
                if (actualBody?.type === 'BlockStatement') {
                  const first = actualBody.stmts?.[0];
                  if (first?.type === 'ReturnStatement')
                    actualBody = first.argument;
                  if (actualBody?.type === 'ParenthesisExpression')
                    actualBody = actualBody.expression;
                }
                if (actualBody && actualBody.type === 'ObjectExpression') {
                  styleFunctions[prop.key.value] = {
                    params,
                    body: actualBody as ObjectExpression,
                  };
                }
              });
              if (t.isIdentifier(node.id)) {
                idSpans.add(node.id.span.start);
                localCreateStyles[node.id.value] = {
                  name: node.id.value,
                  type: 'create',
                  obj,
                  hashMap,
                  isExported,
                  initSpan: {
                    start: init.span.start - baseByteOffset,
                    end: init.span.end - baseByteOffset,
                  },
                  declSpan: {
                    start: declSpan.start - baseByteOffset,
                    end: declSpan.end - baseByteOffset,
                  },
                  functions: styleFunctions,
                };
              }
            }
          } else if (
            propName === 'variants' &&
            t.isObjectExpression(init.arguments[0].expression)
          ) {
            if (t.isIdentifier(node.id)) idSpans.add(node.id.span.start);
            const obj = objectExpressionToObject(
              init.arguments[0].expression as ObjectExpression,
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
                if (localCreateStyles[name]) return localCreateStyles[name].obj;
                if (mergedCreateTable[name]) {
                  const hash = mergedCreateTable[name];
                  if (scannedTables.createObjectTable[hash])
                    return scannedTables.createObjectTable[hash];
                }
                return undefined;
              },
            );
            const { hashMap } = processVariants(
              obj as Record<string, Record<string, CSSObject>>,
            );
            if (t.isIdentifier(node.id)) {
              localCreateStyles[node.id.value] = {
                name: node.id.value,
                type: 'variant',
                obj,
                hashMap,
                isExported,
                initSpan: {
                  start: init.span.start - baseByteOffset,
                  end: init.span.end - baseByteOffset,
                },
                declSpan: {
                  start: declSpan.start - baseByteOffset,
                  end: declSpan.end - baseByteOffset,
                },
              };
            }
          } else if (
            propName === 'createTheme' &&
            t.isObjectExpression(init.arguments[0].expression)
          ) {
            if (t.isIdentifier(node.id)) idSpans.add(node.id.span.start);
            const obj = objectExpressionToObject(
              init.arguments[0].expression as ObjectExpression,
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
            if (t.isIdentifier(node.id)) {
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
                  start: init.span.start - baseByteOffset,
                  end: init.span.end - baseByteOffset,
                },
                declSpan: {
                  start: declSpan.start - baseByteOffset,
                  end: declSpan.end - baseByteOffset,
                },
              };
            }
          }
        }
      };

      const jsxOpeningElementMap = new Map<number, any[]>();

      traverse(ast, {
        ImportDeclaration({ node }) {
          if (node.specifiers) {
            node.specifiers.forEach((specifier: ImportSpecifier) => {
              if (specifier.local)
                excludedSpans.add(specifier.local.span.start);
              if (specifier.type === 'ImportSpecifier' && specifier.imported)
                excludedSpans.add(specifier.imported.span.start);
            });
          }
        },
        ExportDeclaration({ node }) {
          if (t.isVariableDeclaration(node.declaration)) {
            processedDecls.add(node.declaration);
            node.declaration.declarations.forEach((decl: VariableDeclarator) =>
              registerStyle(decl, node.span, true),
            );
          }
        },
        VariableDeclaration({ node }) {
          if (processedDecls.has(node)) return;
          node.declarations.forEach((decl: VariableDeclarator) =>
            registerStyle(decl, node.span, false),
          );
        },
        JSXOpeningElement({ node }) {
          jsxOpeningElementMap.set(node.span.start, node.attributes);
        },
        MemberExpression({ node }) {
          if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
            const varName = node.object.value;
            const propName = node.property.value;
            const uniqueKey = `${resourcePath}-${varName}`;
            let hash = scannedTables.createHashTable[uniqueKey];
            if (!hash) hash = mergedCreateTable[varName];
            if (hash) {
              let atomMap: Record<string, string> | undefined;
              if (scannedTables.createAtomicMapTable[hash])
                atomMap = scannedTables.createAtomicMapTable[hash][propName];
              if (atomMap)
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(atomMap)})`,
                });
            }
            let themeHash = scannedTables.createThemeHashTable[uniqueKey];
            if (!themeHash) themeHash = mergedCreateThemeHashTable[varName];
            if (themeHash) {
              const atomicMap = scannedTables.createAtomicMapTable[themeHash];
              if (atomicMap && atomicMap[propName])
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(atomicMap[propName])})`,
                });
            }
            let staticHash = scannedTables.createStaticHashTable[uniqueKey];
            if (!staticHash) staticHash = mergedCreateStaticHashTable[varName];
            if (staticHash) {
              const staticObj =
                scannedTables.createStaticObjectTable[staticHash];
              if (staticObj && staticObj[propName] !== undefined)
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(staticObj[propName])})`,
                });
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
          if (!hash) hash = mergedCreateTable[varName];
          if (hash) {
            const obj = scannedTables.createObjectTable[hash];
            const atomicMap = scannedTables.createAtomicMapTable[hash];
            if (obj && atomicMap) {
              const hashMap: Record<string, Record<string, string>> = {};
              Object.keys(obj).forEach((key) => {
                if (atomicMap[key]) hashMap[key] = atomicMap[key];
              });
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: `(${JSON.stringify(hashMap)})`,
              });
            }
          }
          let themeHash = scannedTables.createThemeHashTable[uniqueKey];
          if (!themeHash) themeHash = mergedCreateThemeHashTable[varName];
          if (themeHash) {
            const atomicMap = scannedTables.createAtomicMapTable[themeHash];
            if (atomicMap)
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: `(${JSON.stringify(atomicMap)})`,
              });
            return;
          }
          let staticHash = scannedTables.createStaticHashTable[uniqueKey];
          if (!staticHash) staticHash = mergedCreateStaticHashTable[varName];
          if (staticHash) {
            const staticObj = scannedTables.createStaticObjectTable[staticHash];
            if (staticObj)
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: `(${JSON.stringify(staticObj)})`,
              });
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
          let args: Array<{ expression: Expression }> =
            expr.type === 'ArrayExpression'
              ? expr.elements
                  .filter((el: ExprOrSpread) => el !== undefined)
                  .map((el: ExprOrSpread) => ({ expression: el.expression }))
              : [{ expression: expr }];

          const dynamicClassParts: string[] = [];
          const dynamicStyleParts: string[] = [];
          let attributes: any[] = [];
          for (const [, attrs] of jsxOpeningElementMap) {
            const found = attrs
              .filter((a): a is JSXAttribute => a.type === 'JSXAttribute')
              .find((a) => a.span.start === node.span.start);
            if (found) {
              attributes = attrs;
              break;
            }
          }
          const classNameAttr = attributes.find(
            (attr): attr is JSXAttribute =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'Identifier' &&
              attr.name.value === 'className',
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
            (attr): attr is JSXAttribute =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'Identifier' &&
              attr.name.value === 'style',
          );
          if (styleAttrExisting) {
            replacements.push({
              start: styleAttrExisting.span.start - baseByteOffset,
              end: styleAttrExisting.span.end - baseByteOffset,
              content: '',
            });
            if (styleAttrExisting.value?.type === 'JSXExpressionContainer') {
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
          }
          args = args.filter((arg) => {
            const innerExpr = arg.expression;
            if (
              !t.isCallExpression(innerExpr) ||
              !t.isMemberExpression(innerExpr.callee)
            )
              return true;
            const callee = innerExpr.callee;
            if (
              !t.isIdentifier(callee.object) ||
              !t.isIdentifier(callee.property)
            )
              return true;
            const varName = callee.object.value;
            const propKey = callee.property.value;
            const styleInfo = localCreateStyles[varName];
            if (styleInfo?.functions?.[propKey]) {
              const func = styleInfo.functions[propKey];
              const callArgs = (innerExpr as CallExpression).arguments;
              const hasSpread = callArgs.some((a) => a.spread);
              if (!hasSpread && callArgs.length >= 1) {
                const tempStaticTable = { ...mergedStaticTable };
                const cssVarInfo: Record<
                  string,
                  { cssVar: string; propKey: string }
                > = {};
                if (
                  callArgs.length === 1 &&
                  callArgs[0].expression.type === 'ObjectExpression'
                ) {
                  const argObj = objectExpressionToObject(
                    callArgs[0].expression as ObjectExpression,
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
                  func.params.forEach((p) => {
                    if (argObj[p] !== undefined) tempStaticTable[p] = argObj[p];
                  });
                } else {
                  callArgs.forEach((_callArg, i) => {
                    const p = func.params[i];
                    if (!p) return;
                    const cssVar = `--${propKey}-${p}`;
                    tempStaticTable[p] = `var(${cssVar})`;
                    cssVarInfo[p] = { cssVar, propKey: '' };
                  });
                }
                const substituted = objectExpressionToObject(
                  func.body,
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
                if (substituted) {
                  const records = processStyleRecords(substituted);
                  const hashes = records.map((r) => r.hash).join(' ');
                  if (hashes) dynamicClassParts.push(JSON.stringify(hashes));
                  if (Object.keys(cssVarInfo).length > 0) {
                    Object.entries(cssVarInfo).forEach(([paramName, info]) => {
                      const targetProp = Object.keys(substituted).find(
                        (k) =>
                          typeof substituted[k] === 'string' &&
                          (substituted[k] as string).includes(info.cssVar),
                      );
                      if (targetProp) {
                        const paramIndex = func.params.indexOf(paramName);
                        const srcArg =
                          paramIndex >= 0 && callArgs[paramIndex]
                            ? callArgs[paramIndex].expression
                            : callArgs[0].expression;
                        const argStart =
                          (srcArg as HasSpan).span.start - baseByteOffset;
                        const argEnd =
                          (srcArg as HasSpan).span.end - baseByteOffset;
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
                          (argSource.startsWith('"') &&
                            argSource.endsWith('"')) ||
                          (argSource.startsWith("'") && argSource.endsWith("'"))
                        ) {
                          valueExpr = JSON.stringify(
                            applyCssValue(argSource.slice(1, -1), targetProp),
                          );
                        } else {
                          valueExpr = exceptionCamelCase.includes(targetProp)
                            ? argSource
                            : `(typeof ${argSource} === 'number' ? ${argSource} + 'px' : ${argSource})`;
                        }
                        dynamicStyleParts.push(
                          `"${info.cssVar}": ${valueExpr}`,
                        );
                      }
                    });
                  }
                  return false;
                }
              }
            }
            return true;
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
            if (alias === 'NAMESPACE' && propertyName === 'use')
              isUseCall = true;
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName === 'use') isUseCall = true;
          }
          if (!isUseCall) return;
          const args: Array<{ expression: Expression }> = node.arguments;
          for (const arg of args) {
            const innerExpr = arg.expression;
            if (
              !t.isCallExpression(innerExpr) ||
              !t.isMemberExpression(innerExpr.callee)
            )
              continue;
            const innerCallee = innerExpr.callee;
            if (
              !t.isIdentifier(innerCallee.object) ||
              !t.isIdentifier(innerCallee.property)
            )
              continue;
            const varName = innerCallee.object.value;
            const propKey = innerCallee.property.value;
            const styleInfo = localCreateStyles[varName];
            if (styleInfo?.functions?.[propKey]) {
              throw new Error(
                `Plumeria: css.use(${getSource(
                  innerExpr,
                )}) does not support dynamic function keys.\n`,
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

      Object.values(localCreateStyles).forEach((info) => {
        if (info.type === 'constant') return;
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
        const cssId = `/${path.relative(viteRoot, cssFilename).replace(/\\/g, '/')}`;

        if (isDev) {
          if (!devCssSheets.has(cssFilename)) {
            devCssSheets.set(cssFilename, new Set());
          }
          const acc = devCssSheets.get(cssFilename)!;
          extractedSheets.forEach((sheet) => acc.add(sheet));
          const accCSS = await optimizer(Array.from(acc).join(''));
          cssLookup.set(cssFilename, accCSS);
        } else {
          cssLookup.set(cssFilename, optInCSS);
        }
        cssFileLookup.set(cssId, cssFilename);

        const targetIndex = targets.findIndex((t) => t.id === id);
        if (targetIndex !== -1) {
          targets[targetIndex].dependencies = dependencies;
        } else {
          targets.push({ id, dependencies });
        }

        return {
          code: transformedSource + `\nimport ${JSON.stringify(cssId)};`,
          map: null,
        };
      }

      return {
        code: transformedSource,
        map: null,
      };
    },
  };
};
