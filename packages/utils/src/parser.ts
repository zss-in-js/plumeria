import type {
  CSSObject,
  CSSValue,
  ThemeTable,
  Tables,
  StaticTable,
  KeyframesHashTable,
  KeyframesObjectTable,
  ViewTransitionHashTable,
  ViewTransitionObjectTable,
  CreateThemeObjectTable,
  CreateHashTable,
  CreateObjectTable,
  VariantsHashTable,
  VariantsObjectTable,
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
import { getStyleRecords } from './create';
import type { StyleRecord } from './create';

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
  createHashTable: {},
  createObjectTable: {},
  variantsHashTable: {},
  variantsObjectTable: {},
};

/* 
These internal functions are executed through the loader function, so they are already comprehensively covered by the current tests.
Implementation details: These are implementation details that are not exposed, and you end up testing the implementation instead of the behavior.
 */

export function objectExpressionToObject(
  node: ObjectExpression,
  staticTable: StaticTable,
  keyframesHashTable: KeyframesHashTable,
  viewTransitionHashTable: ViewTransitionHashTable,
  themeTable: ThemeTable,
  createHashTable: CreateHashTable,
  variantsHashTable: VariantsHashTable,
  resolveVariable?: (name: string) => any,
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
      if (resolveVariable && t.isMemberExpression(val)) {
        if (t.isIdentifier(val.object) && t.isIdentifier(val.property)) {
          const resolved = resolveVariable(val.object.value);
          const prop = val.property.value;
          if (resolved && resolved[prop]) {
            obj[key] = resolved[prop];
            return;
          }
        }
      }

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
      const resolvedCreate = resolveCreateTableMemberExpression(
        val,
        createHashTable,
      );
      if (resolvedCreate !== undefined) {
        obj[key] = 'cr-' + resolvedCreate;
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
      const resolvedVariants = resolveVariantsTableMemberExpression(
        val,
        variantsHashTable,
      );
      if (resolvedVariants !== undefined) {
        obj[key] = 'vr-' + resolvedVariants;
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
        createHashTable,
        variantsHashTable,
        resolveVariable,
      );
    } else if (t.isMemberExpression(val)) {
      const resolved = resolveStaticTableMemberExpression(val, staticTable);
      obj[key] = resolved !== undefined ? resolved : '[unresolved]';
    } else if (t.isIdentifier(val)) {
      if (resolveVariable) {
        const resolved = resolveVariable(val.value);
        if (resolved !== undefined) {
          obj[key] = resolved;
          return;
        }
      }
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

export function collectLocalConsts(ast: Module): Record<string, any> {
  const localConsts: Record<string, any> = {};
  const decls = new Map<string, any>();

  traverse(ast, {
    VariableDeclarator({ node }: { node: VariableDeclarator }) {
      if (t.isIdentifier(node.id) && node.init) {
        decls.set(node.id.value, node.init);
      }
    },
  });

  const visiting = new Set<string>();

  function resolveValue(name: string): any {
    if (localConsts[name] !== undefined) return localConsts[name];
    if (!decls.has(name) || visiting.has(name)) return undefined;

    visiting.add(name);
    const init = decls.get(name);
    let result: any;

    if (
      t.isStringLiteral(init) ||
      t.isNumericLiteral(init) ||
      t.isBooleanLiteral(init)
    ) {
      result = init.value;
    } else if (t.isObjectExpression(init)) {
      result = objectExpressionToObject(
        init,
        localConsts,
        tables.keyframesHashTable,
        tables.viewTransitionHashTable,
        tables.themeTable,
        tables.createHashTable,
        tables.variantsHashTable,
        resolveValue,
      );
    }

    visiting.delete(name);
    if (result !== undefined) {
      localConsts[name] = result;
    }
    return result;
  }

  for (const name of decls.keys()) {
    resolveValue(name);
  }

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

function resolveCreateTableMemberExpression(
  node: Identifier | MemberExpression,
  createHashTable: CreateHashTable,
): string | undefined {
  if (t.isIdentifier(node)) {
    return createHashTable[node.value];
  }
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object)) {
      return createHashTable[node.object.value];
    }
  }
}

function resolveVariantsTableMemberExpression(
  node: Identifier | MemberExpression,
  variantsHashTable: VariantsHashTable,
): string | undefined {
  if (t.isIdentifier(node)) {
    return variantsHashTable[node.value];
  }
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object)) {
      return variantsHashTable[node.object.value];
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
  keyframesObjectTable: KeyframesObjectTable;
  viewTransitionHashTable: ViewTransitionHashTable;
  viewTransitionObjectTable: ViewTransitionObjectTable;
  themeTable: ThemeTable;
  createThemeObjectTable: CreateThemeObjectTable;
  createHashTable: CreateHashTable;
  createObjectTable: CreateObjectTable;
  variantsHashTable: VariantsHashTable;
  variantsObjectTable: VariantsObjectTable;
  hasCssUsage: boolean;
}

const fileCache: Record<string, CachedData> = {};

export function scanAll(addDependency: (path: string) => void): Tables {
  const localTables: Tables = {
    staticTable: {},
    themeTable: {},
    keyframesHashTable: {},
    keyframesObjectTable: {},
    viewTransitionHashTable: {},
    viewTransitionObjectTable: {},
    createThemeObjectTable: {},
    createHashTable: {},
    createObjectTable: {},
    variantsHashTable: {},
    variantsObjectTable: {},
  };

  const files = fs.globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    try {
      const stats = fs.statSync(filePath);
      const cached = fileCache[filePath];

      if (cached && cached.mtimeMs === stats.mtimeMs) {
        if (cached.hasCssUsage) {
          addDependency(filePath);
          for (const key of Object.keys(cached.staticTable)) {
            localTables.staticTable[`${filePath}-${key}`] =
              cached.staticTable[key];
          }
          for (const key of Object.keys(cached.keyframesHashTable)) {
            localTables.keyframesHashTable[`${filePath}-${key}`] =
              cached.keyframesHashTable[key];
          }
          for (const key of Object.keys(cached.keyframesObjectTable)) {
            localTables.keyframesObjectTable[key] =
              cached.keyframesObjectTable[key];
          }
          for (const key of Object.keys(cached.viewTransitionHashTable)) {
            localTables.viewTransitionHashTable[`${filePath}-${key}`] =
              cached.viewTransitionHashTable[key];
          }
          for (const key of Object.keys(cached.viewTransitionObjectTable)) {
            localTables.viewTransitionObjectTable[key] =
              cached.viewTransitionObjectTable[key];
          }
          for (const key of Object.keys(cached.themeTable)) {
            localTables.themeTable[`${filePath}-${key}`] =
              cached.themeTable[key];
          }
          for (const key of Object.keys(cached.createThemeObjectTable)) {
            localTables.createThemeObjectTable[key] =
              cached.createThemeObjectTable[key];
          }
          for (const key of Object.keys(cached.createHashTable)) {
            localTables.createHashTable[`${filePath}-${key}`] =
              cached.createHashTable[key];
          }
          for (const key of Object.keys(cached.createObjectTable)) {
            localTables.createObjectTable[key] = cached.createObjectTable[key];
          }
          for (const key of Object.keys(cached.variantsHashTable)) {
            localTables.variantsHashTable[`${filePath}-${key}`] =
              cached.variantsHashTable[key];
          }
          for (const key of Object.keys(cached.variantsObjectTable)) {
            localTables.variantsObjectTable[key] =
              cached.variantsObjectTable[key];
          }
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
          keyframesObjectTable: {},
          viewTransitionHashTable: {},
          viewTransitionObjectTable: {},
          themeTable: {},
          createThemeObjectTable: {},
          createHashTable: {},
          createObjectTable: {},
          variantsHashTable: {},
          variantsObjectTable: {},
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

      const localStaticTable: StaticTable = {};
      const localKeyframesHashTable: KeyframesHashTable = {};
      const localKeyframesObjectTable: KeyframesObjectTable = {};
      const localViewTransitionHashTable: ViewTransitionHashTable = {};
      const localViewTransitionObjectTable: ViewTransitionObjectTable = {};
      const localThemeTable: ThemeTable = {};
      const localCreateThemeObjectTable: CreateThemeObjectTable = {};
      const localCreateHashTable: CreateHashTable = {};
      const localCreateObjectTable: CreateObjectTable = {};
      const localVariantsHashTable: VariantsHashTable = {};
      const localVariantsObjectTable: VariantsObjectTable = {};

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

            const resolveVariable = (name: string) => {
              const hash = localCreateHashTable[name];
              if (hash && localCreateObjectTable[hash]) {
                return localCreateObjectTable[hash];
              }
              return undefined;
            };

            const obj = objectExpressionToObject(
              init.arguments[0].expression as ObjectExpression,
              localStaticTable,
              localKeyframesHashTable,
              localViewTransitionHashTable,
              localThemeTable,
              localCreateHashTable,
              localVariantsHashTable,
              resolveVariable,
            );

            const uniqueKey = `${filePath}-${name}`;

            if (method === 'createStatic') {
              localStaticTable[name] = obj;
              localTables.staticTable[uniqueKey] = obj;
            } else if (method === 'keyframes') {
              const hash = genBase36Hash(obj, 1, 8);
              localKeyframesHashTable[name] = hash;
              localTables.keyframesHashTable[uniqueKey] = hash;
              localTables.keyframesObjectTable[hash] = obj;
              localKeyframesObjectTable[hash] = obj;
            } else if (method === 'viewTransition') {
              const hash = genBase36Hash(obj, 1, 8);
              localViewTransitionHashTable[name] = hash;
              localTables.viewTransitionHashTable[uniqueKey] = hash;
              localTables.viewTransitionObjectTable[hash] = obj;
              localViewTransitionObjectTable[hash] = obj;
            } else if (method === 'createTheme') {
              const hash = genBase36Hash(obj, 1, 8);
              localThemeTable[name] = obj;
              localTables.themeTable[uniqueKey] = obj;
              localTables.createThemeObjectTable[hash] = obj;
              localCreateThemeObjectTable[hash] = obj;
            } else if (method === 'create') {
              const hash = genBase36Hash(obj, 1, 8);
              localCreateHashTable[name] = hash;
              localTables.createHashTable[uniqueKey] = hash;
              localTables.createObjectTable[hash] = obj;
              localCreateObjectTable[hash] = obj;
            } else if (method === 'variants') {
              const hash = genBase36Hash(obj, 1, 8);
              localVariantsHashTable[name] = hash;
              localTables.variantsHashTable[uniqueKey] = hash;
              localTables.variantsObjectTable[hash] = obj;
              localVariantsObjectTable[hash] = obj;
            }
          }
        }
      }

      // Update cache
      fileCache[filePath] = {
        mtimeMs: stats.mtimeMs,
        staticTable: localStaticTable,
        keyframesHashTable: localKeyframesHashTable,
        keyframesObjectTable: localKeyframesObjectTable,
        viewTransitionHashTable: localViewTransitionHashTable,
        viewTransitionObjectTable: localViewTransitionObjectTable,
        themeTable: localThemeTable,
        createThemeObjectTable: localCreateThemeObjectTable,
        createHashTable: localCreateHashTable,
        createObjectTable: localCreateObjectTable,
        variantsHashTable: localVariantsHashTable,
        variantsObjectTable: localVariantsObjectTable,
        hasCssUsage: true,
      };
    } catch (e) {
      // Ignore parsing errors for non-relevant files or syntax errors
    }
  }

  return localTables;
}

export function extractOndemandStyles(
  obj: any,
  extractedSheets: string[],
  t: Tables = tables,
): void {
  if (!obj || typeof obj !== 'object') return;

  const visited = new Set();
  const keyframesHashes = new Set<string>();
  const viewTransitionHashes = new Set<string>();
  const createHashes = new Set<string>();
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
        } else if (val.startsWith('cr-')) {
          createHashes.add(val.slice(3));
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
      const definition = t.keyframesObjectTable[hash];
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
      const obj = t.viewTransitionObjectTable[hash];
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

  if (createHashes.size > 0) {
    for (const hash of createHashes) {
      const obj = t.createObjectTable[hash];
      if (obj) {
        Object.entries(obj).forEach(([key, style]) => {
          const records = getStyleRecords(key, style as any, 2);
          records.forEach((r: StyleRecord) => addSheet(r.sheet));
        });
      }
    }
  }

  if (needsTheme) {
    for (const themeVarName in t.themeTable) {
      const themeObj = t.themeTable[themeVarName];
      const hash = genBase36Hash(themeObj, 1, 8);
      const definition = t.createThemeObjectTable[hash];

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
