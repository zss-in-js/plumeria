import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { noUnusedKeys } from '../../src/rules/no-unused-keys';

const ruleTester = new RuleTester();

ruleTester.run('no-unused-keys', noUnusedKeys as unknown as JSRuleDefinition, {
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
  ],
});
