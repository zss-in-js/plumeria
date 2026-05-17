/**
 * @fileoverview Disallow invalid selector nesting (e.g. Pseudo -> Query, Query -> Query) based on Plumeria rules.
 */

import { TSESTree } from '@typescript-eslint/utils';
import { Rule } from 'eslint';

type SelectorType =
  | 'QUERY'
  | 'PSEUDO'
  | 'CLASS'
  | 'PROPERTY'
  | 'SKIP'
  | 'UNKNOWN';

export const noInvalidSelector: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow invalid selector nesting (e.g. Pseudo -> Query, Query -> Query) based on Plumeria rules.',
    },
    messages: {
      invalidKeySelector: 'Invalid key selector.',
      noQueryInsidePseudo:
        'Media/Container queries cannot be nested inside pseudo-selectors.',
      noQueryInsideQuery:
        'Media/Container queries cannot be nested inside other queries.',
      noPseudoInsidePseudo:
        'Pseudo-selectors cannot be nested inside other pseudo-selectors.',
      invalidKeyframesKey:
        'Keyframes keys must be "from", "to", or a percentage value (e.g. "0%", "50%", "100%").',
      invalidViewTransitionKey:
        'ViewTransition keys must be one of: "group", "imagePair", "new", "old".',
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
            return 'PROPERTY';
          }
        } catch (error) {
          // Ignore
        }
        return 'UNKNOWN';
      }

      return 'SKIP';
    }

    function checkNesting(
      node: TSESTree.ObjectExpression,
      parentType: SelectorType,
    ) {
      for (const prop of node.properties) {
        if (prop.type !== TSESTree.AST_NODE_TYPES.Property) continue;

        const currentType = getSelectorType(prop.key);

        if (currentType === 'SKIP') continue;

        if (currentType === 'UNKNOWN') {
          context.report({
            node: prop.key,
            messageId: 'invalidKeySelector',
          });
        }

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

    function checkOnlyProperties(node: TSESTree.ObjectExpression): void {
      for (const prop of node.properties) {
        if (prop.type !== TSESTree.AST_NODE_TYPES.Property) continue;
        const currentType = getSelectorType(prop.key);

        if (currentType !== 'PROPERTY') {
          context.report({
            node: prop.key,
            messageId: 'invalidKeySelector',
          });
        }

        if (prop.value.type === TSESTree.AST_NODE_TYPES.ObjectExpression) {
          checkOnlyProperties(prop.value);
        }
      }
    }

    function getKeyString(node: TSESTree.Node): string | null {
      if (
        node.type === TSESTree.AST_NODE_TYPES.Literal &&
        typeof node.value === 'string'
      ) {
        return node.value;
      }
      if (node.type === TSESTree.AST_NODE_TYPES.Identifier) {
        return node.name;
      }
      return null;
    }

    function checkKeyframesKeys(node: TSESTree.ObjectExpression): void {
      for (const prop of node.properties) {
        if (prop.type !== TSESTree.AST_NODE_TYPES.Property) continue;
        const key = getKeyString(prop.key);
        if (key == null) {
          context.report({
            node: prop.key,
            messageId: 'invalidKeyframesKey',
          });
        }

        if (prop.value.type === TSESTree.AST_NODE_TYPES.ObjectExpression) {
          checkOnlyProperties(prop.value as TSESTree.ObjectExpression);
        }

        if (
          key !== null &&
          key !== 'from' &&
          key !== 'to' &&
          !/^\d+(\.\d+)?%$/.test(key)
        ) {
          context.report({ node: prop.key, messageId: 'invalidKeyframesKey' });
        }
      }
    }

    function checkViewTransitionKeys(node: TSESTree.ObjectExpression): void {
      const allowed = new Set(['group', 'imagePair', 'new', 'old']);
      for (const prop of node.properties) {
        if (prop.type !== TSESTree.AST_NODE_TYPES.Property) continue;
        const key = getKeyString(prop.key);
        if (key == null) {
          context.report({
            node: prop.key,
            messageId: 'invalidViewTransitionKey',
          });
        }

        if (prop.value.type === TSESTree.AST_NODE_TYPES.ObjectExpression) {
          checkOnlyProperties(prop.value as TSESTree.ObjectExpression);
        }

        if (key !== null && !allowed.has(key)) {
          context.report({
            node: prop.key,
            messageId: 'invalidViewTransitionKey',
          });
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
        let isCssKeyframes = false;
        let isCssViewTransition = false;

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
            if (propertyName === 'keyframes') isCssKeyframes = true;
            if (propertyName === 'viewTransition') isCssViewTransition = true;
          }
        } else if (node.callee.type === TSESTree.AST_NODE_TYPES.Identifier) {
          const alias = plumeriaAliases[node.callee.name];
          if (alias === 'create') isCssCreate = true;
          if (alias === 'keyframes') isCssKeyframes = true;
          if (alias === 'viewTransition') isCssViewTransition = true;
        }

        if (
          isCssCreate &&
          node.arguments[0]?.type === TSESTree.AST_NODE_TYPES.ObjectExpression
        ) {
          const styleObj = node.arguments[0];
          styleObj.properties.forEach((prop) => {
            if (prop.type === TSESTree.AST_NODE_TYPES.Property) {
              const currentType = getSelectorType(prop.key as TSESTree.Node);
              if (currentType !== 'SKIP' && currentType === 'UNKNOWN') {
                context.report({
                  node: prop.key,
                  messageId: 'invalidKeySelector',
                });
              }
            }
            if (
              prop.type === TSESTree.AST_NODE_TYPES.Property &&
              prop.value.type === TSESTree.AST_NODE_TYPES.ObjectExpression
            ) {
              checkNesting(prop.value as TSESTree.ObjectExpression, 'CLASS');
            }
          });
        }

        if (
          isCssKeyframes &&
          node.arguments[0]?.type === TSESTree.AST_NODE_TYPES.ObjectExpression
        ) {
          checkKeyframesKeys(node.arguments[0] as TSESTree.ObjectExpression);
        }

        if (
          isCssViewTransition &&
          node.arguments[0]?.type === TSESTree.AST_NODE_TYPES.ObjectExpression
        ) {
          checkViewTransitionKeys(
            node.arguments[0] as TSESTree.ObjectExpression,
          );
        }
      },
    };
  },
};
