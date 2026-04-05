import {
  parseSync,
  ObjectExpression,
  Expression,
  ImportSpecifier,
  CallExpression,
  MemberExpression,
  Identifier,
  ExprOrSpread,
  Statement,
  VariableDeclarator,
  FunctionDeclaration,
  HasSpan,
} from '@swc/core';
import { type CSSProperties, genBase36Hash } from 'zss-engine';
import * as fs from 'fs';
import * as rs from '@rust-gear/glob';

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
import { getLeadingCommentLength } from '@plumeria/utils';

interface CompilerOptions {
  include: string[];
  exclude: string[];
  cwd?: string;
}

// ===========================================
// Definition of recontext and extraction logic
// ============================================

interface TraversalContext {
  mergedStaticTable: StaticTable;
  mergedKeyframesTable: KeyframesHashTable;
  mergedViewTransitionTable: ViewTransitionHashTable;
  mergedCreateThemeHashTable: CreateThemeHashTable;
  mergedCreateStaticHashTable: CreateStaticHashTable;
  mergedCreateTable: CreateHashTable;
  mergedVariantsTable: VariantsHashTable;
  scannedTables: ReturnType<typeof scanAll>;
  localCreateStyles: Record<
    string,
    {
      type: 'create' | 'variant' | 'theme';
      obj: CSSObject;
      hashMap?: any;
      functions?: Record<string, { params: string[]; body: ObjectExpression }>;
    }
  >;
  sourceBuffer: Buffer;
  baseByteOffset: number;
}

function extractStylesFromExpression(
  expression: Expression,
  ctx: TraversalContext,
): CSSObject[] {
  const results: CSSObject[] = [];

  if (t.isObjectExpression(expression)) {
    const object = objectExpressionToObject(
      expression as ObjectExpression,
      ctx.mergedStaticTable,
      ctx.mergedKeyframesTable,
      ctx.mergedViewTransitionTable,
      ctx.mergedCreateThemeHashTable,
      ctx.scannedTables.createThemeObjectTable,
      ctx.mergedCreateTable,
      ctx.mergedCreateStaticHashTable,
      ctx.scannedTables.createStaticObjectTable,
      ctx.mergedVariantsTable,
    );
    if (object) results.push(object);
  } else if (t.isMemberExpression(expression)) {
    const memberExpr = expression as MemberExpression;
    if (
      t.isIdentifier(memberExpr.object) &&
      t.isIdentifier(memberExpr.property)
    ) {
      const variableName = (memberExpr.object as Identifier).value;
      const propertyName = (memberExpr.property as Identifier).value;
      const styleSet = ctx.localCreateStyles[variableName];
      if (styleSet && styleSet.obj[propertyName]) {
        results.push(styleSet.obj[propertyName] as CSSObject);
      } else {
        const hash = ctx.mergedCreateTable[variableName];
        if (hash) {
          const object = ctx.scannedTables.createObjectTable[hash];
          if (object && object[propertyName]) {
            results.push(object[propertyName] as CSSObject);
          }
        }
      }
    }
  } else if (t.isIdentifier(expression)) {
    const identifier = expression as Identifier;
    const object = ctx.localCreateStyles[identifier.value];
    if (object) results.push(object.obj);
    else {
      const hash = ctx.mergedCreateTable[identifier.value];
      if (hash) {
        const objectFromTable = ctx.scannedTables.createObjectTable[hash];
        if (objectFromTable) results.push(objectFromTable as CSSObject);
      }
    }
  } else if (t.isConditionalExpression(expression)) {
    const condExpr = expression;
    results.push(...extractStylesFromExpression(condExpr.consequent, ctx));
    results.push(...extractStylesFromExpression(condExpr.alternate, ctx));
  } else if (
    t.isBinaryExpression(expression) &&
    ['&&', '||', '??'].includes(expression.operator)
  ) {
    const binaryExpr = expression;
    results.push(...extractStylesFromExpression(binaryExpr.left, ctx));
    results.push(...extractStylesFromExpression(binaryExpr.right, ctx));
  } else if (expression.type === 'ParenthesisExpression') {
    const parenExpr = expression;
    results.push(...extractStylesFromExpression(parenExpr.expression, ctx));
  }

  return results;
}

// ===========================================
// Main compiler function
// ===========================================
export function compileCSS(options: CompilerOptions) {
  const { include, exclude, cwd = process.cwd() } = options;
  const allSheets = new Set<string>();

  const files = rs.globSync(include, {
    cwd,
    exclude: exclude,
  });

  const scannedTables = scanAll();

  const processFile = (filePath: string): string[] => {
    const source = fs.readFileSync(filePath, 'utf-8');
    const extractedSheets: string[] = [];

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

    const localConsts = collectLocalConsts(ast);
    const resourcePath = filePath;
    const importMap: StaticTable = {};
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

              if (scannedTables.staticTable[uniqueKey])
                importMap[localName] = scannedTables.staticTable[uniqueKey];
              if (scannedTables.keyframesHashTable[uniqueKey])
                importMap[localName] =
                  scannedTables.keyframesHashTable[uniqueKey];
              if (scannedTables.viewTransitionHashTable[uniqueKey])
                importMap[localName] =
                  scannedTables.viewTransitionHashTable[uniqueKey];
              if (scannedTables.createHashTable[uniqueKey])
                importMap[localName] = scannedTables.createHashTable[uniqueKey];
              if (scannedTables.variantsHashTable[uniqueKey])
                importMap[localName] =
                  scannedTables.variantsHashTable[uniqueKey];
              if (scannedTables.createThemeHashTable[uniqueKey])
                importMap[localName] =
                  scannedTables.createThemeHashTable[uniqueKey];
              if (scannedTables.createStaticHashTable[uniqueKey])
                importMap[localName] =
                  scannedTables.createStaticHashTable[uniqueKey];
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

    const mergedCreateThemeHashTable: CreateThemeHashTable = {};
    for (const key of Object.keys(scannedTables.createThemeHashTable)) {
      mergedCreateThemeHashTable[key] = scannedTables.createThemeHashTable[key];
    }
    for (const key of Object.keys(importMap)) {
      const val = importMap[key];
      if (typeof val === 'string') {
        mergedCreateThemeHashTable[key] = val;
      }
    }

    const mergedCreateStaticHashTable: CreateStaticHashTable = {};
    for (const key of Object.keys(scannedTables.createStaticHashTable)) {
      mergedCreateStaticHashTable[key] =
        scannedTables.createStaticHashTable[key];
    }
    for (const key of Object.keys(importMap)) {
      const val = importMap[key];
      if (typeof val === 'string') {
        mergedCreateStaticHashTable[key] = val;
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

    const ctx: TraversalContext = {
      mergedStaticTable,
      mergedKeyframesTable,
      mergedViewTransitionTable,
      mergedCreateThemeHashTable,
      mergedCreateStaticHashTable,
      mergedCreateTable,
      mergedVariantsTable,
      scannedTables,
      localCreateStyles: {},
      sourceBuffer,
      baseByteOffset,
    };

    const processStyle = (style: CSSObject) => {
      extractOndemandStyles(style, extractedSheets, scannedTables);
      const records = getStyleRecords(style as CSSProperties);
      records.forEach((r: StyleRecord) => extractedSheets.push(r.sheet));
    };

    // Common processing for use() and styleName={}
    const extractAndProcessConditionals = (
      args: Array<{ expression: Expression }>,
      isStyleName: boolean = false,
    ) => {
      const conditionals: Array<{
        test: Expression;
        testString?: string;
        testLHS?: string;
        truthy: CSSObject;
        falsy: CSSObject;
        varName: string | undefined;
        groupId?: number;
        groupName?: string;
        valueName?: string;
      }> = [];
      let groupIdCounter = 0;
      let baseStyle: CSSObject = {};

      const resolveStyleObject = (expr: Expression): CSSObject | null => {
        if (t.isObjectExpression(expr)) {
          return objectExpressionToObject(
            expr,
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
        } else if (
          t.isMemberExpression(expr) &&
          t.isIdentifier(expr.object) &&
          t.isIdentifier(expr.property)
        ) {
          const varName = expr.object.value;
          const propName = expr.property.value;
          const styleInfo = ctx.localCreateStyles[varName];
          if (styleInfo && styleInfo.type === 'create') {
            const style = styleInfo.obj[propName];
            if (typeof style === 'object' && style !== null) {
              return style as CSSObject;
            }
          }
          const hash = ctx.mergedCreateTable[varName];
          if (hash) {
            const obj = ctx.scannedTables.createObjectTable[hash];
            if (obj && obj[propName] && typeof obj[propName] === 'object') {
              return obj[propName] as CSSObject;
            }
          }
        } else if (t.isIdentifier(expr)) {
          const varName = expr.value;
          const styleInfo = ctx.localCreateStyles[varName];
          if (styleInfo && styleInfo.type === 'create') {
            return styleInfo.obj;
          }
          const hash = ctx.mergedCreateTable[varName];
          if (hash) {
            const obj = ctx.scannedTables.createObjectTable[hash];
            if (obj && typeof obj === 'object') {
              return obj;
            }
          }
        }
        return null;
      };

      const getSource = (node: Expression) =>
        ctx.sourceBuffer
          .subarray(
            (node as HasSpan).span.start - ctx.baseByteOffset,
            (node as HasSpan).span.end - ctx.baseByteOffset,
          )
          .toString('utf-8');

      const collectConditions = (
        node: Expression,
        currentTestStrings: string[] = [],
      ): boolean => {
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
        } else if (node.type === 'BinaryExpression' && node.operator === '&&') {
          collectConditions(node.right, [
            ...currentTestStrings,
            `(${getSource(node.left)})`,
          ]);
          return true;
        } else if (node.type === 'ParenthesisExpression') {
          return collectConditions(node.expression, currentTestStrings);
        }

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
        return false;
      };

      const checkFunctionKey = (node: Expression): void => {
        if (isStyleName) return;
        if (
          t.isCallExpression(node) &&
          t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object) &&
          t.isIdentifier(node.callee.property)
        ) {
          const varName = node.callee.object.value;
          const propKey = node.callee.property.value;
          const styleInfo = ctx.localCreateStyles[varName];
          const atomMap = styleInfo?.obj[propKey];
          if (
            typeof atomMap === 'object' &&
            atomMap !== null &&
            '__cssVars__' in atomMap
          ) {
            throw new Error(
              `[plumeria] css.use(${getSource(node)}) cannot handle dynamic style functions. Use styleName instead.\n`,
            );
          }
        }
        if (node.type === 'ConditionalExpression') {
          checkFunctionKey(node.consequent);
          checkFunctionKey(node.alternate);
        } else if (
          node.type === 'BinaryExpression' &&
          ['&&', '||', '??'].includes(node.operator)
        ) {
          checkFunctionKey(node.left);
          checkFunctionKey(node.right);
        } else if (node.type === 'ParenthesisExpression') {
          checkFunctionKey(node.expression);
        } else if (node.type === 'ArrayExpression') {
          for (const el of node.elements) {
            if (el && el.expression) checkFunctionKey(el.expression);
          }
        }
      };

      for (const arg of args) {
        checkFunctionKey(arg.expression);
        const expr = arg.expression;

        if (t.isCallExpression(expr)) {
          if (t.isIdentifier(expr.callee)) {
            const varName = expr.callee.value;
            const styleInfo = ctx.localCreateStyles[varName];

            if (styleInfo && styleInfo.type === 'variant') {
              const variantObj = styleInfo.obj as Record<
                string,
                Record<string, CSSObject>
              >;
              const callArgs = expr.arguments;
              if (callArgs.length === 1 && !callArgs[0].spread) {
                const argExpr = callArgs[0].expression;
                if (argExpr.type === 'ObjectExpression') {
                  for (const prop of argExpr.properties) {
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
                      Object.entries(groupVariants).forEach(
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
                const argSource = getSource(argExpr);
                if (t.isStringLiteral(argExpr)) {
                  if ((variantObj as any)[argExpr.value as string])
                    baseStyle = deepMerge(
                      baseStyle,
                      (variantObj as any)[argExpr.value as string] as CSSObject,
                    );
                  continue;
                }
                const currentGroupId = ++groupIdCounter;
                Object.entries(variantObj).forEach(([key, style]) => {
                  conditionals.push({
                    test: argExpr,
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
            }
          } else if (t.isMemberExpression(expr.callee)) {
            const callee = expr.callee;
            if (
              t.isIdentifier(callee.object) &&
              t.isIdentifier(callee.property)
            ) {
              const varName = callee.object.value;
              const propName = callee.property.value;
              const styleInfo = ctx.localCreateStyles[varName];
              if (styleInfo && styleInfo.functions?.[propName]) {
                const func = styleInfo.functions[propName];
                const callArgs = expr.arguments;
                if (callArgs.length === 1 && !callArgs[0].spread) {
                  const argExpr = callArgs[0].expression;
                  const tempStaticTable = { ...ctx.mergedStaticTable };

                  if (argExpr.type === 'ObjectExpression') {
                    const argObj = objectExpressionToObject(
                      argExpr,
                      ctx.mergedStaticTable,
                      ctx.mergedKeyframesTable,
                      ctx.mergedViewTransitionTable,
                      ctx.mergedCreateThemeHashTable,
                      ctx.scannedTables.createThemeObjectTable,
                      ctx.mergedCreateTable,
                      ctx.mergedCreateStaticHashTable,
                      ctx.scannedTables.createStaticObjectTable,
                      ctx.mergedVariantsTable,
                    );
                    func.params.forEach((p) => {
                      if (argObj[p] !== undefined)
                        tempStaticTable[p] = argObj[p];
                    });
                  } else {
                    func.params.forEach((p) => {
                      tempStaticTable[p] = `var(--${propName}-${p})`;
                    });
                  }

                  const resolved = objectExpressionToObject(
                    func.body,
                    tempStaticTable,
                    ctx.mergedKeyframesTable,
                    ctx.mergedViewTransitionTable,
                    ctx.mergedCreateThemeHashTable,
                    ctx.scannedTables.createThemeObjectTable,
                    ctx.mergedCreateTable,
                    ctx.mergedCreateStaticHashTable,
                    ctx.scannedTables.createStaticObjectTable,
                    ctx.mergedVariantsTable,
                  );
                  if (resolved) baseStyle = deepMerge(baseStyle, resolved);
                  continue;
                }
              }
            }
          }
        }

        if (collectConditions(arg.expression)) continue;
        const extractedStyles = extractStylesFromExpression(
          arg.expression,
          ctx,
        );
        extractedStyles.forEach(processStyle);
      }

      if (Object.keys(baseStyle).length > 0) processStyle(baseStyle);
      for (const cond of conditionals) {
        if (cond.truthy && Object.keys(cond.truthy).length > 0)
          processStyle(cond.truthy);
        if (cond.falsy && Object.keys(cond.falsy).length > 0)
          processStyle(cond.falsy);
      }
    };

    const processedNodes = new WeakSet<CallExpression>();
    const processCall = (node: CallExpression) => {
      if (processedNodes.has(node)) return;
      processedNodes.add(node);
      const callee = node.callee;
      let propName: string | undefined;

      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        t.isIdentifier(callee.property)
      ) {
        const objectName = callee.object.value;
        const propertyName = callee.property.value;
        if (plumeriaAliases[objectName] === 'NAMESPACE')
          propName = propertyName;
      } else if (t.isIdentifier(callee)) {
        const originalName = plumeriaAliases[callee.value];
        if (originalName) propName = originalName;
      }

      if (propName) {
        const args = node.arguments;

        if (propName === 'use') {
          extractAndProcessConditionals(args, false);
        } else if (
          propName === 'keyframes' &&
          args.length > 0 &&
          t.isObjectExpression(args[0].expression)
        ) {
          const obj = objectExpressionToObject(
            args[0].expression as ObjectExpression,
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
          const hash = genBase36Hash(obj, 1, 8);
          ctx.scannedTables.keyframesObjectTable[hash] = obj;
        } else if (
          propName === 'viewTransition' &&
          args.length > 0 &&
          t.isObjectExpression(args[0].expression)
        ) {
          const obj = objectExpressionToObject(
            args[0].expression as ObjectExpression,
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
          const hash = genBase36Hash(obj, 1, 8);
          ctx.scannedTables.viewTransitionObjectTable[hash] = obj;
        } else if (
          propName === 'createTheme' &&
          args.length > 0 &&
          t.isObjectExpression(args[0].expression)
        ) {
          const obj = objectExpressionToObject(
            args[0].expression as ObjectExpression,
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
          const hash = genBase36Hash(obj, 1, 8);
          ctx.scannedTables.createThemeObjectTable[hash] = obj;
        }
      }
    };

    const traverseInternal = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (t.isCallExpression(node)) processCall(node);
      for (const k in node)
        if (k !== 'span' && k !== 'loc') traverseInternal(node[k]);
    };

    // Pass 1: Register all style definitions (create/variants/createTheme/keyframes/viewTransition)
    traverse(ast, {
      VariableDeclarator({ node }: { node: VariableDeclarator }) {
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
            if (plumeriaAliases[callee.object.value] === 'NAMESPACE')
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
              ctx.localCreateStyles[name]?.obj ||
              (ctx.mergedCreateThemeHashTable[name]
                ? ctx.scannedTables.createAtomicMapTable[
                    ctx.mergedCreateThemeHashTable[name]
                  ]
                : undefined);

            if (pName === 'create') {
              const obj = objectExpressionToObject(
                arg,
                ctx.mergedStaticTable,
                ctx.mergedKeyframesTable,
                ctx.mergedViewTransitionTable,
                ctx.mergedCreateThemeHashTable,
                ctx.scannedTables.createThemeObjectTable,
                ctx.mergedCreateTable,
                ctx.mergedCreateStaticHashTable,
                ctx.scannedTables.createStaticObjectTable,
                ctx.mergedVariantsTable,
                resolveVariable,
              );

              if (obj) {
                const styleFunctions: Record<
                  string,
                  { params: string[]; body: ObjectExpression }
                > = {};

                arg.properties.forEach((prop) => {
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

                  const params: string[] = func.params.map((p) => {
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

                  let actualBody: Expression | Statement | undefined =
                    func.body;
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

                ctx.localCreateStyles[node.id.value] = {
                  type: 'create',
                  obj,
                  functions: styleFunctions,
                };
              }
            } else if (pName === 'variants') {
              const obj = objectExpressionToObject(
                arg,
                ctx.mergedStaticTable,
                ctx.mergedKeyframesTable,
                ctx.mergedViewTransitionTable,
                ctx.mergedCreateThemeHashTable,
                ctx.scannedTables.createThemeObjectTable,
                ctx.mergedCreateTable,
                ctx.mergedCreateStaticHashTable,
                ctx.scannedTables.createStaticObjectTable,
                ctx.mergedVariantsTable,
                resolveVariable,
              );
              if (obj) {
                const { hashMap } = processVariants(obj as any);
                ctx.localCreateStyles[node.id.value] = {
                  type: 'variant',
                  obj,
                  hashMap,
                };
              }
            } else if (pName === 'createTheme') {
              const obj = objectExpressionToObject(
                arg,
                ctx.mergedStaticTable,
                ctx.mergedKeyframesTable,
                ctx.mergedViewTransitionTable,
                ctx.mergedCreateThemeHashTable,
                ctx.scannedTables.createThemeObjectTable,
                ctx.mergedCreateTable,
                ctx.mergedCreateStaticHashTable,
                ctx.scannedTables.createStaticObjectTable,
                ctx.mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              const uKey = `${resourcePath}-${node.id.value}`;
              ctx.scannedTables.createThemeHashTable[uKey] = hash;
              ctx.scannedTables.createThemeObjectTable[hash] = obj;
              ctx.localCreateStyles[node.id.value] = {
                type: 'create',
                obj: ctx.scannedTables.createAtomicMapTable[hash],
              };
            }
          }
        }
      },
    });

    // Pass 2: Process usage sites (use()/styleName) - all definitions are now registered
    traverse(ast, {
      VariableDeclarator({ node }: { node: VariableDeclarator }) {
        if (t.isIdentifier(node.id) && node.init) {
          traverseInternal(node.init);
        }
      },
      FunctionDeclaration({ node }: { node: FunctionDeclaration }) {
        if (node.identifier) traverseInternal(node.body);
      },
      CallExpression: (path) => {
        if (!processedNodes.has(path.node)) processCall(path.node);
      },
      JSXAttribute({ node }) {
        if (node.name.value !== 'styleName') return;
        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;
        if (node.value.expression.type === 'JSXEmptyExpression') return;

        const expr = node.value.expression;
        const args =
          expr.type === 'ArrayExpression'
            ? expr.elements
                .filter((el: ExprOrSpread) => el !== undefined)
                .map((el: ExprOrSpread) => ({ expression: el.expression }))
            : [{ expression: expr }];

        extractAndProcessConditionals(args, true);
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
