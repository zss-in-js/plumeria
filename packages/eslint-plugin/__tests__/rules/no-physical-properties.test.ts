import { RuleTester } from 'eslint';
import { noPhysicalProperties } from '../../src/rules/no-physical-properties';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-physical-properties', noPhysicalProperties, {
  valid: [
    {
      code: `
        import css from '@plumeria/core';
        const dynamic = 'paddingLeft';
        css.unknown({ main: { paddingLeft: 1 } });
        css['create']({ main: { paddingLeft: 1 } });
        css.create(null, { main: 1 }, { ...other });
        localFunction();
        (function () {})();
        css.create({
          ...other,
          main: { ...other, [dynamic]: 1, 0: 'ignored', color: 'red' }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            paddingBlockStart: 4,
            marginInlineEnd: 8,
            insetBlockStart: 0,
            padding: 4,
            color: 'red',
            borderWidth: 2
          }
        });
      `,
    },
    {
      /**
       * A size is one property under either spelling in every writing mode a
       * document mixes, so renaming it buys nothing on its own. The edges are
       * what a direction reverses.
       */
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            width: 320,
            height: 200,
            minWidth: 100,
            maxHeight: 400,
            overflowY: 'auto'
          }
        });
      `,
    },
    {
      code: `
        import * as css from 'not-plumeria';
        css.create({ main: { paddingLeft: 4 } });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const key = 'paddingLeft';
        css.create({
          main: {
            [key]: 4,
            ':hover': { paddingBlockEnd: 2 },
            '--custom': 'x'
          }
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        import css from '@plumeria/core';
        css.viewTransition({ old: { ['right']: 0 } });
        css.keyframes({ from: { bottom: 0 } });
      `,
      errors: [
        { messageId: 'rejected', suggestions: 1 },
        { messageId: 'rejected', suggestions: 1 },
      ],
    },
    {
      code: `
        import { 'viewTransition' as transition } from '@plumeria/core';
        transition({ old: { borderLeftColor: 'red' } });
      `,
      errors: [{ messageId: 'rejected', suggestions: 1 }],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            paddingLeft: 16
          }
        });
      `,
      errors: [
        {
          messageId: 'rejected',
          data: { name: 'paddingLeft', counterpart: 'paddingInlineStart' },
          suggestions: [
            {
              messageId: 'rename',
              data: { counterpart: 'paddingInlineStart' },
              output: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            paddingInlineStart: 16
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
        import { create, keyframes } from '@plumeria/core';
        create({ main: { ':hover': { top: 0 } } });
        keyframes({ from: { 'border-top-color': 'red' } });
      `,
      errors: [
        {
          messageId: 'rejected',
          data: { name: 'top', counterpart: 'insetBlockStart' },
          suggestions: 1,
        },
        {
          messageId: 'rejected',
          data: {
            name: 'border-top-color',
            counterpart: 'borderBlockStartColor',
          },
          suggestions: 1,
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({ main: { width: 320 } });
      `,
      options: [{ sizes: true }],
      errors: [
        {
          messageId: 'rejected',
          data: { name: 'width', counterpart: 'inlineSize' },
          suggestions: [
            {
              messageId: 'rename',
              data: { counterpart: 'inlineSize' },
              output: `
        import * as css from '@plumeria/core';
        css.create({ main: { inlineSize: 320 } });
      `,
            },
          ],
        },
      ],
    },
  ],
});
