import { RuleTester } from 'eslint';
import { noLogicalProperties } from '../../src/rules/no-logical-properties';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-logical-properties', noLogicalProperties, {
  valid: [
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            paddingTop: 4,
            marginRight: 8,
            top: 0,
            padding: 4,
            color: 'red'
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({ main: { blockSize: 100, overflowInline: 'auto' } });
      `,
    },
  ],
  invalid: [
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            marginBlockEnd: 8
          }
        });
      `,
      errors: [
        {
          messageId: 'rejected',
          data: { name: 'marginBlockEnd', counterpart: 'marginBottom' },
          suggestions: [
            {
              messageId: 'rename',
              data: { counterpart: 'marginBottom' },
              output: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            marginBottom: 8
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
        css.create({ main: { blockSize: 100 } });
      `,
      options: [{ sizes: true }],
      errors: [
        {
          messageId: 'rejected',
          data: { name: 'blockSize', counterpart: 'height' },
          suggestions: 1,
        },
      ],
    },
  ],
});
