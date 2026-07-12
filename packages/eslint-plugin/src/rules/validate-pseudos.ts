/**
 * @fileoverview Validate CSS pseudo-classes and pseudo-elements inside css.create.
 */

import { TSESTree } from '@typescript-eslint/utils';
import { Rule } from 'eslint';

const VALID_STATIC_PSEUDOS = new Set([
  // Pseudo-Classes
  ':hover',
  ':active',
  ':focus',
  ':focus-visible',
  ':focus-within',
  ':checked',
  ':disabled',
  ':enabled',
  ':required',
  ':optional',
  ':valid',
  ':invalid',
  ':in-range',
  ':out-of-range',
  ':read-only',
  ':read-write',
  ':placeholder-shown',
  ':indeterminate',
  ':default',
  ':autofill',
  ':first-child',
  ':last-child',
  ':only-child',
  ':first-of-type',
  ':last-of-type',
  ':only-of-type',
  ':empty',
  ':link',
  ':visited',
  ':any-link',
  ':root',
  ':target',
  ':fullscreen',
  ':modal',
  ':open',
  ':defined',
  ':popover-open',
  ':host',

  // Pseudo-Elements
  '::before',
  '::after',
  '::first-letter',
  '::first-line',
  '::selection',
  '::placeholder',
  '::marker',
  '::cue',
  '::backdrop',
  '::spelling-error',
  '::grammar-error',
  '::view-transition',
  '::file-selector-button',
  '::details-content',
  '::target-text',

  // Legacy Pseudo-Elements (single colon)
  ':before',
  ':after',
  ':first-letter',
  ':first-line',
  ':placeholder',
]);

const FUNCTIONAL_PREFIXES = [
  // Pseudo-classes
  ':nth-child(',
  ':nth-last-child(',
  ':nth-of-type(',
  ':nth-last-of-type(',
  ':not(',
  ':is(',
  ':where(',
  ':has(',
  ':lang(',
  ':dir(',
  ':host(',
  ':host-context(',
  ':state(',

  // Pseudo-elements
  '::cue(',
  '::part(',
  '::slotted(',
  '::view-transition-group(',
  '::view-transition-image-pair(',
  '::view-transition-old(',
  '::view-transition-new(',
  '::highlight(',
];

export function splitChainedPseudos(selector: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];

    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ':' && parenDepth === 0) {
      if (current.length > 0 && current !== ':' && current !== '::') {
        parts.push(current);
        current = ':';
      } else {
        current += ':';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    parts.push(current);
  }

  return parts;
}

export function isValidPseudo(selector: string): boolean {
  if (VALID_STATIC_PSEUDOS.has(selector)) {
    return true;
  }

  for (const prefix of FUNCTIONAL_PREFIXES) {
    if (selector.startsWith(prefix) && selector.endsWith(')')) {
      const content = selector.slice(prefix.length, -1).trim();
      if (content.length > 0) {
        return true;
      }
    }
  }

  return false;
}

export const validatePseudos: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Validate CSS pseudo-classes and pseudo-elements inside css.create.',
    },
    messages: {
      invalidPseudo: 'Invalid pseudo-class or pseudo-element: "{{selector}}".',
    },
    schema: [],
  },
  create(context) {
    const plumeriaAliases: Record<string, string> = {};
    const parserServices = context.sourceCode.parserServices;
    const checker = parserServices?.program?.getTypeChecker();

    function getSelectorString(node: TSESTree.Node): string | null {
      if (
        node.type === TSESTree.AST_NODE_TYPES.Literal &&
        typeof node.value === 'string'
      ) {
        return node.value;
      }

      if (
        node.type === TSESTree.AST_NODE_TYPES.Identifier &&
        !(
          node.parent?.type === TSESTree.AST_NODE_TYPES.Property &&
          node.parent.computed
        )
      ) {
        return node.name;
      }

      if (checker && parserServices?.esTreeNodeToTSNodeMap) {
        try {
          const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
          const type = checker.getTypeAtLocation(tsNode);

          if (type.isStringLiteral()) {
            return type.value;
          }
        } catch (error) {
          // Ignore
        }
      }

      return null;
    }

    function checkProperties(node: TSESTree.ObjectExpression) {
      for (const prop of node.properties) {
        if (prop.type !== TSESTree.AST_NODE_TYPES.Property) continue;

        const selectorString = getSelectorString(prop.key);
        if (selectorString !== null && selectorString.startsWith(':')) {
          const parts = splitChainedPseudos(selectorString);
          for (const part of parts) {
            if (!isValidPseudo(part)) {
              context.report({
                node: prop.key,
                messageId: 'invalidPseudo',
                data: {
                  selector: selectorString,
                },
              });
              break;
            }
          }
        }

        if (prop.value.type === TSESTree.AST_NODE_TYPES.ObjectExpression) {
          checkProperties(prop.value);
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
              checkProperties(prop.value as TSESTree.ObjectExpression);
            }
          });
        }
      },
    };
  },
};
