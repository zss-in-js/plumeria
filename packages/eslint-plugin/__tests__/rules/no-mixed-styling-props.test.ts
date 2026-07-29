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
      code: '<div classStyle={styles.text} />',
    },
    {
      // once the prop is renamed, the old name is just an ordinary attribute
      code: '<div classStyle={styles.text} className="text" />',
      settings: { plumeria: { styleProp: 'sx' } },
    },
    {
      // renaming the prop to `style` must not make the rule flag it against itself
      code: '<div style={styles.text} />',
      settings: { plumeria: { styleProp: 'style' } },
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
      code: '<div classStyle={styles.text} className="text" />',
      errors: [{ messageId: 'noMixedStylingProps' }],
    },
    {
      code: '<div classStyle={styles.text} style={{ color: "red" }} />',
      errors: [{ messageId: 'noMixedStylingProps' }],
    },
    {
      code: '<div classStyle={styles.text} className="text" style={{ color: "red" }} />',
      errors: [
        { messageId: 'noMixedStylingProps' },
        { messageId: 'noMixedStylingProps' },
      ],
    },
    {
      // settings retarget every rule at once, without per-rule options
      code: '<div sx={styles.text} className="text" />',
      settings: { plumeria: { styleProp: 'sx' } },
      errors: [{ messageId: 'noMixedStylingProps' }],
    },
    {
      // a per-rule option wins over the shared setting
      code: '<div sx={styles.text} style={{ color: "red" }} />',
      settings: { plumeria: { styleProp: 'classStyle' } },
      options: [{ styleProp: 'sx' }],
      errors: [{ messageId: 'noMixedStylingProps' }],
    },
  ],
});
