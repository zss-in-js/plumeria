import type { LoaderContext } from 'webpack';
import { parseSync, ObjectExpression } from '@swc/core';
import fs from 'fs';
import path from 'path';

import { type CSSProperties, genBase36Hash } from 'zss-engine';

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
import type { StyleRecord, CSSObject, FileStyles } from '@plumeria/utils';

const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');

export default function loader(this: LoaderContext<unknown>, source: string) {
  const callback = this.async();

  if (this.resourcePath.includes('node_modules')) {
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

  const fileStyles: FileStyles = {};
  const extractedSheets: string[] = [];
  let hasCssCreate = false;

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
          hasCssCreate = true;

          const hashMap: Record<string, string> = {};
          Object.entries(obj).forEach(([key, style]) => {
            const records = getStyleRecords(key, style as CSSProperties, 2);
            const propMap: Record<string, string> = {};
            extractOndemandStyles(style, extractedSheets);
            records.forEach((r: StyleRecord) => {
              propMap[r.key] = r.hash;
              fileStyles.baseStyles =
                (fileStyles.baseStyles || '') + r.sheet + '\n';
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
        const args = node.arguments;
        if (callee.property.value === 'props') {
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
              if (obj) {
                Object.assign(merged, obj);
              } else {
                allStatic = false;
              }
            } else if (t.isMemberExpression(expr)) {
              if (
                t.isIdentifier(expr.object) &&
                t.isIdentifier(expr.property)
              ) {
                const varName = expr.object.value;
                const propName = expr.property.value;
                const styleSet = localCreateStyles[varName];
                if (styleSet && styleSet[propName]) {
                  Object.assign(merged, styleSet[propName]);
                } else {
                  allStatic = false;
                }
              } else {
                allStatic = false;
              }
            } else if (t.isIdentifier(expr)) {
              const obj = localCreateStyles[expr.value];
              if (obj) {
                Object.assign(merged, obj);
              } else {
                allStatic = false;
              }
            } else {
              allStatic = false;
            }
          });
          if (allStatic && Object.keys(merged).length > 0) {
            extractOndemandStyles(merged, extractedSheets);
            const hash = genBase36Hash(merged, 1, 8);
            const records = getStyleRecords(hash, merged);
            records.forEach((r: StyleRecord) => {
              fileStyles.baseStyles =
                (fileStyles.baseStyles || '') + r.sheet + '\n';
            });

            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(
                records.map((r: StyleRecord) => r.hash).join(' '),
              ),
            });
          }
        } else if (
          callee.property.value === 'keyframes' &&
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
          callee.property.value === 'viewTransition' &&
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
          callee.property.value === 'createTheme' &&
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
            content: JSON.stringify(`theme-${hash}`),
          });
        }
      }
    },
  });

  if (extractedSheets.length > 0) {
    fileStyles.baseStyles =
      (fileStyles.baseStyles || '') + extractedSheets.join('\n') + '\n';
  }

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

  // --- Restoring path resolution and HMR logic ---

  const VIRTUAL_CSS_PATH = require.resolve(VIRTUAL_FILE_PATH);

  function stringifyRequest(
    loaderContext: LoaderContext<unknown>,
    request: string,
  ) {
    const context = loaderContext.context || loaderContext.rootContext;
    const relativePath = path.relative(context, request);
    const requestPath = relativePath.startsWith('.')
      ? relativePath
      : './' + relativePath;
    return JSON.stringify(requestPath);
  }

  const virtualCssRequest = stringifyRequest(this, `${VIRTUAL_CSS_PATH}`);
  const postfix = `\nimport ${virtualCssRequest};`;

  let css = '';
  try {
    css = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');
  } catch (e) {
    //
  }

  function generateOrderedCSS(styles: FileStyles): string {
    const sections: string[] = [];

    if (styles.keyframeStyles?.trim()) {
      if (!css.includes(styles.keyframeStyles))
        sections.push(styles.keyframeStyles);
    }

    if (styles.viewTransitionStyles?.trim()) {
      if (!css.includes(styles.viewTransitionStyles))
        sections.push(styles.viewTransitionStyles);
    }

    if (styles.themeStyles?.trim()) {
      if (!css.includes(styles.themeStyles)) sections.push(styles.themeStyles);
    }
    // Client Consideration
    if (styles.baseStyles?.trim()) {
      sections.push(styles.baseStyles);
    }

    return sections.join('\n');
  }

  const orderedCSS = generateOrderedCSS(fileStyles);
  const relativeId = path.relative(process.cwd(), this.resourcePath);
  const hmrCode = `
    if (module.hot) {
      module.hot.accept(${virtualCssRequest});

      const styleId = "plumeria-hmr";
      const fileKey = ${JSON.stringify(relativeId)};
      
      let styleEl = document.getElementById(styleId);
      
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.setAttribute("data-plumeria-hmr", "");
        document.head.prepend(styleEl);
        styleEl.__plumeriaStyles = {};
      }

      styleEl.__plumeriaStyles[fileKey] = ${JSON.stringify(orderedCSS)};
      styleEl.textContent = Object.values(styleEl.__plumeriaStyles).join('\\n');

      module.hot.dispose(() => {
        if (styleEl && styleEl.__plumeriaStyles) {
          delete styleEl.__plumeriaStyles[fileKey];
          styleEl.textContent = Object.values(styleEl.__plumeriaStyles).join('\\n');
          
          if (Object.keys(styleEl.__plumeriaStyles).length === 0 && styleEl.parentNode) {
            styleEl.parentNode.removeChild(styleEl);
          }
        }
      });
    }
  `;

  if (hasCssCreate) {
    callback(null, transformedSource + hmrCode);
    return;
  }

  const useClientDirective = /^\s*['"]use client['"]/;

  if (extractedSheets.length > 0 && process.env.NODE_ENV === 'development') {
    fs.appendFileSync(VIRTUAL_FILE_PATH, extractedSheets.join('\n'), 'utf-8');
  } else if (
    extractedSheets.length > 0 &&
    process.env.NODE_ENV === 'production'
  ) {
    fs.writeFileSync(VIRTUAL_FILE_PATH, '');
  }

  if (!useClientDirective.test(source)) {
    callback(null, transformedSource + postfix);
    return;
  }

  callback(null, transformedSource);
}
