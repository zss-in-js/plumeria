import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { RuleTester } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { __private, releaseStyles } from '../src/transforms/release-styles';

describe('release-styles expression helpers', () => {
  it('handles every member and composition node boundary', () => {
    expect(__private.memberPath(undefined)).toBeUndefined();
    expect(__private.memberPath({ type: 'Identifier', name: 'css' })).toEqual([
      'css',
    ]);
    expect(
      __private.memberPath({
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'css' },
        computed: true,
        property: { type: 'Literal', value: 'create' },
      }),
    ).toEqual(['css', 'create']);
    expect(
      __private.memberPath({
        type: 'MemberExpression',
        object: { type: 'Literal', value: 'css' },
        computed: false,
        property: { type: 'Literal', value: 'create' },
      }),
    ).toBeUndefined();
    expect(
      __private.memberPath({
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'css' },
        computed: true,
        property: { type: 'Identifier', name: 'method' },
      }),
    ).toBeUndefined();
    expect(__private.isCreate(undefined)).toBe(false);
    expect(
      __private.isCreate({
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'create' },
      }),
    ).toBe(false);
    for (const type of [
      'LogicalExpression',
      'ConditionalExpression',
      'SpreadElement',
    ]) {
      expect(__private.needsFilter({ type })).toBe(true);
    }
    expect(__private.needsFilter({ type: 'Identifier' })).toBe(false);
  });
});

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
  },
});

const PROJECT = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'release-styles-')),
);
const sourceFile = (name: string): string => {
  const file = path.join(PROJECT, name);
  fs.writeFileSync(file, '', 'utf8');
  return file;
};

const filename = sourceFile('Card.tsx');
const OTHER = sourceFile('Other.tsx');
const CONSUMER = sourceFile('Consumer.tsx');
const THEME = sourceFile('theme.ts');
const ANIMATION = sourceFile('animation.ts');

afterAll(() => fs.rmSync(PROJECT, { recursive: true, force: true }));
const options = [
  {
    modules: {
      [filename]: { source: './Card.module.css', binding: 'styles' },
    },
  },
];

tester.run('release-styles', releaseStyles, {
  valid: [
    { code: `const value = 1;` },
    { code: `import value from './local';` },
    { code: `import value from './local';`, options: [{ modules: {} }] },
    { filename, code: `<div className={styles.card} />;`, options },
    {
      filename: OTHER,
      code: `<div classStyle={styles.card} />;`,
      options,
    },
    {
      filename,
      code: `import { value } from 'external';
const first = 1, second = 2;
const { card } = styles;
<div ns:classStyle="" />;`,
      options,
    },
  ],
  invalid: [
    {
      filename,
      code: `<div classStyle="card" />;`,
      options,
      output: `<div className="card" />;`,
      errors: 1,
    },
    {
      filename,
      code: `<div classStyle={styles.size(width)} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              functions: {
                size: {
                  params: ['width', 'color'],
                  variables: ['--styles-size-width', '--styles-size-color'],
                },
              },
            },
          },
        },
      ],
      errors: [{ messageId: 'unsupportedFunctionStyle' }],
    },
    {
      filename,
      code: `<div classStyle={styles[key](width, color)} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              functions: {
                size: {
                  params: ['width', 'color'],
                  variables: ['--styles-size-width', '--styles-size-color'],
                },
              },
            },
          },
        },
      ],
      errors: [{ messageId: 'unsupportedFunctionStyle' }],
    },
    {
      filename,
      code: `import { helper } from './theme';\n<div classStyle={styles.card} data-value={helper} />;`,
      options: [
        {
          modules: {
            [filename]: { source: './Card.module.css', binding: 'styles' },
          },
          themes: { [THEME]: ['theme'] },
        },
      ],
      output: `import { helper } from './theme';\n<div className={styles.card} data-value={helper} />;`,
      errors: 1,
    },
    {
      filename,
      code: `import { 'theme-token' as token } from './theme';\n<div classStyle={styles.card} />;`,
      options: [
        {
          modules: {
            [filename]: { source: './Card.module.css', binding: 'styles' },
          },
          themes: { [THEME]: ['theme-token'] },
        },
      ],
      output: `\n<div className={styles.card} />;`,
      errors: 2,
    },
    {
      filename,
      code: `import { duration } from './animation';\n<div classStyle={styles.card} data-value={duration} />;`,
      options: [
        {
          modules: {
            [filename]: { source: './Card.module.css', binding: 'styles' },
          },
          animations: { [ANIMATION]: ['fade'] },
        },
      ],
      output: `import { duration } from './animation';\n<div className={styles.card} data-value={duration} />;`,
      errors: 1,
    },
    {
      filename,
      code: `import * as css from '@plumeria/core';\nconst styles = css['create']({ card: { color: 'red' } });`,
      options,
      output: `\nimport styles from './Card.module.css';`,
      errors: 2,
    },
    {
      filename: CONSUMER,
      code: `import { styles as cardStyles } from './Card';\n<div classStyle={cardStyles.card} />;`,
      options,
      output: `import { styles as cardStyles } from './Card';\n<div className={cardStyles.card} />;`,
      errors: 1,
    },
    {
      filename: CONSUMER,
      code: `import { 'styles' as cardStyles } from './Card';\n<div classStyle={cardStyles.card} />;`,
      options,
      output: `import { 'styles' as cardStyles } from './Card';\n<div className={cardStyles.card} />;`,
      errors: 1,
    },
    {
      filename: CONSUMER,
      code: `import cardStyles from './Card';\n<div classStyle={styles.card} />;`,
      options,
      output: `import cardStyles from './Card';\n<div className={styles.card} />;`,
      errors: 1,
    },
    {
      filename: ANIMATION,
      code: `import * as css from '@plumeria/core';\nexport const fade = css.keyframes({ from: { opacity: 0 } });\nexport const transition = css.viewTransition({ old: { animationName: fade } });`,
      options: [
        {
          modules: {},
          animations: {
            [ANIMATION]: ['fade', 'transition'],
          },
        },
      ],
      output: `\n\n`,
      errors: 3,
    },
    {
      filename: ANIMATION,
      code: `import * as css from '@plumeria/core';\nconst fade = css.keyframes({ from: { opacity: 0 } });`,
      options: [
        {
          modules: {},
          animations: { [ANIMATION]: ['fade'] },
        },
      ],
      output: `\n`,
      errors: 2,
    },
    {
      filename,
      code: `import { fade } from './animation';\n<div classStyle={styles.card} />;`,
      options: [
        {
          modules: {
            [filename]: { source: './Card.module.css', binding: 'styles' },
          },
          animations: { [ANIMATION]: ['fade'] },
        },
      ],
      output: `\n<div className={styles.card} />;`,
      errors: 2,
    },
    {
      filename,
      code: `import defaults, { fade, duration as ms } from './animation';\n<div classStyle={styles.card} data-duration={ms} />;`,
      options: [
        {
          modules: {
            [filename]: { source: './Card.module.css', binding: 'styles' },
          },
          animations: { [ANIMATION]: ['fade'] },
        },
      ],
      output: `import defaults, { duration as ms } from './animation';\n<div className={styles.card} data-duration={ms} />;`,
      errors: 2,
    },
    {
      filename,
      code: `import defaults, { fade } from './animation';\n<div classStyle={styles.card} data-default={defaults} />;`,
      options: [
        {
          modules: {
            [filename]: { source: './Card.module.css', binding: 'styles' },
          },
          animations: { [ANIMATION]: ['fade'] },
        },
      ],
      output: `import defaults from './animation';\n<div className={styles.card} data-default={defaults} />;`,
      errors: 2,
    },
    {
      filename,
      code: `import { theme, helper } from './theme';\n<div classStyle={styles.card} data-value={helper} />;`,
      options: [
        {
          modules: {
            [filename]: { source: './Card.module.css', binding: 'styles' },
          },
          themes: { [THEME]: ['theme'] },
        },
      ],
      output: `import { helper } from './theme';\n<div className={styles.card} data-value={helper} />;`,
      errors: 2,
    },
    {
      filename: THEME,
      code: `import * as css from '@plumeria/core';\nexport const theme = css.createTheme('.dark', { text: { default: 'black', theme: 'white' } });`,
      options: [
        {
          modules: {},
          themes: { [THEME]: ['theme'] },
        },
      ],
      output: `\n`,
      errors: 2,
    },
    {
      filename,
      code: `import { theme } from './theme';\n<div classStyle={styles.card} />;`,
      options: [
        {
          modules: {
            [filename]: { source: './Card.module.css', binding: 'styles' },
          },
          themes: { [THEME]: ['theme'] },
        },
      ],
      output: `\n<div className={styles.card} />;`,
      errors: 2,
    },
    {
      filename,
      code: `import * as css from '@plumeria/core';\nconst unrelated = 1;\nexport const styles = css.create({ card: { color: 'red' } });\n<div classStyle={styles.card} />;`,
      options,
      output: `\nconst unrelated = 1;\nimport styles from './Card.module.css';\nexport { styles };\n<div className={styles.card} />;`,
      errors: 3,
    },
    {
      filename,
      code: `import * as css from '@plumeria/core';\nexport const breakpoints = css.createStatic({ tablet: '(width > 1px)' });\nconst styles = css.create({ card: { [\`@media \${breakpoints.tablet}\`]: { color: 'red' } } });`,
      options,
      output: `\n\nimport styles from './Card.module.css';`,
      errors: 3,
    },
    {
      filename,
      code: `<div classStyle={[styles.base, styles.card]} />;`,
      options,
      output: '<div className={`${styles.base} ${styles.card}`} />;',
      errors: 2,
    },
    {
      filename,
      code: `<div classStyle={[styles.base, active && styles.active]} />;`,
      options,
      output: `<div className={[styles.base, active && styles.active].filter(Boolean).join(' ')} />;`,
      errors: 2,
    },
    {
      filename,
      code: `<div classStyle={styles.size(width, color)} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              functions: {
                size: {
                  params: ['width', 'color'],
                  variables: ['--styles-size-width', '--styles-size-color'],
                },
              },
            },
          },
        },
      ],
      output: `<div className={styles.size} style={{ '--styles-size-width': width, '--styles-size-color': color }} />;`,
      errors: 1,
    },
    {
      filename,
      code: `<div classStyle={styles['size'](width, color)} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              functions: {
                size: {
                  params: ['width', 'color'],
                  variables: ['--styles-size-width', '--styles-size-color'],
                },
              },
            },
          },
        },
      ],
      output: `<div className={styles.size} style={{ '--styles-size-width': width, '--styles-size-color': color }} />;`,
      errors: 1,
    },
    {
      filename,
      code: `<div classStyle={styles.size(width, color)} style={{ display: 'block' }} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              functions: {
                size: {
                  params: ['width', 'color'],
                  variables: ['--styles-size-width', '--styles-size-color'],
                },
              },
            },
          },
        },
      ],
      output: `<div className={styles.size} style={{ ...{ display: 'block' }, '--styles-size-width': width, '--styles-size-color': color }} />;`,
      errors: 1,
    },
    {
      filename,
      code: `<div classStyle={[styles.base, styles.size(width, color)]} style={style} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              functions: {
                size: {
                  params: ['width', 'color'],
                  variables: ['--styles-size-width', '--styles-size-color'],
                },
              },
            },
          },
        },
      ],
      output: `<div className={\`\${styles.base} \${styles.size}\`} style={{ ...(style), '--styles-size-width': width, '--styles-size-color': color }} />;`,
      errors: 1,
    },
    {
      filename,
      code: `<div classStyle={[]} />;`,
      options,
      output: `<div className={[]} />;`,
      errors: 1,
    },
  ],
});
