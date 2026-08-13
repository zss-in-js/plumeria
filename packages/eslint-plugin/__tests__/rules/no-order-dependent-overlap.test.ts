import { RuleTester } from 'eslint';
import { noOrderDependentOverlap } from '../../src/rules/no-order-dependent-overlap';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-order-dependent-overlap', noOrderDependentOverlap, {
  valid: [
    {
      code: `
        import * as css from 'not-plumeria';
        import { create as localCreate } from 'not-plumeria';
        css.create({ main: { paddingTop: 4, paddingBlockStart: 10 } });
        localCreate({ main: { top: 0, insetBlockStart: 1 } });
      `,
    },
    {
      code: `
        import css from '@plumeria/core';
        const dynamic = 'paddingTop';
        css.unknown({ main: { paddingTop: 4, paddingBlockStart: 10 } });
        css['create']({ main: { paddingTop: 4, paddingBlockStart: 10 } });
        css.create(null, { main: 1 }, { ...other });
        (function () {})();
        css.create({
          ...other,
          main: {
            ...other,
            [dynamic]: 1,
            ':hover': 2,
            '[data-active]': 3,
            '@supports (display: grid)': 4,
            '--custom-property': 5
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            padding: 4,
            paddingBlock: 8,
            paddingTop: 12
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            borderWidth: 5,
            borderTop: '1px solid red'
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            paddingTop: 4,
            ':hover': {
              paddingBlockStart: 10
            }
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            marginBlock: 8,
            marginInline: 16
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            cornerShape: 'round',
            cornerTopLeftShape: 'bevel'
          }
        });
      `,
    },
    {
      code: `
        import { create, keyframes as frames, viewTransition } from '@plumeria/core';
        create({ main: { marginBlock: 8, marginInline: 16 } });
        frames({ from: { padding: 4, paddingTop: 8 } });
        viewTransition({ old: { borderWidth: 2, borderTop: 'solid' } });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          main: {
            0: 'ignored',
            paddingTop: 4,
            nested: { paddingBlockStart: 10 }
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          main: {
            '@media (min-width: 600px)': { color: 'red' },
            '@media (min-width: 900px)': { color: 'blue' },
            '@media (max-width: 500px)': { padding: 4 },
            '@media print': { color: 'black' }
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          main: {
            '@media (min-width: 900px)': { color: 'blue' },
            '@media (min-width: 600px)': { padding: 4 }
          }
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        import { create as make } from '@plumeria/core';
        make({ main: { 'paddingTop': 4, ['paddingBlockStart']: 10 } });
      `,
      errors: [
        {
          messageId: 'alias',
          data: { first: 'paddingTop', second: 'paddingBlockStart' },
          suggestions: 2,
        },
      ],
    },
    {
      code: `
        import { 'create' as make } from '@plumeria/core';
        make({ main: { inlineSize: 10, width: 20 } });
      `,
      errors: [{ messageId: 'alias', suggestions: 2 }],
    },
    {
      code: `
        import { keyframes } from '@plumeria/core';
        keyframes({ from: { overflowBlock: 'clip', overflowY: 'hidden', } });
      `,
      errors: [{ messageId: 'alias', suggestions: 2 }],
    },
    {
      code: `
        import css from '@plumeria/core';
        css.viewTransition({
          old: { minInlineSize: 10, minWidth: 20 },
          new: { overscrollBehaviorInline: 'auto', overscrollBehaviorX: 'none' }
        });
      `,
      errors: [
        { messageId: 'alias', suggestions: 2 },
        { messageId: 'alias', suggestions: 2 },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            paddingTop: 4,
            paddingBlockStart: 10
          }
        });
      `,
      errors: [
        {
          messageId: 'alias',
          data: { first: 'paddingTop', second: 'paddingBlockStart' },
          suggestions: [
            {
              messageId: 'keep',
              data: { keep: 'paddingBlockStart' },
              output: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            paddingBlockStart: 10
          }
        });
      `,
            },
            {
              messageId: 'keep',
              data: { keep: 'paddingTop' },
              output: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            paddingTop: 4
          }
        });
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            borderTop: '1px solid red',
            borderBlockWidth: 5
          }
        });
      `,
      errors: [{ messageId: 'crossing', suggestions: [] }],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            blockSize: 100,
            height: 200
          }
        });
      `,
      errors: [
        {
          messageId: 'alias',
          suggestions: [
            {
              messageId: 'keep',
              data: { keep: 'height' },
              output: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            height: 200
          }
        });
      `,
            },
            {
              messageId: 'keep',
              data: { keep: 'blockSize' },
              output: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            blockSize: 100
          }
        });
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            '@media (min-width: 600px)': {
              insetBlockStart: 0,
              top: 10
            }
          }
        });
      `,
      errors: [
        {
          messageId: 'alias',
          suggestions: [
            {
              messageId: 'keep',
              data: { keep: 'top' },
              output: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            '@media (min-width: 600px)': {
              top: 10
            }
          }
        });
      `,
            },
            {
              messageId: 'keep',
              data: { keep: 'insetBlockStart' },
              output: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            '@media (min-width: 600px)': {
              insetBlockStart: 0
            }
          }
        });
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            borderBlockColor: 'red',
            borderBlockStart: '1px solid blue'
          }
        });
      `,
      errors: [{ messageId: 'crossing', suggestions: [] }],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          main: {
            '@media (min-width: 900px)': { color: 'blue' },
            '@media (min-width: 600px)': { color: 'red' }
          }
        });
      `,
      errors: [
        {
          messageId: 'condition',
          data: {
            narrow: '@media (min-width: 900px)',
            broad: '@media (min-width: 600px)',
            property: 'color',
          },
          suggestions: [
            {
              messageId: 'swap',
              data: {
                narrow: '@media (min-width: 900px)',
                broad: '@media (min-width: 600px)',
              },
              output: `
        import * as css from '@plumeria/core';
        css.create({
          main: {
            '@media (min-width: 600px)': { color: 'red' },
            '@media (min-width: 900px)': { color: 'blue' }
          }
        });
      `,
            },
          ],
        },
      ],
    },
  ],
});
