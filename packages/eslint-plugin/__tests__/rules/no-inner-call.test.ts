import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { noInnerCall } from '../../src/rules/no-inner-call';

const ruleTester = new RuleTester();

const settings = {
  ecmaVersion: 2021,
};

ruleTester.run('no-inner-call', noInnerCall as unknown as JSRuleDefinition, {
  valid: [
    {
      code: `import * as css from '@plumeria/core'; css.create();`,
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; css.createStatic();`,
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; css.createTheme();`,
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; css.keyframes();`,
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; css.viewTransition();`,
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; css.variants();`,
      settings,
    },
    {
      code: `import css from '@plumeria/core'; css.create();`,
      settings,
    },
  ],
  invalid: [
    {
      code: `import * as css from '@plumeria/core'; const create = () => { css.create(); }`,
      errors: [{ message: 'Do not use css.create inside functions' }],
      settings,
    },
    {
      code: `import css from '@plumeria/core'; function f() { css.create(); }`,
      errors: [{ message: 'Do not use css.create inside functions' }],
      settings,
    },
    {
      code: `import { "create" as c } from '@plumeria/core'; function f() { c(); }`,
      errors: [{ message: 'Do not use c inside functions' }],
      settings,
    },
    {
      code: `import { create } from '@plumeria/core'; function f() { create(); }`,
      errors: [{ message: 'Do not use create inside functions' }],
      settings,
    },
    {
      code: `import * as style from '@plumeria/core'; function f() { style.create(); }`,
      errors: [{ message: 'Do not use style.create inside functions' }],
      settings,
    },
    {
      code: `import { keyframes } from '@plumeria/core'; (() => { keyframes(); })();`,
      errors: [{ message: 'Do not use keyframes inside functions' }],
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; (() => { css.viewTransition(); })();`,
      errors: [{ message: 'Do not use css.viewTransition inside functions' }],
      settings,
    },
    {
      code: `import { createStatic } from '@plumeria/core'; function consts() { createStatic(); }`,
      errors: [{ message: 'Do not use createStatic inside functions' }],
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; function theme() { css.createTheme(); }`,
      errors: [{ message: 'Do not use css.createTheme inside functions' }],
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; const arrow = () => { css.keyframes(); };`,
      errors: [{ message: 'Do not use css.keyframes inside functions' }],
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; const func = function() { css.create(); };`,
      errors: [{ message: 'Do not use css.create inside functions' }],
      settings,
    },
    {
      code: `import * as css from '@plumeria/core'; const func = function() { css.variants(); };`,
      errors: [{ message: 'Do not use css.variants inside functions' }],
      settings,
    },
  ],
});
