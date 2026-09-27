import * as fs from 'fs';
import { parseSync } from '@swc/core';
import type { StaticTable } from './types';
import {
  collectLocalConstNodes,
  collectLocalConsts,
  objectExpressionToObject,
  resolveExport,
  t,
  unwrapExpression,
} from './parser';
import { resolveImportPath } from './resolver';

type ConstFile = {
  mtimeMs: number;
  values: Record<string, unknown>;
  imports: Record<string, { source: string; importedName: string }>;
};

const constFileCache = new Map<string, ConstFile>();

function readConstFile(filePath: string): ConstFile {
  const { mtimeMs } = fs.statSync(filePath);
  const cached = constFileCache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs) return cached;

  const ast = parseSync(fs.readFileSync(filePath, 'utf8'), {
    syntax: 'typescript',
    tsx: true,
    target: 'es2022',
  });
  const values: Record<string, unknown> = { ...collectLocalConsts(ast) };
  const imports: ConstFile['imports'] = {};
  const createStaticNames = new Set<string>();
  const namespaces = new Set<string>();

  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration') continue;
    const source = node.source.value;
    for (const specifier of node.specifiers) {
      const local = specifier.local.value;
      const importedName =
        specifier.type === 'ImportSpecifier'
          ? (specifier.imported?.value ?? local)
          : specifier.type === 'ImportDefaultSpecifier'
            ? 'default'
            : '*';
      imports[local] = { source, importedName };
      if (source !== '@plumeria/core') continue;
      if (importedName === 'createStatic') createStaticNames.add(local);
      else if (importedName === '*' || importedName === 'default')
        namespaces.add(local);
    }
  }

  for (const [name, node] of collectLocalConstNodes(ast)) {
    const init = unwrapExpression(node);
    if (!t.isCallExpression(init)) continue;
    const callee = init.callee;
    const isCreateStatic =
      (t.isIdentifier(callee) && createStaticNames.has(callee.value)) ||
      (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        namespaces.has(callee.object.value) &&
        t.isIdentifier(callee.property) &&
        callee.property.value === 'createStatic');
    const argument = unwrapExpression(init.arguments[0]?.expression);
    if (!isCreateStatic || !t.isObjectExpression(argument)) continue;
    try {
      values[name] = objectExpressionToObject(
        argument,
        values as StaticTable,
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      );
    } catch {
      continue;
    }
  }

  for (const node of ast.body) {
    if (node.type !== 'ExportDefaultExpression') continue;
    const expression = unwrapExpression(node.expression);
    if (t.isStringLiteral(expression) || t.isNumericLiteral(expression)) {
      values.default = expression.value;
    } else if (
      t.isIdentifier(expression) &&
      Object.hasOwn(values, expression.value)
    ) {
      values.default = values[expression.value];
    }
  }

  const file = { mtimeMs, values, imports };
  constFileCache.set(filePath, file);
  return file;
}

export function resolveExportValue(
  filePath: string,
  exportName: string,
): unknown {
  const visited = new Set<string>();
  let name = exportName;
  while (!visited.has(`${filePath}-${name}`)) {
    visited.add(`${filePath}-${name}`);
    const site = resolveExport(filePath, name) ?? { filePath, localName: name };
    let file: ConstFile;
    try {
      file = readConstFile(site.filePath);
    } catch {
      return undefined;
    }
    if (Object.hasOwn(file.values, site.localName)) {
      return file.values[site.localName];
    }
    const imported = file.imports[site.localName];
    if (!imported || imported.importedName === '*') return undefined;
    const actualPath = resolveImportPath(imported.source, site.filePath);
    if (!actualPath) return undefined;
    filePath = actualPath;
    name = imported.importedName;
  }
  return undefined;
}
