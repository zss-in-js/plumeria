import { RuleTester } from 'eslint';
import * as parser from '@typescript-eslint/parser';
import { noInvalidSelector } from '../../src/rules/no-invalid-selector';
import path from 'path';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
      },
      tsconfigRootDir: path.resolve(__dirname, '../../'),
    },
  },
});

const ruleTesterNoType = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-invalid-selector', noInvalidSelector, {
  valid: [
    {
      code: `import { create } from 'other-library'; create({ s: {} });`,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          list: {
            'color': 'red',
            'fontSize': { value: '16px' }
          }
        });
        css['create']({ s: {} });
        (css).create({ s: {} });
        function other() {}
        other();
        [].push(1);
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const mq = '@media' as '@media';
        const hv = ':hover' as ':hover';
        const mqL = '@media' as const;
        const hvL = ':hover' as const;

        css.create({
          list: {
            [mq]: { color: 'red' },
            [hv]: { color: 'red' },
            [mqL]: { color: 'blue' },
            [hvL]: { color: 'blue' },
          }
        })
      `,
    },
    {
      code: `
        import { create, create as c, "create" as c2 } from '@plumeria/core';
        import css from '@plumeria/core';
        import type { Create } from '@plumeria/core';
        create({ s: {} });
        c({ s: {} });
        c2({ s: {} });
        css.create({ s: {} });
        const mixed = ':hover';
        create({ list: { [mixed]: {} } });
      `,
    },
    {
      code: `
        import { create } from '@plumeria/core';
        create({ ...spread, list: { ...spread, color: 'red' } });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';

        css.keyframes({
          from: { opacity: 0 },
          '50%': { opacity: 0.5 },
          to: { opacity: 1 },
        });

        css.viewTransition({
          group: {},
          imagePair: {},
          new: {},
          old: {},
        });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';

        const normal = 'color';
        css.create({
          list: {
            [normal]: { color: 'red' }
          }
        })
      `,
    },
  ],
  invalid: [
    {
      code: `
        import * as css from '@plumeria/core';
        css.create({
          list: {
            ':hover': {
              '@media (max-width: 768px)': { color: 'red' },
              ':active': { color: 'blue' }
            },
            '@media (min-width: 0px)': {
              '@media (max-width: 100px)': { color: 'green' }
            }
          }
        })
      `,
      errors: [
        { messageId: 'noQueryInsidePseudo' },
        { messageId: 'noPseudoInsidePseudo' },
        { messageId: 'noQueryInsideQuery' },
      ],
    },
    {
      code: `
            import { create } from '@plumeria/core';
            const mq = '@media' as const;
            const hv = ':hover' as const;
            create({
                myClass: {
                    ':hover': { [mq]: { color: 'red' } },
                    ':active': { [hv]: { color: 'red' } }
                }
            });
        `,
      errors: [
        { messageId: 'noQueryInsidePseudo' },
        { messageId: 'noPseudoInsidePseudo' },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';

        css.keyframes({
          start: { opacity: 0 },
          end: { opacity: 1 },
        });
      `,
      errors: [
        { messageId: 'invalidKeyframesKey' },
        { messageId: 'invalidKeyframesKey' },
      ],
    },
    {
      code: `
        import * as css from '@plumeria/core';

        css.viewTransition({
          invalid: {},
        });
      `,
      errors: [{ messageId: 'invalidViewTransitionKey' }],
    },
    {
      code: `
        import * as css from '@plumeria/core';

        css.viewTransition({
          [1 + 1]: {},
        });
      `,
      errors: [{ messageId: 'invalidViewTransitionKey' }],
    },
    {
      code: `
        import * as css from '@plumeria/core';

        css.keyframes({
          [1 + 1]: {},
        });
      `,
      errors: [{ messageId: 'invalidKeyframesKey' }],
    },
    {
      code: `
        import * as css from '@plumeria/core';

        css.create({
          [1 + 1]: {},
        })
      `,
      errors: [{ messageId: 'invalidKeySelector' }],
    },
    {
      code: `
        import * as css from '@plumeria/core';

        css.keyframes({
          from: { 
            [1 + 1]: {}
          }
        })
      `,
      errors: [{ messageId: 'invalidKeySelector' }],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        
        const invalidKey = 123;
        css.create({
          list: {
            [invalidKey]: { color: 'red' }
          }
        });
      `,
      errors: [{ messageId: 'invalidKeySelector' }],
    },
  ],
});

ruleTesterNoType.run('no-invalid-selector', noInvalidSelector, {
  valid: [
    {
      code: `
        import * as css from '@plumeria/core';
        
        css.create({ list: { ['@media']: {} } })
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        
        // This is invalid but will be skipped because type checker is not available
        css.create({ list: { [1 + 1]: {} } })
      `,
    },
  ],
  invalid: [],
});
