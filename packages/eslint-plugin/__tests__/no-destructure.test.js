const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-destructure');

const ruleTester = new RuleTester();

ruleTester.run('no-destructure', rule, {
  valid: [
    {
      code: 'const styles = css.create({})',
      code: 'css.props()',
      code: 'const animate = css.keyframes({})',
      code: 'const transitionName = css.viewTransition({})',
      code: 'const breakpoints = css.defineConsts({})',
      code: 'const tokens = css.defineTokens({})',

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
      code: 'const { viewTransition } = css;',
      errors: [
        {
          message:
            'Do not destructure "viewTransition" from "css". Use dot notation instead.',
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
      code: 'const { defineTokens } = css;',
      errors: [
        {
          message:
            'Do not destructure "defineTokens" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const { create, props, defineConsts, defineTokens, keyframes } = css;',
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
            'Do not destructure "defineTokens" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "keyframes" from "css". Use dot notation instead.',
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
});
