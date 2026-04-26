import { RuleTester } from 'eslint';
import { noInlineObject } from '../../src/rules/no-inline-object';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('no-inline-object', noInlineObject, {
  valid: [
    { code: '<div style={{ color: "red" }} />' },
    { code: '<div styleName={styles.active} />' },
    { code: '<div styleName={[styles.base, isActive && styles.active]} />' },
    { code: 'css.use(styles.active)' },
    { code: 'css.use(styles.base, isActive && styles.active)' },
    { code: '<div className={css.use(styles.active)} />' },
    { code: 'css.create({ text: { color: "red" } })' },
  ],
  invalid: [
    {
      code: '<div styleName={{ color: "red" }} />',
      errors: [{ messageId: 'noInlineObjectInStyleName' }],
    },
    {
      code: '<div styleName={[styles.base, { color: "red" }]} />',
      errors: [{ messageId: 'noInlineObjectInStyleName' }],
    },
    {
      code: '<div styleName={{ [styles.active]: isActive }} />',
      errors: [{ messageId: 'noInlineObjectInStyleName' }],
    },
    {
      code: 'css.use({ color: "red" })',
      errors: [{ messageId: 'noInlineObjectInCssUse' }],
    },
    {
      code: 'css.use(styles.base, { background: "blue" })',
      errors: [{ messageId: 'noInlineObjectInCssUse' }],
    },
    {
      code: '<div className={css.use({ color: "red" })} />',
      errors: [{ messageId: 'noInlineObjectInCssUse' }],
    },
  ],
});
