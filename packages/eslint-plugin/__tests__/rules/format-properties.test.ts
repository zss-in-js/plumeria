import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { formatProperties } from '../../src/rules/format-properties';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2021,
  },
});

ruleTester.run(
  'format-properties',
  formatProperties as unknown as JSRuleDefinition,
  {
    valid: [
      {
        code: `const styles = {
  testKey: {
    fontSize: 24
  }
};`,
      },
      {
        code: `const styles = {
  testKey: {
    fontSize: 24,
    display: 'flex'
  }
};`,
      },
      {
        code: `const styles = { empty: {} };`,
      },
    ],
    invalid: [
      {
        code: `const styles = {
  testKey: { fontSize: 24 }
};`,
        errors: [
          {
            messageId: 'mustBeMultiline',
          },
        ],
        output: `const styles = {
  testKey: {
    fontSize: 24
  }
};`,
      },
      {
        code: `const styles = {
  testKey: { fontSize: 24, display: 'flex' }
};`,
        errors: [
          {
            messageId: 'mustBeMultiline',
          },
        ],
        output: `const styles = {
  testKey: {
    fontSize: 24,
    display: 'flex'
  }
};`,
      },
      {
        code: `const styles = {
  testKey: {
    fontSize: 24,

    display: 'flex',

    textAlign: 'center',
  }
};`,
        errors: [{ messageId: 'noEmptyLines' }, { messageId: 'noEmptyLines' }],
        output: `const styles = {
  testKey: {
    fontSize: 24,
    display: 'flex',
    textAlign: 'center',
  }
};`,
      },
    ],
  },
);
