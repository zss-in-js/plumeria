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
        results.push(...extractStylesFromExpression(conditionalExpr.alternate));
      } else if (
        t.isBinaryExpression(expression) &&
        ['&&', '||', '??'].includes((expression as BinaryExpression).operator)
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
      /**
       * When style.use is actually used, the contents of the style (obj) are
       * extracted as atomic CSS and the call is replaced with class names.
       */
      extractOndemandStyles(style, extractedSheets, scannedTables);
      const records = getStyleRecords(style as CSSProperties);
      records.forEach((r: StyleRecord) => extractedSheets.push(r.sheet));
    };

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
        if (alias === 'NAMESPACE') propName = propertyName;
      } else if (t.isIdentifier(callee)) {
        const originalName = plumeriaAliases[callee.value];
        if (originalName) propName = originalName;
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
                Object.entries(obj).forEach(([_, style]) => {
                  if (typeof style !== 'object' || style === null) return;
                  getStyleRecords(style as CSSProperties).forEach(
                    (r: StyleRecord) => extractedSheets.push(r.sheet),
                  );
                });
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

                  const tempStaticTable = { ...mergedStaticTable };
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

                  getStyleRecords(substituted as CSSProperties).forEach(
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

        const resolveStyleObject = (
          expression: Expression,
        ): Record<string, any> | null => {
          const styles = extractStylesFromExpression(expression);
          return styles.length === 1
            ? (styles[0] as Record<string, any>)
            : null;
        };

        const conditionals: Array<{
          test: Expression;
          testString?: string;
          truthy: Record<string, any>;
          falsy: Record<string, any>;
        }> = [];
        let baseStyle: Record<string, any> = {};

        for (const arg of args) {
          const argExpr = arg.expression;

          const getSource = (n: any) =>
            sourceBuffer
              .subarray(
                n.span.start - baseByteOffset,
                n.span.end - baseByteOffset,
              )
              .toString('utf-8');

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

          if (collectConditions(argExpr)) continue;

          const extractedStyles = extractStylesFromExpression(argExpr);
          if (extractedStyles.length > 0) {
            extractedStyles.forEach(processStyle);
          }
        }

        if (Object.keys(baseStyle).length > 0) {
          processStyle(baseStyle);
        }

        for (const cond of conditionals) {
          if (cond.truthy && Object.keys(cond.truthy).length > 0) {
            processStyle(cond.truthy);
          }
          if (cond.falsy && Object.keys(cond.falsy).length > 0) {
            processStyle(cond.falsy);
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
