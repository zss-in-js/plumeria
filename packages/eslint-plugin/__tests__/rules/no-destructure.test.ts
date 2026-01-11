import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { noDestructure } from '../../src/rules/no-destructure';

const ruleTester = new RuleTester();

ruleTester.run('no-destructure', noDestructure as unknown as JSRuleDefinition, {
  valid: [
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({})`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.props()`,
    },
    {
      code: `import * as css from '@plumeria/core'; const animate = css.keyframes({})`,
    },
    {
      code: `import * as css from '@plumeria/core'; const transitionName = css.viewTransition({})`,
    },
    {
      code: `import * as css from '@plumeria/core'; const breakpoints = css.createStatic({})`,
    },
    {
      code: `import * as css from '@plumeria/core'; const tokens = css.createTheme({})`,
    },
    {
      code: `import css from '@plumeria/core'; const styles = css.create({})`,
    },
    {
      code: `import { "create" as c } from '@plumeria/core';`,
    },
    {
      code: `import { create } from '@plumeria/core';`,
    },
  ],
  invalid: [
    {
      code: `import * as css from '@plumeria/core'; const { create } = css;`,
      errors: [
        {
          message:
            'Do not destructure "create" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const { props } = css;`,
      errors: [
        {
          message:
            'Do not destructure "props" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const { variants } = css;`,
      errors: [
        {
          message:
            'Do not destructure "variants" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const { keyframes } = css;`,
      errors: [
        {
          message:
            'Do not destructure "keyframes" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const { viewTransition } = css;`,
      errors: [
        {
          message:
            'Do not destructure "viewTransition" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const { createStatic } = css;`,
      errors: [
        {
          message:
            'Do not destructure "createStatic" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const { createTheme } = css;`,
      errors: [
        {
          message:
            'Do not destructure "createTheme" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import css from '@plumeria/core'; const { create } = css;`,
      errors: [
        {
          message:
            'Do not destructure "create" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const { create, createStatic, createTheme, keyframes, props, variants } = css;`,
      errors: [
        {
          message:
            'Do not destructure "create" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "createStatic" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "createTheme" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "keyframes" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "props" from "css". Use dot notation instead.',
        },
        {
          message:
            'Do not destructure "variants" from "css". Use dot notation instead.',
        },
      ],
    },
    {
      code: `import * as style from '@plumeria/core'; const { create } = style;`,
      errors: [
        {
          message:
            'Do not destructure "create" from "style". Use dot notation instead.',
        },
      ],
    },
  ],
});
