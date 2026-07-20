import type {
  CSSObject,
  CSSValue,
  Tables,
  StaticTable,
  KeyframesHashTable,
  KeyframesObjectTable,
  ViewTransitionHashTable,
  ViewTransitionObjectTable,
  CreateHashTable,
  CreateObjectTable,
  CreateAtomicMapTable,
  VariantsHashTable,
  VariantsObjectTable,
  CreateThemeHashTable,
  CreateThemeObjectTable,
  CreateThemeSelectorTable,
  CreateStaticHashTable,
  CreateStaticObjectTable,
  CreateTheme,
  TableEntry,
} from './types';

import { createTheme } from './createTheme';

import { parseSync } from '@swc/core';
import type {
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
  ParenthesisExpression,
  VariableDeclaration,
  VariableDeclarator,
  ExportDeclaration,
  ConditionalExpression,
  ImportSpecifier,
  HasSpan,
  JSXExpression,
  ArrowFunctionExpression,
  FunctionExpression,
} from '@swc/core';
import * as path from 'path';
import * as fs from 'fs';
import * as rs from '@rust-gear/glob';

import { camelToKebabCase, genBase36Hash, transpile } from 'zss-engine';
import type { CSSProperties } from 'zss-engine';
import { createViewTransition } from './viewTransition';
import { getStyleRecords } from './create';
import type { StyleRecord } from './create';
import { resolveImportPath } from './resolver';

const getMarkerVar = (id: string, pseudo: string): string => {
  const state = pseudo.replace(/:/g, '');
  return `--${id}-${state}`;
};

export const getRootIdentifier = (node: Expression): string | null => {
  if (t.isIdentifier(node)) {
    return node.value;
  }
  if (t.isMemberExpression(node)) {
    return getRootIdentifier(node.object);
  }
  if (t.isCallExpression(node)) {
    const callee = node.callee;
    if (callee.type !== 'Super' && callee.type !== 'Import') {
      return getRootIdentifier(callee as Expression);
    }
  }
  if (node.type === 'ParenthesisExpression') {
    return getRootIdentifier(node.expression);
  }
  return null;
};

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
  isParenthesisExpression: (node: any): node is ParenthesisExpression =>
    node?.type === 'ParenthesisExpression',
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
  isArrowFunctionExpression: (node: any): node is ArrowFunctionExpression =>
    node?.type === 'ArrowFunctionExpression',
  isFunctionExpression: (node: any): node is FunctionExpression =>
    node?.type === 'FunctionExpression',
};

export function traverse(
  node: Module | JSXExpression,
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

/*
These internal functions are executed through the loader function, so they are already comprehensively covered by the current tests.
Implementation details: These are implementation details that are not exposed, and you end up testing the implementation instead of the behavior.
*/

export function objectExpressionToObject(
  node: ObjectExpression,
  staticTable: StaticTable,
  keyframesHashTable: KeyframesHashTable,
  viewTransitionHashTable: ViewTransitionHashTable,
  createThemeHashTable: CreateThemeHashTable,
  createThemeObjectTable: CreateThemeObjectTable,
  createHashTable: CreateHashTable,
  createStaticHashTable: CreateStaticHashTable,
  createStaticObjectTable: CreateStaticObjectTable,
  variantsHashTable: VariantsHashTable,
  resolveVariable?: (name: string) => any,
): CSSObject {
  const obj: CSSObject = {};

  node.properties.forEach((prop) => {
    if (prop.type === 'SpreadElement') {
      const arg = prop.arguments;
      const spreadVal = evaluateExpression(
        arg,
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        createThemeHashTable,
        createThemeObjectTable,
        createStaticHashTable,
        createStaticObjectTable,
      );
      if (typeof spreadVal === 'object' && spreadVal !== null) {
        Object.assign(obj, deepMerge(obj, spreadVal));
      }
      return;
    }

    // Handle shorthand properties: { width } => { width: width }
    if (t.isIdentifier(prop) && !t.isObjectProperty(prop)) {
      const key = prop.value;
      if (resolveVariable) {
        const resolved = resolveVariable(key);
        if (resolved !== undefined) {
          obj[key] = resolved;
          return;
        }
      }
      if (staticTable[key] !== undefined) {
        obj[key] = staticTable[key];
      }
      return;
    }

    if (!t.isObjectProperty(prop)) return;

    const key = getPropertyKey(
      prop.key,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      createThemeHashTable,
      createThemeObjectTable,
      createStaticHashTable,
      createStaticObjectTable,
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
      const resolvedTheme = resolveCreateThemeTableMemberExpressionByNode(
        val,
        createThemeHashTable,
        createThemeObjectTable,
      );
      if (resolvedTheme !== undefined) {
        obj[key] = resolvedTheme;
        return;
      }
      const resolvedStatic = resolveCreateStaticTableMemberExpression(
        val,
        createStaticHashTable,
        createStaticObjectTable,
      );
      if (resolvedStatic !== undefined) {
        obj[key] = resolvedStatic;
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
        createThemeHashTable,
        createThemeObjectTable,
        createHashTable,
        createStaticHashTable,
        createStaticObjectTable,
        variantsHashTable,
        resolveVariable,
      );
    } else if (t.isBinaryExpression(val) || t.isTemplateLiteral(val)) {
      const resolved = evaluateExpression(
        val,
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        createThemeHashTable,
        createThemeObjectTable,
        createStaticHashTable,
        createStaticObjectTable,
      );
      if (resolved !== undefined) {
        obj[key] = resolved as CSSObject;
      }
    } else if (t.isMemberExpression(val)) {
      const resolved = resolveStaticTableMemberExpression(val, staticTable);
      if (resolved !== undefined) {
        obj[key] = resolved;
      }
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
      }
    }
  });

  return obj;
}

export function collectLocalConsts(ast: Module): Record<string, any> {
  const localConsts: Record<string, any> = {};
  const decls = new Map<string, any>();

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
        decl.init
      ) {
        decls.set(decl.id.value, decl.init);
      }
    }
  }

  const visiting = new Set<string>();

  function resolveValue(name: string): any {
    if (localConsts[name] !== undefined) return localConsts[name];
    if (!decls.has(name) || visiting.has(name)) return undefined;

    visiting.add(name);
    const init = decls.get(name);
    let result: any;
    try {
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
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          resolveValue,
        );
      } else if (
        t.isBinaryExpression(init) ||
        t.isTemplateLiteral(init) ||
        t.isUnaryExpression(init)
      ) {
        result = evaluateExpression(init, localConsts, {}, {}, {}, {}, {}, {});
      }
    } catch (e) {
      // Ignore
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
  createThemeHashTable: CreateThemeHashTable,
  createThemeObjectTable: CreateThemeObjectTable,
  createStaticHashTable: CreateStaticHashTable,
  createStaticObjectTable: CreateStaticObjectTable,
): string | number {
  if (t.isIdentifier(node)) {
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
    if (t.isCallExpression(expr)) {
      const result = evaluateExpression(
        expr,
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        createThemeHashTable,
        createThemeObjectTable,
        createStaticHashTable,
        createStaticObjectTable,
      );
      if (typeof result === 'string') return result;
    }
    if (t.isMemberExpression(expr)) {
      const result = resolveStaticTableMemberExpression(expr, staticTable);
      if (typeof result === 'string') return result;

      const staticResult = resolveCreateStaticTableMemberExpression(
        expr,
        createStaticHashTable,
        createStaticObjectTable,
      );
      if (typeof staticResult === 'string') return staticResult;

      const themeResult = resolveCreateThemeTableMemberExpressionByNode(
        expr,
        createThemeHashTable,
        createThemeObjectTable,
      );
      if (typeof themeResult === 'string') return themeResult;
    }
    if (t.isTemplateLiteral(expr)) {
      return evaluateTemplateLiteral(
        expr,
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        createThemeHashTable,
        createThemeObjectTable,
        createStaticHashTable,
        createStaticObjectTable,
      );
    }
    if (t.isBinaryExpression(expr)) {
      return evaluateBinaryExpression(
        expr,
        staticTable,
        keyframesHashTable,
        viewTransitionHashTable,
        createThemeHashTable,
        createThemeObjectTable,
        createStaticHashTable,
        createStaticObjectTable,
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
      createThemeHashTable,
      createThemeObjectTable,
      createStaticHashTable,
      createStaticObjectTable,
    );
  }

  if (t.isBinaryExpression(node)) {
    return evaluateBinaryExpression(
      node,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      createThemeHashTable,
      createThemeObjectTable,
      createStaticHashTable,
      createStaticObjectTable,
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
  createThemeHashTable: CreateThemeHashTable,
  createThemeObjectTable: CreateThemeObjectTable,
  createStaticHashTable: CreateStaticHashTable,
  createStaticObjectTable: CreateStaticObjectTable,
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
        createThemeHashTable,
        createThemeObjectTable,
        createStaticHashTable,
        createStaticObjectTable,
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
  createThemeHashTable: CreateThemeHashTable,
  createThemeObjectTable: CreateThemeObjectTable,
  createStaticHashTable: CreateStaticHashTable,
  createStaticObjectTable: CreateStaticObjectTable,
): string | number {
  const left = evaluateExpression(
    node.left as Expression,
    staticTable,
    keyframesHashTable,
    viewTransitionHashTable,
    createThemeHashTable,
    createThemeObjectTable,
    createStaticHashTable,
    createStaticObjectTable,
  );
  const right = evaluateExpression(
    node.right as Expression,
    staticTable,
    keyframesHashTable,
    viewTransitionHashTable,
    createThemeHashTable,
    createThemeObjectTable,
    createStaticHashTable,
    createStaticObjectTable,
  );

  if (typeof left === 'number' && typeof right === 'number') {
    if (node.operator === '+') {
      return left + right;
    }
    if (node.operator === '-') {
      return left - right;
    }
    if (node.operator === '*') {
      return left * right;
    }
    if (node.operator === '/') {
      return left / right;
    }
    if (node.operator === '%') {
      return left % right;
    }
    if (node.operator === '**') {
      return left ** right;
    }
    if (node.operator === '&') {
      return left & right;
    }
    if (node.operator === '<<') {
      return left << right;
    }
    if (node.operator === '>>') {
      return left >> right;
    }
    if (node.operator === '>>>') {
      return left >>> right;
    }
    if (node.operator === '^') {
      return left ^ right;
    }
    if (node.operator === '|') {
      return left | right;
    }
  }

  if (node.operator === '+') {
    return String(left) + String(right);
  }

  throw new Error(`[plumeria] Unsupported binary operator: ${node.operator}`);
}

/* istanbul ignore next */
function evaluateCallExpression(
  node: CallExpression,
  staticTable: StaticTable,
): string | CSSObject | null {
  const callee = node.callee;
  let method: string | undefined;

  if (t.isIdentifier(callee)) {
    method = callee.value;
  } else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
    method = callee.property.value;
  }

  if (!method) return null;

  if (method === 'marker') {
    const args = node.arguments;
    if (args.length >= 2) {
      const id = evaluateExpression(
        args[0].expression,
        staticTable,
        {},
        {},
        {},
        {},
        {},
        {},
      );
      const pseudo = evaluateExpression(
        args[1].expression,
        staticTable,
        {},
        {},
        {},
        {},
        {},
        {},
      );
      if (typeof id === 'string' && typeof pseudo === 'string') {
        const varName = getMarkerVar(id, pseudo);
        return {
          [pseudo]: {
            [varName]: 1,
          },
        };
      }
    }
  }

  if (method === 'extended') {
    const args = node.arguments;
    if (args.length >= 2) {
      const id = evaluateExpression(
        args[0].expression,
        staticTable,
        {},
        {},
        {},
        {},
        {},
        {},
      );
      const pseudo = evaluateExpression(
        args[1].expression,
        staticTable,
        {},
        {},
        {},
        {},
        {},
        {},
      );
      if (typeof id === 'string' && typeof pseudo === 'string') {
        const varName = getMarkerVar(id, pseudo);
        return `@container style(${varName}: 1)`;
      }
    }
  }

  return null;
}

/* istanbul ignore next */
function evaluateExpression(
  node: Expression,
  staticTable: StaticTable,
  keyframesHashTable: KeyframesHashTable,
  viewTransitionHashTable: ViewTransitionHashTable,
  createThemeHashTable: CreateThemeHashTable,
  createThemeObjectTable: CreateThemeObjectTable,
  createStaticHashTable: CreateStaticHashTable,
  createStaticObjectTable: CreateStaticObjectTable,
): string | number | boolean | null | CSSObject {
  if (t.isCallExpression(node)) {
    return evaluateCallExpression(node, staticTable);
  }
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

    if (createStaticHashTable[node.value] !== undefined) {
      const hash = createStaticHashTable[node.value];
      if (createStaticObjectTable[hash] !== undefined) {
        return createStaticObjectTable[hash];
      }
    }

    return '';
  }

  if (t.isMemberExpression(node)) {
    const resolved = resolveStaticTableMemberExpression(node, staticTable);
    if (resolved !== undefined) {
      return resolved;
    }
    const resolvedTheme = resolveCreateThemeTableMemberExpressionByNode(
      node,
      createThemeHashTable,
      createThemeObjectTable,
    );
    if (resolvedTheme !== undefined) {
      return resolvedTheme;
    }

    const resolvedStatic = resolveCreateStaticTableMemberExpression(
      node,
      createStaticHashTable,
      createStaticObjectTable,
    );
    if (resolvedStatic !== undefined) {
      return resolvedStatic;
    }

    return '';
  }

  if (t.isBinaryExpression(node)) {
    return evaluateBinaryExpression(
      node,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      createThemeHashTable,
      createThemeObjectTable,
      createStaticHashTable,
      createStaticObjectTable,
    );
  }

  if (t.isTemplateLiteral(node)) {
    return evaluateTemplateLiteral(
      node,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      createThemeHashTable,
      createThemeObjectTable,
      createStaticHashTable,
      createStaticObjectTable,
    );
  }

  if (t.isUnaryExpression(node)) {
    return evaluateUnaryExpression(node);
  }

  if (t.isParenthesisExpression(node)) {
    return evaluateExpression(
      node.expression,
      staticTable,
      keyframesHashTable,
      viewTransitionHashTable,
      createThemeHashTable,
      createThemeObjectTable,
      createStaticHashTable,
      createStaticObjectTable,
    );
  }

  throw new Error(`[plumeria] Unsupported expression type: ${node.type}`);
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
      throw new Error(
        `[plumeria] Unsupported unary operator: ${node.operator}`,
      );
  }
  throw new Error(
    `[plumeria] Unsupported UnaryExpression argument type: ${arg.type}`,
  );
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
function resolveCreateThemeTableMemberExpressionByNode(
  node: Identifier | MemberExpression,
  createThemeHashTable: CreateThemeHashTable,
  createThemeObjectTable: CreateThemeObjectTable,
): CSSValue | undefined {
  if (t.isMemberExpression(node) && t.isIdentifier(node.object)) {
    const varName = node.object.value;
    const hash = createThemeHashTable[varName];

    if (hash) {
      const themeObj = createThemeObjectTable[hash];
      if (themeObj) {
        let key: string | undefined;
        if (t.isIdentifier(node.property)) {
          key = node.property.value;
        } else if (
          node.property.type === 'Computed' &&
          t.isStringLiteral(node.property.expression)
        ) {
          key = node.property.expression.value;
        }

        if (key && themeObj[key] !== undefined) {
          const value = themeObj[key];
          const atomicHash = genBase36Hash({ [key]: value }, 1, 8);
          const cssVarName = camelToKebabCase(key);
          return `var(--${atomicHash}-${cssVarName})`;
        }
      }
    }
  }
  return undefined;
}

function resolveCreateStaticTableMemberExpression(
  node: Identifier | MemberExpression,
  createStaticHashTable: CreateStaticHashTable,
  createStaticObjectTable: CreateStaticObjectTable,
): CSSValue | undefined {
  if (t.isMemberExpression(node) && t.isIdentifier(node.object)) {
    const varName = node.object.value;
    const hash = createStaticHashTable[varName];

    if (hash) {
      const staticObj = createStaticObjectTable[hash];
      if (staticObj) {
        let key: string | undefined;
        if (t.isIdentifier(node.property)) {
          key = node.property.value;
        } else if (
          node.property.type === 'Computed' &&
          t.isStringLiteral(node.property.expression)
        ) {
          key = node.property.expression.value;
        }

        if (key && staticObj[key] !== undefined) {
          return staticObj[key];
        }
      }
    }
  }
  return undefined;
}

// Cache for incremental scanning
interface CachedData {
  mtimeMs: number;
  dependencies?: string[];
  exports?: {
    localExports: string[];
    reExports: Record<string, { source: string | null; localName: string }>;
    starExports: string[];
  };
  staticTable: StaticTable;
  keyframesHashTable: KeyframesHashTable;
  keyframesObjectTable: KeyframesObjectTable;
  viewTransitionHashTable: ViewTransitionHashTable;
  viewTransitionObjectTable: ViewTransitionObjectTable;
  createThemeHashTable: CreateThemeHashTable;
  createThemeSelectorTable: CreateThemeSelectorTable;
  createThemeObjectTable: CreateThemeObjectTable;
  createHashTable: CreateHashTable;
  createObjectTable: CreateObjectTable;
  createAtomicMapTable: CreateAtomicMapTable;
  variantsHashTable: VariantsHashTable;
  variantsObjectTable: VariantsObjectTable;
  createStaticHashTable: CreateStaticHashTable;
  createStaticObjectTable: CreateStaticObjectTable;
  componentPropsTable?: Record<string, Record<string, TableEntry[]>>;
  hasCssUsage: boolean;
}

const fileCache: Record<string, CachedData> = {};

// Global reverse dependency map and known file tracking for incremental updates
const dependentsMap = new Map<string, Set<string>>();
let knownFiles = new Set<string>();

function updateDependencyEdges(
  filePath: string,
  oldDeps: string[] | undefined,
  newDeps: string[] | undefined,
) {
  if (oldDeps) {
    for (const dep of oldDeps) {
      dependentsMap.get(dep)?.delete(filePath);
    }
  }
  if (newDeps) {
    for (const dep of newDeps) {
      let set = dependentsMap.get(dep);
      if (!set) {
        set = new Set();
        dependentsMap.set(dep, set);
      }
      set.add(filePath);
    }
  }
}

const globalAgregatedTables: Tables = {
  staticTable: {},
  keyframesHashTable: {},
  keyframesObjectTable: {},
  viewTransitionHashTable: {},
  viewTransitionObjectTable: {},
  createThemeObjectTable: {},
  createThemeSelectorTable: {},
  createHashTable: {},
  createObjectTable: {},
  createAtomicMapTable: {},
  variantsHashTable: {},
  variantsObjectTable: {},
  createThemeHashTable: {},
  createStaticHashTable: {},
  createStaticObjectTable: {},
  componentPropsTable: {},
};
let hasComputedOnce = false;

// Content-hash-keyed "Object" tables (keyframesObjectTable, createObjectTable,
// etc.) have keys derived purely from style content, not from the file that
// wrote them, so two files can legitimately share one entry. Reference-count
// each entry by contributing file so it can be safely removed once its last
// owning file is invalidated/deleted, without disturbing an entry another
// live file still relies on.
const objectTableOwners = new Map<string, Set<string>>();

function registerObjectOwner(
  tableName: string,
  hash: string,
  filePath: string,
) {
  const key = `${tableName}:${hash}`;
  let owners = objectTableOwners.get(key);
  if (!owners) {
    owners = new Set();
    objectTableOwners.set(key, owners);
  }
  owners.add(filePath);
}

function releaseObjectOwner(
  tableName: string,
  hash: string,
  filePath: string,
  table: Record<string, unknown>,
) {
  const key = `${tableName}:${hash}`;
  const owners = objectTableOwners.get(key);
  if (!owners) return;
  owners.delete(filePath);
  if (owners.size === 0) {
    objectTableOwners.delete(key);
    delete table[hash];
  }
}

// Removes one file's previously-recorded contributions from the persistent
// aggregated tables. Must be called with that file's OLD fileCache entry,
// and BEFORE that entry is overwritten or deleted, since the composite keys
// to remove are derived from it.
function stripFileContributions(filePath: string, cached: CachedData) {
  if (!cached.hasCssUsage) return;

  const localTables = globalAgregatedTables;
  for (const key of Object.keys(cached.staticTable)) {
    delete localTables.staticTable[`${filePath}-${key}`];
  }
  for (const key of Object.keys(cached.keyframesHashTable)) {
    delete localTables.keyframesHashTable[`${filePath}-${key}`];
  }
  for (const key of Object.keys(cached.viewTransitionHashTable)) {
    delete localTables.viewTransitionHashTable[`${filePath}-${key}`];
  }
  for (const key of Object.keys(cached.createThemeHashTable)) {
    delete localTables.createThemeHashTable[`${filePath}-${key}`];
  }
  for (const key of Object.keys(cached.createStaticHashTable)) {
    delete localTables.createStaticHashTable[`${filePath}-${key}`];
  }
  for (const key of Object.keys(cached.createHashTable)) {
    delete localTables.createHashTable[`${filePath}-${key}`];
  }
  for (const key of Object.keys(cached.variantsHashTable)) {
    delete localTables.variantsHashTable[`${filePath}-${key}`];
  }

  for (const key of Object.keys(cached.createStaticObjectTable)) {
    releaseObjectOwner(
      'createStaticObjectTable',
      key,
      filePath,
      localTables.createStaticObjectTable,
    );
  }
  for (const key of Object.keys(cached.keyframesObjectTable)) {
    releaseObjectOwner(
      'keyframesObjectTable',
      key,
      filePath,
      localTables.keyframesObjectTable,
    );
  }
  for (const key of Object.keys(cached.viewTransitionObjectTable)) {
    releaseObjectOwner(
      'viewTransitionObjectTable',
      key,
      filePath,
      localTables.viewTransitionObjectTable,
    );
  }
  for (const key of Object.keys(cached.createThemeObjectTable)) {
    releaseObjectOwner(
      'createThemeObjectTable',
      key,
      filePath,
      localTables.createThemeObjectTable,
    );
  }
  for (const key of Object.keys(cached.createThemeSelectorTable)) {
    releaseObjectOwner(
      'createThemeSelectorTable',
      key,
      filePath,
      localTables.createThemeSelectorTable,
    );
  }
  for (const key of Object.keys(cached.createObjectTable)) {
    releaseObjectOwner(
      'createObjectTable',
      key,
      filePath,
      localTables.createObjectTable,
    );
  }
  for (const key of Object.keys(cached.createAtomicMapTable)) {
    releaseObjectOwner(
      'createAtomicMapTable',
      key,
      filePath,
      localTables.createAtomicMapTable,
    );
  }
  for (const key of Object.keys(cached.variantsObjectTable)) {
    releaseObjectOwner(
      'variantsObjectTable',
      key,
      filePath,
      localTables.variantsObjectTable,
    );
  }

  if (cached.componentPropsTable) {
    const table = localTables.componentPropsTable!;
    for (const compKey of Object.keys(cached.componentPropsTable)) {
      const propTable = table[compKey];
      if (!propTable) continue;
      for (const propName of Object.keys(cached.componentPropsTable[compKey])) {
        const entries = propTable[propName];
        if (!entries) continue;
        const filtered = entries.filter((x) => x.filePath !== filePath);
        if (filtered.length > 0) {
          propTable[propName] = filtered;
        } else {
          delete propTable[propName];
        }
      }
      if (Object.keys(propTable).length === 0) {
        delete table[compKey];
      }
    }
  }
}

export function scanAll(): Tables {
  if (hasComputedOnce && process.env.NODE_ENV === 'production') {
    return globalAgregatedTables;
  }

  const localTables = globalAgregatedTables;

  const files = rs.globSync(PATTERN_PATH, GLOB_OPTIONS);
  const currentFiles = new Set(files);

  // Detect deleted files
  const deletedFiles: string[] = [];
  for (const fp of knownFiles) {
    if (!currentFiles.has(fp)) deletedFiles.push(fp);
  }
  knownFiles = currentFiles;

  // Detect changed files and files affected by them using dependentsMap (BFS)
  const invalidated = new Set<string>();
  const queue: string[] = [];

  for (const filePath of files) {
    try {
      const stats = fs.statSync(filePath);
      const cached = fileCache[filePath];
      if (!cached || cached.mtimeMs !== stats.mtimeMs) {
        invalidated.add(filePath);
        queue.push(filePath);
      }
    } catch (e) {
      invalidated.add(filePath);
      queue.push(filePath);
    }
  }
  for (const fp of deletedFiles) {
    invalidated.add(fp);
    queue.push(fp);
  }

  while (queue.length > 0) {
    const fp = queue.shift()!;
    const deps = dependentsMap.get(fp);
    if (deps) {
      for (const dep of deps) {
        if (!invalidated.has(dep)) {
          invalidated.add(dep);
          queue.push(dep);
        }
      }
    }
  }

  // Return the most recent aggregated data immediately if there are no changes
  if (invalidated.size === 0 && hasComputedOnce) {
    return localTables;
  }

  // Strip deleted files' stale contributions, then clean up cache/dependency edges
  for (const fp of deletedFiles) {
    const cached = fileCache[fp];
    if (cached) stripFileContributions(fp, cached);
    updateDependencyEdges(fp, cached?.dependencies, undefined);
    delete fileCache[fp];
  }

  // Only invalidated files need work. Their stale contributions are stripped
  // BEFORE reparsing below — cross-file resolution during the 2-pass scan must
  // not see a changed file's old data. Files whose cache is still valid are
  // left untouched in `localTables`: no per-file copy work at all.
  const uncachedFiles = files.filter((f) => invalidated.has(f));
  for (const filePath of uncachedFiles) {
    const cached = fileCache[filePath];
    if (cached) stripFileContributions(filePath, cached);
  }

  // Parsing of uncached or modified files
  const parsedFiles: { filePath: string; ast: Module; mtimeMs: number }[] = [];
  for (const filePath of uncachedFiles) {
    try {
      const stats = fs.statSync(filePath);
      const source = fs.readFileSync(filePath, 'utf8');
      if (!source.includes('@plumeria/core')) {
        // Store an empty record in the cache and clear old dependency edges
        updateDependencyEdges(
          filePath,
          fileCache[filePath]?.dependencies,
          undefined,
        );
        fileCache[filePath] = {
          mtimeMs: stats.mtimeMs,
          staticTable: {},
          keyframesHashTable: {},
          keyframesObjectTable: {},
          viewTransitionHashTable: {},
          viewTransitionObjectTable: {},
          createThemeHashTable: {},
          createThemeSelectorTable: {},
          createThemeObjectTable: {},
          createHashTable: {},
          createObjectTable: {},
          createAtomicMapTable: {},
          variantsHashTable: {},
          variantsObjectTable: {},
          createStaticHashTable: {},
          createStaticObjectTable: {},
          hasCssUsage: false,
        };
        continue;
      }

      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: true,
        target: 'es2022',
      });
      parsedFiles.push({ filePath, ast, mtimeMs: stats.mtimeMs });
    } catch (e) {
      // ignore
    }
  }

  // 2 pass scanning
  for (let passNumber = 1; passNumber <= 2; passNumber++) {
    const isFirstPass = passNumber === 1;

    for (const { filePath, ast, mtimeMs } of parsedFiles) {
      try {
        const localDependencies = new Set<string>();
        const localStaticTable: StaticTable = {};
        const localKeyframesHashTable: KeyframesHashTable = {};
        const localKeyframesObjectTable: KeyframesObjectTable = {};
        const localViewTransitionHashTable: ViewTransitionHashTable = {};
        const localViewTransitionObjectTable: ViewTransitionObjectTable = {};
        const localCreateThemeObjectTable: CreateThemeObjectTable = {};
        const localCreateThemeSelectorTable: CreateThemeSelectorTable = {};
        const localCreateHashTable: CreateHashTable = {};
        const localCreateObjectTable: CreateObjectTable = {};
        const localCreateAtomicMapTable: CreateAtomicMapTable = {};
        const localVariantsHashTable: VariantsHashTable = {};
        const localVariantsObjectTable: VariantsObjectTable = {};
        const localCreateThemeHashTable: CreateThemeHashTable = {};
        const localCreateStaticHashTable: CreateStaticHashTable = {};
        const localCreateStaticObjectTable: CreateStaticObjectTable = {};
        const plumeriaAliases: Record<string, string> = {};
        const localImports: Record<
          string,
          { actualPath: string; importedName: string }
        > = {};

        for (const node of ast.body) {
          if (node.type === 'ImportDeclaration') {
            const sourceValue = node.source.value;
            if (sourceValue === '@plumeria/core') {
              node.specifiers.forEach((specifier: ImportSpecifier) => {
                if (specifier.type === 'ImportNamespaceSpecifier') {
                  if (specifier.local) {
                    plumeriaAliases[specifier.local.value] = 'NAMESPACE';
                  }
                } else if (specifier.type === 'ImportSpecifier') {
                  const importedName = specifier.imported
                    ? specifier.imported.value
                    : specifier.local.value;
                  const localName = specifier.local.value;
                  plumeriaAliases[localName] = importedName;
                } else if (specifier.type === 'ImportDefaultSpecifier') {
                  if (specifier.local) {
                    plumeriaAliases[specifier.local.value] = 'NAMESPACE';
                  }
                }
              });
            } else {
              const actualPath = resolveImportPath(sourceValue, filePath);
              if (actualPath) {
                localDependencies.add(actualPath);
                node.specifiers.forEach((specifier: ImportSpecifier) => {
                  if (
                    specifier.type === 'ImportSpecifier' ||
                    specifier.type === 'ImportDefaultSpecifier'
                  ) {
                    const importedName =
                      specifier.type === 'ImportDefaultSpecifier'
                        ? 'default'
                        : specifier.imported
                          ? specifier.imported.value
                          : specifier.local.value;
                    const localName = specifier.local.value;
                    let resolvedKey = `${actualPath}-${importedName}`;
                    const resolved = resolveExport(actualPath, importedName);
                    if (resolved) {
                      resolvedKey = `${resolved.filePath}-${resolved.localName}`;
                    }
                    const uniqueKey = resolvedKey;
                    localImports[localName] = { actualPath, importedName };

                    if (localTables.createStaticHashTable[uniqueKey]) {
                      const hash = localTables.createStaticHashTable[uniqueKey];
                      localCreateStaticHashTable[localName] = hash;
                      if (localTables.createStaticObjectTable[hash]) {
                        localCreateStaticObjectTable[hash] =
                          localTables.createStaticObjectTable[hash];
                      }
                    }
                    if (localTables.createThemeHashTable[uniqueKey]) {
                      const hash = localTables.createThemeHashTable[uniqueKey];
                      localCreateThemeHashTable[localName] = hash;
                      if (localTables.createThemeObjectTable[hash]) {
                        localCreateThemeObjectTable[hash] =
                          localTables.createThemeObjectTable[hash];
                      }
                    }
                    if (localTables.keyframesHashTable[uniqueKey]) {
                      const hash = localTables.keyframesHashTable[uniqueKey];
                      localKeyframesHashTable[localName] = hash;
                      if (localTables.keyframesObjectTable[hash]) {
                        localKeyframesObjectTable[hash] =
                          localTables.keyframesObjectTable[hash];
                      }
                    }
                    if (localTables.viewTransitionHashTable[uniqueKey]) {
                      const hash =
                        localTables.viewTransitionHashTable[uniqueKey];
                      localViewTransitionHashTable[localName] = hash;
                      if (localTables.viewTransitionObjectTable[hash]) {
                        localViewTransitionObjectTable[hash] =
                          localTables.viewTransitionObjectTable[hash];
                      }
                    }
                    if (localTables.createHashTable[uniqueKey]) {
                      const hash = localTables.createHashTable[uniqueKey];
                      localCreateHashTable[localName] = hash;
                    }
                  }
                });
              }
            }
          } else if (node.type === 'ExportNamedDeclaration') {
            if (node.source) {
              const actualPath = resolveImportPath(node.source.value, filePath);
              if (actualPath) {
                localDependencies.add(actualPath);
              }
            }
          } else if (node.type === 'ExportAllDeclaration') {
            if (node.source) {
              const actualPath = resolveImportPath(node.source.value, filePath);
              if (actualPath) {
                localDependencies.add(actualPath);
              }
            }
          }
        }

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
              t.isCallExpression(decl.init)
            ) {
              const callee = decl.init.callee;
              let method: string | undefined;

              if (
                t.isMemberExpression(callee) &&
                t.isIdentifier(callee.object) &&
                t.isIdentifier(callee.property)
              ) {
                const objectName = callee.object.value;
                const propertyName = callee.property.value;
                const alias = plumeriaAliases[objectName];
                if (alias === 'NAMESPACE') {
                  method = propertyName;
                }
              } else if (t.isIdentifier(callee)) {
                const calleeName = callee.value;
                const originalName = plumeriaAliases[calleeName];
                if (originalName) {
                  method = originalName;
                }
              }

              const isCreateTheme = method === 'createTheme';
              if (
                method &&
                decl.init.arguments.length > 0 &&
                ((!isCreateTheme &&
                  t.isObjectExpression(decl.init.arguments[0].expression)) ||
                  (isCreateTheme &&
                    decl.init.arguments.length >= 2 &&
                    t.isObjectExpression(decl.init.arguments[1].expression)))
              ) {
                const name = decl.id.value;
                const init = decl.init;

                const resolveVariable = (name: string) => {
                  const hash = localCreateHashTable[name];
                  if (hash && localCreateObjectTable[hash]) {
                    return localCreateObjectTable[hash];
                  }
                  return undefined;
                };

                const objExpression = isCreateTheme
                  ? (init.arguments[1].expression as ObjectExpression)
                  : (init.arguments[0].expression as ObjectExpression);

                const obj = objectExpressionToObject(
                  objExpression,
                  localStaticTable,
                  localKeyframesHashTable,
                  localViewTransitionHashTable,
                  localCreateThemeHashTable,
                  localCreateThemeObjectTable,
                  localCreateHashTable,
                  localCreateStaticHashTable,
                  localCreateStaticObjectTable,
                  localVariantsHashTable,
                  resolveVariable,
                );

                const uniqueKey = `${filePath}-${name}`;

                // Two-pass scanning:
                // Pass 1: Collect all createStatic, createTheme, keyframes, and viewTransition definitions for global resolution
                // Pass 2: Process css.create and variants (with all global definitions available)

                const isPassOneMethod =
                  method === 'createStatic' ||
                  method === 'createTheme' ||
                  method === 'keyframes' ||
                  method === 'viewTransition';
                if (isFirstPass && !isPassOneMethod) continue;

                if (method === 'createStatic') {
                  localStaticTable[name] = obj;
                  localTables.staticTable[uniqueKey] = obj;

                  const hash = genBase36Hash(obj, 1, 8);
                  localCreateStaticHashTable[name] = hash;
                  localTables.createStaticHashTable[uniqueKey] = hash;

                  localTables.createStaticObjectTable[hash] = obj;
                  localCreateStaticObjectTable[hash] = obj;
                  registerObjectOwner(
                    'createStaticObjectTable',
                    hash,
                    filePath,
                  );
                } else if (method === 'keyframes') {
                  const hash = genBase36Hash(obj, 1, 8);
                  localKeyframesHashTable[name] = hash;
                  localTables.keyframesHashTable[uniqueKey] = hash;
                  localTables.keyframesObjectTable[hash] = obj;
                  localKeyframesObjectTable[hash] = obj;
                  registerObjectOwner('keyframesObjectTable', hash, filePath);
                } else if (method === 'viewTransition') {
                  const hash = genBase36Hash(obj, 1, 8);
                  localViewTransitionHashTable[name] = hash;
                  localTables.viewTransitionHashTable[uniqueKey] = hash;
                  localTables.viewTransitionObjectTable[hash] = obj;
                  localViewTransitionObjectTable[hash] = obj;
                  registerObjectOwner(
                    'viewTransitionObjectTable',
                    hash,
                    filePath,
                  );
                } else if (method === 'createTheme') {
                  let selector = '';
                  const selectorExpr = init.arguments[0].expression;
                  if (t.isStringLiteral(selectorExpr)) {
                    selector = selectorExpr.value;
                  }
                  const hash = genBase36Hash(obj, 1, 8);
                  localTables.createThemeObjectTable[hash] = obj;
                  localCreateThemeObjectTable[hash] = obj;
                  registerObjectOwner('createThemeObjectTable', hash, filePath);
                  localCreateThemeHashTable[name] = hash;
                  localTables.createThemeHashTable[uniqueKey] = hash;
                  localTables.createThemeSelectorTable[hash] = selector;
                  localCreateThemeSelectorTable[hash] = selector;
                  registerObjectOwner(
                    'createThemeSelectorTable',
                    hash,
                    filePath,
                  );
                  const hashMap: Record<string, any> = {};
                  for (const [key, value] of Object.entries(obj)) {
                    const atomicHash = genBase36Hash({ [key]: value }, 1, 8);
                    const cssVarName = camelToKebabCase(key);
                    hashMap[key] = `var(--${atomicHash}-${cssVarName})`;
                  }
                  localCreateAtomicMapTable[hash] = hashMap;
                  localTables.createAtomicMapTable[hash] = hashMap;
                  registerObjectOwner('createAtomicMapTable', hash, filePath);
                } else if (method === 'create') {
                  const hash = genBase36Hash(obj, 1, 8);
                  localCreateHashTable[name] = hash;
                  localTables.createHashTable[uniqueKey] = hash;
                  localTables.createObjectTable[hash] = obj;
                  localCreateObjectTable[hash] = obj;
                  registerObjectOwner('createObjectTable', hash, filePath);

                  const hashMap: Record<string, Record<string, string>> = {};

                  Object.entries(obj).forEach(([key, style]) => {
                    const records = getStyleRecords(style as CSSProperties);
                    const atomMap: Record<string, string> = {};
                    records.forEach((r) => (atomMap[r.key] = r.hash));
                    hashMap[key] = atomMap;
                  });
                  localCreateAtomicMapTable[hash] = hashMap;
                  localTables.createAtomicMapTable[hash] = hashMap;
                  registerObjectOwner('createAtomicMapTable', hash, filePath);
                } else if (method === 'variants') {
                  const hash = genBase36Hash(obj, 1, 8);
                  localVariantsHashTable[name] = hash;
                  localTables.variantsHashTable[uniqueKey] = hash;
                  localTables.variantsObjectTable[hash] = obj;
                  localVariantsObjectTable[hash] = obj;
                  registerObjectOwner('variantsObjectTable', hash, filePath);
                }
              }
            }
          }
        }

        if (isFirstPass) {
          extractAndCacheExports(filePath, ast, mtimeMs);
        }

        if (!isFirstPass) {
          const resolveCallStylePropInScan = (
            expr: Expression,
          ): { classString: string; styleObj: CSSObject } | null => {
            if (expr.type === 'ArrayExpression') {
              let mergedStyle: CSSObject = {};
              const classList: string[] = [];
              let valid = false;
              for (const el of expr.elements) {
                if (el && el.expression) {
                  const res = resolveCallStylePropInScan(el.expression);
                  if (res) {
                    mergedStyle = deepMerge(mergedStyle, res.styleObj);
                    if (res.classString) classList.push(res.classString);
                    valid = true;
                  }
                }
              }
              return valid
                ? { classString: classList.join(' '), styleObj: mergedStyle }
                : null;
            }

            if (expr.type === 'ConditionalExpression') {
              if (expr.test.type === 'BooleanLiteral') {
                return resolveCallStylePropInScan(
                  expr.test.value ? expr.consequent : expr.alternate,
                );
              }
            }

            if (expr.type === 'BinaryExpression') {
              if (
                expr.operator === '&&' &&
                expr.left.type === 'BooleanLiteral'
              ) {
                if (expr.left.value) {
                  return resolveCallStylePropInScan(expr.right);
                }
              }
            }

            if (expr.type === 'ParenthesisExpression') {
              return resolveCallStylePropInScan(expr.expression);
            }

            if (
              expr.type === 'MemberExpression' &&
              expr.object.type === 'Identifier'
            ) {
              const varName = expr.object.value;
              if (expr.property.type === 'Identifier') {
                const propName = expr.property.value;
                const uniqueKey = `${filePath}-${varName}`;

                let hash = localCreateHashTable[varName];
                if (!hash) hash = localTables.createHashTable[uniqueKey];

                if (hash) {
                  const styleObj =
                    localTables.createObjectTable[hash]?.[propName];
                  const atomMap =
                    localTables.createAtomicMapTable[hash]?.[propName];
                  if (styleObj && atomMap) {
                    const classString = Object.values(atomMap).join(' ');
                    return { classString, styleObj: styleObj as CSSObject };
                  }
                }
              }
            }

            return null;
          };

          const localComponentPropsTable: Record<
            string,
            Record<string, TableEntry[]>
          > = {};

          const registerStyles = (
            node: Expression,
            propName: string,
            compKey: string,
            table: Record<string, Record<string, TableEntry[]>>,
          ) => {
            if (node.type === 'ConditionalExpression') {
              registerStyles(node.consequent, propName, compKey, table);
              registerStyles(node.alternate, propName, compKey, table);
              return;
            }
            if (node.type === 'BinaryExpression' && node.operator === '&&') {
              registerStyles(node.right, propName, compKey, table);
              return;
            }
            if (node.type === 'ParenthesisExpression') {
              registerStyles(node.expression, propName, compKey, table);
              return;
            }

            const resolved = resolveCallStylePropInScan(node);
            if (resolved) {
              if (!table[compKey]) {
                table[compKey] = {};
              }
              if (!table[compKey][propName]) {
                table[compKey][propName] = [];
              }
              const list = table[compKey][propName];

              // Content-derived key: stable across scan order and cache state
              const entry: TableEntry = {
                key: genBase36Hash(resolved.classString, 1, 8),
                styleObj: resolved.styleObj,
                classString: resolved.classString,
                spanStart: (node as HasSpan).span.start,
                filePath,
              };

              list.push(entry);
            }
          };

          traverse(ast, {
            JSXOpeningElement({ node }) {
              if (node.name.type === 'Identifier') {
                const name = node.name.value;
                if (name[0] === name[0].toUpperCase()) {
                  let compKey = '';
                  const imported = localImports[name];
                  if (imported) {
                    let resolvedKey = `${imported.actualPath}-${imported.importedName}`;
                    const resolved = resolveExport(
                      imported.actualPath,
                      imported.importedName,
                    );
                    if (resolved) {
                      resolvedKey = `${resolved.filePath}-${resolved.localName}`;
                    }
                    compKey = resolvedKey;
                  } else {
                    compKey = `${filePath}-${name}`;
                  }

                  node.attributes.forEach((attr: any) => {
                    if (
                      attr.type === 'JSXAttribute' &&
                      attr.name.type === 'Identifier'
                    ) {
                      const propName = attr.name.value;
                      const val = attr.value;
                      if (val && val.type === 'JSXExpressionContainer') {
                        registerStyles(
                          val.expression,
                          propName,
                          compKey,
                          localComponentPropsTable,
                        );
                      }
                    }
                  });
                }
              }
            },
          });

          const globalTable = localTables.componentPropsTable!;
          for (const compKey of Object.keys(localComponentPropsTable)) {
            if (!globalTable[compKey]) {
              globalTable[compKey] = {};
            }
            for (const propName of Object.keys(
              localComponentPropsTable[compKey],
            )) {
              if (!globalTable[compKey][propName]) {
                globalTable[compKey][propName] = [];
              }
              const entries = localComponentPropsTable[compKey][propName];
              for (const entry of entries) {
                const exists = globalTable[compKey][propName].some(
                  (x) =>
                    x.spanStart === entry.spanStart &&
                    x.filePath === entry.filePath,
                );
                if (!exists) {
                  globalTable[compKey][propName].push(entry);
                }
              }
            }
          }

          // Update incremental edges and cache
          const prevDependencies = fileCache[filePath]?.dependencies;
          fileCache[filePath] = {
            mtimeMs: mtimeMs,
            dependencies: Array.from(localDependencies),
            exports: fileCache[filePath]?.exports,
            staticTable: localStaticTable,
            keyframesHashTable: localKeyframesHashTable,
            keyframesObjectTable: localKeyframesObjectTable,
            viewTransitionHashTable: localViewTransitionHashTable,
            viewTransitionObjectTable: localViewTransitionObjectTable,
            createThemeHashTable: localCreateThemeHashTable,
            createThemeSelectorTable: localCreateThemeSelectorTable,
            createThemeObjectTable: localCreateThemeObjectTable,
            createHashTable: localCreateHashTable,
            createObjectTable: localCreateObjectTable,
            createAtomicMapTable: localCreateAtomicMapTable,
            variantsHashTable: localVariantsHashTable,
            variantsObjectTable: localVariantsObjectTable,
            createStaticHashTable: localCreateStaticHashTable,
            createStaticObjectTable: localCreateStaticObjectTable,
            componentPropsTable: localComponentPropsTable,
            hasCssUsage: true,
          };

          updateDependencyEdges(
            filePath,
            prevDependencies,
            fileCache[filePath].dependencies,
          );
        }
      } catch (e) {
        // ignore
      }
    }
  }

  hasComputedOnce = true;
  return localTables;
}

export function getFileDependencies(filePath: string): string[] {
  const visited = new Set<string>();
  const deps: string[] = [];

  const collect = (fp: string) => {
    if (visited.has(fp)) return;
    visited.add(fp);
    const cached = fileCache[fp];
    if (cached && cached.dependencies) {
      for (const dep of cached.dependencies) {
        deps.push(dep);
        collect(dep);
      }
    }
  };

  collect(filePath);
  return Array.from(new Set(deps));
}

function extractAndCacheExports(
  filePath: string,
  ast: Module,
  mtimeMs: number,
) {
  const localExports: string[] = [];
  const reExports: Record<
    string,
    { source: string | null; localName: string }
  > = {};
  const starExports: string[] = [];
  const localDependencies = new Set<string>();

  const imports: Record<string, { source: string; importedName: string }> = {};
  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value;
      node.specifiers.forEach((spec) => {
        if (spec.type === 'ImportSpecifier') {
          const orig = spec.imported ? spec.imported.value : spec.local.value;
          imports[spec.local.value] = { source, importedName: orig };
        } else if (spec.type === 'ImportDefaultSpecifier') {
          imports[spec.local.value] = { source, importedName: 'default' };
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          imports[spec.local.value] = { source, importedName: '*' };
        }
      });
    }
  }

  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      const actualPath = resolveImportPath(node.source.value, filePath);
      if (actualPath) {
        localDependencies.add(actualPath);
      }
    } else if (node.type === 'ExportDeclaration') {
      const decl = node.declaration;
      if (decl && decl.type === 'VariableDeclaration') {
        decl.declarations.forEach((d) => {
          if (d.id && d.id.type === 'Identifier') {
            localExports.push(d.id.value);
          }
        });
      } else if (decl && decl.type === 'FunctionDeclaration') {
        if (decl.identifier) {
          localExports.push(decl.identifier.value);
        }
      } else if (decl && decl.type === 'ClassDeclaration') {
        if (decl.identifier) {
          localExports.push(decl.identifier.value);
        }
      }
    } else if (node.type === 'ExportNamedDeclaration') {
      const source = node.source ? node.source.value : null;
      if (source) {
        const actualPath = resolveImportPath(source, filePath);
        if (actualPath) {
          localDependencies.add(actualPath);
        }
      }
      node.specifiers.forEach((spec) => {
        if (spec.type === 'ExportSpecifier') {
          const orig = spec.orig.value;
          const exported = spec.exported ? spec.exported.value : orig;
          if (source) {
            reExports[exported] = { source, localName: orig };
          } else {
            const imp = imports[orig];
            if (imp) {
              reExports[exported] = {
                source: imp.source,
                localName: imp.importedName,
              };
            } else {
              reExports[exported] = { source: null, localName: orig };
            }
          }
        }
      });
    } else if (node.type === 'ExportAllDeclaration') {
      if (node.source) {
        starExports.push(node.source.value);
        const actualPath = resolveImportPath(node.source.value, filePath);
        if (actualPath) {
          localDependencies.add(actualPath);
        }
      }
    } else if (node.type === 'ExportDefaultExpression') {
      if (node.expression.type === 'Identifier') {
        const name = node.expression.value;
        const imp = imports[name];
        if (imp) {
          reExports['default'] = {
            source: imp.source,
            localName: imp.importedName,
          };
        } else {
          reExports['default'] = { source: null, localName: name };
        }
      } else {
        localExports.push('default');
      }
    } else if (node.type === 'ExportDefaultDeclaration') {
      const decl = node.decl as any;
      if (decl && decl.identifier) {
        const name = decl.identifier.value;
        const imp = imports[name];
        if (imp) {
          reExports['default'] = {
            source: imp.source,
            localName: imp.importedName,
          };
        } else {
          reExports['default'] = { source: null, localName: name };
        }
      } else {
        localExports.push('default');
      }
    }
  }

  // Clear and update old dependency edges
  const prevDeps = fileCache[filePath]?.dependencies;
  const newDeps = Array.from(localDependencies);
  updateDependencyEdges(filePath, prevDeps, newDeps);

  if (!fileCache[filePath]) {
    fileCache[filePath] = {
      mtimeMs: mtimeMs,
      exports: { localExports, reExports, starExports },
      dependencies: newDeps,
      staticTable: {},
      keyframesHashTable: {},
      keyframesObjectTable: {},
      viewTransitionHashTable: {},
      viewTransitionObjectTable: {},
      createThemeHashTable: {},
      createThemeSelectorTable: {},
      createThemeObjectTable: {},
      createHashTable: {},
      createObjectTable: {},
      createAtomicMapTable: {},
      variantsHashTable: {},
      variantsObjectTable: {},
      createStaticHashTable: {},
      createStaticObjectTable: {},
      hasCssUsage: false,
    };
  } else {
    fileCache[filePath].exports = {
      localExports,
      reExports,
      starExports,
    };
    fileCache[filePath].dependencies = newDeps;
  }
}

export function resolveExport(
  filePath: string,
  exportName: string,
  visited: Set<string> = new Set(),
): { filePath: string; localName: string } | null {
  const key = `${filePath}-${exportName}`;
  if (visited.has(key)) return null;
  visited.add(key);

  if (!fileCache[filePath] || !fileCache[filePath].exports) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const source = fs.readFileSync(filePath, 'utf8');
        const ast = parseSync(source, {
          syntax: 'typescript',
          tsx: true,
          target: 'es2022',
        });
        extractAndCacheExports(filePath, ast, stats.mtimeMs);
      }
    } catch (e) {
      // ignore
    }
  }

  const cached = fileCache[filePath];
  if (!cached || !cached.exports) return null;

  const { localExports, reExports, starExports } = cached.exports;

  if (reExports[exportName]) {
    const { source, localName } = reExports[exportName];
    if (source) {
      const actualPath = resolveImportPath(source, filePath);
      if (actualPath) {
        return resolveExport(actualPath, localName, visited);
      }
    } else {
      return resolveExport(filePath, localName, visited);
    }
  }

  if (localExports.includes(exportName)) {
    return { filePath, localName: exportName };
  }

  for (const source of starExports) {
    const actualPath = resolveImportPath(source, filePath);
    if (actualPath) {
      const resolved = resolveExport(actualPath, exportName, visited);
      if (resolved) return resolved;
    }
  }

  return null;
}

export function extractOndemandStyles(
  obj: any,
  extractedSheets: string[],
  t: Tables,
): void {
  if (!obj || typeof obj !== 'object') return;

  const visited = new Set();
  const keyframesHashes = new Set<string>();
  const viewTransitionHashes = new Set<string>();
  const createHashes = new Set<string>();
  const usedVariables = new Set<string>();

  function walk(n: any) {
    if (!n || typeof n !== 'object' || visited.has(n)) return;
    visited.add(n);

    Object.values(n).forEach((val) => {
      if (typeof val === 'string') {
        if (val.startsWith('kf-')) {
          const hash = val.slice(3);
          if (!keyframesHashes.has(hash)) {
            keyframesHashes.add(hash);
            walk(t.keyframesObjectTable[hash]);
          }
        } else if (val.startsWith('vt-')) {
          const hash = val.slice(3);
          if (!viewTransitionHashes.has(hash)) {
            viewTransitionHashes.add(hash);
            walk(t.viewTransitionObjectTable[hash]);
          }
        } else if (val.startsWith('cr-')) {
          const hash = val.slice(3);
          if (!createHashes.has(hash)) {
            createHashes.add(hash);
            walk(t.createObjectTable[hash]);
          }
        } else if (val.includes('var(--')) {
          let startIdx = 0;
          while ((startIdx = val.indexOf('var(--', startIdx)) !== -1) {
            startIdx += 4;
            const endIdx = val.indexOf(')', startIdx);
            if (endIdx !== -1) {
              const content = val.slice(startIdx, endIdx);
              const varName = content.trim();
              if (varName.startsWith('--')) {
                usedVariables.add(varName);
              }
              startIdx = endIdx + 1;
            } else {
              break;
            }
          }
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
          { [`@keyframes kf-${hash}`]: definition },
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
        Object.entries(obj).forEach(([_key, style]) => {
          const records = getStyleRecords(style as CSSProperties);
          records.forEach((r: StyleRecord) => addSheet(r.sheet));
        });
      }
    }
  }

  if (usedVariables.size > 0) {
    Object.keys(t.createThemeHashTable)
      .sort()
      .forEach((themeVarName) => {
        const hash = t.createThemeHashTable[themeVarName];
        const definition = t.createThemeObjectTable[hash];
        const selector = t.createThemeSelectorTable[hash];
        if (definition && typeof definition === 'object' && selector) {
          Object.keys(definition).forEach((key) => {
            const value = definition[key];
            const atomicHash = genBase36Hash({ [key]: value }, 1, 8);
            const varName = `--${atomicHash}-${camelToKebabCase(key)}`;
            if (usedVariables.has(varName)) {
              const styles = createTheme(selector, {
                [key]: value,
              } as CreateTheme);
              const { styleSheet } = transpile(styles, undefined, '--global');
              addSheet(styleSheet);
            }
          });
        }
      });
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
