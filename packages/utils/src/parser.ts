import type {
  CSSObject,
  StaticTable,
  KeyframesHashTable,
  KeyframesObjectTable,
  CSSValue,
  ThemeTable,
  ViewTransitionObjectTable,
  ViewTransitionHashTable,
  Tables,
} from './types';

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
} from '@swc/core';
import path from 'path';
import fs from 'fs';
import { camelToKebabCase, genBase36Hash } from 'zss-engine';

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

    const key = getPropertyKey(prop.key, staticTable);
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

export function collectLocalConsts(ast: Module): Record<string, any> {
  const localConsts: Record<string, any> = {};

  traverse(ast, {
    VariableDeclarator({ node }: { node: VariableDeclarator }) {
      if (t.isIdentifier(node.id) && node.init) {
        if (t.isStringLiteral(node.init)) {
          localConsts[node.id.value] = node.init.value;
        } else if (t.isObjectExpression(node.init)) {
          localConsts[node.id.value] = objectExpressionToObject(
            node.init,
            localConsts,
            tables.keyframesHashTable,
            tables.viewTransitionHashTable,
            tables.themeTable,
          );
        }
      }
    },
  });

  return localConsts;
}

/* istanbul ignore next */
function getPropertyKey(node: any, staticTable: StaticTable): string {
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
      return evaluateTemplateLiteral(expr, staticTable);
    }
    if (t.isBinaryExpression(expr)) {
      return evaluateBinaryExpression(expr, staticTable);
    }
    return '';
  }

  if (t.isTemplateLiteral(node)) {
    return evaluateTemplateLiteral(node, staticTable);
  }

  if (t.isBinaryExpression(node)) {
    return evaluateBinaryExpression(node, staticTable);
  }

  return '';
}
/* istanbul ignore next */
function evaluateTemplateLiteral(
  node: TemplateLiteral,
  staticTable: StaticTable,
): string {
  let result = '';

  for (let i = 0; i < node.quasis.length; i++) {
    result += node.quasis[i].cooked || node.quasis[i].raw;

    if (i < node.expressions.length) {
      const expr = node.expressions[i];
      const evaluatedExpr = evaluateExpression(expr as Expression, staticTable);
      result += String(evaluatedExpr);
    }
  }

  return result;
}

/* istanbul ignore next */
function evaluateBinaryExpression(
  node: BinaryExpression,
  staticTable: StaticTable,
): string {
  const left = evaluateExpression(node.left as Expression, staticTable);
  const right = evaluateExpression(node.right as Expression, staticTable);

  if (node.operator === '+') {
    return String(left) + String(right);
  }

  throw new Error(`Unsupported binary operator: ${node.operator}`);
}

/* istanbul ignore next */
function evaluateExpression(
  node: Expression,
  staticTable: StaticTable,
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

    if (tables.keyframesHashTable[node.value] !== undefined) {
      return tables.keyframesHashTable[node.value];
    }

    if (tables.viewTransitionHashTable[node.value] !== undefined) {
      return tables.viewTransitionHashTable[node.value];
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
      tables.themeTable,
    );
    if (resolvedTheme !== undefined) {
      return resolvedTheme;
    }

    return `[unresolved member expression]`;
  }

  if (t.isBinaryExpression(node)) {
    return evaluateBinaryExpression(node, staticTable);
  }

  if (t.isTemplateLiteral(node)) {
    return evaluateTemplateLiteral(node, staticTable);
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

export function scanForKeyframes(addDependency: (path: string) => void): {
  keyframesHashTableLocal: KeyframesHashTable;
  keyframesObjectTableLocal: KeyframesObjectTable;
} {
  const keyframesHashTableLocal: KeyframesHashTable = {};
  const keyframesObjectTableLocal: KeyframesObjectTable = {};
  const files = fs.globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    if (!isCSSDefineFile(filePath, 'keyframes')) continue;
    addDependency(filePath);

    const source = fs.readFileSync(filePath, 'utf8');
    const ast = parseSync(source, {
      syntax: 'typescript',
      tsx: true,
      target: 'es2022',
    });

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
          t.isIdentifier(decl.init.callee.property, { name: 'keyframes' }) &&
          decl.init.arguments.length > 0 &&
          t.isObjectExpression(decl.init.arguments[0].expression)
        ) {
          const varName = decl.id.value;
          const obj = objectExpressionToObject(
            decl.init.arguments[0].expression as ObjectExpression,
            tables.staticTable,
            keyframesHashTableLocal,
            tables.viewTransitionHashTable,
            tables.themeTable,
          );
          const hash = genBase36Hash(obj, 1, 8);

          keyframesHashTableLocal[varName] = hash;
          keyframesObjectTableLocal[hash] = obj;
        }
      }
    }
  }

  return {
    keyframesHashTableLocal,
    keyframesObjectTableLocal,
  };
}

export function scanForViewTransition(addDependency: (path: string) => void): {
  viewTransitionHashTableLocal: ViewTransitionHashTable;
  viewTransitionObjectTableLocal: ViewTransitionObjectTable;
} {
  const viewTransitionHashTableLocal: ViewTransitionHashTable = {};
  const viewTransitionObjectTableLocal: ViewTransitionObjectTable = {};
  const files = fs.globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    if (!isCSSDefineFile(filePath, 'viewTransition')) continue;
    addDependency(filePath);

    const source = fs.readFileSync(filePath, 'utf8');
    const ast = parseSync(source, {
      syntax: 'typescript',
      tsx: true,
      target: 'es2022',
    });

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
          t.isIdentifier(decl.init.callee.property, {
            name: 'viewTransition',
          }) &&
          decl.init.arguments.length > 0 &&
          t.isObjectExpression(decl.init.arguments[0].expression)
        ) {
          const varName = decl.id.value;
          const obj = objectExpressionToObject(
            decl.init.arguments[0].expression as ObjectExpression,
            tables.staticTable,
            tables.keyframesHashTable,
            viewTransitionHashTableLocal,
            tables.themeTable,
          );
          const hash = genBase36Hash(obj, 1, 8);

          viewTransitionHashTableLocal[varName] = hash;
          viewTransitionObjectTableLocal[hash] = obj;
        }
      }
    }
  }

  return {
    viewTransitionHashTableLocal,
    viewTransitionObjectTableLocal,
  };
}

export function scanForCreateStatic(
  addDependency: (path: string) => void,
): StaticTable {
  const staticTableLocal: StaticTable = {};
  const files = fs.globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    if (!isCSSDefineFile(filePath, 'createStatic')) continue;
    addDependency(filePath);

    const source = fs.readFileSync(filePath, 'utf8');
    const ast = parseSync(source, {
      syntax: 'typescript',
      tsx: true,
      target: 'es2022',
    });

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
          t.isIdentifier(decl.init.callee.property, { name: 'createStatic' }) &&
          decl.init.arguments.length > 0 &&
          t.isObjectExpression(decl.init.arguments[0].expression)
        ) {
          const varName = decl.id.value;
          const obj = objectExpressionToObject(
            decl.init.arguments[0].expression as ObjectExpression,
            staticTableLocal,
            tables.keyframesHashTable,
            tables.viewTransitionHashTable,
            tables.themeTable,
          );
          staticTableLocal[varName] = obj;
        }
      }
    }
  }
  return staticTableLocal;
}

export function scanForCreateTheme(addDependency: (path: string) => void): {
  themeTableLocal: Record<string, Record<string, any>>;
  createThemeObjectTableLocal: Record<string, any>;
} {
  const themeTableLocal: Record<string, Record<string, any>> = {};
  const createThemeObjectTableLocal: Record<string, any> = {};
  const files = fs.globSync(PATTERN_PATH, GLOB_OPTIONS);

  for (const filePath of files) {
    if (!isCSSDefineFile(filePath, 'createTheme')) continue;
    addDependency(filePath);
    const source = fs.readFileSync(filePath, 'utf8');
    const ast = parseSync(source, {
      syntax: 'typescript',
      tsx: true,
      target: 'es2022',
    });

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
          t.isIdentifier(decl.init.callee.property, { name: 'createTheme' }) &&
          decl.init.arguments.length > 0 &&
          t.isObjectExpression(decl.init.arguments[0].expression)
        ) {
          const varName = decl.id.value;
          const obj = objectExpressionToObject(
            decl.init.arguments[0].expression as ObjectExpression,
            tables.staticTable,
            tables.keyframesHashTable,
            tables.viewTransitionHashTable,
            themeTableLocal,
          );
          themeTableLocal[varName] = obj;
          createThemeObjectTableLocal[varName] = obj;
        }
      }
    }
  }

  return { themeTableLocal, createThemeObjectTableLocal };
}

function isCSSDefineFile(filePath: string, target: string): boolean {
  if (fs.statSync(filePath).isDirectory()) return false;
  const code = fs.readFileSync(filePath, 'utf8');

  let ast;
  try {
    ast = parseSync(code, {
      syntax: 'typescript',
      tsx: true,
      target: 'es2022',
    });
  } catch (err) {
    console.log(err);
    return false;
  }

  let found = false;

  traverse(ast, {
    CallExpression({ node, stop }) {
      const callee = node.callee;

      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.value === 'css' &&
        callee.property.type === 'Identifier' &&
        callee.property.value === target
      ) {
        found = true;
        stop();
      }
    },
  });

  return found;
}
