import { RuleTester } from 'eslint';
import * as parser from '@typescript-eslint/parser';
import { noInvalidSelectorNesting } from '../../src/rules/no-invalid-selector-nesting';
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

ruleTester.run('no-invalid-selector-nesting', noInvalidSelectorNesting, {
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
        other(); // [144行目] Identifier call
        [].push(1); // [144行目 false] MemberExpression call (but not plumeria)
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';
        const mq = '@media' as '@media' | '@container';
        const hv = ':hover' as ':hover' | ':active';
        const mqL = '@media' as const;
        const hvL = ':hover' as const;
        const normal = 'color';
        css.create({
          list: {
            [mq]: { color: 'red' },
            [hv]: { color: 'red' },
            [mqL]: { color: 'blue' },
            [hvL]: { color: 'blue' },
            [normal]: { color: 'red' }
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
        (function(){})();
        const mixed = ':hover' as ':hover' | number;
        create({ list: { [mixed]: {} } });
      `,
    },
    {
      code: `
        import { create } from '@plumeria/core';
        create({ ...spread, list: { ...spread, color: 'red' } });
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
  ],
});

ruleTesterNoType.run('no-invalid-selector-nesting', noInvalidSelectorNesting, {
  valid: [
    {
      code: `
        import * as css from '@plumeria/core';
        const mq = '@media';
        css.create({ list: { [mq]: {}, [Math.random()]: {} } })
      `,
    },
  ],
  invalid: [],
});
