const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-inner-call');

const ruleTester = new RuleTester();

const settings = { settings: { ecmaVersion: 2021 } };

ruleTester.run('no-inner-call', rule, {
  valid: [
    {
      code: 'css.create();',
      code: 'css.global();',
      code: 'css.keyframes();',
      code: 'css.defineConsts();',
      code: 'css.defineVars();',
      code: 'css.defineTheme();',
      code: 'const styles = css.create();',
      ...settings,
    },
  ],
  invalid: [
    {
      code: 'const create = () => { css.create(); }',
      errors: [{ message: 'Do not use css.create inside functions' }],
      ...settings,
    },
    {
      code: 'const globl = () => { css.global(); }',
      errors: [{ message: 'Do not use css.global inside functions' }],
      ...settings,
    },
    {
      code: 'function create() { css.create(); }',
      errors: [{ message: 'Do not use css.create inside functions' }],
      ...settings,
    },
    {
      code: 'function global() { css.global(); }',
      errors: [{ message: 'Do not use css.global inside functions' }],
      ...settings,
    },
    {
      code: '(() => { css.keyframes(); })();',
      errors: [{ message: 'Do not use css.keyframes inside functions' }],
      ...settings,
    },
    {
      code: 'function consts() { css.defineConsts(); }',
      errors: [{ message: 'Do not use css.defineConsts inside functions' }],
      ...settings,
    },
    {
      code: 'function vars() { css.defineVars(); }',
      errors: [{ message: 'Do not use css.defineVars inside functions' }],
      ...settings,
    },
    {
      code: 'function theme() { css.defineTheme(); }',
      errors: [{ message: 'Do not use css.defineTheme inside functions' }],
      ...settings,
    },
  ],
});
