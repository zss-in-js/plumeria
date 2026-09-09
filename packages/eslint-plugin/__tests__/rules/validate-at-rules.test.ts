import { RuleTester } from 'eslint';
import * as parser from '@typescript-eslint/parser';
import path from 'path';
import {
  isValidAtRule,
  validateAtRules,
} from '../../src/rules/validate-at-rules';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      projectService: { allowDefaultProject: ['*.ts'] },
      tsconfigRootDir: path.resolve(__dirname, '../../'),
    },
  },
});

const ruleTesterNoType = new RuleTester({
  languageOptions: { parser, ecmaVersion: 'latest', sourceType: 'module' },
});

ruleTester.run('validate-at-rules', validateAtRules, {
  valid: [
    {
      code: `
        import * as css from '@plumeria/core';
        const query = '@media (width >= 640px)' as const;
        css.create({
          box: {
            [query]: { color: 'red' },
            '@container card (width > 20rem)': { display: 'grid' },
            '@supports (display: grid)': { display: 'grid' },
            '@layer components': { color: 'blue' },
            '@scope (.card)': { color: 'green' },
          },
        });
      `,
    },
    {
      code: `import { create } from 'other-library'; create({ box: { '@unknown foo': {} } });`,
    },
    {
      code: `
        import { "create" as createStyles } from '@plumeria/core';
        createStyles({
          ...sharedStyles,
          shared: sharedStyle,
          box: {
            ...sharedRules,
            '@media print': { color: 'black' },
          },
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        import { create } from '@plumeria/core';
        const unknown = '@unknown foo' as const;
        create({
          box: {
            [unknown]: { color: 'red' },
            '@mediafoo': { color: 'blue' },
            '@supports': { display: 'grid' },
          },
        });
      `,
      errors: [
        { message: 'Invalid at-rule: "@unknown foo".' },
        { message: 'Invalid at-rule: "@mediafoo".' },
        { message: 'Invalid at-rule: "@supports".' },
      ],
    },
  ],
});

ruleTesterNoType.run(
  'validate-at-rules without type information',
  validateAtRules,
  {
    valid: [
      {
        code: `
        import * as css from '@plumeria/core';
        const unknown = '@unknown foo';
        css.create({ box: { [unknown]: { color: 'red' } } });
      `,
      },
    ],
    invalid: [
      {
        code: `
        import * as css from '@plumeria/core';
        css.create({ box: { '@unknown foo': { color: 'red' } } });
      `,
        errors: [{ messageId: 'invalidAtRule' }],
      },
    ],
  },
);

describe('isValidAtRule', () => {
  test('accepts supported at-rules with a prelude', () => {
    expect(isValidAtRule('@media print')).toBe(true);
    expect(isValidAtRule('@scope (.card)')).toBe(true);
  });

  test('rejects unknown and incomplete at-rules', () => {
    expect(isValidAtRule('@unknown foo')).toBe(false);
    expect(isValidAtRule('@media')).toBe(false);
  });
});
