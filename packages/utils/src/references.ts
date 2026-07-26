import type { Module } from '@swc/core';

const NON_REFERENCE_SLOTS: Record<string, readonly string[]> = {
  KeyValueProperty: ['key'],
  MethodProperty: ['key'],
  GetterProperty: ['key'],
  SetterProperty: ['key'],
  ClassMethod: ['key'],
  PrivateMethod: ['key'],
  ClassProperty: ['key'],
  PrivateProperty: ['key'],
  KeyValuePatternProperty: ['key'],
  AssignmentPatternProperty: ['key'],
  MemberExpression: ['property'],
  SuperPropExpression: ['property'],
  JSXAttribute: ['name'],
  JSXOpeningElement: ['name'],
  JSXClosingElement: ['name'],
  JSXNamespacedName: ['namespace', 'name'],
  JSXMemberExpression: ['object', 'property'],
  LabeledStatement: ['label'],
  BreakStatement: ['label'],
  ContinueStatement: ['label'],
  ImportSpecifier: ['local', 'imported'],
  ImportDefaultSpecifier: ['local'],
  ImportNamespaceSpecifier: ['local'],
  ExportSpecifier: ['orig', 'exported'],
  ExportNamedSpecifier: ['orig', 'exported'],
  ExportDefaultSpecifier: ['exported'],
  ExportNamespaceSpecifier: ['name'],
  ForInStatement: ['left'],
  ForOfStatement: ['left'],
};

const PATTERN_SLOTS: Record<string, readonly string[]> = {
  VariableDeclarator: ['id'],
  Parameter: ['pat'],
  CatchClause: ['param'],
};

const TS_VALUE_SLOTS: Record<string, readonly string[]> = {
  TsAsExpression: ['expression'],
  TsSatisfiesExpression: ['expression'],
  TsNonNullExpression: ['expression'],
  TsTypeAssertion: ['expression'],
  TsConstAssertion: ['expression'],
  TsInstantiation: ['expression'],
  TsExportAssignment: ['expression'],
  TsModuleDeclaration: ['body'],
  TsModuleBlock: ['body'],
  TsEnumDeclaration: ['members'],
  TsEnumMember: ['init'],
};

const TYPE_KEYS = new Set([
  'typeAnnotation',
  'returnType',
  'typeParams',
  'typeParameters',
  'superTypeParams',
  'typeArguments',
]);

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

const collectPatternNames = (pat: any, out: Set<string>) => {
  if (!pat || typeof pat !== 'object') return;
  switch (pat.type) {
    case 'Identifier':
      out.add(pat.value);
      return;
    case 'Parameter':
      collectPatternNames(pat.pat, out);
      return;
    case 'AssignmentPattern':
      collectPatternNames(pat.left, out);
      return;
    case 'RestElement':
      collectPatternNames(pat.argument, out);
      return;
    case 'ArrayPattern':
      pat.elements?.forEach((el: any) => collectPatternNames(el, out));
      return;
    case 'ObjectPattern':
      pat.properties?.forEach((prop: any) => {
        if (prop?.type === 'KeyValuePatternProperty') {
          collectPatternNames(prop.value, out);
        } else if (prop?.type === 'AssignmentPatternProperty') {
          collectPatternNames(prop.key, out);
        } else if (prop?.type === 'RestElement') {
          collectPatternNames(prop.argument, out);
        }
      });
      return;
  }
};

// let/const/class/function declared directly in a statement list.
const collectLexicalNames = (stmts: any[] | undefined, out: Set<string>) => {
  stmts?.forEach((stmt) => {
    const decl = stmt?.type === 'ExportDeclaration' ? stmt.declaration : stmt;
    if (!decl) return;
    if (decl.type === 'VariableDeclaration') {
      decl.declarations?.forEach((d: any) => collectPatternNames(d.id, out));
    } else if (
      decl.type === 'FunctionDeclaration' ||
      decl.type === 'ClassDeclaration'
    ) {
      collectPatternNames(decl.identifier, out);
    }
  });
};

// `var` and function declarations hoist to the enclosing function scope, so
// they are collected across blocks but never across a nested function.
const collectHoistedNames = (n: any, out: Set<string>) => {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) {
    n.forEach((c) => collectHoistedNames(c, out));
    return;
  }
  if (FUNCTION_TYPES.has(n.type)) return;
  if (n.type === 'VariableDeclaration' && n.kind === 'var') {
    n.declarations?.forEach((d: any) => collectPatternNames(d.id, out));
  } else if (n.type === 'FunctionDeclaration') {
    collectPatternNames(n.identifier, out);
    return;
  }
  for (const key in n) {
    if (key === 'span') continue;
    collectHoistedNames(n[key], out);
  }
};

export interface ReferenceIdentifiers {
  references: Set<number>;
  shorthands: Set<number>;
}

export function collectReferenceIdentifiers(ast: Module): ReferenceIdentifiers {
  const references = new Set<number>();
  const shorthands = new Set<number>();
  const scopes: Set<string>[] = [];

  const isShadowed = (name: string) => scopes.some((scope) => scope.has(name));

  const walkPattern = (n: any) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach(walkPattern);
      return;
    }

    if (n.type === 'AssignmentPattern') {
      walkPattern(n.left);
      walk(n.right);
      return;
    }
    if (n.type === 'AssignmentPatternProperty') {
      walk(n.value);
      return;
    }
    if (n.type === 'KeyValuePatternProperty') {
      if (n.key?.type === 'Computed') walk(n.key);
      walkPattern(n.value);
      return;
    }
    for (const key in n) {
      if (key === 'span' || TYPE_KEYS.has(key)) continue;
      walkPattern(n[key]);
    }
  };

  const inScope = (bindings: Set<string>, run: () => void) => {
    scopes.push(bindings);
    run();
    scopes.pop();
  };

  const walkFunction = (n: any) => {
    const bindings = new Set<string>();
    if (n.type === 'FunctionExpression' && n.identifier) {
      collectPatternNames(n.identifier, bindings);
    }
    n.params?.forEach((p: any) => collectPatternNames(p, bindings));
    collectHoistedNames(n.body, bindings);
    inScope(bindings, () => {
      n.params?.forEach(walkPattern);
      walk(n.body);
    });
  };

  const walkBlock = (n: any, stmts: any[] | undefined, extra?: any) => {
    const bindings = new Set<string>();
    collectLexicalNames(stmts, bindings);
    if (extra) collectPatternNames(extra, bindings);
    inScope(bindings, () => {
      for (const key in n) {
        if (key === 'span' || TYPE_KEYS.has(key)) continue;
        walk(n[key]);
      }
    });
  };

  function walk(n: any) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }

    const type: string = n.type;

    if (type === 'Identifier') {
      if (!isShadowed(n.value)) references.add(n.span.start);
      return;
    }

    if (FUNCTION_TYPES.has(type)) {
      walkFunction(n);
      return;
    }

    switch (type) {
      case 'BlockStatement':
        walkBlock(n, n.stmts);
        return;
      case 'TsModuleBlock':
        walkBlock(n, n.body);
        return;
      case 'SwitchStatement': {
        const bindings = new Set<string>();
        n.cases?.forEach((c: any) =>
          collectLexicalNames(c.consequent, bindings),
        );
        inScope(bindings, () => {
          walk(n.discriminant);
          n.cases?.forEach((c: any) => {
            walk(c.test);
            walk(c.consequent);
          });
        });
        return;
      }
      case 'CatchClause':
        walkBlock(n, undefined, n.param);
        return;
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement': {
        const head = type === 'ForStatement' ? n.init : n.left;
        const bindings = new Set<string>();
        if (head?.type === 'VariableDeclaration') {
          head.declarations?.forEach((d: any) =>
            collectPatternNames(d.id, bindings),
          );
        }
        inScope(bindings, () => {
          const skip = NON_REFERENCE_SLOTS[type] ?? [];
          for (const key in n) {
            if (key === 'span' || TYPE_KEYS.has(key)) continue;
            if (skip.includes(key)) continue;
            walk(n[key]);
          }
        });
        return;
      }
      case 'ClassExpression': {
        const bindings = new Set<string>();
        if (n.identifier) collectPatternNames(n.identifier, bindings);
        inScope(bindings, () => {
          for (const key in n) {
            if (key === 'span' || key === 'identifier' || TYPE_KEYS.has(key))
              continue;
            walk(n[key]);
          }
        });
        return;
      }
      case 'ClassDeclaration':
        for (const key in n) {
          if (key === 'span' || key === 'identifier' || TYPE_KEYS.has(key))
            continue;
          walk(n[key]);
        }
        return;
      case 'ObjectExpression':
        n.properties?.forEach((prop: any) => {
          if (prop?.type === 'Identifier') {
            if (!isShadowed(prop.value)) {
              references.add(prop.span.start);
              shorthands.add(prop.span.start);
            }
            return;
          }
          walk(prop);
        });
        return;
    }

    if (type?.startsWith('Ts')) {
      const slots = TS_VALUE_SLOTS[type];
      slots?.forEach((key) => walk(n[key]));
      return;
    }

    const patternSlots = PATTERN_SLOTS[type] ?? [];
    const skip = NON_REFERENCE_SLOTS[type] ?? [];
    for (const key in n) {
      if (key === 'span' || TYPE_KEYS.has(key)) continue;
      if (patternSlots.includes(key)) {
        walkPattern(n[key]);
        continue;
      }
      if (skip.includes(key)) {
        const child = n[key];
        if (child?.type === 'Computed') walk(child);
        continue;
      }
      walk(n[key]);
    }
  }

  ast.body.forEach(walk);
  return { references, shorthands };
}
