/* eslint-disable @plumeria/validate-values */
import type { LoaderContext } from 'webpack';
import { parseSync } from '@swc/core';
import type {
  Declaration,
  Expression,
  ImportSpecifier,
  ObjectExpression,
} from '@swc/core';
import fs from 'fs';
import path from 'path';

import { type CSSProperties, genBase36Hash } from 'zss-engine';

import {
  tables,
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
import type { StyleRecord, FileStyles } from '@plumeria/utils';

const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');
if (process.env.NODE_ENV === 'production') {
  fs.writeFileSync(VIRTUAL_FILE_PATH, '/** Placeholder file */', 'utf-8');
}

export default function loader(this: LoaderContext<unknown>, source: string) {
  const callback = this.async();

  if (
    this.resourcePath.includes('node_modules') ||
    !source.includes('@plumeria/core')
  ) {
    return callback(null, source);
  }

  this.clearDependencies();
  this.addDependency(this.resourcePath);

  scanAll((path) => this.addDependency(path));

  const extractedSheets: string[] = [];
  const fileStyles: FileStyles = {};

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

      if (actualPath && fs.existsSync(actualPath)) {
        node.specifiers.forEach((specifier: ImportSpecifier) => {
          if (specifier.type === 'ImportSpecifier') {
            const importedName = specifier.imported
              ? specifier.imported.value
              : specifier.local.value;
            const localName = specifier.local.value;
            const uniqueKey = `${actualPath}-${importedName}`;
            if (tables.staticTable[uniqueKey]) {
              importMap[localName] = tables.staticTable[uniqueKey];
            }
            if (tables.keyframesHashTable[uniqueKey]) {
              importMap[localName] = tables.keyframesHashTable[uniqueKey];
            }
            if (tables.viewTransitionHashTable[uniqueKey]) {
              importMap[localName] = tables.viewTransitionHashTable[uniqueKey];
            }
            if (tables.themeTable[uniqueKey]) {
              importMap[localName] = tables.themeTable[uniqueKey];
            }
          }
        });
      }
    },
  });

  const mergedStaticTable = { ...tables.staticTable };
  for (const key of Object.keys(localConsts)) {
    mergedStaticTable[key] = localConsts[key];
  }
  for (const key of Object.keys(importMap)) {
    mergedStaticTable[key] = importMap[key];
  }

  const mergedKeyframesTable = { ...tables.keyframesHashTable };
  for (const key of Object.keys(importMap)) {
    mergedKeyframesTable[key] = importMap[key];
  }

  const mergedViewTransitionTable = { ...tables.viewTransitionHashTable };
  for (const key of Object.keys(importMap)) {
    mergedViewTransitionTable[key] = importMap[key];
  }

  const mergedThemeTable = { ...tables.themeTable };
  for (const key of Object.keys(importMap)) {
    mergedThemeTable[key] = importMap[key];
  }

  const isTSFile =
    this.resourcePath.endsWith('.ts') && !this.resourcePath.endsWith('.tsx');

  const localCreateStyles: Record<
    string,
    {
      name: string;
      type: 'create' | 'constant';
      obj: Record<string, any>;
      hashMap: Record<string, Record<string, string>>;
      hasDynamicAccess: boolean;
      isExported: boolean;
      initSpan: { start: number; end: number };
      declSpan: { start: number; end: number };
    }
  > = {};

  const replacements: Array<{ start: number; end: number; content: string }> =
    [];

  const processedDecls = new Set<any>();
  const excludedSpans = new Set<number>();
  const idSpans = new Set<number>();
  const registerStyle = (
    node: any,
    declSpan: Declaration['span'],
    isExported: boolean,
  ) => {
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
        );
        if (obj) {
          const hashMap: Record<string, Record<string, string>> = {};
          Object.entries(obj).forEach(([key, style]) => {
            const records = getStyleRecords(key, style as CSSProperties, 2);
            extractOndemandStyles(style, extractedSheets);
            records.forEach((r: StyleRecord) => {
              extractedSheets.push(r.sheet);
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
            hasDynamicAccess: false,
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
          hasDynamicAccess: false,
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
    ExportDeclaration({ node }) {
      if (t.isVariableDeclaration(node.declaration)) {
        processedDecls.add(node.declaration);
        node.declaration.declarations.forEach((decl: Declaration) => {
          registerStyle(decl, node.span, true);
        });
      }
    },
    VariableDeclaration({ node }) {
      if (processedDecls.has(node)) return;
      node.declarations.forEach((decl: Declaration) => {
        registerStyle(decl, node.span, false);
      });
    },
    MemberExpression({ node }) {
      if (t.isIdentifier(node.object)) {
        const styleInfo = localCreateStyles[node.object.value];
        if (styleInfo) {
          if (t.isIdentifier(node.property)) {
            const hash = styleInfo.hashMap[node.property.value];
            if (!hash && styleInfo.type !== 'constant') {
              styleInfo.hasDynamicAccess = true;
            }
          } else {
            styleInfo.hasDynamicAccess = true;
          }
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
            mergedStaticTable,
            mergedKeyframesTable,
            mergedViewTransitionTable,
            mergedThemeTable,
          );
          const hash = genBase36Hash(obj, 1, 8);
          tables.viewTransitionObjectTable[hash] = obj;
          extractOndemandStyles(obj, extractedSheets);
          extractOndemandStyles({ vt: `vt-${hash}` }, extractedSheets);
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
          );
          const hash = genBase36Hash(obj, 1, 8);
          tables.createThemeObjectTable[hash] = obj;
        }
      }
    },
  });

  // Pass 2: Confirm reference replacement
  traverse(ast, {
    MemberExpression({ node }) {
      if (excludedSpans.has(node.span.start)) return;
      if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
        const styleInfo = localCreateStyles[node.object.value];
        if (styleInfo && !styleInfo.hasDynamicAccess) {
          const atomMap = styleInfo.hashMap[node.property.value];
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
      if (styleInfo && !styleInfo.hasDynamicAccess) {
        replacements.push({
          start: node.span.start - ast.span.start,
          end: node.span.end - ast.span.start,
          content: JSON.stringify(styleInfo.hashMap),
        });
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

        const checkStatic = (expr: Expression): boolean => {
          if (
            t.isObjectExpression(expr) ||
            t.isStringLiteral(expr) ||
            t.isNumericLiteral(expr) ||
            t.isBooleanLiteral(expr) ||
            t.isNullLiteral(expr)
          )
            return true;
          if (
            t.isMemberExpression(expr) &&
            t.isIdentifier(expr.object) &&
            t.isIdentifier(expr.property)
          ) {
            const styleInfo = localCreateStyles[expr.object.value];
            return !!(
              styleInfo &&
              !styleInfo.hasDynamicAccess &&
              styleInfo.hashMap[expr.property.value]
            );
          }
          if (t.isIdentifier(expr)) {
            const styleInfo = localCreateStyles[expr.value];
            return !!(styleInfo && !styleInfo.hasDynamicAccess);
          }
          return false;
        };

        // Check if there's any dynamic access (bracket notation like styles[variant])
        const hasDynamicAccess = (expr: Expression): boolean => {
          if (t.isMemberExpression(expr) && t.isIdentifier(expr.object)) {
            const info = localCreateStyles[expr.object.value];
            if (info && info.hasDynamicAccess) return true;
          }
          if (t.isIdentifier(expr)) {
            const info = localCreateStyles[expr.value];
            if (info && info.hasDynamicAccess) return true;
          }
          if (t.isConditionalExpression(expr)) {
            return (
              hasDynamicAccess(expr.consequent) ||
              hasDynamicAccess(expr.alternate)
            );
          }
          if (
            t.isBinaryExpression(expr) &&
            (expr.operator === '&&' ||
              expr.operator === '||' ||
              expr.operator === '??')
          ) {
            return hasDynamicAccess(expr.left) || hasDynamicAccess(expr.right);
          }
          return false;
        };

        const allStatic = args.every((arg: any) => checkStatic(arg.expression));
        const anyDynamic = args.some((arg: any) =>
          hasDynamicAccess(arg.expression),
        );

        if (allStatic && args.length > 0) {
          const merged = args.reduce((acc: Record<string, any>, arg: any) => {
            const expr = arg.expression;

            if (t.isObjectExpression(expr)) {
              const obj = objectExpressionToObject(
                expr,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedThemeTable,
              );
              return obj ? deepMerge(acc, obj) : acc;
            } else if (
              t.isMemberExpression(expr) &&
              t.isIdentifier(expr.object) &&
              t.isIdentifier(expr.property)
            ) {
              const styleInfo = localCreateStyles[expr.object.value];
              return styleInfo
                ? deepMerge(acc, styleInfo.obj[expr.property.value])
                : acc;
            } else if (t.isIdentifier(expr)) {
              const styleInfo = localCreateStyles[expr.value];
              return styleInfo ? deepMerge(acc, styleInfo.obj) : acc;
            }

            return acc;
          }, {});

          if (Object.keys(merged).length > 0) {
            extractOndemandStyles(merged, extractedSheets);
            const hash = genBase36Hash(merged, 1, 8);
            const records = getStyleRecords(hash, merged, 2);
            records.forEach((r: StyleRecord) => extractedSheets.push(r.sheet));
            const resultHash = records
              .map((r: StyleRecord) => r.hash)
              .join(' ');
            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(resultHash),
            });
          }
        } else if (anyDynamic) {
          // Pattern B: Contains dynamic access - don't inline static references
          // Keep styles.button as-is to avoid duplication with styles object
          const processExpr = (expr: Expression) => {
            if (t.isIdentifier(expr)) {
              const info = localCreateStyles[expr.value];
              if (info && info.hasDynamicAccess) {
                excludedSpans.add(expr.span.start);
              }
            } else if (t.isConditionalExpression(expr)) {
              processExpr(expr.consequent);
              processExpr(expr.alternate);
            } else if (
              t.isBinaryExpression(expr) &&
              (expr.operator === '&&' ||
                expr.operator === '||' ||
                expr.operator === '??')
            ) {
              processExpr(expr.left);
              processExpr(expr.right);
            }
          };
          args.forEach((arg: any) => processExpr(arg.expression));
        } else {
          // Pattern C: Conditional/runtime only - replace static style references with hashmaps
          const processExpr = (expr: Expression) => {
            if (
              t.isMemberExpression(expr) &&
              t.isIdentifier(expr.object) &&
              t.isIdentifier(expr.property)
            ) {
              const info = localCreateStyles[expr.object.value];
              if (info) {
                const atomMap = info.hashMap[expr.property.value];
                if (atomMap) {
                  excludedSpans.add(expr.span.start);
                  replacements.push({
                    start: expr.span.start - ast.span.start,
                    end: expr.span.end - ast.span.start,
                    content: JSON.stringify(atomMap),
                  });
                }
              }
            } else if (t.isIdentifier(expr)) {
              const info = localCreateStyles[expr.value];
              if (info) {
                excludedSpans.add(expr.span.start);
                replacements.push({
                  start: expr.span.start - ast.span.start,
                  end: expr.span.end - ast.span.start,
                  content: JSON.stringify(info.hashMap),
                });
              }
            } else if (t.isConditionalExpression(expr)) {
              processExpr(expr.consequent);
              processExpr(expr.alternate);
            } else if (
              t.isBinaryExpression(expr) &&
              (expr.operator === '&&' ||
                expr.operator === '||' ||
                expr.operator === '??')
            ) {
              processExpr(expr.left);
              processExpr(expr.right);
            }
          };
          args.forEach((arg: any) => processExpr(arg.expression));
        }
      }
    },
  });

  // Confirm the replacement of the styles declaration
  Object.values(localCreateStyles).forEach((info) => {
    if (info.isExported) {
      const content =
        isTSFile || info.hasDynamicAccess
          ? JSON.stringify(info.hashMap)
          : JSON.stringify('');

      replacements.push({
        start: info.initSpan.start,
        end: info.initSpan.end,
        content,
      });
    } else {
      if (info.hasDynamicAccess) {
        replacements.push({
          start: info.initSpan.start,
          end: info.initSpan.end,
          content: JSON.stringify(info.hashMap),
        });
      } else {
        replacements.push({
          start: info.declSpan.start,
          end: info.declSpan.end,
          content: '',
        });
      }
    }
  });

  if (extractedSheets.length > 0) {
    fileStyles.baseStyles =
      (fileStyles.baseStyles || '') + extractedSheets.join('');
  }

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

  // --- Path resolution and virtual CSS import ---

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

  const css = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');

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

  if (extractedSheets.length > 0 && process.env.NODE_ENV === 'development') {
    fs.appendFileSync(VIRTUAL_FILE_PATH, extractedSheets.join(''), 'utf-8');
  }

  const useClientDirective = /^\s*['"]use client['"]/;

  if (process.env.NODE_ENV === 'production')
    return callback(null, transformedSource);

  if (!useClientDirective.test(source)) {
    callback(null, transformedSource + postfix);
    return;
  } else {
    callback(null, transformedSource + hmrCode);
  }
}
