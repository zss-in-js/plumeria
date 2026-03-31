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
    { type: 'create' | 'variant' | 'theme'; obj: CSSObject }
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
      if (styleSet && (styleSet.obj as Record<string, any>)[propertyName]) {
        results.push(
          (styleSet.obj as Record<string, any>)[propertyName] as CSSObject,
        );
      } else {
        const hash = ctx.mergedCreateTable[variableName];
        if (hash) {
          const object = ctx.scannedTables.createObjectTable[hash];
          if (object && (object as Record<string, any>)[propertyName]) {
            results.push(
              (object as Record<string, any>)[propertyName] as CSSObject,
            );
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
    const condExpr = expression as ConditionalExpression;
    results.push(...extractStylesFromExpression(condExpr.consequent, ctx));
    results.push(...extractStylesFromExpression(condExpr.alternate, ctx));
  } else if (
    t.isBinaryExpression(expression) &&
    ['&&', '||', '??'].includes((expression as BinaryExpression).operator)
  ) {
    const binaryExpr = expression as BinaryExpression;
    results.push(...extractStylesFromExpression(binaryExpr.left, ctx));
    results.push(...extractStylesFromExpression(binaryExpr.right, ctx));
  } else if (expression.type === 'ParenthesisExpression') {
    const parenExpr = expression as unknown as ParenthesisExpression;
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
    const importMap: Record<string, any> = {};
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
          node.specifiers.forEach((specifier: any) => {
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
        truthy: Record<string, any>;
        falsy: Record<string, any>;
      }> = [];
      let baseStyle: Record<string, any> = {};

      const resolveStyleObject = (
        expression: Expression,
      ): Record<string, any> | null => {
        const styles = extractStylesFromExpression(expression, ctx);
        return styles.length === 1 ? (styles[0] as Record<string, any>) : null;
      };

      const getSource = (node: any) =>
        ctx.sourceBuffer
          .subarray(
            node.span.start - ctx.baseByteOffset,
            node.span.end - ctx.baseByteOffset,
          )
          .toString('utf-8');

      const collectConditions = (
        node: Expression,
        testStrings: string[] = [],
      ): boolean => {
        const staticStyle = resolveStyleObject(node);
        if (staticStyle) {
          if (testStrings.length === 0) {
            baseStyle = deepMerge(baseStyle, staticStyle);
          } else {
            conditionals.push({
              test: node,
              testString: testStrings.join(' && '),
              truthy: staticStyle,
              falsy: {},
            });
          }
          return true;
        }
        if (node.type === 'ConditionalExpression') {
          const testSource = getSource((node as ConditionalExpression).test);
          collectConditions((node as ConditionalExpression).consequent, [
            ...testStrings,
            `(${testSource})`,
          ]);
          collectConditions((node as ConditionalExpression).alternate, [
            ...testStrings,
            `!(${testSource})`,
          ]);
          return true;
        } else if (
          node.type === 'BinaryExpression' &&
          (node as BinaryExpression).operator === '&&'
        ) {
          collectConditions((node as BinaryExpression).right, [
            ...testStrings,
            `(${getSource((node as BinaryExpression).left)})`,
          ]);
          return true;
        } else if (node.type === 'ParenthesisExpression') {
          return collectConditions((node as any).expression, testStrings);
        }
        return false;
      };

      const checkFunctionKey = (node: Expression): void => {
        if (isStyleName) return;
        if (
          t.isCallExpression(node) &&
          t.isMemberExpression((node as any).callee) &&
          t.isIdentifier((node as any).callee.object) &&
          t.isIdentifier((node as any).callee.property)
        ) {
          const varName = (node as any).callee.object.value;
          const propKey = (node as any).callee.property.value;
          const styleInfo = ctx.localCreateStyles[varName];
          const atomMap = (styleInfo?.obj as any)?.[propKey];
          if (atomMap?.['__cssVars__']) {
            throw new Error(
              `[plumeria] css.use(${getSource(node)}) cannot handle dynamic style functions. Use styleName instead.\n`,
            );
          }
        }
        if (node.type === 'ConditionalExpression') {
          checkFunctionKey((node as ConditionalExpression).consequent);
          checkFunctionKey((node as ConditionalExpression).alternate);
        } else if (
          node.type === 'BinaryExpression' &&
          ['&&', '||', '??'].includes((node as BinaryExpression).operator)
        ) {
          checkFunctionKey((node as BinaryExpression).left);
          checkFunctionKey((node as BinaryExpression).right);
        } else if (node.type === 'ParenthesisExpression') {
          checkFunctionKey((node as any).expression);
        } else if (node.type === 'ArrayExpression') {
          for (const el of (node as any).elements) {
            if (el && el.expression) checkFunctionKey(el.expression);
          }
        }
      };

      for (const arg of args) {
        checkFunctionKey(arg.expression);
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

    const processCall = (node: any) => {
      node._processed = true;
      const callee = node.callee;
      let propName: string | undefined;

      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        t.isIdentifier(callee.property)
      ) {
        const objectName = (callee.object as Identifier).value;
        const propertyName = (callee.property as Identifier).value;
        if (plumeriaAliases[objectName] === 'NAMESPACE')
          propName = propertyName;
      } else if (t.isIdentifier(callee)) {
        const originalName = plumeriaAliases[(callee as Identifier).value];
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

    traverse(ast, {
      VariableDeclarator({ node }: { node: any }) {
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
              plumeriaAliases[(callee.object as Identifier).value] ===
              'NAMESPACE'
            )
              pName = (callee.property as Identifier).value;
          } else if (
            t.isIdentifier(callee) &&
            plumeriaAliases[(callee as Identifier).value]
          ) {
            pName = plumeriaAliases[(callee as Identifier).value];
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
                ctx.localCreateStyles[node.id.value] = { type: 'create', obj };
                Object.entries(obj).forEach(([_, style]) => {
                  if (typeof style !== 'object' || style === null) return;
                  getStyleRecords(style as CSSProperties).forEach(
                    (r: StyleRecord) => extractedSheets.push(r.sheet),
                  );
                });

                // Analysis and extraction of functional variants
                arg.properties.forEach((prop: any) => {
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

                  const tempStaticTable = { ...ctx.mergedStaticTable };
                  params.forEach((paramName) => {
                    tempStaticTable[paramName] = `var(--${key}-${paramName})`;
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
                    ctx.mergedKeyframesTable,
                    ctx.mergedViewTransitionTable,
                    ctx.mergedCreateThemeHashTable,
                    ctx.scannedTables.createThemeObjectTable,
                    ctx.mergedCreateTable,
                    ctx.mergedCreateStaticHashTable,
                    ctx.scannedTables.createStaticObjectTable,
                    ctx.mergedVariantsTable,
                  );

                  if (!substituted) return;
                  getStyleRecords(substituted as CSSProperties).forEach(
                    (r: StyleRecord) => extractedSheets.push(r.sheet),
                  );
                });
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
              if (obj)
                ctx.localCreateStyles[node.id.value] = { type: 'variant', obj };
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
      JSXAttribute({ node }) {
        if (node.name?.value !== 'styleName') return;
        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;

        const expr = node.value.expression;
        const args =
          expr.type === 'ArrayExpression'
            ? expr.elements
                .filter(Boolean)
                .map((el: any) => ({ expression: el.expression ?? el }))
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
