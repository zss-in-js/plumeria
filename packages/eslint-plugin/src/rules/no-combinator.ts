/**
 * @fileoverview Disallow combinators >, +, ~ and descendant combinator (space) unless inside functional pseudo-classes
 */

import type { Rule } from 'eslint';

export const noCombinator: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow combinators >, +, ~ and descendant combinator (space) unless inside functional pseudo-classes.',
    },
    messages: {
      noCombinator:
        'Combinator "{{combinator}}" is not allowed unless inside functional pseudo-classes.',
    },
    schema: [],
  },

  create(context) {
    const plumeriaAliases: Record<string, string> = {};

    function isCombinatorAllowed(selector: string): boolean {
      const s = selector.trim();

      if (s.startsWith('@')) {
        return true;
      }

      const len = s.length;
      let i = 0;

      while (i < len) {
        const char = s[i];

        if (char === '"' || char === "'") {
          i = skipString(s, i);
          continue;
        }

        if (char === '(') {
          i = skipBlock(s, i, '(', ')');
          continue;
        }

        if (char === '[') {
          i = skipBlock(s, i, '[', ']');
          continue;
        }

        if (char === '>' || char === '+' || char === '~') {
          return false;
        }

        if (isSpace(char)) {
          let next = i + 1;
          while (next < len && isSpace(s[next])) {
            next++;
          }

          if (next < len) {
            const nextChar = s[next];
            const prevChar = s[i - 1];

            if (
              !isCombinatorOrSeparator(prevChar) &&
              !isCombinatorOrSeparator(nextChar)
            ) {
              return false;
            }
          }
          i = next;
          continue;
        }

        i++;
      }

      return true;
    }

    function skipString(s: string, start: number): number {
      const quote = s[start];
      let i = start + 1;
      while (i < s.length) {
        if (s[i] === '\\') {
          i += 2; // Skip escaped char
          continue;
        }
        if (s[i] === quote) {
          return i + 1;
        }
        i++;
      }
      return i;
    }

    function skipBlock(
      s: string,
      start: number,
      open: string,
      close: string,
    ): number {
      let depth = 1;
      let i = start + 1;
      while (i < s.length && depth > 0) {
        const char = s[i];
        if (char === '\\') {
          i += 2;
          continue;
        }
        if (char === '"' || char === "'") {
          i = skipString(s, i);
          continue;
        }
        if (char === open) {
          depth++;
        } else if (char === close) {
          depth--;
        }
        i++;
      }
      return i;
    }

    function isSpace(char: string): boolean {
      return char === ' ' || char === '\t' || char === '\n' || char === '\r';
    }

    function isCombinatorOrSeparator(char: string): boolean {
      return (
        char === '>' ||
        char === '+' ||
        char === '~' ||
        char === ',' ||
        char === undefined
      ); // undefined check for safety
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
            } else if (specifier.type === 'ImportSpecifier') {
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
        if (node.callee.type === 'MemberExpression') {
          if (
            node.callee.object.type === 'Identifier' &&
            plumeriaAliases[node.callee.object.name] === 'NAMESPACE'
          ) {
            const propertyName =
              node.callee.property.type === 'Identifier'
                ? node.callee.property.name
                : null;
            if (propertyName === 'create' || propertyName === 'variants') {
              node.arguments.forEach((arg) => {
                if (arg.type === 'ObjectExpression') {
                  checkForCombinatorsRecursively(arg);
                }
              });
            } else if (propertyName === 'createStatic') {
              node.arguments.forEach((arg) => {
                if (arg.type === 'ObjectExpression') {
                  checkCreateStaticValues(arg);
                }
              });
            }
          }
        } else if (node.callee.type === 'Identifier') {
          const alias = plumeriaAliases[node.callee.name];
          if (alias === 'create' || alias === 'variants') {
            node.arguments.forEach((arg) => {
              if (arg.type === 'ObjectExpression') {
                checkForCombinatorsRecursively(arg);
              }
            });
          } else if (alias === 'createStatic') {
            node.arguments.forEach((arg) => {
              if (arg.type === 'ObjectExpression') {
                checkCreateStaticValues(arg);
              }
            });
          }
        }
      },
    };

    function checkForCombinatorsRecursively(node: any) {
      for (const prop of node.properties) {
        if (prop.type === 'Property') {
          let keyName = '';
          if (prop.key.type === 'Identifier') {
            keyName = prop.key.name;
          } else if (prop.key.type === 'Literal') {
            keyName = String(prop.key.value);
          }

          if (keyName) {
            checkAndReport(keyName, prop.key);
          }

          if (prop.value.type === 'ObjectExpression') {
            checkForCombinatorsRecursively(prop.value);
          }
        }
      }
    }

    function checkCreateStaticValues(node: any) {
      for (const prop of node.properties) {
        if (prop.type === 'Property') {
          if (prop.value.type === 'Literal') {
            const value = String(prop.value.value);
            checkAndReport(value, prop.value);
          }
        }
      }
    }

    function checkAndReport(text: string, node: any) {
      if (
        text.includes('>') ||
        text.includes('+') ||
        text.includes('~') ||
        text.includes(' ') || // Simple space check is usually enough for class names but let's be safe
        text.includes('\t') ||
        text.includes('\n')
      ) {
        if (!isCombinatorAllowed(text)) {
          let found = '';
          if (text.includes('>')) found = '>';
          else if (text.includes('+')) found = '+';
          else if (text.includes('~')) found = '~';
          else if (
            text.includes(' ') ||
            text.includes('\t') ||
            text.includes('\n')
          )
            found = '(space)';

          context.report({
            node: node,
            messageId: 'noCombinator',
            data: { combinator: found },
          });
        }
      }
    }
  },
};
