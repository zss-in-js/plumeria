import type { Property } from 'estree';
import type { Rule } from 'eslint';

/* istanbul ignore next */
function getSourceCode(context: Rule.RuleContext) {
  return context.sourceCode ?? context.getSourceCode();
}

export const formatProperties: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description:
        'Format nested objects to have one property per line and remove empty lines',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      mustBeMultiline:
        'Property object must be formatted with each property on its own line.',
      noEmptyLines: 'No empty lines allowed between properties.',
    },
  },

  create(context) {
    const sourceCode = getSourceCode(context);

    return {
      ObjectExpression(node) {
        if (!node.parent || node.parent.type !== 'Property') return;
        if (node.properties.length === 0) return;

        const properties = node.properties as Property[];

        const parentLine = sourceCode.lines[node.parent.loc!.start.line - 1];
        const baseIndent = parentLine.match(/^(\s*)/)![1];
        const innerIndent = baseIndent + '  ';

        const countNewlines = (text: string) =>
          (text.match(/\n/g) ?? []).length;

        const isWhitespaceOnly = (text: string) => /^\s*$/.test(text);

        const fullText = sourceCode.getText();
        const openBrace = sourceCode.getFirstToken(node)!;
        const closeBrace = sourceCode.getLastToken(node)!;

        let hasError = false;
        let hasBlankLines = false;

        const textBeforeFirst = fullText.slice(
          openBrace.range![1],
          properties[0].range![0],
        );
        const newlinesBeforeFirst = countNewlines(textBeforeFirst);
        if (newlinesBeforeFirst === 0) hasError = true;

        for (let i = 0; i < properties.length - 1; i++) {
          const current = properties[i];
          const next = properties[i + 1];
          const comma = sourceCode.getTokenAfter(current)!;
          const sliceStart = comma.range![1];
          const between = fullText.slice(sliceStart, next.range![0]);
          const newlines = countNewlines(between);
          if (newlines === 0) hasError = true;
          if (newlines > 1 && isWhitespaceOnly(between)) hasBlankLines = true;
        }

        const lastProp = properties[properties.length - 1];
        const lastComma = sourceCode.getTokenAfter(lastProp);
        const lastSliceStart =
          lastComma?.value === ',' ? lastComma.range![1] : lastProp.range![1];
        const textAfterLast = fullText.slice(
          lastSliceStart,
          closeBrace.range![0],
        );
        const newlinesAfterLast = countNewlines(textAfterLast);
        if (newlinesAfterLast === 0) hasError = true;

        if (!hasError && !hasBlankLines) return;

        // fix ロジックを共通関数として切り出す
        const buildFixes = (fixer: Rule.RuleFixer) => {
          const fixes = [];

          fixes.push(
            fixer.replaceTextRange(
              [openBrace.range![1], properties[0].range![0]],
              `\n${innerIndent}`,
            ),
          );

          for (let i = 0; i < properties.length - 1; i++) {
            const current = properties[i];
            const next = properties[i + 1];
            const comma = sourceCode.getTokenAfter(current)!;
            if (comma.value === ',') {
              const betweenText = fullText.slice(
                comma.range![1],
                next.range![0],
              );
              if (isWhitespaceOnly(betweenText)) {
                fixes.push(
                  fixer.replaceTextRange(
                    [comma.range![1], next.range![0]],
                    `\n${innerIndent}`,
                  ),
                );
              }
            }
          }

          const lastComma = sourceCode.getTokenAfter(lastProp);
          if (lastComma?.value === ',') {
            fixes.push(
              fixer.replaceTextRange(
                [lastComma.range![1], closeBrace.range![0]],
                `\n${baseIndent}`,
              ),
            );
          } else {
            fixes.push(
              fixer.replaceTextRange(
                [lastProp.range![1], closeBrace.range![0]],
                `\n${baseIndent}`,
              ),
            );
          }

          return fixes;
        };

        if (hasError) {
          context.report({
            node,
            messageId: 'mustBeMultiline',
            fix: buildFixes,
          });
          return;
        }

        let reported = false;
        for (let i = 0; i < properties.length - 1; i++) {
          const current = properties[i];
          const next = properties[i + 1];
          const comma = sourceCode.getTokenAfter(current)!;
          const sliceStart = comma.range![1];
          const between = fullText.slice(sliceStart, next.range![0]);

          if (countNewlines(between) > 1 && isWhitespaceOnly(between)) {
            const blankLineNumber = current.loc!.end.line + 1;
            context.report({
              loc: {
                start: {
                  line: blankLineNumber,
                  column: 0,
                },
                end: {
                  line: blankLineNumber + 1,
                  column: 0,
                },
              },
              messageId: 'noEmptyLines',
              fix: reported ? null : buildFixes,
            });
            reported = true;
          }
        }
      },
    };
  },
};
