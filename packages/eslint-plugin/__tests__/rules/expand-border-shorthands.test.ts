import { RuleTester } from 'eslint';
import { expandBorderShorthands } from '../../src/rules/expand-border-shorthands';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

const wrap = (body: string) => `
import * as css from '@plumeria/core';
const styles = css.create({
  box: {
${body}
  }
});
`;

ruleTester.run('expand-border-shorthands', expandBorderShorthands, {
  valid: [
    {
      code: wrap(
        `    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'red',
    borderWidth: 2,
    borderBlockWidth: 5,
    borderRadius: 4,
    color: 'red'`,
      ),
    },
    {
      code: `
        import * as css from 'not-plumeria';
        css.create({ box: { borderTop: '1px solid red' } });
      `,
    },
  ],
  invalid: [
    {
      code: wrap(`    borderTop: '1px solid red'`),
      output: wrap(
        `    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'red'`,
      ),
      errors: [{ messageId: 'expand', data: { name: 'borderTop' } }],
    },
    {
      /**
       * The shorthand resets what it omits, so the expansion has to write the
       * initial value of every component the author left out.
       */
      code: wrap(`    borderBlock: 'solid'`),
      output: wrap(
        `    borderBlockWidth: 'medium',
    borderBlockStyle: 'solid',
    borderBlockColor: 'currentcolor'`,
      ),
      errors: [{ messageId: 'expand', data: { name: 'borderBlock' } }],
    },
    {
      code: wrap(`    border: '2px dashed rgb(0 0 0 / 50%)'`),
      output: wrap(
        `    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: 'rgb(0 0 0 / 50%)'`,
      ),
      errors: [{ messageId: 'expand', data: { name: 'border' } }],
    },
    {
      code: wrap(`    borderInlineStart: 'red 1px'`),
      output: wrap(
        `    borderInlineStartWidth: '1px',
    borderInlineStartStyle: 'none',
    borderInlineStartColor: 'red'`,
      ),
      errors: [{ messageId: 'expand', data: { name: 'borderInlineStart' } }],
    },
    {
      code: wrap(`    borderTop: 'var(--edge)'`),
      errors: [{ messageId: 'opaque', data: { name: 'borderTop' } }],
    },
    {
      code: wrap(`    borderBottom: 'inherit'`),
      errors: [{ messageId: 'opaque', data: { name: 'borderBottom' } }],
    },
    {
      code: `
        import { keyframes } from '@plumeria/core';
        keyframes({
          from: {
            borderLeft: '1px solid red'
          }
        });
      `,
      output: `
        import { keyframes } from '@plumeria/core';
        keyframes({
          from: {
            borderLeftWidth: '1px',
            borderLeftStyle: 'solid',
            borderLeftColor: 'red'
          }
        });
      `,
      errors: [{ messageId: 'expand', data: { name: 'borderLeft' } }],
    },
  ],
});
