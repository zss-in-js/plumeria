import { TSESTree } from '@typescript-eslint/utils';
import { Rule } from 'eslint';
import ts from 'typescript';

type SelectorType = 'QUERY' | 'PSEUDO' | 'CLASS' | 'PROPERTY' | 'UNKNOWN';

export const noInvalidSelectorNesting: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow invalid selector nesting (e.g. Pseudo -> Query, Query -> Query) based on Plumeria rules.',
    },
    messages: {
      noQueryInsidePseudo:
        'Media/Container queries cannot be nested inside pseudo-selectors.',
      noQueryInsideQuery:
        'Media/Container queries cannot be nested inside other queries.',
      noPseudoInsidePseudo:
        'Pseudo-selectors cannot be nested inside other pseudo-selectors.',
    },
    schema: [],
  },
  create(context) {
    const plumeriaAliases: Record<string, string> = {};
    const parserServices = context.sourceCode.parserServices;
    const checker = parserServices?.program?.getTypeChecker();

    function getSelectorType(node: TSESTree.Node): SelectorType {
      if (
        node.type === TSESTree.AST_NODE_TYPES.Literal &&
        typeof node.value === 'string'
      ) {
        if (node.value.startsWith('@')) return 'QUERY';
        if (node.value.startsWith(':')) return 'PSEUDO';
        return 'PROPERTY';
      }

      if (
        node.type === TSESTree.AST_NODE_TYPES.Identifier &&
        !(
          node.parent?.type === TSESTree.AST_NODE_TYPES.Property &&
          node.parent.computed
        )
      ) {
        return 'PROPERTY';
      }

      if (checker && parserServices?.esTreeNodeToTSNodeMap) {
        try {
          const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
          const type = checker.getTypeAtLocation(tsNode);

          if (type.isStringLiteral()) {
            if (type.value.startsWith('@')) return 'QUERY';
            if (type.value.startsWith(':')) return 'PSEUDO';
          }
          if (type.isUnion()) {
            const types = type.types;
            if (
              types.every(
                (t: ts.Type) => t.isStringLiteral() && t.value.startsWith('@'),
              )
            )
              return 'QUERY';
            if (
              types.every(
                (t: ts.Type) => t.isStringLiteral() && t.value.startsWith(':'),
              )
            )
              return 'PSEUDO';
          }
        } catch (e) {
          // Ignore
        }
      }

      return 'UNKNOWN';
    }

    function checkNesting(
      node: TSESTree.ObjectExpression,
      parentType: SelectorType,
    ) {
      for (const prop of node.properties) {
        if (prop.type !== TSESTree.AST_NODE_TYPES.Property) continue;

        const currentType = getSelectorType(prop.key);

        if (parentType === 'PSEUDO' && currentType === 'QUERY') {
          context.report({
            node: prop.key,
            messageId: 'noQueryInsidePseudo',
          });
        } else if (parentType === 'QUERY' && currentType === 'QUERY') {
          context.report({ node: prop.key, messageId: 'noQueryInsideQuery' });
        } else if (parentType === 'PSEUDO' && currentType === 'PSEUDO') {
          context.report({
            node: prop.key,
            messageId: 'noPseudoInsidePseudo',
          });
        }

        if (prop.value.type === TSESTree.AST_NODE_TYPES.ObjectExpression) {
          checkNesting(
            prop.value,
            currentType === 'PROPERTY' ? parentType : currentType,
          );
        }
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value === '@plumeria/core') {
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
        }
      },
      CallExpression(node) {
        let isCssCreate = false;
        if (node.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression) {
          if (
            node.callee.object.type === TSESTree.AST_NODE_TYPES.Identifier &&
            plumeriaAliases[node.callee.object.name] === 'NAMESPACE'
          ) {
            const propertyName =
              node.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier
                ? node.callee.property.name
                : null;
            if (propertyName === 'create') isCssCreate = true;
          }
        } else if (node.callee.type === TSESTree.AST_NODE_TYPES.Identifier) {
          const alias = plumeriaAliases[node.callee.name];
          if (alias === 'create') isCssCreate = true;
        }

        if (
          isCssCreate &&
          node.arguments[0]?.type === TSESTree.AST_NODE_TYPES.ObjectExpression
        ) {
          const styleObj = node.arguments[0];
          styleObj.properties.forEach((prop) => {
            if (
              prop.type === TSESTree.AST_NODE_TYPES.Property &&
              prop.value.type === TSESTree.AST_NODE_TYPES.ObjectExpression
            ) {
              checkNesting(prop.value as TSESTree.ObjectExpression, 'CLASS');
            }
          });
        }
      },
    };
  },
};
