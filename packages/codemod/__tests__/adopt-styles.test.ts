import { RuleTester } from 'eslint';
import { adoptStyles } from '../src/transforms/adopt-styles';

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
  },
});

const options = [
  {
    modules: {
      './Card.module.css': {
        source: './Card.styles',
        names: { base: 'base', card: 'card', 'card-title': 'cardTitle' },
        composes: { card: ['base'] },
      },
    },
  },
];

tester.run('adopt-styles', adoptStyles, {
  valid: [
    {
      code: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={styles.card} />;`,
      options,
    },
    {
      code: `import s from './other.css';\n<div className={s.card} />;`,
      options,
    },
  ],
  invalid: [
    {
      // the stylesheet import becomes the generated module, and the core import
      // is added because the compiler collects a file only when it sees one
      code: `import s from './Card.module.css';\n<div className={s['card-title']} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={styles.cardTitle} />;`,
      errors: 3,
    },
    {
      // a composed class becomes an array, in the order the stylesheet declared
      code: `import '@plumeria/core';\nimport s from './Card.module.css';\n<div className={s.card} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={[styles.base, styles.card]} />;`,
      errors: 4,
    },
  ],
});
