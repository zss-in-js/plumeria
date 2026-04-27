import { RuleTester } from 'eslint';
import { noUnusedKeys } from '../../src/rules/no-unused-keys';

const ruleTester = new RuleTester();

ruleTester.run('no-unused-keys', noUnusedKeys, {
  valid: [
    {
      code: 'const styles = { key: {} };',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const styles = css.keyframes({ from: {}, to: {} })',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const tokens = css.defineTokens({ primary: {} })',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'const styles = css.create({ unused: {} });',
      filename: 'test.ts',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: `
        const styles = css.create({ used: {} });
        const x = styles.used;
      `,
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: `
        const styles = css.create({ unused: {} });
        const ref = styles.unused;
      `,
      settings: {
        ecmaVersion: 2021,
      },
      filename: 'test.js',
    },
    {
      code: `
        const styles = css.create({ key1: {}, key2: {} });
        const key = 'key1';
        const x = styles[key];
      `,
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: `
        const styles = css.create({ primary: { color: 'gray' }});
        styles.primary.color;
      `,
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Computed Literal key (Supported)
      code: `
        const styles = css.create({ used: {} });
        styles['used'];
      `,
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // css.create with no arguments
      code: 'css.create()',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // css.create with non-object argument
      code: 'css.create(arg)',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // css.create not in variable declarator
      code: 'css.create({ a: {} })',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Destructuring (should skip or handle gracefully)
      code: 'const [s] = css.create({ a: {} });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Spread element in create (skipped)
      code: `
        const styles = css.create({ ...props, used: {} });
        styles.used;
      `,
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
  invalid: [
    {
      code: 'const styles = css.create({ key: {} });',
      errors: [
        {
          message: "The key 'key' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: `
        const styles = css.create({ unused1: {}, unused2: {} });
      `,
      errors: [
        {
          message:
            "The key 'unused1' is defined but never referenced anywhere.",
        },
        {
          message:
            "The key 'unused2' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: `
        const styles = css.create({ used: {}, unused: {} });
        const x = styles.used;
      `,
      errors: [
        {
          message: "The key 'unused' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: `
        const styles1 = css.create({ unused: {} });
        const key = 'prop';
        styles1[key];
        const styles2 = css.create({ unused: {} });
      `,
      errors: [
        {
          message: "The key 'unused' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: `
        const styles = css.create({ used: { fontSize: 24 }, unused: {} });
        styles.used.fontSize;
      `,
      errors: [
        {
          message: "The key 'unused' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Member access on non-identifier object (Correctly reported as unused)
      code: 'const styles = css.create({ used: {} }); (function(){})().used;',
      errors: [
        {
          message: "The key 'used' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Computed member access on non-identifier object
      code: 'const styles = css.create({ used: {} }); (function(){})()["used"];',
      errors: [
        {
          message: "The key 'used' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Dynamic bracket access on non-identifier object
      code: 'const styles = css.create({ used: {} }); (function(){})()[key];',
      errors: [
        {
          message: "The key 'used' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Complex computed key (Ignored by the rule, so 'used' remains unused)
      code: `
        const styles = css.create({ used: {} });
        styles[1 + 1];
      `,
      errors: [
        {
          message: "The key 'used' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
});
