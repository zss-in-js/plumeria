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
  ],
});
