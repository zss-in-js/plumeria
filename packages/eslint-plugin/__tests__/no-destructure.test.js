const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-destructure');

const ruleTester = new RuleTester();

ruleTester.run('no-destructure', rule, {
  valid: [
    {
      code: 'const styles = css.create({})',
      code: 'css.props()',
      code: 'const breakpoints = css.defineConsts({})',
      code: 'const tokens = css.defineVars({})',
      code: 'const theme = css.defineTheme({})',
      code: 'const animate = css.keyframes({})',
      code: 'css.global({})',
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
  invalid: [
    {
      code: 'const { create } = css;',
      errors: [
        {
          message:
            'Do not destructure "create" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
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
      code: 'const { keyframes } = css;',
      errors: [
        {
          message:
            'Do not destructure "keyframes" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const { defineConsts } = css;',
      errors: [
        {
          message:
            'Do not destructure "defineConsts" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const { defineVars } = css;',
      errors: [
        {
          message:
            'Do not destructure "defineVars" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const { defineTheme } = css;',
      errors: [
        {
          message:
            'Do not destructure "defineTheme" from "css". Use dot notation instead.',
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
      code: 'const { create, props, defineConsts, defineVars, defineTheme, keyframes, global } = css;',
      errors: [
        {
          message:
            'Do not destructure "create" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "props" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "defineConsts" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "defineVars" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "defineTheme" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "keyframes" from "css". Use dot notation instead.',
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
