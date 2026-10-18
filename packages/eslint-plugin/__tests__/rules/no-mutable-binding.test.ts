import { RuleTester } from 'eslint';
import { noMutableBinding } from '../../src/rules/no-mutable-binding';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-mutable-binding', noMutableBinding, {
  valid: [
    `
      import * as css from '@plumeria/core';
      const key = 'color';
      const size = 4;
      css.create({ box: { [key]: 'red', padding: size } });
    `,
    `
      import * as css from '@plumeria/core';
      css.create({ box: (width) => ({ width }) });
    `,
    `
      import * as css from '@plumeria/core';
      let color = 'red';
      css.create({ box: { color: 'blue' } });
      color = 'green';
    `,
    `
      import * as css from '@plumeria/core';
      let box = 'red';
      css.create({ box: { color: 'blue' }, other: { borderColor: css.box } });
    `,
    `
      import { create } from 'other-library';
      let color = 'red';
      create({ box: { color } });
    `,
  ],
  invalid: [
    {
      code: `
        import * as css from '@plumeria/core';
        let key = 'color';
        css.create({ box: { [key]: 'red' } });
      `,
      errors: [{ messageId: 'mutable', data: { name: 'key', kind: 'let' } }],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        var size = 4;
        css.create({ box: { padding: size } });
      `,
      errors: [{ messageId: 'mutable', data: { name: 'size', kind: 'var' } }],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        let start = '0deg';
        css.varType({ syntax: '<angle>', initialValue: start });
      `,
      errors: [{ messageId: 'mutable', data: { name: 'start', kind: 'let' } }],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        let gap = 8;
        css.positionTry({ positionArea: 'top', marginBottom: gap });
      `,
      errors: [{ messageId: 'mutable', data: { name: 'gap', kind: 'let' } }],
    },
    {
      code: `
        import { createStatic, keyframes } from '@plumeria/core';
        let query = '@media (min-width: 600px)';
        let opacity = 0.5;
        createStatic({ wide: query });
        keyframes({ to: { opacity } });
      `,
      errors: [
        { messageId: 'mutable', data: { name: 'query', kind: 'let' } },
        { messageId: 'mutable', data: { name: 'opacity', kind: 'let' } },
      ],
    },
    {
      code: `
        import css from '@plumeria/core';
        let fg = 'black';
        css.createTheme('.dark', { fg: { default: fg, theme: 'white' } });
      `,
      errors: [{ messageId: 'mutable', data: { name: 'fg', kind: 'let' } }],
    },
    {
      code: `
        import * as css from '@plumeria/core';
        let gap = 8;
        css.create({ box: (scale) => ({ gap: gap * scale }) });
      `,
      errors: [{ messageId: 'mutable', data: { name: 'gap', kind: 'let' } }],
    },
  ],
});
