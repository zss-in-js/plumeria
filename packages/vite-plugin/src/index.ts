import type { Plugin } from 'vite';
import type {
  CSSObject,
  ConstTable,
  VariableTable,
  KeyframesHashTable,
  KeyframesObjectTable,
  DefineVarsObjectTable,
  DefineThemeObjectTable,
  CSSValue,
  ThemeTable,
} from './types.js';

import {
  parseSync,
  traverse,
  transformFromAstSync,
  type PluginObj,
} from '@babel/core';
import * as t from '@babel/types';

import path from 'path';
import fs from 'fs';
import { createCSS, createTheme, createVars } from './create.js';
import { genBase36Hash, transpile, camelToKebabCase } from 'zss-engine';
import { globSync } from '@rust-gear/glob';

const PROJECT_ROOT = process.cwd().split('node_modules')[0];
const PATTERN_PATH = path.join(PROJECT_ROOT, '**/*.{js,jsx,ts,tsx}');
const GLOB_OPTIONS = {
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  cwd: PROJECT_ROOT,
};

let constTable: ConstTable = {};
let variableTable: VariableTable = {};
let themeTable: ThemeTable = {};
let keyframesHashTable: KeyframesHashTable = {};
let keyframesObjectTable: KeyframesObjectTable = {};
let defineVarsObjectTable: DefineVarsObjectTable = {};
let defineThemeObjectTable: DefineThemeObjectTable = {};

// -----------------------------------------------------------
// AST parsing helper functions
// -----------------------------------------------------------

function objectExpressionToObject(
  node: t.ObjectExpression,
  constTable: ConstTable,
  keyframesHashTable: KeyframesHashTable,
  variableTable: VariableTable,
  themeTable: ThemeTable,
): CSSObject {
  const obj: CSSObject = {};

  node.properties.forEach((prop) => {
    if (!t.isObjectProperty(prop)) return;
    const key = getPropertyKey(prop.key, constTable, variableTable);
    if (!key) return;
    const val = prop.value;

    if (t.isIdentifier(val) || t.isMemberExpression(val)) {
      const resolvedKeyframe = resolveKeyframesTableMemberExpression(
        val,
        keyframesHashTable,
      );
      if (resolvedKeyframe !== undefined) {
        obj[key] = resolvedKeyframe;
        return;
      }
      const resolvedVariable = resolveVariableTableMemberExpressionByNode(
        val,
        variableTable,
      );
      if (resolvedVariable !== undefined) {
        obj[key] = resolvedVariable;
        return;
      }
      const resolvedTheme = resolveThemeTableMemberExpressionByNode(
        val,
        themeTable,
      );
      if (resolvedTheme !== undefined) {
        obj[key] = resolvedTheme;
        return;
      }
    }

    if (
      t.isStringLiteral(val) ||
      t.isNumericLiteral(val) ||
      t.isBooleanLiteral(val)
    ) {
      obj[key] = val.value;
    } else if (t.isUnaryExpression(val)) {
      obj[key] = evaluateUnaryExpression(val);
    } else if (t.isObjectExpression(val)) {
      obj[key] = objectExpressionToObject(
        val,
        constTable,
        keyframesHashTable,
        variableTable,
        themeTable,
      );
    } else if (t.isMemberExpression(val)) {
      const resolved = resolveConstTableMemberExpression(val, constTable);
      obj[key] = resolved !== undefined ? resolved : '[unresolved]';
    } else if (t.isIdentifier(val)) {
      if (constTable[val.name] !== undefined) {
        obj[key] = constTable[val.name];
      } else {
        obj[key] = '[unresolved identifier]';
      }
    } else {
      obj[key] = '[unsupported value type]';
    }
  });
  return obj;
}

function getPropertyKey(
  node: t.Expression | t.PrivateName,
  constTable: ConstTable,
  variableTable: VariableTable,
): string {
  if (t.isIdentifier(node)) {
    if (constTable[node.name] && typeof constTable[node.name] === 'string') {
      return constTable[node.name] as string;
    }
    return node.name;
  }
  if (t.isStringLiteral(node)) return node.value;
  if (t.isMemberExpression(node)) {
    const result = resolveConstTableMemberExpression(node, constTable);
    if (typeof result === 'string') return result;
    throw new Error(`Resolved key is not a string: ${JSON.stringify(result)}`);
  }
  if (t.isTemplateLiteral(node)) {
    return evaluateTemplateLiteral(node, constTable, variableTable);
  }
  if (t.isBinaryExpression(node)) {
    return evaluateBinaryExpression(node, constTable, variableTable);
  }
  throw new Error(`Unsupported property key type: ${node.type}`);
}

function evaluateTemplateLiteral(
  node: t.TemplateLiteral,
  constTable: ConstTable,
  variableTable: VariableTable,
): string {
  let result = '';
  for (let i = 0; i < node.quasis.length; i++) {
    result += node.quasis[i].value.cooked || node.quasis[i].value.raw;
    if (i < node.expressions.length) {
      const expr = node.expressions[i];
      const evaluatedExpr = evaluateExpression(
        expr as t.Expression,
        constTable,
        variableTable,
      );
      result += String(evaluatedExpr);
    }
  }
  return result;
}

function evaluateBinaryExpression(
  node: t.BinaryExpression,
  constTable: ConstTable,
  variableTable: VariableTable,
): string {
  const left = evaluateExpression(
    node.left as t.Expression,
    constTable,
    variableTable,
  );
  const right = evaluateExpression(node.right, constTable, variableTable);
  if (node.operator === '+') {
    return String(left) + String(right);
  }
  throw new Error(`Unsupported binary operator: ${node.operator}`);
}

function evaluateExpression(
  node: t.Expression,
  constTable: ConstTable,
  variableTable: VariableTable,
): string | number | boolean | null | CSSObject {
  if (t.isStringLiteral(node)) return node.value;
  if (t.isNumericLiteral(node)) return node.value;
  if (t.isBooleanLiteral(node)) return node.value;
  if (t.isNullLiteral(node)) return null;
  if (t.isIdentifier(node)) {
    if (constTable[node.name] !== undefined) return constTable[node.name];
    if (keyframesHashTable[node.name] !== undefined)
      return keyframesHashTable[node.name];
    return `[unresolved: ${node.name}]`;
  }
  if (t.isMemberExpression(node)) {
    const resolved = resolveConstTableMemberExpression(node, constTable);
    if (resolved !== undefined) return resolved;
    const resolvedVar = resolveVariableTableMemberExpressionByNode(
      node,
      variableTable,
    );
    if (resolvedVar !== undefined) return resolvedVar;
    const resolvedTheme = resolveThemeTableMemberExpressionByNode(
      node,
      themeTable,
    );
    if (resolvedTheme !== undefined) return resolvedTheme;
    return `[unresolved member expression]`;
  }
  if (t.isBinaryExpression(node))
    return evaluateBinaryExpression(node, constTable, variableTable);
  if (t.isTemplateLiteral(node))
    return evaluateTemplateLiteral(node, constTable, variableTable);
  if (t.isUnaryExpression(node)) return evaluateUnaryExpression(node);
  throw new Error(`Unsupported expression type: ${node.type}`);
}

function evaluateUnaryExpression(node: t.UnaryExpression): number | string {
  const arg = node.argument;
  switch (node.operator) {
    case '-':
      if (t.isNumericLiteral(arg)) return -arg.value;
      break;
    case '+':
      if (t.isNumericLiteral(arg)) return +arg.value;
      break;
    default:
      throw new Error(`Unsupported unary operator: ${node.operator}`);
  }
  throw new Error(`Unsupported UnaryExpression argument type: ${arg.type}`);
}

function resolveKeyframesTableMemberExpression(
  node: t.Identifier | t.MemberExpression,
  keyframesHashTable: KeyframesHashTable,
): string | undefined {
  if (t.isIdentifier(node)) return keyframesHashTable[node.name];
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object))
      return keyframesHashTable[node.object.name];
  }
  return undefined;
}

function resolveConstTableMemberExpression(
  node: t.MemberExpression,
  constTable: ConstTable,
): CSSValue | undefined {
  if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
    const varName = node.object.name;
    const key = node.property.name;
    const tableValue = constTable[varName];
    if (typeof tableValue === 'string') {
      return tableValue;
    }
    if (tableValue && typeof tableValue === 'object' && key in tableValue) {
      return tableValue[key];
    }
  }
  return undefined;
}

function resolveVariableTableMemberExpressionByNode(
  node: t.Identifier | t.MemberExpression,
  variableTable: VariableTable,
  asObject: boolean = false,
): CSSValue | undefined {
  if (t.isIdentifier(node)) {
    if (asObject && typeof variableTable[node.name] === 'object') {
      return { ...variableTable[node.name] };
    }
    const cssVarName = camelToKebabCase(node.name);
    return `var(--${cssVarName})`;
  }
  if (t.isMemberExpression(node) && t.isIdentifier(node.object)) {
    const varName = node.object.name;
    let key: string | undefined;
    if (t.isIdentifier(node.property)) {
      key = node.property.name;
    } else if (t.isStringLiteral(node.property)) {
      key = node.property.value;
    }
    if (
      key &&
      variableTable[varName] &&
      variableTable[varName][key] !== undefined
    ) {
      if (asObject) {
        return { [key]: variableTable[varName][key] };
      }
      const cssVarName = camelToKebabCase(key);
      return `var(--${cssVarName})`;
    }
  }
  return undefined;
}

function resolveThemeTableMemberExpressionByNode(
  node: t.Identifier | t.MemberExpression,
  themeTable: ThemeTable,
  asObject: boolean = false,
): CSSValue | undefined {
  if (t.isIdentifier(node)) {
    if (asObject && typeof themeTable[node.name] === 'object') {
      return { ...themeTable[node.name] };
    }
    const cssVarName = camelToKebabCase(node.name);
    return `var(--${cssVarName})`;
  }
  if (t.isMemberExpression(node) && t.isIdentifier(node.object)) {
    const varName = node.object.name;
    let key: string | undefined;
    if (t.isIdentifier(node.property)) {
      key = node.property.name;
    } else if (t.isStringLiteral(node.property)) {
      key = node.property.value;
    }
    if (key && themeTable[varName] && themeTable[varName][key] !== undefined) {
      if (asObject) {
        return { [key]: themeTable[varName][key] };
      }
      const cssVarName = camelToKebabCase(key);
      return `var(--${cssVarName})`;
    }
  }
  return undefined;
}

function collectLocalConsts(ast: t.File): Record<string, string> {
  const localConsts: Record<string, string> = {};
  traverse(ast, {
    VariableDeclarator(path) {
      const { node } = path;
      if (
        t.isIdentifier(node.id) &&
        node.init &&
        t.isStringLiteral(node.init)
      ) {
        localConsts[node.id.name] = node.init.value;
      }
    },
  });
  return localConsts;
}

function isCSSDefineFile(filePath: string, target: string): boolean {
  if (fs.statSync(filePath).isDirectory()) return false;
  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parseSync(code, {
      sourceType: 'module',
      presets: [
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
      ],
    });
  } catch (err) {
    console.error(err);
    return false;
  }
  if (!ast) return false;

  let found = false;
  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'css' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === target
      ) {
        found = true;
        path.stop();
      }
    },
  });
  return found;
}

function scanForDefineConsts(): ConstTable {
  const constTableLocal: ConstTable = {};
  const files = globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    if (!isCSSDefineFile(filePath, 'defineConsts')) continue;

    const source = fs.readFileSync(filePath, 'utf8');
    const ast = parseSync(source, {
      sourceType: 'module',
      presets: [
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
      ],
    });

    if (!ast) continue;

    for (const node of ast.program.body as t.Statement[]) {
      const declarations = t.isVariableDeclaration(node)
        ? node.declarations
        : t.isExportNamedDeclaration(node) &&
            node.declaration &&
            t.isVariableDeclaration(node.declaration)
          ? node.declaration.declarations
          : [];

      for (const decl of declarations) {
        if (
          t.isVariableDeclarator(decl) &&
          t.isIdentifier(decl.id) &&
          t.isCallExpression(decl.init) &&
          t.isMemberExpression(decl.init.callee) &&
          t.isIdentifier(decl.init.callee.object, { name: 'css' }) &&
          t.isIdentifier(decl.init.callee.property, { name: 'defineConsts' }) &&
          t.isObjectExpression(decl.init.arguments[0])
        ) {
          const varName = decl.id.name;
          const obj = objectExpressionToObject(
            decl.init.arguments[0],
            constTableLocal,
            keyframesHashTable,
            variableTable,
            themeTable,
          );
          constTableLocal[varName] = obj;
        }
      }
    }
  }
  return constTableLocal;
}

function scanForKeyframes(): {
  keyframesHashTableLocal: KeyframesHashTable;
  keyframesObjectTableLocal: KeyframesObjectTable;
} {
  const keyframesHashTableLocal: KeyframesHashTable = {};
  const keyframesObjectTableLocal: KeyframesObjectTable = {};
  const files = globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    if (!isCSSDefineFile(filePath, 'keyframes')) continue;

    const source = fs.readFileSync(filePath, 'utf8');
    const ast = parseSync(source, {
      sourceType: 'module',
      presets: [
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
      ],
    });

    if (!ast) continue;

    for (const node of ast.program.body as t.Statement[]) {
      const declarations = t.isVariableDeclaration(node)
        ? node.declarations
        : t.isExportNamedDeclaration(node) &&
            node.declaration &&
            t.isVariableDeclaration(node.declaration)
          ? node.declaration.declarations
          : [];

      for (const decl of declarations) {
        if (
          t.isVariableDeclarator(decl) &&
          t.isIdentifier(decl.id) &&
          t.isCallExpression(decl.init) &&
          t.isMemberExpression(decl.init.callee) &&
          t.isIdentifier(decl.init.callee.object, { name: 'css' }) &&
          t.isIdentifier(decl.init.callee.property, { name: 'keyframes' }) &&
          t.isObjectExpression(decl.init.arguments[0])
        ) {
          const varName = decl.id.name;
          const obj = objectExpressionToObject(
            decl.init.arguments[0],
            constTable,
            keyframesHashTableLocal,
            variableTable,
            themeTable,
          );
          const hash = genBase36Hash(obj, 1, 8);
          keyframesHashTableLocal[varName] = hash;
          keyframesObjectTableLocal[hash] = obj;
        }
      }
    }
  }

  return { keyframesHashTableLocal, keyframesObjectTableLocal };
}

function scanForDefineVars(): {
  variableTableLocal: VariableTable;
  defineVarsObjectTableLocal: DefineVarsObjectTable;
} {
  const variableTableLocal: VariableTable = {};
  const defineVarsObjectTableLocal: DefineVarsObjectTable = {};

  const files = globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    if (!isCSSDefineFile(filePath, 'defineVars')) continue;

    const source = fs.readFileSync(filePath, 'utf8');
    const ast = parseSync(source, {
      sourceType: 'module',
      presets: [
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
      ],
    });

    if (!ast) continue;

    for (const node of ast.program.body as t.Statement[]) {
      const declarations = t.isVariableDeclaration(node)
        ? node.declarations
        : t.isExportNamedDeclaration(node) &&
            node.declaration &&
            t.isVariableDeclaration(node.declaration)
          ? node.declaration.declarations
          : [];

      for (const decl of declarations) {
        if (
          t.isVariableDeclarator(decl) &&
          t.isIdentifier(decl.id) &&
          t.isCallExpression(decl.init) &&
          t.isMemberExpression(decl.init.callee) &&
          t.isIdentifier(decl.init.callee.object, { name: 'css' }) &&
          t.isIdentifier(decl.init.callee.property, { name: 'defineVars' }) &&
          t.isObjectExpression(decl.init.arguments[0])
        ) {
          const varName = decl.id.name;
          const obj = objectExpressionToObject(
            decl.init.arguments[0],
            constTable,
            keyframesHashTable,
            variableTableLocal,
            themeTable,
          );
          variableTableLocal[varName] = obj;
          defineVarsObjectTableLocal[varName] = obj;
        }
      }
    }
  }

  return { variableTableLocal, defineVarsObjectTableLocal };
}

function scanForDefineTheme(): {
  themeTableLocal: ThemeTable;
  defineThemeObjectTableLocal: DefineThemeObjectTable;
} {
  const themeTableLocal: ThemeTable = {};
  const defineThemeObjectTableLocal: DefineThemeObjectTable = {};

  const files = globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    if (!isCSSDefineFile(filePath, 'defineTheme')) continue;

    const source = fs.readFileSync(filePath, 'utf8');
    const ast = parseSync(source, {
      sourceType: 'module',
      presets: [
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
      ],
    });

    if (!ast) continue;

    for (const node of ast.program.body as t.Statement[]) {
      const declarations = t.isVariableDeclaration(node)
        ? node.declarations
        : t.isExportNamedDeclaration(node) &&
            node.declaration &&
            t.isVariableDeclaration(node.declaration)
          ? node.declaration.declarations
          : [];

      for (const decl of declarations) {
        if (
          t.isVariableDeclarator(decl) &&
          t.isIdentifier(decl.id) &&
          t.isCallExpression(decl.init) &&
          t.isMemberExpression(decl.init.callee) &&
          t.isIdentifier(decl.init.callee.object, { name: 'css' }) &&
          t.isIdentifier(decl.init.callee.property, { name: 'defineTheme' }) &&
          t.isObjectExpression(decl.init.arguments[0])
        ) {
          const varName = decl.id.name;
          const obj = objectExpressionToObject(
            decl.init.arguments[0],
            constTable,
            keyframesHashTable,
            variableTable,
            themeTableLocal,
          );
          themeTableLocal[varName] = obj;
          defineThemeObjectTableLocal[varName] = obj;
        }
      }
    }
  }

  return { themeTableLocal, defineThemeObjectTableLocal };
}

// -----------------------------------------------------------
// Implementing Vite Plugin
// -----------------------------------------------------------

export function plumeria(): Plugin {
  const stylesByFile = new Map<string, any>();
  let hasScanned = false;
  const outputPath = path.join(PROJECT_ROOT, 'zero-virtual.css');

  return {
    name: 'plumeria-vite-plugin',

    config: ({ build = {} }) => ({
      build: {
        ...build,
        rollupOptions: {
          ...build.rollupOptions,
          external: [
            ...((build.rollupOptions?.external || []) as string[]),
            'fs',
          ],
        },
      },
    }),

    buildStart() {
      if (hasScanned) return;

      constTable = {};
      variableTable = {};
      themeTable = {};
      keyframesHashTable = {};
      keyframesObjectTable = {};
      defineVarsObjectTable = {};
      defineThemeObjectTable = {};

      constTable = scanForDefineConsts();

      const keyframesResult = scanForKeyframes();
      keyframesHashTable = keyframesResult.keyframesHashTableLocal;
      keyframesObjectTable = keyframesResult.keyframesObjectTableLocal;

      const varsResult = scanForDefineVars();
      variableTable = varsResult.variableTableLocal;
      defineVarsObjectTable = varsResult.defineVarsObjectTableLocal;

      const themeResult = scanForDefineTheme();
      themeTable = themeResult.themeTableLocal;
      defineThemeObjectTable = themeResult.defineThemeObjectTableLocal;

      hasScanned = true;
    },

    async transform(source, id) {
      if (
        id.includes('node_modules') ||
        !/\.(js|jsx|ts|tsx|vue|svelte|astro)$/.test(id)
      ) {
        return null;
      }

      try {
        let ast: t.File | null = null;
        try {
          ast = parseSync(source, {
            sourceType: 'module',
            presets: [
              [
                '@babel/preset-typescript',
                { isTSX: true, allExtensions: true },
              ],
            ],
          });
        } catch (err) {
          return null;
        }

        if (!ast) return null;

        const localConsts = collectLocalConsts(ast);
        Object.assign(constTable, localConsts);

        let extractedObject: CSSObject | null = null;
        const extractedGlobalObjects: CSSObject[] = [];

        const pluginAst: PluginObj = {
          visitor: {
            CallExpression(path) {
              const callee = path.node.callee;
              if (
                t.isMemberExpression(callee) &&
                t.isIdentifier(callee.object, { name: 'css' }) &&
                t.isIdentifier(callee.property)
              ) {
                const args = path.node.arguments;
                if (
                  callee.property.name === 'create' &&
                  args.length === 1 &&
                  t.isObjectExpression(args[0])
                ) {
                  extractedObject = objectExpressionToObject(
                    args[0],
                    constTable,
                    keyframesHashTable,
                    variableTable,
                    themeTable,
                  );
                }
                if (
                  callee.property.name === 'global' &&
                  args.length === 1 &&
                  t.isObjectExpression(args[0])
                ) {
                  extractedGlobalObjects.push(
                    objectExpressionToObject(
                      args[0],
                      constTable,
                      keyframesHashTable,
                      variableTable,
                      themeTable,
                    ),
                  );
                }
              }
            },
          },
        };

        transformFromAstSync(ast, source, {
          code: false,
          plugins: [pluginAst],
          configFile: false,
        });

        const fileStyles: CSSObject = {};
        let hasCSSDefinitions = false;

        if (extractedObject) {
          const base = createCSS(extractedObject);
          if (base) {
            fileStyles.baseStyles = base;
            hasCSSDefinitions = true;
          }
        }

        if (extractedGlobalObjects.length > 0) {
          fileStyles.globalStyles = extractedGlobalObjects
            .map(
              (obj) => transpile(obj as any, undefined, '--global').styleSheet,
            )
            .join('\n');
          hasCSSDefinitions = true;
        }

        if (Object.keys(keyframesObjectTable).length > 0) {
          fileStyles.keyframeStyles = Object.entries(keyframesObjectTable)
            .map(
              ([hash, obj]) =>
                transpile(
                  { [`@keyframes ${hash}`]: obj },
                  undefined,
                  '--global',
                ).styleSheet,
            )
            .join('\n');
          hasCSSDefinitions = true;
        }

        if (Object.keys(defineVarsObjectTable).length > 0) {
          fileStyles.varStyles = Object.values(defineVarsObjectTable)
            .map(
              (obj) =>
                transpile(createVars(obj as any), undefined, '--global')
                  .styleSheet,
            )
            .join('\n');
          hasCSSDefinitions = true;
        }

        if (Object.keys(defineThemeObjectTable).length > 0) {
          fileStyles.themeStyles = Object.values(defineThemeObjectTable)
            .map(
              (obj) =>
                transpile(createTheme(obj as any), undefined, '--global')
                  .styleSheet,
            )
            .join('\n');
          hasCSSDefinitions = true;
        }

        if (Object.keys(fileStyles).length > 0) {
          stylesByFile.set(id, {
            ...fileStyles,
            lastUpdated: Date.now(),
          });
        }

        if (hasCSSDefinitions) {
          const allStyles = Array.from(stylesByFile.values());

          const keyframeStylesSet = new Set<string>();
          const varStylesSet = new Set<string>();
          const themeStylesSet = new Set<string>();
          const globalStylesSet = new Set<string>();
          const baseStylesSet = new Set<string>();

          for (const style of allStyles) {
            if (style.keyframeStyles)
              keyframeStylesSet.add(style.keyframeStyles);
            if (style.varStyles) varStylesSet.add(style.varStyles);
            if (style.themeStyles) themeStylesSet.add(style.themeStyles);
            if (style.globalStyles) globalStylesSet.add(style.globalStyles);
            if (style.baseStyles) baseStylesSet.add(style.baseStyles);
          }

          const css = [
            ...Array.from(keyframeStylesSet),
            ...Array.from(varStylesSet),
            ...Array.from(themeStylesSet),
            ...Array.from(globalStylesSet),
            ...Array.from(baseStylesSet),
          ]
            .filter(Boolean)
            .join('\n');

          fs.writeFileSync(outputPath, css);

          const importStatement = fs.existsSync(outputPath)
            ? `import '${outputPath}';`
            : '// zero-virtual.css not found';

          return {
            code: `${source}\n${importStatement}`,
            map: null,
          };
        }
      } catch (error) {
        console.error(`Error processing ${id}:`, error);
      }

      return null;
    },

    configureServer(server) {
      server.watcher.on('change', (filePath) => {
        if (
          filePath.endsWith('.ts') ||
          filePath.endsWith('.tsx') ||
          filePath.endsWith('.js') ||
          filePath.endsWith('.jsx')
        ) {
          if (
            isCSSDefineFile(filePath, 'defineConsts') ||
            isCSSDefineFile(filePath, 'keyframes') ||
            isCSSDefineFile(filePath, 'defineVars') ||
            isCSSDefineFile(filePath, 'defineTheme')
          ) {
            hasScanned = false;
            console.log('🔄 CSS definition changed, rescanning...');
          }
        }
      });

      const cleanup = () => {
        if (fs.existsSync(outputPath)) {
          try {
            fs.unlinkSync(outputPath);
          } catch (error) {
            error;
          }
        }
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      server.watcher.on('unlink', (filePath) => {
        stylesByFile.delete(filePath);
      });
    },
  };
}
