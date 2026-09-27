import * as ts from 'typescript';

type ReadFile = (path: string) => string | undefined;

type ModuleValues = {
  consts: Map<string, ts.Expression>;
  imports: Map<string, { source: string; importedName: string }>;
  reExports: Map<string, { source: string | null; localName: string }>;
  starExports: string[];
  createStaticNames: Set<string>;
  namespaces: Set<string>;
};

const CORE = '@plumeria/core';
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];

let readFile: ReadFile = () => undefined;
const moduleCache = new Map<string, { source: string; values: ModuleValues }>();

export function setPlaygroundFiles(reader: ReadFile) {
  readFile = reader;
  moduleCache.clear();
}

export function resolveImportPath(importPath: string, importerPath: string): string | null {
  if (!importPath.startsWith('.')) return null;
  const base = importerPath.slice(0, importerPath.lastIndexOf('/') + 1);
  const segments: string[] = [];
  for (const segment of (base + importPath).split('/')) {
    if (segment === '..') segments.pop();
    else if (segment !== '.' && segment !== '') segments.push(segment);
  }
  const joined = `/${segments.join('/')}`;
  for (const extension of EXTENSIONS) {
    if (readFile(joined + extension) !== undefined) return joined + extension;
  }
  return null;
}

export const resolveExport = () => null;
export const scanAll = () => undefined;

function unwrap(node: ts.Expression): ts.Expression {
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isTypeAssertionExpression(node)
  )
    node = node.expression;
  return node;
}

function moduleValues(filePath: string): ModuleValues | undefined {
  const source = readFile(filePath);
  if (source === undefined) return undefined;
  const cached = moduleCache.get(filePath);
  if (cached && cached.source === source) return cached.values;

  const file = ts.createSourceFile(filePath, source, ts.ScriptTarget.ES2022, true);
  const values: ModuleValues = {
    consts: new Map(),
    imports: new Map(),
    reExports: new Map(),
    starExports: [],
    createStaticNames: new Set(),
    namespaces: new Set(),
  };

  for (const statement of file.statements) {
    if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.Const) {
      const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
        values.consts.set(declaration.name.text, declaration.initializer);
        if (exported) values.reExports.set(declaration.name.text, { source: null, localName: declaration.name.text });
      }
    } else if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const from = statement.moduleSpecifier.text;
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly) continue;
      if (clause.name) values.imports.set(clause.name.text, { source: from, importedName: 'default' });
      const bindings = clause.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) {
        values.imports.set(bindings.name.text, { source: from, importedName: '*' });
        if (from === CORE) values.namespaces.add(bindings.name.text);
      } else if (bindings) {
        for (const element of bindings.elements) {
          const importedName = (element.propertyName ?? element.name).text;
          values.imports.set(element.name.text, { source: from, importedName });
          if (from === CORE && importedName === 'createStatic') values.createStaticNames.add(element.name.text);
        }
      }
      if (from === CORE && clause.name) values.namespaces.add(clause.name.text);
    } else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      const from =
        statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : null;
      const clause = statement.exportClause;
      if (!clause) {
        if (from) values.starExports.push(from);
      } else if (ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          values.reExports.set(element.name.text, {
            source: from,
            localName: (element.propertyName ?? element.name).text,
          });
        }
      }
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      values.consts.set('default', statement.expression);
      values.reExports.set('default', { source: null, localName: 'default' });
    }
  }

  moduleCache.set(filePath, { source, values });
  return values;
}

function evaluate(node: ts.Expression, filePath: string, values: ModuleValues, visiting: Set<ts.Node>): unknown {
  node = unwrap(node);
  if (visiting.has(node)) return undefined;
  visiting.add(node);
  try {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isIdentifier(node)) return localValue(node.text, filePath, values, visiting);
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const key = ts.isPropertyAccessExpression(node)
        ? node.name.text
        : evaluate(node.argumentExpression, filePath, values, visiting);
      if (typeof key !== 'string') return undefined;
      const object = unwrap(node.expression);
      if (ts.isIdentifier(object) && values.imports.get(object.text)?.importedName === '*') {
        const target = resolveImportPath(values.imports.get(object.text)!.source, filePath);
        return target ? exportValue(target, key, visiting) : undefined;
      }
      const value = evaluate(object, filePath, values, visiting);
      return value && typeof value === 'object' && Object.hasOwn(value, key)
        ? (value as Record<string, unknown>)[key]
        : undefined;
    }
    if (ts.isObjectLiteralExpression(node)) {
      const result: Record<string, unknown> = Object.create(null);
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = property.name;
        const key =
          ts.isIdentifier(name) || ts.isStringLiteral(name)
            ? name.text
            : ts.isComputedPropertyName(name)
              ? evaluate(name.expression, filePath, values, visiting)
              : undefined;
        if (typeof key !== 'string') continue;
        result[key] = evaluate(property.initializer, filePath, values, visiting);
      }
      return result;
    }
    if (ts.isCallExpression(node) && node.arguments[0]) {
      const callee = unwrap(node.expression);
      const isCreateStatic =
        (ts.isIdentifier(callee) && values.createStaticNames.has(callee.text)) ||
        (ts.isPropertyAccessExpression(callee) &&
          callee.name.text === 'createStatic' &&
          ts.isIdentifier(callee.expression) &&
          values.namespaces.has(callee.expression.text));
      return isCreateStatic ? evaluate(node.arguments[0], filePath, values, visiting) : undefined;
    }
    return undefined;
  } finally {
    visiting.delete(node);
  }
}

function localValue(name: string, filePath: string, values: ModuleValues, visiting: Set<ts.Node>): unknown {
  const initializer = values.consts.get(name);
  if (initializer) return evaluate(initializer, filePath, values, visiting);
  const imported = values.imports.get(name);
  if (!imported || imported.importedName === '*') return undefined;
  const target = resolveImportPath(imported.source, filePath);
  return target ? exportValue(target, imported.importedName, visiting) : undefined;
}

function exportValue(filePath: string, exportName: string, visiting: Set<ts.Node>, seen = new Set<string>()): unknown {
  const key = `${filePath}-${exportName}`;
  if (seen.has(key)) return undefined;
  seen.add(key);
  const values = moduleValues(filePath);
  if (!values) return undefined;
  const reExport = values.reExports.get(exportName);
  if (reExport) {
    if (reExport.source === null) return localValue(reExport.localName, filePath, values, visiting);
    const target = resolveImportPath(reExport.source, filePath);
    return target ? exportValue(target, reExport.localName, visiting, seen) : undefined;
  }
  for (const star of values.starExports) {
    const target = resolveImportPath(star, filePath);
    const value = target ? exportValue(target, exportName, visiting, seen) : undefined;
    if (value !== undefined) return value;
  }
  return undefined;
}

export function resolveExportValue(filePath: string, exportName: string): unknown {
  return exportValue(filePath, exportName, new Set());
}
