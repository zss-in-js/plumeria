import { RuleTester } from 'eslint';
import { styleNameRequiresImport } from '../../src/rules/style-name-requires-import';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('style-name-requires-import', styleNameRequiresImport, {
  valid: [
    {
      code: `
          import * as css from '@plumeria/core';
          const el = <div styleName={[styles.foo]} />;
        `,
    },
    {
      code: `
          import { create } from '@plumeria/core';
          const el = <div styleName={[styles.foo]} />;
        `,
    },
    {
      code: `
          import * as css from '@plumeria/core';
          const el = <div className="foo" />;
        `,
    },
    {
      code: `
          import React from 'react';
          const el = <div className="foo" />;
        `,
    },
    {
      code: `
          const el = <div className="foo" />;
        `,
    },
  ],
  invalid: [
    {
      code: `
          const el = <div styleName={[styles.foo]} />;
        `,
      output: `import "@plumeria/core";\n\n          const el = <div styleName={[styles.foo]} />;\n        `,
      errors: [
        {
          messageId: 'styleNameError',
        },
      ],
    },
    {
      code: `
          import React from 'react';
          const el = <div styleName={[styles.foo]} />;
        `,
      output: `import "@plumeria/core";\n\n          import React from 'react';\n          const el = <div styleName={[styles.foo]} />;\n        `,
      errors: [
        {
          messageId: 'styleNameError',
        },
      ],
    },
    {
      code: `
          import something from 'other-lib';
          const el = <div styleName={[styles.foo]} />;
          const el2 = <span styleName={[styles.bar]} />;
        `,
      output: `import "@plumeria/core";\n\n          import something from 'other-lib';\n          const el = <div styleName={[styles.foo]} />;\n          const el2 = <span styleName={[styles.bar]} />;\n        `,
      errors: [
        {
          messageId: 'styleNameError',
        },
        {
          messageId: 'styleNameError',
        },
      ],
    },
  ],
});
