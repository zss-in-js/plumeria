import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { noInnerCall } from '../../src/rules/no-inner-call';

const ruleTester = new RuleTester();

const settings = {
  ecmaVersion: 2021,
};

ruleTester.run('no-inner-call', noInnerCall as unknown as JSRuleDefinition, {
  valid: [
    {
      code: 'css.create();',
      settings,
    },
    {
      code: 'css.keyframes();',
      settings,
    },
    {
      code: 'css.viewTransition();',
      settings,
    },
    {
      code: 'css.defineConsts();',
      settings,
    },
    {
      code: 'css.defineTokens();',
      settings,
    },
    {
      code: 'const styles = css.create();',
      settings,
    },
  ],
  invalid: [
    {
      code: 'const create = () => { css.create(); }',
      errors: [{ message: 'Do not use css.create inside functions' }],
      settings,
    },
    {
      code: 'function create() { css.create(); }',
      errors: [{ message: 'Do not use css.create inside functions' }],
      settings,
    },
    {
      code: '(() => { css.keyframes(); })();',
      errors: [{ message: 'Do not use css.keyframes inside functions' }],
      settings,
    },
    {
      code: '(() => { css.viewTransition(); })();',
      errors: [{ message: 'Do not use css.viewTransition inside functions' }],
      settings,
    },
    {
      code: 'function consts() { css.defineConsts(); }',
      errors: [{ message: 'Do not use css.defineConsts inside functions' }],
      settings,
    },
    {
      code: 'function theme() { css.defineTokens(); }',
      errors: [{ message: 'Do not use css.defineTokens inside functions' }],
      settings,
    },
    {
      code: 'const arrow = () => { css.keyframes(); };',
      errors: [{ message: 'Do not use css.keyframes inside functions' }],
      settings,
    },
    {
      code: 'const func = function() { css.create(); };',
      errors: [{ message: 'Do not use css.create inside functions' }],
      settings,
    },
  ],
});
