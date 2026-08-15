import { RuleTester } from 'eslint';
import { expandBorderShorthands } from '../../src/rules/expand-border-shorthands';
import { formatProperties } from '../../src/rules/format-properties';
import { noCombinator } from '../../src/rules/no-combinator';
import { noInvalidSelector } from '../../src/rules/no-invalid-selector';
import { noLogicalProperties } from '../../src/rules/no-logical-properties';
import { noOrderDependentOverlap } from '../../src/rules/no-order-dependent-overlap';
import { noPhysicalProperties } from '../../src/rules/no-physical-properties';
import { noUnknownCssProperties } from '../../src/rules/no-unknown-css-properties';
import { sortProperties } from '../../src/rules/sort-properties';
import { validatePseudos } from '../../src/rules/validate-pseudos';
import { validateValues } from '../../src/rules/validate-values';

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});
const wrap = (body: string) =>
  `import * as css from '@plumeria/core'; css.create({ dynamic: value => (${body}) });`;
const rejects = (
  name: string,
  rule: Parameters<typeof tester.run>[1],
  code: string,
  output?: string,
) =>
  tester.run(`function keys: ${name}`, rule, {
    valid: [],
    invalid: [
      {
        code: wrap(code),
        ...(output === undefined ? {} : { output }),
        errors: 1,
      },
    ],
  });

rejects(
  'no-unknown-css-properties',
  noUnknownCssProperties,
  `{ colro: value }`,
);
rejects('validate-values', validateValues, `{ position: 'invalid' }`);
rejects(
  'no-invalid-selector',
  noInvalidSelector,
  `{ ':hover': { '@media (width > 1px)': { color: value } } }`,
);
rejects(
  'validate-pseudos',
  validatePseudos,
  `{ ':not-a-pseudo': { color: value } }`,
);
rejects('no-combinator', noCombinator, `{ '& > span': { color: value } }`);
rejects(
  'no-order-dependent-overlap',
  noOrderDependentOverlap,
  `{ paddingTop: value, paddingBlockStart: value }`,
);
rejects(
  'no-logical-properties',
  noLogicalProperties,
  `{ marginBlockEnd: value }`,
);
rejects(
  'no-physical-properties',
  noPhysicalProperties,
  `{ marginBottom: value }`,
);
rejects(
  'expand-border-shorthands',
  expandBorderShorthands,
  `{ border: '1px solid red' }`,
  `import * as css from '@plumeria/core'; css.create({ dynamic: value => ({ borderWidth: '1px',
                                                                         borderStyle: 'solid',
                                                                         borderColor: 'red' }) });`,
);
rejects(
  'sort-properties',
  sortProperties,
  `{ display: 'block', position: 'absolute' }`,
  `import * as css from '@plumeria/core'; css.create({ dynamic: value => ({ position: 'absolute', display: 'block' }) });`,
);
rejects(
  'format-properties',
  formatProperties,
  `{ color: value, display: 'block' }`,
  `import * as css from '@plumeria/core'; css.create({ dynamic: value => ({
  color: value,
  display: 'block'
}) });`,
);
