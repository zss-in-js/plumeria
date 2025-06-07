const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-inner-call');

const ruleTester = new RuleTester();

const settings = { settings: { ecmaVersion: 2021 } };

ruleTester.run('no-inner-call', rule, {
  valid: [
    { code: 'css.create();', ...settings },
    { code: 'css.createComposite();', ...settings },
    { code: 'css.global();', ...settings },
    { code: 'css.keyframes();', ...settings },
    { code: 'css.defineConsts();', ...settings },
    { code: 'css.defineVars();', ...settings },
    { code: 'css.defineTheme();', ...settings },
    { code: 'other.create();', ...settings },
    { code: 'const style = css.create();', ...settings },
  ],
  invalid: [
    {
      code: 'function foo() { css.create(); }',
      errors: [{ message: 'Do not use css.create inside functions' }],
      ...settings,
    },
    {
      code: 'function foo() { css.createComposite(); }',
      errors: [{ message: 'Do not use css.createComposite inside functions' }],
      ...settings,
    },
    {
      code: 'const bar = () => { css.global(); }',
      errors: [{ message: 'Do not use css.global inside functions' }],
      ...settings,
    },
    {
      code: '(() => { css.keyframes(); })();',
      errors: [{ message: 'Do not use css.keyframes inside functions' }],
      ...settings,
    },
    {
      code: 'function theme() { css.defineConsts(); }',
      errors: [{ message: 'Do not use css.defineConsts inside functions' }],
      ...settings,
    },
    {
      code: 'function theme() { css.defineVars(); }',
      errors: [{ message: 'Do not use css.defineVars inside functions' }],
      ...settings,
    },
    {
      code: 'function theme() { css.defineTheme(); }',
      errors: [{ message: 'Do not use css.defineTheme inside functions' }],
      ...settings,
    },
    {
      code: 'function outer() { function inner() { css.create(); } }',
      errors: [{ message: 'Do not use css.create inside functions' }],
      ...settings,
    },
    {
      code: 'const fn = function() { css.global(); }',
      errors: [{ message: 'Do not use css.global inside functions' }],
      ...settings,
    },
  ],
});
