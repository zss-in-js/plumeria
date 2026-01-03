import type {
  CSSObject,
  StaticTable,
  KeyframesHashTable,
  CSSValue,
  ThemeTable,
  ViewTransitionHashTable,
  Tables,
  CreateThemeObjectTable,
} from './types';

import { createTheme } from './createTheme';

import {
  parseSync,
  Module,
  Expression,
  CallExpression,
  Identifier,
  KeyValueProperty,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  ObjectExpression,
  MemberExpression,
  TemplateLiteral,
  BinaryExpression,
  UnaryExpression,
  VariableDeclaration,
  VariableDeclarator,
  ExportDeclaration,
  ConditionalExpression,
} from '@swc/core';
import path from 'path';
import fs from 'fs';
import { camelToKebabCase, genBase36Hash, transpile } from 'zss-engine';
import { createViewTransition } from './viewTransition';

export const t = {
  isObjectExpression: (node: any): node is ObjectExpression =>
    node?.type === 'ObjectExpression',
  isObjectProperty: (node: any): node is KeyValueProperty =>
    node?.type === 'KeyValueProperty',
  isIdentifier: (node: any, opts?: { name?: string }): node is Identifier => {
    if (node?.type !== 'Identifier') return false;
    if (opts?.name && node.value !== opts.name) return false;
    return true;
  },
  isStringLiteral: (node: any): node is StringLiteral =>
    node?.type === 'StringLiteral',
  isNumericLiteral: (node: any): node is NumericLiteral =>
    node?.type === 'NumericLiteral',
  isBooleanLiteral: (node: any): node is BooleanLiteral =>
    node?.type === 'BooleanLiteral',
  isMemberExpression: (node: any): node is MemberExpression =>
    node?.type === 'MemberExpression',
  isUnaryExpression: (node: any): node is UnaryExpression =>
    node?.type === 'UnaryExpression',
  isTemplateLiteral: (node: any): node is TemplateLiteral =>
    node?.type === 'TemplateLiteral',
  isBinaryExpression: (node: any): node is BinaryExpression =>
    node?.type === 'BinaryExpression',
  isVariableDeclaration: (node: any): node is VariableDeclaration =>
    node?.type === 'VariableDeclaration',
  isExportDeclaration: (node: any): node is ExportDeclaration =>
    node?.type === 'ExportDeclaration',
  isVariableDeclarator: (node: any): node is VariableDeclarator =>
    node?.type === 'VariableDeclarator',
  isCallExpression: (node: any): node is CallExpression =>
    node?.type === 'CallExpression',
  isNullLiteral: (node: any): boolean => node?.type === 'NullLiteral',
  isConditionalExpression: (node: any): node is ConditionalExpression =>
    node?.type === 'ConditionalExpression',
};

export function traverse(
  node: Module,
  visitor: { [key: string]: (path: { node: any; stop: () => void }) => void },
) {
  let stopped = false;
  const stop = () => {
    stopped = true;
  };

  function walk(n: any) {
    if (stopped) return;
    if (!n || typeof n !== 'object') return;

    if (n.type && visitor[n.type]) {
      visitor[n.type]({ node: n, stop });
    }

    for (const key in n) {
      if (key === 'span') continue;
      const child = n[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          walk(c);
        }
      } else {
        walk(child);
      }
    }
  }
  walk(node);
}

const PROJECT_ROOT = process.cwd().split('node_modules')[0];
const PATTERN_PATH = path.join(PROJECT_ROOT, '**/*.{js,jsx,ts,tsx}');
const GLOB_OPTIONS = {
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  cwd: PROJECT_ROOT,
};
export const tables: Tables = {
  staticTable: {},
  themeTable: {},
  keyframesHashTable: {},
  keyframesObjectTable: {},
  viewTransitionHashTable: {},
  viewTransitionObjectTable: {},
  createThemeObjectTable: {},
};

/* 
These internal functions are executed through the loader function, so they are already comprehensively covered by the current tests.
Implementation details: These are implementation details that are not exposed, and you end up testing the implementation instead of the behavior.
 */

function genFileId(filePath: string): string {
  const relativePath = path
    .relative(PROJECT_ROOT, filePath)
    .split(path.sep)
    .join('/');
  return genBase36Hash({ __file: relativePath }, 1, 8);
}

export function objectExpressionToObject(
  node: ObjectExpression,
  staticTable: StaticTable,
  keyframesHashTable: KeyframesHashTable,
  viewTransitionHashTable: ViewTransitionHashTable,
  themeTable: ThemeTable,
): CSSObject {
  const obj: CSSObject = {};

  node.properties.forEach((prop) => {
    if (!t.isObjectProperty(prop)) return;

    const key = getPropertyKey(
      prop.key,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      themeTable,
    );
    if (!key) return;

    const val = prop.value;

    if (t.isIdentifier(val) || t.isMemberExpression(val)) {
      const resolvedKeyframe = resolveKeyframesTableMemberExpression(
        val,
        keyframesHashTable,
      );
      if (resolvedKeyframe !== undefined) {
        obj[key] = 'kf-' + resolvedKeyframe;
        return;
      }
      const resolvedViewTransitioin =
        resolveViewTransitionTableMemberExpression(
          val,
          viewTransitionHashTable,
        );
      if (resolvedViewTransitioin !== undefined) {
        obj[key] = 'vt-' + resolvedViewTransitioin;
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
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        themeTable,
      );
    } else if (t.isMemberExpression(val)) {
      const resolved = resolveStaticTableMemberExpression(val, staticTable);
      obj[key] = resolved !== undefined ? resolved : '[unresolved]';
    } else if (t.isIdentifier(val)) {
      if (staticTable[val.value] !== undefined) {
        obj[key] = staticTable[val.value];
      } else {
        obj[key] = '[unresolved identifier]';
      }
    } else {
      obj[key] = '[unsupported value type]';
    }
  });

  return obj;
}

export function collectLocalConsts(
  ast: Module,
  filePath: string,
): Record<string, any> {
  const localConsts: Record<string, any> = {};
  const fileId = genFileId(filePath);

  const createProxy = (table: Record<string, any>) => {
    return new Proxy(table, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return target[`${fileId}-${prop}`];
        }
        return Reflect.get(target, prop);
      },
    });
  };

  traverse(ast, {
    VariableDeclarator({ node }: { node: VariableDeclarator }) {
      if (t.isIdentifier(node.id) && node.init) {
        if (t.isStringLiteral(node.init)) {
          localConsts[node.id.value] = node.init.value;
        } else if (t.isObjectExpression(node.init)) {
          localConsts[node.id.value] = objectExpressionToObject(
            node.init,
            localConsts,
            createProxy(tables.keyframesHashTable),
            createProxy(tables.viewTransitionHashTable),
            createProxy(tables.themeTable),
          );
        }
      }
    },
  });

  return localConsts;
}

/* istanbul ignore next */
function getPropertyKey(
  node: any,
  staticTable: StaticTable,
  keyframesHashTable: KeyframesHashTable,
  viewTransitionHashTable: ViewTransitionHashTable,
  themeTable: ThemeTable,
): string {
  if (t.isIdentifier(node)) {
    if (
      staticTable[node.value] &&
      typeof staticTable[node.value] === 'string'
    ) {
      return staticTable[node.value] as string;
    }
    return node.value;
  }
  if (t.isStringLiteral(node)) {
    return node.value;
  }
  if (node.type === 'Computed') {
    const expr = node.expression;
    if (t.isStringLiteral(expr)) {
      return expr.value;
    }
    if (t.isIdentifier(expr)) {
      if (
        staticTable[expr.value] &&
        typeof staticTable[expr.value] === 'string'
      ) {
        return staticTable[expr.value] as string;
      }
    }
    if (t.isMemberExpression(expr)) {
      const result = resolveStaticTableMemberExpression(expr, staticTable);
      if (typeof result === 'string') return result;
    }
    if (t.isTemplateLiteral(expr)) {
      return evaluateTemplateLiteral(
        expr,
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        themeTable,
      );
    }
    if (t.isBinaryExpression(expr)) {
      return evaluateBinaryExpression(
        expr,
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        themeTable,
      );
    }
    return '';
  }

  if (t.isTemplateLiteral(node)) {
    return evaluateTemplateLiteral(
      node,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      themeTable,
    );
  }

  if (t.isBinaryExpression(node)) {
    return evaluateBinaryExpression(
      node,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      themeTable,
    );
  }

  return '';
}
/* istanbul ignore next */
function evaluateTemplateLiteral(
  node: TemplateLiteral,
  staticTable: StaticTable,
  keyframesHashTable: KeyframesHashTable,
  viewTransitionHashTable: ViewTransitionHashTable,
  themeTable: ThemeTable,
): string {
  let result = '';

  for (let i = 0; i < node.quasis.length; i++) {
    result += node.quasis[i].cooked || node.quasis[i].raw;

    if (i < node.expressions.length) {
      const expr = node.expressions[i];
      const evaluatedExpr = evaluateExpression(
        expr as Expression,
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        themeTable,
      );
      result += String(evaluatedExpr);
    }
  }

  return result;
}

/* istanbul ignore next */
function evaluateBinaryExpression(
  node: BinaryExpression,
  staticTable: StaticTable,
  keyframesHashTable: KeyframesHashTable,
  viewTransitionHashTable: ViewTransitionHashTable,
  themeTable: ThemeTable,
): string {
  const left = evaluateExpression(
    node.left as Expression,
    staticTable,
    keyframesHashTable,
    viewTransitionHashTable,
    themeTable,
  );
  const right = evaluateExpression(
    node.right as Expression,
    staticTable,
    keyframesHashTable,
    viewTransitionHashTable,
    themeTable,
  );

  if (node.operator === '+') {
    return String(left) + String(right);
  }

  throw new Error(`Unsupported binary operator: ${node.operator}`);
}

/* istanbul ignore next */
function evaluateExpression(
  node: Expression,
  staticTable: StaticTable,
  keyframesHashTable: KeyframesHashTable,
  viewTransitionHashTable: ViewTransitionHashTable,
  themeTable: ThemeTable,
): string | number | boolean | null | CSSObject {
  if (t.isStringLiteral(node)) {
    return node.value;
  }

  if (t.isNumericLiteral(node)) {
    return node.value;
  }

  if (t.isBooleanLiteral(node)) {
    return node.value;
  }

  if (t.isNullLiteral(node)) {
    return null;
  }

  if (t.isIdentifier(node)) {
    if (staticTable[node.value] !== undefined) {
      return staticTable[node.value];
    }

    if (keyframesHashTable[node.value] !== undefined) {
      return keyframesHashTable[node.value];
    }

    if (viewTransitionHashTable[node.value] !== undefined) {
      return viewTransitionHashTable[node.value];
    }

    return `[unresolved: ${node.value}]`;
  }

  if (t.isMemberExpression(node)) {
    const resolved = resolveStaticTableMemberExpression(node, staticTable);
    if (resolved !== undefined) {
      return resolved;
    }

    const resolvedTheme = resolveThemeTableMemberExpressionByNode(
      node,
      themeTable,
    );
    if (resolvedTheme !== undefined) {
      return resolvedTheme;
    }

    return `[unresolved member expression]`;
  }

  if (t.isBinaryExpression(node)) {
    return evaluateBinaryExpression(
      node,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      themeTable,
    );
  }

  if (t.isTemplateLiteral(node)) {
    return evaluateTemplateLiteral(
      node,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      themeTable,
    );
  }

  if (t.isUnaryExpression(node)) {
    return evaluateUnaryExpression(node);
  }

  throw new Error(`Unsupported expression type: ${node.type}`);
}

/* istanbul ignore next */
function evaluateUnaryExpression(node: UnaryExpression): number | string {
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
  node: Identifier | MemberExpression,
  keyframesHashTable: KeyframesHashTable,
): string | undefined {
  if (t.isIdentifier(node)) {
    return keyframesHashTable[node.value];
  }
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object)) {
      return keyframesHashTable[node.object.value];
    }
  }
}

function resolveViewTransitionTableMemberExpression(
  node: Identifier | MemberExpression,
  viewTransitionHashTable: ViewTransitionHashTable,
): string | undefined {
  if (t.isIdentifier(node)) {
    return viewTransitionHashTable[node.value];
  }
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object)) {
      return viewTransitionHashTable[node.object.value];
    }
  }
}

function resolveStaticTableMemberExpression(
  node: MemberExpression,
  staticTable: StaticTable,
): CSSValue | undefined {
  if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
    const varName = node.object.value;
    const key = node.property.value;
    const tableValue = staticTable[varName];

    if (tableValue && typeof tableValue === 'object' && key in tableValue) {
      return tableValue[key];
    }
  }
  return undefined;
}
/* istanbul ignore next */
function resolveThemeTableMemberExpressionByNode(
  node: Identifier | MemberExpression,
  themeTable: ThemeTable,
): CSSValue | undefined {
  if (t.isMemberExpression(node) && t.isIdentifier(node.object)) {
    const varName = node.object.value;
    let key: string | undefined;
    if (t.isIdentifier(node.property)) {
      key = node.property.value;
    } else if (
      node.property.type === 'Computed' &&
      t.isStringLiteral(node.property.expression)
    ) {
      key = node.property.expression.value;
    }
    if (key && themeTable[varName] && themeTable[varName][key] !== undefined) {
      const cssVarName = camelToKebabCase(key);
      return `var(--${cssVarName})`;
    }
  }
  return undefined;
}

// Cache for incremental scanning
interface CachedData {
  mtimeMs: number;
  staticTable: StaticTable;
  keyframesHashTable: KeyframesHashTable;
  viewTransitionHashTable: ViewTransitionHashTable;
  themeTable: ThemeTable;
  createThemeObjectTable: CreateThemeObjectTable;
  hasCssUsage: boolean;
}

const fileCache: Record<string, CachedData> = {};

export function scanAll(addDependency: (path: string) => void): Tables {
  // Clear existing tables
  for (const key in tables) {
    (tables as any)[key] = {};
  }

  const files = fs.globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    try {
      const stats = fs.statSync(filePath);
      const cached = fileCache[filePath];

      // Use cache if file hasn't changed
      if (cached && cached.mtimeMs === stats.mtimeMs) {
        if (cached.hasCssUsage) {
          addDependency(filePath);
          Object.assign(tables.staticTable, cached.staticTable);
          Object.assign(tables.keyframesHashTable, cached.keyframesHashTable);
          Object.assign(
            tables.viewTransitionHashTable,
            cached.viewTransitionHashTable,
          );
          Object.assign(tables.themeTable, cached.themeTable);
          Object.assign(
            tables.createThemeObjectTable,
            cached.createThemeObjectTable,
          );
        }
        continue;
      }

      const source = fs.readFileSync(filePath, 'utf8');
      if (!source.includes('css.')) {
        // Cache negative result
        fileCache[filePath] = {
          mtimeMs: stats.mtimeMs,
          staticTable: {},
          keyframesHashTable: {},
          viewTransitionHashTable: {},
          themeTable: {},
          createThemeObjectTable: {},
          hasCssUsage: false,
        };
        continue;
      }

      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: true,
        target: 'es2022',
      });

      addDependency(filePath);

      const fileId = genFileId(filePath);
      const localStaticTable: StaticTable = {};
      const localKeyframesHashTable: KeyframesHashTable = {};
      const localViewTransitionHashTable: ViewTransitionHashTable = {};
      const localThemeTable: ThemeTable = {};
      const localCreateThemeObjectTable: CreateThemeObjectTable = {};

      for (const node of ast.body) {
        let declarations: VariableDeclarator[] = [];

        if (t.isVariableDeclaration(node)) {
          declarations = node.declarations;
        } else if (
          t.isExportDeclaration(node) &&
          t.isVariableDeclaration(node.declaration)
        ) {
          declarations = node.declaration.declarations;
        }

        for (const decl of declarations) {
          if (
            t.isVariableDeclarator(decl) &&
            t.isIdentifier(decl.id) &&
            decl.init &&
            t.isCallExpression(decl.init) &&
            t.isMemberExpression(decl.init.callee) &&
            t.isIdentifier(decl.init.callee.object, { name: 'css' }) &&
            t.isIdentifier(decl.init.callee.property) &&
            decl.init.arguments.length > 0 &&
            t.isObjectExpression(decl.init.arguments[0].expression)
          ) {
            const method = decl.init.callee.property.value;
            const name = decl.id.value;
            const init = decl.init;

            const obj = objectExpressionToObject(
              init.arguments[0].expression as ObjectExpression,
              localStaticTable,
              localKeyframesHashTable,
              localViewTransitionHashTable,
              localThemeTable,
            );

            const uniqueKey = `${fileId}-${name}`;

            if (method === 'createStatic') {
              localStaticTable[name] = obj;
              tables.staticTable[uniqueKey] = obj;
            } else if (method === 'keyframes') {
              const hash = genBase36Hash(obj, 1, 8);
              localKeyframesHashTable[name] = hash;
              tables.keyframesHashTable[uniqueKey] = hash;
              tables.keyframesObjectTable[hash] = obj;
            } else if (method === 'viewTransition') {
              const hash = genBase36Hash(obj, 1, 8);
              localViewTransitionHashTable[name] = hash;
              tables.viewTransitionHashTable[uniqueKey] = hash;
              tables.viewTransitionObjectTable[hash] = obj;
            } else if (method === 'createTheme') {
              const hash = genBase36Hash(obj, 1, 8);
              localThemeTable[name] = obj;
              tables.themeTable[uniqueKey] = obj;
              tables.createThemeObjectTable[hash] = obj;
              localCreateThemeObjectTable[hash] = obj;
            }
          }
        }
      }

      // Update cache
      fileCache[filePath] = {
        mtimeMs: stats.mtimeMs,
        staticTable: localStaticTable,
        keyframesHashTable: localKeyframesHashTable,
        viewTransitionHashTable: localViewTransitionHashTable,
        themeTable: localThemeTable,
        createThemeObjectTable: localCreateThemeObjectTable,
        hasCssUsage: true,
      };
    } catch (e) {
      // Ignore parsing errors for non-relevant files or syntax errors
    }
  }

  return tables;
}

export function extractOndemandStyles(
  obj: any,
  extractedSheets: string[],
): void {
  if (!obj || typeof obj !== 'object') return;

  const visited = new Set();
  const keyframesHashes = new Set<string>();
  const viewTransitionHashes = new Set<string>();
  let needsTheme = false;

  function walk(n: any) {
    if (!n || typeof n !== 'object' || visited.has(n)) return;
    visited.add(n);

    // Using recursion for deep traversal
    Object.values(n).forEach((val) => {
      if (typeof val === 'string') {
        if (val.startsWith('kf-')) {
          keyframesHashes.add(val.slice(3));
        } else if (val.startsWith('vt-')) {
          viewTransitionHashes.add(val.slice(3));
        } else if (!needsTheme && val.includes('var(--')) {
          needsTheme = true;
        }
      } else {
        walk(val);
      }
    });
  }
  walk(obj);

  const existingSheets = new Set(extractedSheets);
  const addSheet = (sheet: string) => {
    if (!existingSheets.has(sheet)) {
      existingSheets.add(sheet);
      extractedSheets.push(sheet);
    }
  };

  if (keyframesHashes.size > 0) {
    for (const hash of keyframesHashes) {
      const definition = tables.keyframesObjectTable[hash];
      if (definition) {
        const { styleSheet } = transpile(
          { [`@keyframes kf-${hash}`]: definition as any },
          undefined,
          '--global',
        );
        addSheet(styleSheet);
      }
    }
  }

  if (viewTransitionHashes.size > 0) {
    for (const hash of viewTransitionHashes) {
      const obj = tables.viewTransitionObjectTable[hash];
      if (obj) {
        const { styleSheet } = transpile(
          createViewTransition(obj, hash),
          undefined,
          '--global',
        );
        addSheet(styleSheet);
      }
    }
  }

  if (needsTheme) {
    for (const themeVarName in tables.themeTable) {
      const themeObj = tables.themeTable[themeVarName];
      const hash = genBase36Hash(themeObj, 1, 8);
      const definition = tables.createThemeObjectTable[hash];

      if (definition && typeof definition === 'object') {
        const styles = createTheme(definition as Record<string, any>);
        const { styleSheet } = transpile(styles, undefined, '--global');
        addSheet(styleSheet);
      }
    }
  }
}

export function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  const result = { ...target };

  for (const key in source) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (result[key] && typeof result[key] === 'object') {
        result[key] = deepMerge(result[key], val);
      } else {
        result[key] = val;
      }
    } else {
      result[key] = val;
    }
  }

  return result;
}
