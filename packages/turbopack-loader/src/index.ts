import { parseSync, ObjectExpression } from '@swc/core';
import fs from 'fs';
import path from 'path';
import { genBase36Hash } from 'zss-engine';
import type { CSSProperties } from 'zss-engine';

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
import type { StyleRecord, CSSObject } from '@plumeria/utils';

interface LoaderContext {
  resourcePath: string;
  async: () => (err: Error | null, content?: string) => void;
  addDependency: (path: string) => void;
  clearDependencies: () => void;
}

export default async function loader(this: LoaderContext, source: string) {
  const callback = this.async();

  if (
    this.resourcePath.includes('node_modules') ||
    !source.includes('@plumeria/core')
  ) {
    return callback(null, source);
  }

  this.clearDependencies();
  this.addDependency(this.resourcePath);

  tables.staticTable = scanForCreateStatic((path) => this.addDependency(path));

  const { keyframesHashTableLocal, keyframesObjectTableLocal } =
    scanForKeyframes((path) => this.addDependency(path));
  tables.keyframesHashTable = keyframesHashTableLocal;
  tables.keyframesObjectTable = keyframesObjectTableLocal;

  const { viewTransitionHashTableLocal, viewTransitionObjectTableLocal } =
    scanForViewTransition((path) => this.addDependency(path));
  tables.viewTransitionHashTable = viewTransitionHashTableLocal;
  tables.viewTransitionObjectTable = viewTransitionObjectTableLocal;

  const { themeTableLocal, createThemeObjectTableLocal } = scanForCreateTheme(
    (path) => this.addDependency(path),
  );

  tables.themeTable = themeTableLocal;
  tables.createThemeObjectTable = createThemeObjectTableLocal;

  const ast = parseSync(source, {
    syntax: 'typescript',
    tsx: true,
    target: 'es2022',
  });

  const localConsts = collectLocalConsts(ast);
  Object.assign(tables.staticTable, localConsts);

  const localCreateStyles: Record<string, CSSObject> = {};
  const replacements: Array<{ start: number; end: number; content: string }> =
    [];
  const extractedSheets: string[] = [];

  traverse(ast, {
    VariableDeclarator({ node }) {
      if (
        node.id.type === 'Identifier' &&
        node.init &&
        t.isCallExpression(node.init) &&
        t.isMemberExpression(node.init.callee) &&
        t.isIdentifier(node.init.callee.object, { name: 'css' }) &&
        t.isIdentifier(node.init.callee.property, { name: 'create' }) &&
        node.init.arguments.length === 1 &&
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
          localCreateStyles[node.id.value] = obj;
          const hashMap: Record<string, string> = {};
          Object.entries(obj).forEach(([key, style]) => {
            const records = getStyleRecords(key, style as CSSProperties, 2);
            const propMap: Record<string, string> = {};
            extractOndemandStyles(style, extractedSheets);
            records.forEach((r: StyleRecord) => {
              propMap[r.key] = r.hash;
              extractedSheets.push(r.sheet);
            });
            hashMap[key] = records.map((r) => r.hash).join(' ');
          });
          replacements.push({
            start: node.init.span.start - ast.span.start,
            end: node.init.span.end - ast.span.start,
            content: JSON.stringify(hashMap),
          });
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

        if (propName === 'props') {
          const merged: Record<string, any> = {};
          let allStatic = true;
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
              const styleSet = localCreateStyles[expr.object.value];
              styleSet && styleSet[expr.property.value]
                ? Object.assign(merged, styleSet[expr.property.value])
                : (allStatic = false);
            } else if (t.isIdentifier(expr)) {
              const obj = localCreateStyles[expr.value];
              obj ? Object.assign(merged, obj) : (allStatic = false);
            } else {
              allStatic = false;
            }
          });

          if (allStatic && Object.keys(merged).length > 0) {
            extractOndemandStyles(merged, extractedSheets);
            const hash = genBase36Hash(merged, 1, 8);
            const records = getStyleRecords(hash, merged, 2);
            records.forEach((r: StyleRecord) => extractedSheets.push(r.sheet));
            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(
                records.map((r: StyleRecord) => r.hash).join(' '),
              ),
            });
          }
        } else if (
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
          replacements.push({
            start: node.span.start - ast.span.start,
            end: node.span.end - ast.span.start,
            content: JSON.stringify(''),
          });
        } else if (
          callee.property.value === 'createStatic' &&
          args.length > 0 &&
          t.isStringLiteral(args[0].expression)
        ) {
          replacements.push({
            start: node.span.start - ast.span.start,
            end: node.span.end - ast.span.start,
            content: JSON.stringify(''),
          });
        }
      }
    },
  });

  // Apply replacements
  const buffer = Buffer.from(source);
  let offset = 0;
  const parts: Buffer[] = [];

  replacements
    .sort((a, b) => a.start - b.start)
    .forEach((r) => {
      parts.push(buffer.subarray(offset, r.start));
      parts.push(Buffer.from(r.content));
      offset = r.end;
    });
  parts.push(buffer.subarray(offset));
  const transformedSource = Buffer.concat(parts).toString();

  const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');
  const VIRTUAL_CSS_PATH = require.resolve(VIRTUAL_FILE_PATH);

  function stringifyRequest(loaderContext: any, request: string) {
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

  if (extractedSheets.length > 0 && process.env.NODE_ENV === 'development') {
    fs.appendFileSync(VIRTUAL_FILE_PATH, extractedSheets.join(''), 'utf-8');
  } else if (
    extractedSheets.length > 0 &&
    process.env.NODE_ENV === 'production'
  ) {
    fs.writeFileSync(VIRTUAL_FILE_PATH, '');
  }

  if (process.env.NODE_ENV === 'production')
    return callback(null, transformedSource);

  callback(null, transformedSource + postfix);
}
