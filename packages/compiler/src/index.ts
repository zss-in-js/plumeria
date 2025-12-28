import { parseSync, ObjectExpression } from '@swc/core';
import { type CSSProperties, genBase36Hash } from 'zss-engine';
import path from 'path';
import fs from 'fs';

import {
  tables,
  traverse,
  getStyleRecords,
  collectLocalConsts,
  objectExpressionToObject,
  scanForCreateStatic,
  scanForKeyframes,
  scanForViewTransition,
  scanForCreateTheme,
  t,
  extractOndemandStyles,
} from '@plumeria/utils';
import type { StyleRecord, CSSObject } from '@plumeria/utils';
import { optimizeCSS } from './optimizer';

interface CompilerOptions {
  pattern: string;
  output: string;
  cwd?: string;
}

async function compile(options: CompilerOptions) {
  const { pattern, output, cwd = process.cwd() } = options;

  let staticTable: ReturnType<typeof scanForCreateStatic> | null = null;
  let keyframesData: ReturnType<typeof scanForKeyframes> | null = null;
  let viewTransitionData: ReturnType<typeof scanForViewTransition> | null =
    null;
  let themeData: ReturnType<typeof scanForCreateTheme> | null = null;
  const allSheets = new Set<string>();

  const dependencies = new Set<string>();

  staticTable = scanForCreateStatic((p) => dependencies.add(p));
  tables.staticTable = staticTable;

  keyframesData = scanForKeyframes((p) => dependencies.add(p));
  tables.keyframesHashTable = keyframesData.keyframesHashTableLocal;
  tables.keyframesObjectTable = keyframesData.keyframesObjectTableLocal;

  viewTransitionData = scanForViewTransition((p) => dependencies.add(p));
  tables.viewTransitionHashTable =
    viewTransitionData.viewTransitionHashTableLocal;
  tables.viewTransitionObjectTable =
    viewTransitionData.viewTransitionObjectTableLocal;

  themeData = scanForCreateTheme((p) => dependencies.add(p));
  tables.themeTable = themeData.themeTableLocal;
  tables.createThemeObjectTable = themeData.createThemeObjectTableLocal;

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
    Object.assign(tables.staticTable, localConsts);

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
            tables.staticTable,
            tables.keyframesHashTable,
            tables.viewTransitionHashTable,
            tables.themeTable,
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
              const records = getStyleRecords(hash, merged, 1);
              records.forEach((r: StyleRecord) =>
                extractedSheets.push(r.sheet),
              );
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
            const themeHash = genBase36Hash(obj, 1, 8);
            tables.createThemeObjectTable[themeHash] = obj;
          }
        }
      },
    });

    return extractedSheets;
  };

  const files = fs.globSync(pattern, {
    cwd,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  });

  files.forEach((file) => {
    const sheets = processFile(file);
    sheets.forEach((sheet) => allSheets.add(sheet));
  });

  const outputPath = path.resolve(cwd, output);
  const css = Array.from(allSheets).join('\n');

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const optCSS = await optimizeCSS(css);

  fs.writeFileSync(outputPath, optCSS);
}

async function main() {
  const coreFilePath = require.resolve('@plumeria/core/stylesheet.css');
  await compile({ pattern: '**/*.{js,jsx,ts,tsx}', output: coreFilePath });
}

main().catch((err) => {
  console.error(err);
});
