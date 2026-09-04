import * as path from 'path';
import type {
  Module,
  ObjectExpression,
  Expression,
  ImportSpecifier,
} from '@swc/core';
import type { PropertySpelling } from 'zss-engine';
import {
  camelToKebabCase,
  counterpartOf,
  kebabToCamelCase,
  spellingOf,
} from 'zss-engine';
import { traverse, t } from './parser';

export interface PropertyPolicyOptions {
  withoutLogicalProperties?: boolean | { sizes?: boolean };
  withoutPhysicalProperties?: boolean | { sizes?: boolean };
}

export interface PropertyPolicy {
  reject: PropertySpelling;
  includeAxes: boolean;
}

const STYLE_APIS = ['create', 'keyframes', 'viewTransition'];

const MESSAGES: Record<PropertySpelling, (n: string, c: string) => string> = {
  physical: (name, counterpart) =>
    `'${name}' is the physical name of this property. Write it as '${counterpart}', which follows the writing mode.`,
  logical: (name, counterpart) =>
    `'${name}' is the logical name of this property. This project is written in physical properties; use '${counterpart}'.`,
};

const isEnabled = (
  option: boolean | { sizes?: boolean } | undefined,
): boolean =>
  option === true || (typeof option === 'object' && option !== null);

const axesOf = (option: boolean | { sizes?: boolean } | undefined): boolean =>
  typeof option === 'object' && option !== null
    ? (option.sizes ?? false)
    : false;

export const resolvePropertyPolicy = (
  options: PropertyPolicyOptions,
): PropertyPolicy | undefined => {
  const withoutLogical = isEnabled(options.withoutLogicalProperties);
  const withoutPhysical = isEnabled(options.withoutPhysicalProperties);

  if (withoutLogical && withoutPhysical)
    throw new Error(
      `[plumeria] withoutLogicalProperties and withoutPhysicalProperties contradict each other. Enable only the one this project writes against.`,
    );

  if (withoutLogical)
    return {
      reject: 'logical',
      includeAxes: axesOf(options.withoutLogicalProperties),
    };

  if (withoutPhysical)
    return {
      reject: 'physical',
      includeAxes: axesOf(options.withoutPhysicalProperties),
    };

  return undefined;
};

export const assertPropertyPolicy = (
  ast: Module,
  policy: PropertyPolicy | undefined,
  resourcePath: string,
): void => {
  if (!policy) return;

  const plumeriaAliases: Record<string, string> = {};

  const styleObjectOf = (node: Expression): ObjectExpression | undefined => {
    if (t.isObjectExpression(node)) return node;
    if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
      const body = (node as { body?: unknown }).body;
      if (t.isObjectExpression(body)) return body as ObjectExpression;
      if (t.isParenthesisExpression(body))
        return styleObjectOf((body as { expression: Expression }).expression);
    }
    return undefined;
  };

  const nameOf = (key: unknown): string => {
    if (t.isIdentifier(key) || t.isStringLiteral(key))
      return (key as { value: string }).value;
    return '';
  };

  const check = (node: ObjectExpression): void => {
    node.properties.forEach((prop) => {
      if (!t.isObjectProperty(prop)) return;

      const nested = styleObjectOf(prop.value as Expression);
      if (nested) {
        check(nested);
        return;
      }

      const name = nameOf(prop.key);
      if (!name) return;

      const kebab = camelToKebabCase(name);
      if (spellingOf(kebab, policy.includeAxes) !== policy.reject) return;

      const counterpart = kebabToCamelCase(counterpartOf(kebab)!);
      throw new Error(
        `[plumeria] ${MESSAGES[policy.reject](name, counterpart)} (${path.basename(resourcePath)})`,
      );
    });
  };

  traverse(ast, {
    ImportDeclaration({ node }) {
      if (node.source.value !== '@plumeria/core') return;
      node.specifiers.forEach((specifier: ImportSpecifier) => {
        if (
          specifier.type === 'ImportNamespaceSpecifier' ||
          specifier.type === 'ImportDefaultSpecifier'
        ) {
          plumeriaAliases[specifier.local.value] = 'NAMESPACE';
        } else if (specifier.type === 'ImportSpecifier') {
          plumeriaAliases[specifier.local.value] = specifier.imported
            ? specifier.imported.value
            : specifier.local.value;
        }
      });
    },
    CallExpression({ node }) {
      const callee = node.callee;
      let apiName: string | undefined;

      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        t.isIdentifier(callee.property)
      ) {
        if (plumeriaAliases[callee.object.value] === 'NAMESPACE')
          apiName = callee.property.value;
      } else if (t.isIdentifier(callee)) {
        apiName = plumeriaAliases[callee.value];
      }

      if (!apiName || !STYLE_APIS.includes(apiName)) return;

      node.arguments.forEach(({ expression }: { expression: Expression }) => {
        if (!t.isObjectExpression(expression)) return;
        expression.properties.forEach((prop) => {
          if (!t.isObjectProperty(prop)) return;
          const style = styleObjectOf(prop.value as Expression);
          if (style) check(style);
        });
      });
    },
  });
};
