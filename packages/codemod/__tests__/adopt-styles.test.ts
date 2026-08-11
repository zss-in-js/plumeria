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
      code: `<div className={getStyles()} />;`,
    },
    {
      code: `const value = styles.card;\n<div id="card" className />;`,
      options: [{}],
    },
    {
      code: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={styles.card} />;`,
      options,
    },
    {
      code: `import s from './other.css';\n<div className={s.card} />;`,
      options,
    },
    {
      code: `import { card } from './Card.module.css';`,
      options,
    },
  ],
  invalid: [
    {
      code: `import s from './Card.module.css';\nconst dynamic = s[key];\nconst nested = s.card.value;\n<div x:className={s.card} />;\n<div className={s[key]} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\nconst dynamic = s[key];\nconst nested = styles.card.value;\n<div x:className={styles.card} />;\n<div classStyle={s[key]} />;`,
      errors: 4,
    },
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
    {
      // A basename module-map entry also matches a nested import. When the
      // generated export name is occupied, preserve the stylesheet binding.
      code: `const styles = {};\nimport cardStyles from '../ui/Card.module.css';\n<div className={cardStyles.card} />;`,
      options: [
        {
          modules: {
            'Card.module.css': options[0].modules['./Card.module.css'],
          },
        },
      ],
      output: `const styles = {};\nimport '@plumeria/core';\nimport { styles as cardStyles } from './Card.styles';\n<div classStyle={[cardStyles.base, cardStyles.card]} />;`,
      errors: 3,
    },
    {
      code: `function styles() {}\nimport s from './Card.module.css';\n<div className={s.unknown} />;`,
      options: [{ ...options[0], styleProp: 'sx' }],
      output: `function styles() {}\nimport '@plumeria/core';\nimport { styles as s } from './Card.styles';\n<div sx={s.unknown} />;`,
      errors: 2,
    },
  ],
});
