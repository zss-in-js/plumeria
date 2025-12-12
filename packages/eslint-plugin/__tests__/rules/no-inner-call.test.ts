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
      code: 'css.createStatic();',
      settings,
    },
    {
      code: 'css.createTheme();',
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
      code: 'function consts() { css.createStatic(); }',
      errors: [{ message: 'Do not use css.createStatic inside functions' }],
      settings,
    },
    {
      code: 'function theme() { css.createTheme(); }',
      errors: [{ message: 'Do not use css.createTheme inside functions' }],
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
