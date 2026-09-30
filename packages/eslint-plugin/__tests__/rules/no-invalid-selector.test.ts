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
    {
      code: `
        import * as css from '@plumeria/core';

        css.keyframes({ ...base, from: { ...base, opacity: 0 } });
        css.viewTransition({ ...base, old: { ...base, opacity: 0 } });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';

        css.keyframes({ from: shared });
        css.viewTransition({ old: shared });
      `,
    },
    {
      code: `
        import { keyframes as kf, viewTransition as vt } from '@plumeria/core';

        kf({ from: { opacity: 0 } });
        vt({ old: { opacity: 0 } });
      `,
    },
    {
      code: `
        import * as css from '@plumeria/core';

        (function () { return css; })();
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

        const styles = (key: string) => css.create({ list: { [key]: {} } });
      `,
    },
  ],
  invalid: [
    {
      code: `
        import * as css from '@plumeria/core';

        css.create({ list: { [1 + 1]: {} } })
      `,
      errors: [{ messageId: 'invalidKeySelector' }],
    },
  ],
});

const pseudoNesting = (selector: string) => `
  import * as css from '@plumeria/core';
  css.create({ a: { '${selector}': { color: 'red' } } });
`;

ruleTesterNoType.run(
  'no-invalid-selector same-name pseudo',
  noInvalidSelector,
  {
    valid: [
      { code: pseudoNesting(':is(:where(:not(:has(.a))))') },
      { code: pseudoNesting(':is(.a, .b)') },
      { code: pseudoNesting('[data-a]:is(:hover, :focus-visible)') },
      { code: pseudoNesting('[data-x=":is(:is(a))"]') },
      { code: pseudoNesting(':is(') },
      { code: pseudoNesting(':is(.a]') },
      { code: pseudoNesting(':is(.a):where(.b)[') },
      { code: pseudoNesting(':is("quoted", .a)') },
      { code: pseudoNesting(String.raw`:is("escaped\\\"quote", .a)`) },
      { code: pseudoNesting(String.raw`:is(.a\\+b, .c)`) },
    ],
    invalid: [
      {
        code: pseudoNesting(':where(:where(.a, .b), .c)'),
        output: pseudoNesting(':where(.a, .b, .c)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(':where(:where(:where(.a)))'),
        output: pseudoNesting(':where(.a)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(':is(.x, :is(.a, :is(.b)))'),
        output: pseudoNesting(':is(.x, .a, .b)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(':has(:has(.a), .b)'),
        output: pseudoNesting(':has(.a, .b)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(':host(:host(.a))'),
        output: pseudoNesting(':host(.a)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(':lang(:lang(en))'),
        output: pseudoNesting(':lang(en)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting('::slotted(::slotted(span))'),
        output: pseudoNesting('::slotted(span)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(':nth-child(:nth-child(2))'),
        output: pseudoNesting(':nth-child(2)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(
          '::view-transition-old(::view-transition-old(root))',
        ),
        output: pseudoNesting('::view-transition-old(root)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(':nth-child(2 of :nth-child(1 of .a))'),
        output: null,
        errors: [{ messageId: 'noSameNamePseudoNesting' }],
      },
      {
        code: pseudoNesting('[data-a]:is(:is(.a), .b)'),
        output: pseudoNesting('[data-a]:is(.a, .b)'),
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting('[data-a]:is(:where(:is(.a)))'),
        output: null,
        errors: [{ messageId: 'noSameNamePseudoNesting' }],
      },
      {
        code: pseudoNesting(':not(:not(.a), .b)'),
        output: null,
        errors: [{ messageId: 'noSameNamePseudoNesting' }],
      },
      {
        code: pseudoNesting(':where(.x:where(.a))'),
        output: null,
        errors: [{ messageId: 'noSameNamePseudoNesting' }],
      },
      {
        code: pseudoNesting(':is(:where(:is(.a)))'),
        output: null,
        errors: [{ messageId: 'noSameNamePseudoNesting' }],
      },
      {
        code: `
          import * as css from '@plumeria/core';
          const selector = ':where(:where(.a))' as const;
          css.create({ a: { [selector]: { color: 'red' } } });
        `,
        output: null,
        errors: [{ messageId: 'noSameNamePseudoNesting' }],
      },
      {
        code: `
          import * as css from '@plumeria/core';
          css.create({ a: { ":where(:where([data-x='value']))": {} } });
        `,
        output: `
          import * as css from '@plumeria/core';
          css.create({ a: { ":where([data-x='value'])": {} } });
        `,
        errors: [{ messageId: 'flattenSameNamePseudo' }],
      },
      {
        code: pseudoNesting(String.raw`:where(:where(.a\\.b))`),
        output: null,
        errors: [{ messageId: 'noSameNamePseudoNesting' }],
      },
      {
        code: `
          import * as css from '@plumeria/core';
          css.create({ a: { ":where(:where([data-x=\\"value\\"]))": {} } });
        `,
        output: null,
        errors: [{ messageId: 'noSameNamePseudoNesting' }],
      },
    ],
  },
);
