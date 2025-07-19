const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-destructure');

const ruleTester = new RuleTester();

ruleTester.run('no-destructure', rule, {
  valid: [
    {
      code: 'const { keyframes } = css',
      code: 'const { defineConsts } = css',
      code: 'const { defineVars } = css',
      code: 'const { defineTheme } = css',
      code: 'const { rx } = css',
      code: 'const { px } = css',
      code: 'const { media } = css',
      code: 'const { container } = css',
      code: 'const { color } = css;',
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
  invalid: [
    {
      code: 'const { props } = css;',
      errors: [
        {
          message:
            'Do not destructure "props" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const { global } = css;',
      errors: [
        {
          message:
            'Do not destructure "global" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const { props, global } = css;',
      errors: [
        {
          message:
            'Do not destructure "props" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "global" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
});
