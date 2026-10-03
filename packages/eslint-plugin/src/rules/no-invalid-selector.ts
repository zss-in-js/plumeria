/**
 * @fileoverview Disallow invalid selector nesting (e.g. Pseudo -> Query, Query -> Query) based on Plumeria rules.
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { Rule } from 'eslint';
import {
  MAX_SELECTOR_NESTING,
  findInvalidSelector,
  stripSelectorComments,
} from 'zss-engine';
import { styleObjectFromValue } from '../util/styleObject';
import { staticValueResolver } from '../util/staticValue';

type SelectorType =
  | 'QUERY'
  | 'PSEUDO'
  | 'CLASS'
  | 'PROPERTY'
  | 'SKIP'
  | 'UNKNOWN';

type PseudoCall = {
  prefix: string;
  name: string;
  start: number;
  end: number;
  args: string;
};

const flattenablePseudos = new Set([
  'is',
  'where',
  'matches',
  '-webkit-any',
  '-moz-any',
  'current',
  'past',
  'future',
  'has',
  'host',
  'host-context',
  'lang',
  'dir',
  'state',
  'part',
  'slotted',
  'nth-child',
  'nth-last-child',
  'nth-of-type',
  'nth-last-of-type',
  'nth-col',
  'nth-last-col',
  'heading',
  'active-view-transition-type',
  'highlight',
  'view-transition-group',
  'view-transition-image-pair',
  'view-transition-old',
  'view-transition-new',
  'cue',
  'cue-region',
  'picker',
  'scroll-button',
]);

function skipString(text: string, i: number): number {
  const quote = text[i];
  let j = i + 1;
  while (j < text.length && text[j] !== quote) {
    j += text[j] === '\\' ? 2 : 1;
  }
  return j + 1;
}

function matchClose(text: string, i: number): number {
  const close = text[i] === '(' ? ')' : ']';
  let depth = 0;
  let j = i;
  while (j < text.length) {
    const ch = text[j];
    if (ch === '\\') {
      j += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      j = skipString(text, j);
      continue;
    }
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') {
      depth--;
      if (depth === 0) return ch === close ? j : -1;
    }
    j++;
  }
  return -1;
}

function findPseudoCalls(text: string): PseudoCall[] | null {
  const calls: PseudoCall[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i = skipString(text, i);
      continue;
    }
    if (ch === '(' || ch === '[') {
      const close = matchClose(text, i);
      if (close < 0) return null;
      i = close + 1;
      continue;
    }
    if (ch === ':') {
      const match = /^(::?)(-?[a-zA-Z][\w-]*)\(/.exec(text.slice(i));
      if (match) {
        const open = i + match[0].length - 1;
        const close = matchClose(text, open);
        if (close < 0) return null;
        calls.push({
          prefix: match[1],
          name: match[2].toLowerCase(),
          start: i,
          end: close + 1,
          args: text.slice(open + 1, close),
        });
        i = close + 1;
        continue;
      }
    }
    i++;
  }
  return calls;
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let last = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i = skipString(text, i);
      continue;
    }
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(text.slice(last, i));
      last = i + 1;
    }
    i++;
  }
  parts.push(text.slice(last));
  return parts;
}

function findSameNameNesting(
  text: string,
  ancestors: string[],
): PseudoCall | null {
  const calls = findPseudoCalls(text);
  if (!calls) return null;
  for (const call of calls) {
    const key = call.prefix + call.name;
    if (key !== ':not' && ancestors.includes(key)) return call;
    const nested = findSameNameNesting(call.args, [...ancestors, key]);
    if (nested) return nested;
  }
  return null;
}

function flattenSelector(text: string): string {
  const calls = findPseudoCalls(text);
  if (!calls) return text;
  let result = '';
  let last = 0;
  for (const call of calls) {
    const args = flattenArgs(call);
    result += text.slice(last, call.start);
    result +=
      args === call.args
        ? text.slice(call.start, call.end)
        : `${call.prefix}${call.name}(${args})`;
    last = call.end;
  }
  return result + text.slice(last);
}

function flattenArgs(call: PseudoCall): string {
  let changed = false;
  const items: string[] = [];
  for (const part of splitTopLevel(call.args)) {
    const flattened = flattenSelector(part);
    if (flattened !== part) changed = true;
    const item = flattened.trim();
    const inner = flattenablePseudos.has(call.name)
      ? findPseudoCalls(item)
      : null;
    if (
      inner?.length === 1 &&
      inner[0].start === 0 &&
      inner[0].end === item.length &&
      inner[0].prefix === call.prefix &&
      inner[0].name === call.name
    ) {
      items.push(...splitTopLevel(inner[0].args).map((s) => s.trim()));
      changed = true;
    } else {
      items.push(item);
    }
  }
  return changed ? items.join(', ') : call.args;
}

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
      flattenSameNamePseudo:
        'Flatten nested "{{name}}()" into a single "{{name}}()".',
      noSameNamePseudoNesting:
        '"{{name}}()" cannot be nested inside another "{{name}}()"; rewrite it without nesting.',
      tooDeepSelector:
        'A selector key cannot nest parentheses deeper than {{max}} levels.',
      strayQuote:
        'A quote must open and close a string inside brackets or parentheses.',
      invalidKeyframesKey:
        'Keyframes keys must be "from", "to", or a percentage value (e.g. "0%", "50%", "100%").',
      invalidViewTransitionKey:
        'ViewTransition keys must be one of: "group", "imagePair", "new", "old".',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const plumeriaAliases: Record<string, string> = {};
    const staticValue = staticValueResolver(context);

    function getSelectorType(node: TSESTree.Node): SelectorType {
      if (node.type === 'Literal' && typeof node.value === 'string') {
        if (node.value.startsWith('@')) return 'QUERY';
        if (node.value.startsWith(':')) return 'PSEUDO';
        return 'PROPERTY';
      }

      if (
        node.type === 'Identifier' &&
        !(node.parent?.type === 'Property' && node.parent.computed)
      ) {
        return 'PROPERTY';
      }

      const value = staticValue(node);
      if (typeof value === 'string') {
        if (value.startsWith('@')) return 'QUERY';
        if (value.startsWith(':')) return 'PSEUDO';
        return 'PROPERTY';
      }
      if (value !== undefined) return 'UNKNOWN';

      return 'SKIP';
    }

    function checkPseudoNesting(node: TSESTree.Node): void {
      const selector =
        node.type === 'Literal' && typeof node.value === 'string'
          ? node.value
          : staticValue(node);
      if (typeof selector !== 'string' || !/^[:[]/.test(selector)) return;
      const invalid = findInvalidSelector(stripSelectorComments(selector));
      if (invalid?.kind === 'too-deep') {
        context.report({
          node,
          messageId: 'tooDeepSelector',
          data: { max: String(MAX_SELECTOR_NESTING) },
        });
        return;
      }
      if (invalid?.kind === 'stray-quote') {
        context.report({ node, messageId: 'strayQuote' });
        return;
      }
      const nested = findSameNameNesting(selector, []);
      if (!nested) return;
      const flattened = flattenSelector(selector);
      const raw = node.type === 'Literal' ? node.raw : '';
      const quote = raw[0];
      const fixable =
        flattened !== selector &&
        (quote === '"' || quote === "'") &&
        raw.slice(1, -1) === selector &&
        !flattened.includes(quote) &&
        !flattened.includes('\\');
      context.report({
        node,
        messageId:
          fixable && !findSameNameNesting(flattened, [])
            ? 'flattenSameNamePseudo'
            : 'noSameNamePseudoNesting',
        data: { name: nested.prefix + nested.name },
        fix: fixable
          ? (fixer) =>
              fixer.replaceText(
                node as Rule.Node,
                `${quote}${flattened}${quote}`,
              )
          : null,
      });
    }

    function checkNesting(
      node: TSESTree.ObjectExpression,
      parentType: SelectorType,
    ) {
      for (const prop of node.properties) {
        if (prop.type !== 'Property') continue;

        const currentType = getSelectorType(prop.key);

        if (currentType === 'SKIP') continue;

        if (
          currentType === 'PSEUDO' ||
          (currentType === 'PROPERTY' &&
            (prop.computed || prop.key.type !== 'Identifier'))
        )
          checkPseudoNesting(prop.key);

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

        if (prop.value.type === 'ObjectExpression') {
          checkNesting(
            prop.value,
            currentType === 'PROPERTY' ? parentType : currentType,
          );
        }
      }
    }

    function checkOnlyProperties(node: TSESTree.ObjectExpression): void {
      for (const prop of node.properties) {
        if (prop.type !== 'Property') continue;
        const currentType = getSelectorType(prop.key);

        if (currentType !== 'PROPERTY') {
          context.report({
            node: prop.key,
            messageId: 'invalidKeySelector',
          });
        }

        if (prop.value.type === 'ObjectExpression') {
          checkOnlyProperties(prop.value);
        }
      }
    }

    function getKeyString(node: TSESTree.Node): string | null {
      if (node.type === 'Literal' && typeof node.value === 'string') {
        return node.value;
      }
      if (node.type === 'Identifier') {
        return node.name;
      }
      return null;
    }

    function checkKeyframesKeys(node: TSESTree.ObjectExpression): void {
      for (const prop of node.properties) {
        if (prop.type !== 'Property') continue;
        const key = getKeyString(prop.key);
        if (key == null) {
          context.report({
            node: prop.key,
            messageId: 'invalidKeyframesKey',
          });
        }

        if (prop.value.type === 'ObjectExpression') {
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
        if (prop.type !== 'Property') continue;
        const key = getKeyString(prop.key);
        if (key == null) {
          context.report({
            node: prop.key,
            messageId: 'invalidViewTransitionKey',
          });
        }

        if (prop.value.type === 'ObjectExpression') {
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
        }
      },

      CallExpression(node) {
        let isCssCreate = false;
        let isCssKeyframes = false;
        let isCssViewTransition = false;

        if (node.callee.type === 'MemberExpression') {
          if (
            node.callee.object.type === 'Identifier' &&
            plumeriaAliases[node.callee.object.name] === 'NAMESPACE'
          ) {
            const propertyName =
              node.callee.property.type === 'Identifier'
                ? node.callee.property.name
                : null;
            if (propertyName === 'create') isCssCreate = true;
            if (propertyName === 'keyframes') isCssKeyframes = true;
            if (propertyName === 'viewTransition') isCssViewTransition = true;
          }
        } else if (node.callee.type === 'Identifier') {
          const alias = plumeriaAliases[node.callee.name];
          if (alias === 'create') isCssCreate = true;
          if (alias === 'keyframes') isCssKeyframes = true;
          if (alias === 'viewTransition') isCssViewTransition = true;
        }

        if (isCssCreate && node.arguments[0]?.type === 'ObjectExpression') {
          const styleObj = node.arguments[0];
          styleObj.properties.forEach((prop) => {
            if (prop.type === 'Property') {
              const currentType = getSelectorType(prop.key as TSESTree.Node);
              if (currentType !== 'SKIP' && currentType === 'UNKNOWN') {
                context.report({
                  node: prop.key,
                  messageId: 'invalidKeySelector',
                });
              }
            }
            if (prop.type !== 'Property') return;
            const style = styleObjectFromValue(prop.value);
            if (style)
              checkNesting(style as TSESTree.ObjectExpression, 'CLASS');
          });
        }

        if (isCssKeyframes && node.arguments[0]?.type === 'ObjectExpression') {
          checkKeyframesKeys(node.arguments[0] as TSESTree.ObjectExpression);
        }

        if (
          isCssViewTransition &&
          node.arguments[0]?.type === 'ObjectExpression'
        ) {
          checkViewTransitionKeys(
            node.arguments[0] as TSESTree.ObjectExpression,
          );
        }
      },
    };
  },
};
