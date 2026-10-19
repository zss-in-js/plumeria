/**
 * @fileoverview Rename a Plumeria API across a codebase
 */

import type { Rule } from 'eslint';

export interface RenameApiOptions {
  from: string;
  to: string;
}

const CORE = '@plumeria/core';

export const renameApi: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Rename a Plumeria API to a new name',
    },
    fixable: 'code',
    messages: {
      rename: 'Rename "{{from}}" to "{{to}}".',
    },
    schema: [
      {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
        },
        required: ['from', 'to'],
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const { from, to } = context.options[0] as RenameApiOptions;
    const namespaces = new Set<string>();

    const rename = (node: any) =>
      context.report({
        node,
        messageId: 'rename',
        data: { from, to },
        fix: (fixer) => fixer.replaceText(node, to),
      });

    return {
      ImportDeclaration(node: any) {
        if (node.source.value !== CORE) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            namespaces.add(specifier.local.name);
            continue;
          }
          if (specifier.imported.type !== 'Identifier') continue;
          if (specifier.imported.name !== from) continue;
          rename(specifier.imported);
          if (specifier.local.name !== from) continue;
          const [variable] = context.sourceCode.getDeclaredVariables(specifier);
          for (const reference of variable?.references ?? []) {
            rename(reference.identifier);
          }
        }
      },

      MemberExpression(node: any) {
        if (node.computed) return;
        if (node.object.type !== 'Identifier') return;
        if (!namespaces.has(node.object.name)) return;
        if (node.property.type !== 'Identifier') return;
        if (node.property.name !== from) return;
        rename(node.property);
      },
    };
  },
};
