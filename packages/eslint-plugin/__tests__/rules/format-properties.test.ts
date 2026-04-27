import { RuleTester } from 'eslint';
import { formatProperties } from '../../src/rules/format-properties';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
  },
});

ruleTester.run('format-properties', formatProperties, {
  valid: [
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
    display: 'flex'
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ empty: {} });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
    // display: 'flex',
    textAlign: 'center',
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
    /* display: 'flex', */
    textAlign: 'center',
  }
});`,
    },
    // Without @plumeria/core import, should NOT trigger
    {
      code: `const styles = {
  testKey: { fontSize: 24 }
};`,
    },
    {
      code: `import * as css from 'other'; const styles = css.create({ s: { color: 'red' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.create(myVar);`,
    },
    {
      code: `import * as css from '@plumeria/core'; css.other({ s: { color: 'red' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; (function(){})()`,
    },
    {
      code: `import { create } from '@plumeria/core'; create(myVar);`,
    },
    {
      code: `import { "create" as c } from '@plumeria/core'; c({
  s: {
    color: 'red'
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24, // comment
    display: 'flex'
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css['create']({
  testKey: {
    fontSize: 24
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    ...props,
    fontSize: 24
  }
});`,
    },
    {
      // Case with comment in the "between" space of noEmptyLines
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,

    /* not whitespace only */
    display: 'flex'
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  [testKey]: {
    fontSize: 24
  }
});`,
    },
    {
      // Top-level spread in create
      code: `import * as css from '@plumeria/core'; const styles = css.create({ ...props });`,
    },
    {
      // Other import from @plumeria/core
      code: `import { use } from '@plumeria/core'; use({ s: { color: 'red' } });`,
    },
  ],
  invalid: [
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: { fontSize: 24, /* comment */ display: 'flex' }
});`,
      errors: [{ messageId: 'mustBeMultiline' }],
      // Outer object is fixed, inner object is NOT fixed because of the comment
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24, /* comment */ display: 'flex'
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: { fontSize: 24 }
});`,
      errors: [
        {
          messageId: 'mustBeMultiline',
        },
      ],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: { fontSize: 24, display: 'flex' }
});`,
      errors: [
        {
          messageId: 'mustBeMultiline',
        },
      ],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
    display: 'flex'
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,

    display: 'flex',

    textAlign: 'center',
  }
});`,
      errors: [{ messageId: 'noEmptyLines' }, { messageId: 'noEmptyLines' }],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
    display: 'flex',
    textAlign: 'center',
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    ':hover': { color: 'red' }
  }
});`,
      errors: [{ messageId: 'mustBeMultiline' }],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    ':hover': {
      color: 'red'
    }
  }
});`,
    },
    {
      code: `import { create } from '@plumeria/core'; const styles = create({
  testKey: { fontSize: 24 }
});`,
      errors: [{ messageId: 'mustBeMultiline' }],
      output: `import { create } from '@plumeria/core'; const styles = create({
  testKey: {
    fontSize: 24
  }
});`,
    },
    {
      code: `import { keyframes } from '@plumeria/core'; const anim = keyframes({
  testKey: { fontSize: 24 }
});`,
      errors: [{ messageId: 'mustBeMultiline' }],
      output: `import { keyframes } from '@plumeria/core'; const anim = keyframes({
  testKey: {
    fontSize: 24
  }
});`,
    },
    {
      code: `import { viewTransition } from '@plumeria/core'; const vt = viewTransition({
  testKey: { fontSize: 24 }
});`,
      errors: [{ messageId: 'mustBeMultiline' }],
      output: `import { viewTransition } from '@plumeria/core'; const vt = viewTransition({
  testKey: {
    fontSize: 24
  }
});`,
    },
    {
      code: `import plumeria from '@plumeria/core'; const styles = plumeria.create({
  testKey: { fontSize: 24 }
});`,
      errors: [{ messageId: 'mustBeMultiline' }],
      output: `import plumeria from '@plumeria/core'; const styles = plumeria.create({
  testKey: {
    fontSize: 24
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: { fontSize: 24, }
});`,
      errors: [{ messageId: 'mustBeMultiline' }],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
  }
});`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,


    display: 'flex'
  }
});`,
      errors: [{ messageId: 'noEmptyLines' }],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
    display: 'flex'
  }
});`,
    },
    {
      // Multiple invalid objects
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  a: { color: 'red' },
  b: { color: 'blue' }
});`,
      errors: [
        { messageId: 'mustBeMultiline' },
        { messageId: 'mustBeMultiline' },
      ],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  a: {
    color: 'red'
  },
  b: {
    color: 'blue'
  }
});`,
    },
    {
      // Tab character in empty line
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
\t
    display: 'flex'
  }
});`,
      errors: [{ messageId: 'noEmptyLines' }],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
    display: 'flex'
  }
});`,
    },
    {
      // Spread element with empty line
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,

    ...props
  }
});`,
      errors: [{ messageId: 'noEmptyLines' }],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    fontSize: 24,
    ...props
  }
});`,
    },
    {
      // Mixed empty and normal lines to cover all branches in the second pass
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    prop1: 1,

    prop2: 2,
    prop3: 3
  }
});`,
      errors: [{ messageId: 'noEmptyLines' }],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    prop1: 1,
    prop2: 2,
    prop3: 3
  }
});`,
    },
    {
      // Mixed pure empty lines and commented empty lines to cover L155 false branch
      code: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    prop1: 1,

    prop2: 2,

    /* comment */
    prop3: 3
  }
});`,
      errors: [{ messageId: 'noEmptyLines' }],
      output: `import * as css from '@plumeria/core'; const styles = css.create({
  testKey: {
    prop1: 1,
    prop2: 2,

    /* comment */
    prop3: 3
  }
});`,
    },
  ],
});
