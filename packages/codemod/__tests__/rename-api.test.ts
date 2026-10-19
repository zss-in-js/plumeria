import { RuleTester } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { renameApi } from '../src/transforms/rename-api';

import type { Linter } from 'eslint';

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser as unknown as Linter.Parser,
  },
});

const options = [{ from: 'viewTransition', to: 'viewTransitionClass' }];
const rename = { messageId: 'rename' };

tester.run('rename-api', renameApi, {
  valid: [
    {
      code: `import * as css from '@plumeria/core';
const fade = css.viewTransitionClass({ old: { opacity: 0 } });`,
      options,
    },
    {
      // a namespace from another package is not Plumeria's
      code: `import * as css from 'other';
const fade = css.viewTransition({ old: { opacity: 0 } });`,
      options,
    },
    {
      code: `import { viewTransition } from 'other';
viewTransition();`,
      options,
    },
    {
      code: `import * as css from '@plumeria/core';
const fade = css['viewTransition'];
const name = { viewTransition: 1 }.viewTransition;`,
      options,
    },
  ],
  invalid: [
    {
      code: `import * as css from '@plumeria/core';
const fade = css.viewTransition({ old: { opacity: 0 } });`,
      output: `import * as css from '@plumeria/core';
const fade = css.viewTransitionClass({ old: { opacity: 0 } });`,
      options,
      errors: [rename],
    },
    {
      code: `import css from '@plumeria/core';
const fade = css.viewTransition({ old: { opacity: 0 } });`,
      output: `import css from '@plumeria/core';
const fade = css.viewTransitionClass({ old: { opacity: 0 } });`,
      options,
      errors: [rename],
    },
    {
      code: `import { viewTransition } from '@plumeria/core';
const fade = viewTransition({ old: { opacity: 0 } });
const slide = viewTransition({ new: { opacity: 1 } });`,
      output: `import { viewTransitionClass } from '@plumeria/core';
const fade = viewTransitionClass({ old: { opacity: 0 } });
const slide = viewTransitionClass({ new: { opacity: 1 } });`,
      options,
      errors: [rename, rename, rename],
    },
    {
      // only the imported name changes; the local alias stays
      code: `import { viewTransition as vt } from '@plumeria/core';
const fade = vt({ old: { opacity: 0 } });`,
      output: `import { viewTransitionClass as vt } from '@plumeria/core';
const fade = vt({ old: { opacity: 0 } });`,
      options,
      errors: [rename],
    },
    {
      // a parameter that shadows the import is left alone
      code: `import { viewTransition } from '@plumeria/core';
const fade = viewTransition({ old: { opacity: 0 } });
const f = (viewTransition: string) => viewTransition;`,
      output: `import { viewTransitionClass } from '@plumeria/core';
const fade = viewTransitionClass({ old: { opacity: 0 } });
const f = (viewTransition: string) => viewTransition;`,
      options,
      errors: [rename, rename],
    },
  ],
});
