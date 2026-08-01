/**
 * @fileoverview Rename a JSX prop across a codebase
 */

import type { Rule } from 'eslint';

export interface RenamePropOptions {
  from: string;
  to: string;
  includeTypes?: boolean;
}

/**
 * A property signature is renamed only when it is annotated with Plumeria's
 * `Style`, so an unrelated interface that happens to share the key is left
 * alone.
 */
function isStyleAnnotation(node: any): boolean {
  if (!node) return false;

  switch (node.type) {
    case 'TSTypeReference': {
      const name = node.typeName;
      // Plumeria.Style
      if (name?.type === 'TSQualifiedName') return name.right?.name === 'Style';
      return name?.name === 'Style';
    }
    case 'TSUnionType':
    case 'TSIntersectionType':
      return node.types.some(isStyleAnnotation);
    default:
      return false;
  }
}

export const renameProp: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Rename a JSX prop to a new name',
    },
    fixable: 'code',
    messages: {
      rename: 'Rename "{{from}}" to "{{to}}".',
      manual:
        '"{{from}}" is forwarded here. Rename it to "{{to}}" by hand — an autofix would change the local binding too.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          includeTypes: { type: 'boolean' },
        },
        required: ['from', 'to'],
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const {
      from,
      to,
      includeTypes = true,
    } = context.options[0] as RenamePropOptions;

    const rename = (node: any) =>
      context.report({
        node,
        messageId: 'rename',
        data: { from, to },
        fix: (fixer) => fixer.replaceText(node, to),
      });

    const manual = (node: any) =>
      context.report({ node, messageId: 'manual', data: { from, to } });

    return {
      // <div classStyle={styles.text} />
      JSXAttribute(node: any) {
        if (node.name.type !== 'JSXIdentifier') return;
        if (node.name.name !== from) return;
        rename(node.name);
      },

      // interface Props { classStyle?: Style }
      TSPropertySignature(node: any) {
        if (!includeTypes) return;
        if (node.key.type !== 'Identifier' || node.key.name !== from) return;
        if (!isStyleAnnotation(node.typeAnnotation?.typeAnnotation)) return;
        rename(node.key);
      },

      // function Card({ classStyle }) {}
      Property(node: any) {
        if (node.parent?.type !== 'ObjectPattern') return;
        if (node.computed) return;
        if (node.key.type !== 'Identifier' || node.key.name !== from) return;
        manual(node.key);
      },

      // props.classStyle
      MemberExpression(node: any) {
        if (node.computed) return;
        if (node.property.type !== 'Identifier') return;
        if (node.property.name !== from) return;
        manual(node.property);
      },
    };
  },
};
