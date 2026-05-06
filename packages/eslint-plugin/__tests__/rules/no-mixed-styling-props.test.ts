import { RuleTester } from 'eslint';
import { noMixedStylingProps } from '../../src/rules/no-mixed-styling-props';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('no-mixed-styling-props', noMixedStylingProps, {
  valid: [
    {
      code: '<div styleName={styles.text} />',
    },
    {
      code: '<div className="text" />',
    },
    {
      code: '<div style={{ color: "red" }} />',
    },
    {
      code: '<div className="text" style={{ color: "red" }} />',
    },
    {
      code: '<div />',
    },
  ],
  invalid: [
    {
      code: '<div styleName={styles.text} className="text" />',
      errors: [{ messageId: 'noMixedStylingProps' }],
    },
    {
      code: '<div styleName={styles.text} style={{ color: "red" }} />',
      errors: [{ messageId: 'noMixedStylingProps' }],
    },
    {
      code: '<div styleName={styles.text} className="text" style={{ color: "red" }} />',
      errors: [
        { messageId: 'noMixedStylingProps' },
        { messageId: 'noMixedStylingProps' },
      ],
    },
  ],
});
