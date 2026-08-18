import { Linter, RuleTester } from 'eslint';
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
      // reading a style outside the styling prop asks for the class name it
      // used to be, which is what `css.use` returns
      output: `import * as css from '@plumeria/core';\nimport { styles } from './Card.styles';\nconst dynamic = s[key];\nconst nested = css.use(styles.card).value;\n<div x:className={css.use(styles.card)} />;\n<div classStyle={s[key]} />;`,
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
    {
      // a joined class list is the array the styling prop takes
      code: `import s from './Card.module.css';\n<div className={[s.base, s['card-title']].join(' ')} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={[styles.base, styles.cardTitle]} />;`,
      errors: 5,
    },
    {
      // a condition keeps its place inside the array it is joined from
      code: `import s from './Card.module.css';\n<div className={[s.base, on && s['card-title']].filter(Boolean).join(' ')} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={[styles.base, on && styles.cardTitle]} />;`,
      errors: 5,
    },
    {
      // an element carrying a class name of its own keeps it on className
      code: `import s from './Card.module.css';\n<div className={[props.className, s.base].filter(Boolean).join(' ')} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div className={[props.className].filter(Boolean).join(' ')} classStyle={[styles.base]} />;`,
      errors: 3,
    },
    {
      // a joined list on a component may have come from `css.use`, and
      // `className` takes the string it returns either way
      code: `import s from './Card.module.css';\n<Chevron className={[s.base, s['card-title']].join(' ')} />;`,
      options,
      output: `import * as css from '@plumeria/core';\nimport { styles } from './Card.styles';\n<Chevron className={css.use(styles.base, styles.cardTitle)} />;`,
      errors: 4,
    },
  ],
});

// Two rewrites reach their answer on a later pass than the one RuleTester
// applies: the import has to become the Plumeria form before the call site can
// be read against it.
describe('rewrites that settle on a later pass', () => {
  const settle = (code: string, modules: Record<string, unknown>) =>
    new Linter().verifyAndFix(code, {
      languageOptions: {
        parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
      },
      plugins: { codemod: { rules: { 'adopt-styles': adoptStyles } } },
      rules: { 'codemod/adopt-styles': ['error', { modules }] },
    }).output;

  it('reads a style used as a value back through css.use', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<Link viewTransitionName={s.base} />;`,
        options[0].modules,
      ),
    ).toBe(
      `import * as css from '@plumeria/core';\nimport { styles } from './Card.styles';\n<Link viewTransitionName={css.use(styles.base)} />;`,
    );
  });

  it('reads the custom properties back as function style arguments', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={s.size} style={{ ['--styles-size-width']: width }} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { size: 'size' },
            composes: {},
            functions: { size: ['--styles-size-width'] },
          },
        },
      ),
    ).toBe(
      `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={styles.size(width)} />;`,
    );
  });

  it('drops the pixel guard the export put around a length argument', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={s.size} style={{ ['--styles-size-width']: typeof width === 'number' ? \`\${width}px\` : width }} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { size: 'size' },
            composes: {},
            functions: { size: ['--styles-size-width'] },
          },
        },
      ),
    ).toBe(
      `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={styles.size(width)} />;`,
    );
  });

  it.each([
    ['a condition of its own', 'wide ? big : width'],
    ['a loose comparison', "typeof width == 'number' ? `${width}px` : width"],
    ['no typeof at all', "width === 'number' ? `${width}px` : width"],
    ['another unary operator', "!width === 'number' ? `${width}px` : width"],
    ['a computed right side', 'typeof width === kind ? `${width}px` : width'],
    ['another type name', "typeof width === 'string' ? `${width}px` : width"],
    ['a plain consequent', "typeof width === 'number' ? '0px' : width"],
    [
      'two interpolations',
      "typeof width === 'number' ? `${width}${unit}` : width",
    ],
    ['another unit', "typeof width === 'number' ? `${width}rem` : width"],
    [
      'a different variable',
      "typeof height === 'number' ? `${width}px` : width",
    ],
  ])(
    'keeps a conditional that only looks like the pixel guard: %s',
    (_, argument) => {
      expect(
        settle(
          `import s from './Card.module.css';\n<div className={s.size} style={{ ['--styles-size-width']: ${argument} }} />;`,
          {
            './Card.module.css': {
              source: './Card.styles',
              names: { size: 'size' },
              composes: {},
              functions: { size: ['--styles-size-width'] },
            },
          },
        ),
      ).toBe(
        `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={styles.size(${argument})} />;`,
      );
    },
  );
});
