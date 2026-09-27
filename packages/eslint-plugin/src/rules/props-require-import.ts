/**
 * @fileoverview Require the @plumeria/core import in files that pass a style through a prop other than the styling prop
 */

import type { Rule } from 'eslint';
import type { ImportDeclaration } from 'estree';
import type { JSXAttribute } from 'estree-jsx';
import { resolveExport, resolveImportPath, scanAll } from '@plumeria/utils';
import { resolveStyleProp, stylePropSchema } from '../util/style-prop';

type ImportedBinding = {
  source: string;
  importedName: string | null;
};

type StyleRoot = { name: string; member: string | null };

const CORE = '@plumeria/core';

const styleRoots = (node: unknown, roots: StyleRoot[]): StyleRoot[] => {
  const expression = node as any;
  if (!expression) return roots;
  switch (expression.type) {
    case 'Identifier':
      roots.push({ name: expression.name, member: null });
      break;
    case 'MemberExpression': {
      let object: any = expression;
      let member: string | null = null;
      while (object.type === 'MemberExpression') {
        member =
          !object.computed && object.property.type === 'Identifier'
            ? object.property.name
            : null;
        object = object.object;
      }
      if (object.type === 'Identifier')
        roots.push({ name: object.name, member });
      break;
    }
    case 'ArrayExpression':
      expression.elements.forEach((element: unknown) =>
        styleRoots(element, roots),
      );
      break;
    case 'ConditionalExpression':
      styleRoots(expression.consequent, roots);
      styleRoots(expression.alternate, roots);
      break;
    case 'LogicalExpression':
      styleRoots(expression.left, roots);
      styleRoots(expression.right, roots);
      break;
    case 'ChainExpression':
    case 'TSAsExpression':
    case 'TSNonNullExpression':
    case 'TSSatisfiesExpression':
      styleRoots(expression.expression, roots);
      break;
  }
  return roots;
};

const SCAN_REUSE_MS = 1000;
let recentScan:
  | { key: string; at: number; tables: ReturnType<typeof scanAll> }
  | undefined;

const scanTables = (cwd: string, styleProp: string) => {
  const key = `${cwd}\0${styleProp}`;
  const now = Date.now();
  if (
    !recentScan ||
    recentScan.key !== key ||
    now - recentScan.at > SCAN_REUSE_MS
  ) {
    recentScan = { key, at: now, tables: scanAll(cwd, styleProp) };
  }
  return recentScan.tables;
};

export const propsRequireImport: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require the @plumeria/core import in files that pass a style through a prop other than the styling prop',
    },
    fixable: 'code',
    messages: {
      requiresImport:
        '{{prop}} passes a style from "{{source}}", so this file must import "@plumeria/core".',
    },
    schema: stylePropSchema,
  },
  create(context) {
    const styleProp = resolveStyleProp(context);
    const filename = context.filename;
    const imports = new Map<string, ImportedBinding>();
    const candidates: { node: Rule.Node; prop: string; roots: StyleRoot[] }[] =
      [];
    let hasPlumeriaImport = false;

    const isStyle = (root: StyleRoot) => {
      const binding = imports.get(root.name);
      if (!binding) return null;
      const exportName = binding.importedName ?? root.member;
      if (!exportName) return null;
      const actualPath = resolveImportPath(binding.source, filename);
      if (!actualPath) return null;
      const tables = scanTables(context.cwd, styleProp);
      const resolved = resolveExport(actualPath, exportName);
      if (!resolved) return null;
      const key = `${resolved.filePath}-${resolved.localName}`;
      return tables.createHashTable[key] !== undefined ? binding.source : null;
    };

    return {
      ImportDeclaration(node: ImportDeclaration) {
        const source = node.source.value as string;
        if (source.startsWith(CORE)) {
          hasPlumeriaImport = true;
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') {
            imports.set(specifier.local.name, { source, importedName: null });
          } else if (specifier.type === 'ImportDefaultSpecifier') {
            imports.set(specifier.local.name, {
              source,
              importedName: 'default',
            });
          } else {
            const imported = specifier.imported as {
              name?: string;
              value?: string;
            };
            imports.set(specifier.local.name, {
              source,
              importedName: imported.name ?? String(imported.value),
            });
          }
        }
      },
      JSXAttribute(node: JSXAttribute & Rule.NodeParentExtension) {
        if (node.name.type !== 'JSXIdentifier') return;
        const prop = node.name.name;
        if (prop === styleProp) return;
        if (node.value?.type !== 'JSXExpressionContainer') return;
        const roots = styleRoots(node.value.expression, []);
        if (roots.length > 0) candidates.push({ node, prop, roots });
      },
      'Program:exit'() {
        if (hasPlumeriaImport || candidates.length === 0) return;
        let fixed = false;
        for (const { node, prop, roots } of candidates) {
          const source = roots.map(isStyle).find((found) => found !== null);
          if (!source) continue;
          const first = !fixed;
          fixed = true;
          context.report({
            node,
            messageId: 'requiresImport',
            data: { prop, source },
            fix: first
              ? (fixer) =>
                  fixer.insertTextBefore(
                    context.sourceCode.ast,
                    'import "@plumeria/core";\n',
                  )
              : null,
          });
        }
      },
    };
  },
};
