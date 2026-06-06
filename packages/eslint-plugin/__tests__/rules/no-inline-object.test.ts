import { RuleTester } from 'eslint';
import { noInlineObject } from '../../src/rules/no-inline-object';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
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
    { code: '<div styleName={[variants({ size: "small" })]} />' },
    { code: 'css.use(variants({ size: "small" }))' },
    { code: 'foo()()' },
    { code: "import React from 'react';" },
    { code: 'obj.prop.use()' },
    { code: 'css["use"]()' },
    { code: '<div styleName />' },
    { code: 'css.variants({ ...spread })' },
    { code: 'css.variants({ size: { ...spread } })' },
    { code: "import { use as myUse } from '@plumeria/core';" },
    {
      code: "import { 'use' as myUse } from '@plumeria/core'; myUse(styles.base);",
    },
    {
      code: "import { variants } from '@plumeria/core'; variants('not-an-object');",
    },
    {
      code: "import { variants } from '@plumeria/core'; variants({ ...spread });",
    },
    {
      code: "import { variants } from '@plumeria/core'; variants({ size: 'not-an-object' });",
    },
    {
      code: "import { variants } from '@plumeria/core'; variants({ size: { ...nestedSpread } });",
    },
    {
      code: "import { variants } from '@plumeria/core'; variants({ size: { small: styles.small } });",
    },
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
      code: "import { use } from '@plumeria/core'; use({ color: 'red' })",
      errors: [{ messageId: 'noInlineObjectInCssUse' }],
    },
    {
      code: "import * as css from '@plumeria/core'; css.use(styles.base, { background: 'blue' })",
      errors: [{ messageId: 'noInlineObjectInCssUse' }],
    },
    {
      code: "import css from '@plumeria/core'; <div className={css.use({ color: 'red' })} />",
      errors: [{ messageId: 'noInlineObjectInCssUse' }],
    },
    {
      code: "import { variants } from '@plumeria/core'; const getStyle = variants({ variant: { style: { color:'red' } } });",
      errors: [{ messageId: 'noInlineObjectInCssVariants' }],
    },
  ],
});
