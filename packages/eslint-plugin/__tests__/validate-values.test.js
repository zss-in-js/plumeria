const { RuleTester } = require('eslint')
const rule = require('../lib/rules/validate-values')

const ruleTester = new RuleTester()

ruleTester.run('validate-values', rule, {
  valid: [
    // position: value is valid
    { code: "const styles = { position: 'absolute' };" },
    { code: "const styles = { position: 'relative' };" },

    // zIndex: value is valid
    { code: 'const styles = { zIndex: 10 };' },
    { code: 'const styles = { zIndex: 0 };' },

    // fontSize: value is valid
    { code: "const styles = { fontSize: '16px' };" },
    { code: "const styles = { fontSize: '1.5em' };" },
    { code: "const styles = { fontSize: '100%' };" },
  ],

  invalid: [
    {
      code: "const styles = { position: 'center' };",
      errors: [
        {
          message:
            "'position' has an invalid value 'center'. Valid values: static, relative, absolute, fixed, sticky",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },

    {
      code: "const styles = { position: 'none' };",
      errors: [
        {
          message:
            "'position' has an invalid value 'none'. Valid values: static, relative, absolute, fixed, sticky",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },

    {
      code: "const styles = { zIndex: 'high' };",
      errors: [
        {
          message: "'zIndex' has an invalid value 'high'. Valid values: auto",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },

    {
      code: "const styles = { fontSize: '16pts' };",
      errors: [
        {
          message:
            "'fontSize' has an invalid value '16pts'. Valid values: xx-small, x-small, small, medium, large, x-large, xx-large, math, smaller, larger",
        },
      ],
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
})
