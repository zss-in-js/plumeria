import { RuleTester } from 'eslint';
import { propsRequireImport } from '../../src/rules/props-require-import';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('props-require-import', propsRequireImport, {
  valid: [
    {
      // the default name stops being the styling prop once renamed
      code: '<div classStyle={[styles.foo]} />;',
      settings: { plumeria: { styleProp: 'sx' } },
    },
    {
      code: `
          import * as css from '@plumeria/core';
          const el = <div classStyle={[styles.foo]} />;
        `,
    },
    {
      code: `
          import { create } from '@plumeria/core';
          const el = <div classStyle={[styles.foo]} />;
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
          const el = <div classStyle={[styles.foo]} />;
        `,
      output: `import "@plumeria/core";\n\n          const el = <div classStyle={[styles.foo]} />;\n        `,
      errors: [
        {
          messageId: 'requiresImport',
        },
      ],
    },
    {
      code: `
          import React from 'react';
          const el = <div classStyle={[styles.foo]} />;
        `,
      output: `import "@plumeria/core";\n\n          import React from 'react';\n          const el = <div classStyle={[styles.foo]} />;\n        `,
      errors: [
        {
          messageId: 'requiresImport',
        },
      ],
    },
    {
      code: `
          import something from 'other-lib';
          const el = <div classStyle={[styles.foo]} />;
          const el2 = <span classStyle={[styles.bar]} />;
        `,
      output: `import "@plumeria/core";\n\n          import something from 'other-lib';\n          const el = <div classStyle={[styles.foo]} />;\n          const el2 = <span classStyle={[styles.bar]} />;\n        `,
      errors: [
        {
          messageId: 'requiresImport',
        },
        {
          messageId: 'requiresImport',
        },
      ],
    },
    {
      code: '<div sx={[styles.foo]} />;',
      settings: { plumeria: { styleProp: 'sx' } },
      errors: [{ messageId: 'requiresImport' }],
      output: 'import "@plumeria/core";\n<div sx={[styles.foo]} />;',
    },
    {
      code: '<div sx={[styles.foo]} />;',
      options: [{ styleProp: 'sx' }],
      errors: [{ messageId: 'requiresImport' }],
      output: 'import "@plumeria/core";\n<div sx={[styles.foo]} />;',
    },
  ],
});
