import { RuleTester } from 'eslint';
import * as parser from '@typescript-eslint/parser';
import {
  validatePseudos,
  splitChainedPseudos,
} from '../../src/rules/validate-pseudos';
import path from 'path';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
      },
      tsconfigRootDir: path.resolve(__dirname, '../../'),
    },
  },
});

const ruleTesterNoType = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('validate-pseudos', validatePseudos, {
  valid: [
    {
      code: `import { create } from 'other-library'; create({ s: { ':hovver': {} } });`,
    },
    // Test branch: member expression where object is identifier but not plumeria alias
    {
      code: `import * as other from 'other-library'; other.create({ s: { ':hovver': {} } });`,
    },
    // Test branch: callee is neither identifier nor member expression
    {
      code: `
        import * as css from '@plumeria/core';
        (function() { return css.create; })()({
          s: { ':hovver': {} }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          button: {
            color: 'red',
            ':hover': { color: 'blue' },
            '::before': { content: '""' },
            ':before': { content: '""' }, // legacy compatibility
            ':nth-child(2n)': { color: 'green' },
            ':not(:hover)': { color: 'yellow' },
            ':hover::after': { color: 'purple' },
            ':nth-child(2n)::before': { content: '""' },
            ':popover-open': { display: 'block' },
            ':host': { display: 'block' },
            ':host(.dark)': { display: 'block' },
            ':host-context(.dark)': { display: 'block' },
            ':state(checked)': { color: 'blue' },
            '::file-selector-button': { color: 'red' },
            '::details-content': { color: 'red' },
            '::target-text': { color: 'red' },
            '::highlight(search)': { color: 'red' },
          }
        });
      `,
    },
    {
      code: `
        import { create } from '@plumeria/core';
        create({
          button: {
            // Nested checks
            ':active': {
              '::after': {
                color: 'red'
              }
            }
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const hv = ':hover' as const;
        css.create({
          button: {
            [hv]: { color: 'red' },
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        // Non-string-literal dynamic computed keys are skipped/ignored by this rule
        const dynamic = (':hover' + '') as string;
        css.create({
          button: {
            [dynamic]: { color: 'red' },
          }
        });
      `,
    },
    // Test branch: non-Identifier namespace object (ParenthesizedExpression)
    {
      code: `
        import * as css from '@plumeria/core';
        (css).create({
          button: {
            ':hover': { color: 'blue' }
          }
        });
      `,
    },
    // Test branch: member expression property is not an Identifier (css['create'])
    {
      code: `
        import * as css from '@plumeria/core';
        css['create']({
          button: {
            ':hover': { color: 'blue' }
          }
        });
      `,
    },
    // Test branch: Import specifier with string literal name
    {
      code: `
        import { "create" as c2 } from '@plumeria/core';
        c2({
          button: {
            ':hover': { color: 'blue' }
          }
        });
      `,
    },
    // Test branch: spread elements and non-object expressions at top-level and nested level
    {
      code: `
        import { create } from '@plumeria/core';
        create({
          ...topSpread,
          button: {
            ...nestedSpread,
            color: 'red',
            ':hover': { color: 'blue' }
          }
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          button: {
            ':hovver': { color: 'red' }
          }
        });
      `,
      errors: [
        {
          message: 'Invalid pseudo-class or pseudo-element: ":hovver".',
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          button: {
            ':hover::befor': { color: 'red' }
          }
        });
      `,
      errors: [
        {
          message: 'Invalid pseudo-class or pseudo-element: ":hover::befor".',
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          button: {
            ':nth-child()': { color: 'red' }
          }
        });
      `,
      errors: [
        {
          message: 'Invalid pseudo-class or pseudo-element: ":nth-child()".',
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          button: {
            ':nth-child(2n': { color: 'red' }
          }
        });
      `,
      errors: [
        {
          message: 'Invalid pseudo-class or pseudo-element: ":nth-child(2n".',
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const invalidHv = ':hovver' as const;
        css.create({
          button: {
            [invalidHv]: { color: 'red' }
          }
        });
      `,
      errors: [
        {
          message: 'Invalid pseudo-class or pseudo-element: ":hovver".',
        },
      ],
    },
  ],
});

ruleTesterNoType.run('validate-pseudos', validatePseudos, {
  valid: [
    {
      code: `
        import * as css from '@plumeria/core';
        // Checked node starts with ':' is valid, but computed is skipped when no type info
        const invalidHv = ':hovver' as const;
        css.create({
          button: {
            [invalidHv]: { color: 'red' }
          }
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          button: {
            ':hovver': { color: 'red' }
          }
        });
      `,
      errors: [
        {
          message: 'Invalid pseudo-class or pseudo-element: ":hovver".',
        },
      ],
    },
  ],
});

describe('helper functions', () => {
  test('splitChainedPseudos with empty string', () => {
    expect(splitChainedPseudos('')).toEqual([]);
  });
});
