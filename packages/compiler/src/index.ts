import { parseSync, ObjectExpression, Expression } from '@swc/core';
import { type CSSProperties, genBase36Hash } from 'zss-engine';
import fs from 'fs';
import path from 'path';

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
} from '@plumeria/utils';
import type { StyleRecord, CSSObject } from '@plumeria/utils';

interface CompilerOptions {
  include: string[];
  exclude: string[];
  cwd?: string;
}

export function compileCSS(options: CompilerOptions) {
  const { include, exclude, cwd = process.cwd() } = options;

  const allSheets = new Set<string>();

  const dependencies = new Set<string>();
  scanAll((p) => dependencies.add(p));

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

    const localConsts = collectLocalConsts(ast);
    const resourcePath = filePath;
    const importMap: Record<string, any> = {};

    traverse(ast, {
      ImportDeclaration({ node }) {
        const sourcePath = node.source.value;
        let resolvedPath = '';
        if (sourcePath.startsWith('.')) {
          resolvedPath = path.resolve(path.dirname(resourcePath), sourcePath);
        } else {
          let currentDir = path.dirname(resourcePath);
          while (currentDir !== path.parse(currentDir).root) {
            if (fs.existsSync(path.join(currentDir, 'package.json'))) {
              resolvedPath = path.resolve(currentDir, sourcePath);
              break;
            }
            currentDir = path.dirname(currentDir);
          }
        }

        if (resolvedPath) {
          const exts = [
            '.ts',
            '.tsx',
            '.js',
            '.jsx',
            '/index.ts',
            '/index.tsx',
            '/index.js',
            '/index.jsx',
          ];
          let actualPath = resolvedPath;
          if (!fs.existsSync(actualPath)) {
            for (const ext of exts) {
              if (fs.existsSync(resolvedPath + ext)) {
                actualPath = resolvedPath + ext;
                break;
              }
            }
          }

          if (fs.existsSync(actualPath)) {
            node.specifiers.forEach((specifier: any) => {
              if (specifier.type === 'ImportSpecifier') {
                const importedName = specifier.imported
                  ? (specifier.imported as any).value
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
                  importMap[localName] =
                    tables.viewTransitionHashTable[uniqueKey];
                }
                if (tables.themeTable[uniqueKey]) {
                  importMap[localName] = tables.themeTable[uniqueKey];
                }
              }
            });
          }
        }
      },
    });

    const mergedStaticTable = Object.assign(
      Object.create(tables.staticTable),
      localConsts,
      importMap,
    );
    const mergedKeyframesTable = Object.assign(
      Object.create(tables.keyframesHashTable),
      importMap,
    );
    const mergedViewTransitionTable = Object.assign(
      Object.create(tables.viewTransitionHashTable),
      importMap,
    );
    const mergedThemeTable = Object.assign(
      Object.create(tables.themeTable),
      importMap,
    );

    const localCreateStyles: Record<string, CSSObject> = {};

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
            mergedStaticTable,
            mergedKeyframesTable,
            mergedViewTransitionTable,
            mergedThemeTable,
          );
          if (obj) {
            localCreateStyles[node.id.value] = obj;

            Object.entries(obj).forEach(([key, style]) => {
              const records = getStyleRecords(key, style as CSSProperties, 1);
              extractOndemandStyles(style, extractedSheets);
              records.forEach((r: StyleRecord) => {
                extractedSheets.push(r.sheet);
              });
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
                mergedThemeTable,
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
                if (styleSet && styleSet[propName]) {
                  results.push(styleSet[propName] as CSSObject);
                }
              } else if (
                t.isIdentifier(expr.object) &&
                expr.property.type === 'Computed'
              ) {
                // Brackets/Computed access styles[key]
                const varName = expr.object.value;
                const styleSet = localCreateStyles[varName];
                if (styleSet) {
                  Object.values(styleSet).forEach((s) =>
                    results.push(s as CSSObject),
                  );
                }
              }
            } else if (t.isIdentifier(expr)) {
              const obj = localCreateStyles[expr.value];
              if (obj) {
                results.push(obj);
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
            }
            return results;
          };

          const processStyle = (style: CSSObject) => {
            extractOndemandStyles(style, extractedSheets);
            const hash = genBase36Hash(style, 1, 8);
            const records = getStyleRecords(hash, style as CSSProperties, 1);
            records.forEach((r: StyleRecord) => extractedSheets.push(r.sheet));
          };

          if (callee.property.value === 'props') {
            const staticStyles: CSSObject[] = [];
            let isAllStatic = true;

            args.forEach((arg: any) => {
              const expr = arg.expression;
              const styles = extractStylesFromExpression(expr);
              if (styles.length === 0) {
                isAllStatic = false;
              }
              staticStyles.push(...styles);
            });

            if (isAllStatic && staticStyles.length > 0) {
              const merged = staticStyles.reduce(
                (acc, style) => deepMerge(acc, style),
                {},
              );
              processStyle(merged);
            } else {
              staticStyles.forEach((s) => processStyle(s));
            }
          } else if (
            callee.property.value === 'keyframes' &&
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
          } else if (
            callee.property.value === 'viewTransition' &&
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
          } else if (
            callee.property.value === 'createTheme' &&
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
            const themeHash = genBase36Hash(obj, 1, 8);
            tables.createThemeObjectTable[themeHash] = obj;
          }
        }
      },
    });

    return extractedSheets;
  };

  const files = fs.globSync(include, {
    cwd,
    exclude: exclude,
  });

  for (const file of files) {
    const sheets = processFile(file);
    for (const sheet of sheets) {
      allSheets.add(sheet);
    }
  }

  return Array.from(allSheets).join('\n');
}
