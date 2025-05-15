const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-unused-keys')

const ruleTester = new RuleTester()

ruleTester.run('no-unused-keys', rule, {
  valid: [
    {
      code: 'const styles = { key: {} };',
      code: 'const styles = css.keyframes({ from: {}, to: {} })',
      code: 'const styles = css.global({ html: {}, body: {} })',
      code: 'const styles = css.defineThemeVars({ primary: {} })',
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
  invalid: [
    {
      code: 'const styles = css.create({ key: {} });',
      errors: [
        {
          message: "The key 'key' is defined but never referenced anywhere.",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
})
