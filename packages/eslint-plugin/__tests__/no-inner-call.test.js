const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-inner-call');

const ruleTester = new RuleTester();

const settings = { settings: { ecmaVersion: 2021 } };

ruleTester.run('no-inner-call', rule, {
  valid: [
    {
      code: 'css.create();',
      code: 'css.keyframes();',
      code: 'css.viewTransition();',
      code: 'css.defineConsts();',
      code: 'css.defineTokens();',
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
      code: 'function create() { css.create(); }',
      errors: [{ message: 'Do not use css.create inside functions' }],
      ...settings,
    },
    {
      code: '(() => { css.keyframes(); })();',
      errors: [{ message: 'Do not use css.keyframes inside functions' }],
      ...settings,
    },
    {
      code: '(() => { css.viewTransition(); })();',
      errors: [{ message: 'Do not use css.viewTransition inside functions' }],
      ...settings,
    },
    {
      code: 'function consts() { css.defineConsts(); }',
      errors: [{ message: 'Do not use css.defineConsts inside functions' }],
      ...settings,
    },
    {
      code: 'function theme() { css.defineTokens(); }',
      errors: [{ message: 'Do not use css.defineTokens inside functions' }],
      ...settings,
    },
  ],
});
