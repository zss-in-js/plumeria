/**
 * @fileoverview Validate at-rules inside css.create.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { Rule } from 'eslint';
import { styleObjectFromValue } from '../util/styleObject';
import { staticValueResolver } from '../util/staticValue';

const VALID_AT_RULES = [
  '@media',
  '@container',
  '@supports',
  '@layer',
  '@scope',
];

export function isValidAtRule(rule: string): boolean {
  return VALID_AT_RULES.some((keyword) => {
    if (!rule.startsWith(keyword)) return false;
    const prelude = rule.slice(keyword.length);
    if (!prelude.startsWith(' ') && !prelude.startsWith('(')) return false;
    return prelude.replace(/[()\s]/g, '').length > 0;
  });
}

export const validateAtRules: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate at-rules inside css.create.',
    },
    messages: {
      invalidAtRule: 'Invalid at-rule: "{{ rule }}".',
    },
    schema: [],
  },
  create(context) {
    const plumeriaAliases: Record<string, string> = {};
    const staticValue = staticValueResolver(context);

    function getKeyString(node: TSESTree.Node): string | null {
      if (node.type === 'Literal' && typeof node.value === 'string') {
        return node.value;
      }
      const value = staticValue(node);
      return typeof value === 'string' ? value : null;
    }

    function checkProperties(node: TSESTree.ObjectExpression): void {
      for (const prop of node.properties) {
        if (prop.type !== 'Property') continue;
        const key = getKeyString(prop.key);
        if (key?.startsWith('@') && !isValidAtRule(key)) {
          context.report({
            node: prop.key,
            messageId: 'invalidAtRule',
            data: { rule: key },
          });
        }
        if (prop.value.type === 'ObjectExpression') {
          checkProperties(prop.value);
        }
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@plumeria/core') return;
        node.specifiers.forEach((specifier) => {
          if (
            specifier.type === 'ImportNamespaceSpecifier' ||
            specifier.type === 'ImportDefaultSpecifier'
          ) {
            plumeriaAliases[specifier.local.name] = 'NAMESPACE';
          } else {
            const importedName =
              specifier.imported.type === 'Identifier'
                ? specifier.imported.name
                : String(specifier.imported.value);
            plumeriaAliases[specifier.local.name] = importedName;
          }
        });
      },
      CallExpression(node) {
        let isCssCreate = false;
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          plumeriaAliases[node.callee.object.name] === 'NAMESPACE' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'create'
        ) {
          isCssCreate = true;
        } else if (
          node.callee.type === 'Identifier' &&
          plumeriaAliases[node.callee.name] === 'create'
        ) {
          isCssCreate = true;
        }
        if (!isCssCreate || node.arguments[0]?.type !== 'ObjectExpression') {
          return;
        }
        for (const prop of node.arguments[0].properties) {
          if (prop.type !== 'Property') continue;
          const style = styleObjectFromValue(prop.value);
          if (style) checkProperties(style as TSESTree.ObjectExpression);
        }
      },
    };
  },
};
