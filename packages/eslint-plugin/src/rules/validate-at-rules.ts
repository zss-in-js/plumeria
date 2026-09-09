/**
 * @fileoverview Validate at-rules inside css.create.
 */

import { TSESTree } from '@typescript-eslint/utils';
import { Rule } from 'eslint';
import { styleObjectFromValue } from '../util/styleObject';

const VALID_AT_RULES = [
  '@media ',
  '@container ',
  '@supports ',
  '@layer ',
  '@scope ',
];

export function isValidAtRule(rule: string): boolean {
  return VALID_AT_RULES.some(
    (prefix) => rule.startsWith(prefix) && rule.length > prefix.length,
  );
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
    const parserServices = context.sourceCode.parserServices;
    const checker = parserServices?.program?.getTypeChecker();

    function getKeyString(node: TSESTree.Node): string | null {
      if (
        node.type === TSESTree.AST_NODE_TYPES.Literal &&
        typeof node.value === 'string'
      ) {
        return node.value;
      }
      if (checker && parserServices?.esTreeNodeToTSNodeMap) {
        try {
          const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
          const type = checker.getTypeAtLocation(tsNode);
          if (type.isStringLiteral()) return type.value;
        } catch (error) {
          // Ignore
        }
      }
      return null;
    }

    function checkProperties(node: TSESTree.ObjectExpression): void {
      for (const prop of node.properties) {
        if (prop.type !== TSESTree.AST_NODE_TYPES.Property) continue;
        const key = getKeyString(prop.key);
        if (key?.startsWith('@') && !isValidAtRule(key)) {
          context.report({
            node: prop.key,
            messageId: 'invalidAtRule',
            data: { rule: key },
          });
        }
        if (prop.value.type === TSESTree.AST_NODE_TYPES.ObjectExpression) {
          checkProperties(prop.value);
        }
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@plumeria/core') return;
        node.specifiers.forEach((specifier) => {
          if (
            specifier.type ===
              TSESTree.AST_NODE_TYPES.ImportNamespaceSpecifier ||
            specifier.type === TSESTree.AST_NODE_TYPES.ImportDefaultSpecifier
          ) {
            plumeriaAliases[specifier.local.name] = 'NAMESPACE';
          } else {
            const importedName =
              specifier.imported.type === TSESTree.AST_NODE_TYPES.Identifier
                ? specifier.imported.name
                : String(specifier.imported.value);
            plumeriaAliases[specifier.local.name] = importedName;
          }
        });
      },
      CallExpression(node) {
        let isCssCreate = false;
        if (
          node.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === TSESTree.AST_NODE_TYPES.Identifier &&
          plumeriaAliases[node.callee.object.name] === 'NAMESPACE' &&
          node.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
          node.callee.property.name === 'create'
        ) {
          isCssCreate = true;
        } else if (
          node.callee.type === TSESTree.AST_NODE_TYPES.Identifier &&
          plumeriaAliases[node.callee.name] === 'create'
        ) {
          isCssCreate = true;
        }
        if (
          !isCssCreate ||
          node.arguments[0]?.type !== TSESTree.AST_NODE_TYPES.ObjectExpression
        ) {
          return;
        }
        for (const prop of node.arguments[0].properties) {
          if (prop.type !== TSESTree.AST_NODE_TYPES.Property) continue;
          const style = styleObjectFromValue(prop.value);
          if (style) checkProperties(style as TSESTree.ObjectExpression);
        }
      },
    };
  },
};
