import { RuleTester } from 'eslint';
import { noUnknownCssProperties } from '../../src/rules/no-unknown-css-properties';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('no-unknown-css-properties', noUnknownCssProperties, {
  valid: [
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            backgroundColor: 'red',
            marginTop: '10px',
            '--custom-prop': 'blue',
            ':hover': {
              color: 'green'
            },
            '@media (min-width: 600px)': {
              padding: '20px'
            },
            '[disabled]': {
              opacity: 0.5
            }
          }
        });
      `,
    },
    {
      code: `
        import css from '@plumeria/core';
        const styles = css.create({
          main: {
            display: 'flex'
          }
        });
      `,
    },
    {
      code: `
        import { create } from '@plumeria/core';
        const styles = create({
          main: {
            color: 'red'
          }
        });
      `,
    },
    {
      code: `
        import { create as c } from '@plumeria/core';
        const styles = c({
          main: {
            color: 'red'
          }
        });
      `,
    },
    {
      code: `
        import css from '@plumeria/core';
        const styles = css['create']({
          main: {
            color: 'red'
          }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const animation = css.keyframes({
          from: { opacity: 0 },
          to: { opacity: 1 }
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const transition = css.viewTransition({
          group: { opacity: 0 },
          new: { opacity: 1 }
        });
      `,
    },
    {
      code: `
        import { keyframes } from '@plumeria/core';
        const animation = keyframes({
          from: { opacity: 0 }
        });
      `,
    },
    {
      code: `
        import { viewTransition as vt } from '@plumeria/core';
        const transition = vt({
          new: { opacity: 1 }
        });
      `,
    },
  ],
  invalid: [
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            backgoundColor: 'red'
          }
        });
      `,
      errors: [
        {
          messageId: 'unknownProperty',
          data: {
            name: 'backgoundColor',
          },
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            unknownProp: 'value'
          }
        });
      `,
      errors: [
        {
          messageId: 'unknownProperty',
          data: {
            name: 'unknownProp',
          },
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            ':hover': {
              unkownInsidePseudo: 'value'
            }
          }
        });
      `,
      errors: [
        {
          messageId: 'unknownProperty',
          data: {
            name: 'unkownInsidePseudo',
          },
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const styles = css.create({
          main: {
            '[disabled]': {
              invalidInsideAttr: 'green'
            }
          }
        });
      `,
      errors: [
        {
          messageId: 'unknownProperty',
          data: {
            name: 'invalidInsideAttr',
          },
        },
      ],
    },
    {
      code: `
        import { create } from '@plumeria/core';
        const styles = create({
          main: {
            '& .child': {
              color: 'red'
            }
          }
        });
      `,
      errors: [
        {
          messageId: 'unknownProperty',
          data: {
            name: '& .child',
          },
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const animation = css.keyframes({
          from: { unkownProp: '0' }
        });
      `,
      errors: [
        {
          messageId: 'unknownProperty',
          data: {
            name: 'unkownProp',
          },
        },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const transition = css.viewTransition({
          new: { unkownProp: '0' }
        });
      `,
      errors: [
        {
          messageId: 'unknownProperty',
          data: {
            name: 'unkownProp',
          },
        },
      ],
    },
  ],
});
