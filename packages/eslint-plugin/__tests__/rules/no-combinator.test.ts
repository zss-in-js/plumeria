import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { noCombinator } from '../../src/rules/no-combinator';

const ruleTester = new RuleTester();

ruleTester.run('no-combinator', noCombinator as unknown as JSRuleDefinition, {
  valid: [
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':has(> div)': { color: 'red' } } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':has(.foo + .bar)': { color: 'red' } } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':has(a ~ b)': { color: 'red' } } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':where(> div)': { color: 'red' } } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':is(> div)': { color: 'red' } } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':not(> div)': { color: 'red' } } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':nth-child(2n + 1)': { color: 'red' } } })`,
    },
    {
      // Comma is not a combinator we are targeting, spaces around comma should be fine
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div, span': { color: 'red' } } })`,
    },
    {
      // Space in attribute selector
      code: `import * as css from '@plumeria/core'; css.create({ container: { '[title="a b"]': {} } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { '&.active': { color: 'red' } } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { '[data-val=">"]': { color: 'red' } } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create({ container: { '[title="a + b"]': { color: 'red' } } })`,
    },
    {
      code: `import { create } from '@plumeria/core'; create({ container: { ':has(> div)': {} } })`,
    },
    {
      code: `import { create as c } from '@plumeria/core'; c({ container: { ':has(> div)': {} } })`,
    },
    {
      // Trailing spaces should be ignored (multiple consecutive spaces)
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div     ': { color: 'red' } } })`,
    },
    {
      // Leading spaces should be ignored (multiple consecutive spaces)
      code: `import * as css from '@plumeria/core'; css.create({ container: { '     div': { color: 'red' } } })`,
    },
    {
      // Multiple consecutive spaces between selectors inside functional pseudo (allowed)
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':where(div     span)': { color: 'red' } } })`,
    },
    {
      // Spaces around explicit combinators should be fine
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':where(div     >     span)': { color: 'red' } } })`,
    },
    {
      // Spaces after comma separator
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div,     span': { color: 'red' } } })`,
    },
    {
      // Multiple spaces before explicit combinator (not a descendant combinator)
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div     , span': { color: 'red' } } })`,
    },
    {
      // Multiple spaces before combinator inside functional pseudo
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':where(div     > span)': { color: 'red' } } })`,
    },
    // Coverage tests for edge cases
    {
      // Top-level string with space (triggers check)
      code: `import * as css from '@plumeria/core'; css.create({ container: { '"string selector"': { color: 'red' } } })`,
    },
    {
      // Nested attribute selector with spaces inside string (should be ignored)
      code: `import * as css from '@plumeria/core'; css.create({ container: { '[data-foo="a b"]': { color: 'red' } } })`,
    },
    {
      // Nested attribute selector with escaped quotes and spaces
      code: `import * as css from '@plumeria/core'; css.create({ container: { '[data-foo="a \\" b"]': { color: 'red' } } })`,
    },
    {
      // String with escaped backslash (covers s[i] === '\\' in skipString)
      // code string has 4 backslashes -> file has 4 -> source has 2 -> value has 1.
      code: `import * as css from '@plumeria/core'; css.create({ container: { '"escaped \\\\ string"': { color: 'red' } } })`,
    },
    {
      // Deeply nested pseudo classes with space
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':where(:has(:not(.foo) ))': { color: 'red' } } })`,
    },
    {
      // Escaped characters in block with space
      // We need quadruple backslash in the code string to result in a double backslash in the source, which results in a single backslash in the string value.
      code: `import * as css from '@plumeria/core'; css.create({ container: { '[data-val=\\\\] ]': { color: 'red' } } })`,
    },
    {
      // Unclosed string with space (should be robust and not crash)
      code: `import * as css from '@plumeria/core'; css.create({ container: { '"unclosed string ': { color: 'red' } } })`,
    },
    // Coverage for other APIs and access patterns
    {
      code: `import { "create" as c } from '@plumeria/core'; c({ container: { 'div': {} } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css['create']({ container: { 'div': {} } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.createStatic({ container: { 'div': {} } })`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.variants({ container: { 'div': {} } })`,
    },
    {
      code: `import { createStatic as c } from '@plumeria/core'; c({ container: { 'div': {} } })`,
    },
    {
      code: `import { variants as v } from '@plumeria/core'; v({ container: { 'div': {} } })`,
    },
  ],
  invalid: [
    {
      // Explicit combinator >
      code: `import * as css from '@plumeria/core'; css.create({ container: { '> div': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator ">" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Explicit combinator +
      code: `import * as css from '@plumeria/core'; css.create({ container: { '+ div': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "+" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Explicit combinator ~
      code: `import * as css from '@plumeria/core'; css.create({ container: { '~ div': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "~" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Combinator in middle
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div > span': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator ">" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Combinator outside has
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':has(div) > span': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator ">" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Descendant combinator (space)
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div span': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "(space)" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Descendant combinator with pseudo
      code: `import * as css from '@plumeria/core'; css.create({ container: { ':hover span': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "(space)" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Descendant combinator with pseudo (reversed)
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div :hover': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "(space)" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      code: `import { create } from '@plumeria/core'; create({ container: { '> div': {} } })`,
      errors: [
        {
          message:
            'Combinator ">" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Multiple consecutive spaces as descendant combinator
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div     span': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "(space)" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Many consecutive spaces as descendant combinator (to trigger backward loop)
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div          span': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "(space)" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Tab character as separator
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div\tspan': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "(space)" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // Newline character as separator
      code: `import * as css from '@plumeria/core'; css.create({ container: { 'div\\nspan': { color: 'red' } } })`,
      errors: [
        {
          message:
            'Combinator "(space)" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // createStatic invalid usage
      code: `import * as css from '@plumeria/core'; css.createStatic({ container: { '> div': {} } })`,
      errors: [
        {
          message:
            'Combinator ">" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
    {
      // variants invalid usage
      code: `import * as css from '@plumeria/core'; css.variants({ container: { '> div': {} } })`,
      errors: [
        {
          message:
            'Combinator ">" is not allowed unless inside functional pseudo-classes.',
        },
      ],
    },
  ],
});
