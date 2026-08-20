import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Linter, RuleTester } from 'eslint';
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
      code: `import { styles } from './Card';\n<div classStyle={styles.card} />;`,
      options,
      output: `import { styles } from './Card';\n<div className={styles.card} />;`,
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
      output: `\nimport styles from './Card.module.css';\nexport { styles };\nconst unrelated = 1;\n<div className={styles.card} />;`,
      errors: 3,
    },
    {
      filename,
      code: `import * as css from '@plumeria/core';\nexport const breakpoints = css.createStatic({ tablet: '(width > 1px)' });\nconst styles = css.create({ card: { [\`@media \${breakpoints.tablet}\`]: { color: 'red' } } });`,
      options,
      output: `\n\nconst styles = css.create({ card: { [\`@media \${breakpoints.tablet}\`]: { color: 'red' } } });`,
      errors: 3,
    },
    {
      filename,
      // a branch resolves when both of its sides name a released style
      code: `<div classStyle={[styles.base, on ? styles.card : styles.badge]} />;`,
      options,
      output: `<div className={[styles.base, on ? styles.card : styles.badge].filter(Boolean).join(' ')} />;`,
      errors: 2,
    },
    {
      filename,
      // a local holding a released style is a class name at the call site
      code: `const held = styles.card;\n<div classStyle={held} />;`,
      options,
      output: `const held = styles.card;\n<div className={held} />;`,
      errors: 1,
    },
    {
      filename,
      // an existing className keeps its own value and takes the styles beside it
      code: `<div className={outer} classStyle={styles.card} />;`,
      options,
      output: `<div className={[outer, styles.card].filter(Boolean).join(' ')} />;`,
      errors: 1,
    },
    {
      filename,
      // a token read after its definition is gone becomes the value it had
      code: `import { theme } from './theme';\n<div classStyle={styles.card} title={theme.text} />;`,
      options: [
        { ...options[0], values: { [THEME]: { theme: { text: 'var(--x)' } } } },
      ],
      output: `import { theme } from './theme';\n<div className={styles.card} title={'var(--x)'} />;`,
      errors: 2,
    },
    {
      filename,
      // an animation name is a plain string once it is written globally
      code: `import { fade } from './animation';\n<div classStyle={styles.card} data-name={fade} />;`,
      options: [{ ...options[0], values: { [ANIMATION]: { fade: 'kf-abc' } } }],
      output: `import { fade } from './animation';\n<div className={styles.card} data-name={'kf-abc'} />;`,
      errors: 2,
    },
    {
      filename,
      // a slot the stylesheet cannot rank carries its override alongside it
      code: `<div classStyle={[styles.base, on && styles.card]} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              target: path.join(PROJECT, 'Card.module.css'),
              overrides: { 'base|card': { 1: 'cardOverBase' } },
            },
          },
        },
      ],
      output: `<div className={[styles.base, on && styles.card, on && styles.cardOverBase].filter(Boolean).join(' ')} />;`,
      errors: 2,
    },
    {
      filename,
      // a composition the plan folded reads as the one class it became
      code: `<div classStyle={[styles.base, styles.card]} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              target: path.join(PROJECT, 'Card.module.css'),
              merges: {
                [`${path.join(PROJECT, 'Card.module.css')}#base|${path.join(PROJECT, 'Card.module.css')}#card`]:
                  'baseCard',
              },
            },
          },
        },
      ],
      output: `<div className={styles.baseCard} />;`,
      errors: 2,
    },
    {
      filename,
      // a folded composition beside a className of its own keeps both
      code: `<div className={outer} classStyle={[styles.base, styles.card]} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              target: path.join(PROJECT, 'Card.module.css'),
              merges: {
                [`${path.join(PROJECT, 'Card.module.css')}#base|${path.join(PROJECT, 'Card.module.css')}#card`]:
                  'baseCard',
              },
            },
          },
        },
      ],
      output: `<div className={[outer, styles.baseCard].filter(Boolean).join(' ')} />;`,
      errors: 1,
    },
    {
      filename,
      // `css.use` names a class, and after the export it is that class
      code: `import * as css from '@plumeria/core';\n<Link name={css.use(styles.card)} />;`,
      options,
      output: `\n<Link name={styles.card} />;`,
      errors: 2,
    },
    {
      filename,
      // several arguments join, and a condition adds the filter. The import
      // outlives this pass: a conditional argument reads as a use `css` still
      // has work for, and the next pass finds the call already rewritten.
      code: `import * as css from '@plumeria/core';\n<Link name={css.use(styles.base, on && styles.card)} />;`,
      options,
      output: `import * as css from '@plumeria/core';\n<Link name={[styles.base, on && styles.card].filter(Boolean).join(' ')} />;`,
      errors: 1,
    },
    {
      filename,
      // a constant that only ever named a style key has nothing left to name
      code: `const size = 'card';\n<div classStyle={[styles.base, styles[size]]} />;`,
      options: [{ ...options[0], constants: { [filename]: { size: 'card' } } }],
      output: `<div className={[styles.base, styles.card].join(' ')} />;`,
      errors: 3,
    },
    {
      filename,
      // a constant read for something else as well outlives the fold
      code: `const size = 'card';\n<div classStyle={[styles.base, styles[size]]} data-size={size} />;`,
      options: [{ ...options[0], constants: { [filename]: { size: 'card' } } }],
      output: `const size = 'card';\n<div className={[styles.base, styles.card].join(' ')} data-size={size} />;`,
      errors: 2,
    },
    {
      filename,
      // a lone key named by a constant folds the same as one inside an array.
      // Retiring the import without folding it leaves the key unbound.
      code: `import { size } from './tokens';\n<div classStyle={styles[size]} />;`,
      options: [{ ...options[0], constants: { [filename]: { size: 'card' } } }],
      output: `\n<div className={styles.card} />;`,
      errors: 3,
    },
    {
      filename,
      // the same fold, carried into the className the element already had
      code: `import { size } from './tokens';\n<div className={cn} classStyle={styles[size]} />;`,
      options: [{ ...options[0], constants: { [filename]: { size: 'card' } } }],
      output: `\n<div className={[cn, styles.card].filter(Boolean).join(' ')} />;`,
      errors: 2,
    },
    {
      filename,
      // an imported constant that only ever named a key goes with the fold,
      // and the one still doing work beside it stays
      code: `import { size, gap } from './tokens';\n<div classStyle={[styles.base, styles[size]]} data-gap={gap} />;`,
      options: [
        {
          ...options[0],
          constants: { [filename]: { size: 'card', gap: 'lg' } },
        },
      ],
      output: `import { gap } from './tokens';\n<div className={[styles.base, styles.card].join(' ')} data-gap={gap} />;`,
      errors: 3,
    },
    {
      filename,
      // nothing is left to import once the only binding it carried is folded,
      // and the import beside it is not disturbed
      code: `import { size } from './tokens';\nimport { useState } from 'react';\n<div classStyle={[styles.base, styles[size]]} onClick={useState} />;`,
      options: [{ ...options[0], constants: { [filename]: { size: 'card' } } }],
      output: `import { useState } from 'react';\n<div className={[styles.base, styles.card].join(' ')} onClick={useState} />;`,
      errors: 3,
    },
    {
      filename,
      // a complete plan turns the type that described a style into a string
      code: `const Logo = ({ art }: { art: css.Style }) => <div classStyle={art} />;`,
      options: [{ ...options[0], complete: true }],
      output: `const Logo = ({ art }: { art: string }) => <div className={art} />;`,
      errors: 2,
    },
    {
      filename,
      // a joined composition beside a className of its own keeps both
      code: `<div className={outer} classStyle={[styles.base, on && styles.card]} />;`,
      options,
      output: `<div className={[outer, [styles.base, on && styles.card].filter(Boolean).join(' ')].filter(Boolean).join(' ')} />;`,
      errors: 1,
    },
    {
      filename,
      // a file with only theme work still retires the import that fed it
      code: `import * as css from '@plumeria/core';\nexport const theme = css.createTheme('.dark', { text: { default: 'black', theme: 'white' } });`,
      options: [
        { modules: {}, themes: { [filename]: ['theme'] }, active: true },
      ],
      output: `\n`,
      errors: 2,
    },
    {
      filename: CONSUMER,
      // a core import a released module leaves nothing for is retired
      code: `import '@plumeria/core';\nimport { styles } from './Other';\n<div classStyle={styles.card} />;`,
      options: [
        {
          modules: {
            [OTHER]: { source: './Card.module.css', binding: 'styles' },
          },
        },
      ],
      output: `import { styles } from './Other';\n<div className={styles.card} />;`,
      errors: 2,
    },
    {
      filename,
      // a call that is not a definition leaves the file alone
      code: `import * as css from '@plumeria/core';\nconst held = css.use(styles.card);\n<div classStyle={styles.card} />;`,
      options,
      output: `\nconst held = styles.card;\n<div className={styles.card} />;`,
      errors: 3,
    },
    {
      filename,
      // a call on something other than the core namespace is left alone
      code: `import * as css from '@plumeria/core';\n<div classStyle={styles.card} title={other.use(styles.base)} />;`,
      options,
      output: `\n<div className={styles.card} title={other.use(styles.base)} />;`,
      errors: 2,
    },
    {
      filename,
      // `css.use` on something that names no released style stays put
      code: `import * as css from '@plumeria/core';\n<div classStyle={styles.card} title={css.use(unknown)} />;`,
      options,
      output: `import * as css from '@plumeria/core';\n<div className={styles.card} title={css.use(unknown)} />;`,
      errors: 1,
    },
    {
      filename,
      // a second create folded into the same module leaves nothing behind
      code: `import * as css from '@plumeria/core';\nconst styles = css.create({ card: { color: 'red' } });\nconst extra = css.create({ badge: { color: 'blue' } });\n<div classStyle={extra.badge} />;`,
      options: [
        {
          modules: {
            [filename]: {
              source: './Card.module.css',
              binding: 'styles',
              aliases: { extra: { badge: 'badge' } },
            },
          },
        },
      ],
      output: `\nimport styles from './Card.module.css';\n<div className={styles.badge} />;`,
      errors: 5,
    },
    {
      filename,
      // a falsy literal stands in for a style that is simply absent
      code: `<div classStyle={[styles.base, false]} />;`,
      options,
      output: "<div className={[styles.base, false].join(' ')} />;",
      errors: 2,
    },
    {
      filename,
      // the core import goes once nothing but a released style still reads it
      code: `import * as css from '@plumeria/core';\n<div classStyle={css.use(styles.card)} />;`,
      options: [{ active: true, ...options[0] }],
      // the prop follows on the next pass, once the call has become the class
      output: `\n<div classStyle={styles.card} />;`,
      errors: 2,
    },
    {
      filename,
      code: `<div classStyle={[styles.base, styles.card]} />;`,
      options,
      output: "<div className={[styles.base, styles.card].join(' ')} />;",
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
      output: `<div className={styles.size} style={{ ['--styles-size-width' as string]: width, ['--styles-size-color' as string]: color }} />;`,
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
      output: `<div className={styles.size} style={{ ['--styles-size-width' as string]: width, ['--styles-size-color' as string]: color }} />;`,
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
      output: `<div className={styles.size} style={{ ...{ display: 'block' }, ['--styles-size-width' as string]: width, ['--styles-size-color' as string]: color }} />;`,
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
      output: `<div className={[styles.base, styles.size].join(' ')} style={{ ...(style), ['--styles-size-width' as string]: width, ['--styles-size-color' as string]: color }} />;`,
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

describe('release-styles boundary rewrites', () => {
  const boundaryFilename = path.join(
    process.cwd(),
    'packages/codemod/__tests__/Boundary.tsx',
  );
  const boundaryValues = path.join(
    process.cwd(),
    'packages/codemod/__tests__/Boundary.values.ts',
  );
  const boundaryStyles = path.join(
    process.cwd(),
    'packages/codemod/__tests__/Boundary.styles.ts',
  );
  const boundaryCss = path.join(
    process.cwd(),
    'packages/codemod/__tests__/Boundary.module.css',
  );
  beforeAll(() => {
    fs.writeFileSync(boundaryValues, '');
    fs.writeFileSync(boundaryStyles, '');
    fs.writeFileSync(boundaryCss, '');
  });
  afterAll(() => {
    fs.rmSync(boundaryValues, { force: true });
    fs.rmSync(boundaryStyles, { force: true });
    fs.rmSync(boundaryCss, { force: true });
  });
  const settle = (code: string, extra: Record<string, unknown> = {}) =>
    new Linter().verifyAndFix(
      code,
      {
        files: ['**/*.tsx'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
        },
        plugins: { codemod: { rules: { 'release-styles': releaseStyles } } },
        rules: {
          'codemod/release-styles': [
            'error',
            {
              modules: {
                [boundaryFilename]: {
                  source: './Card.module.css',
                  binding: 'styles',
                  aliases: { other: { card: 'other-card' } },
                  functions: {
                    size: {
                      params: ['width'],
                      variables: ['--size'],
                      lengths: [true],
                    },
                  },
                  merges: {},
                  overrides: {},
                },
              },
              ...extra,
            },
          ],
        },
      },
      { filename: boundaryFilename },
    ).output;

  it.each([
    `import css from '@plumeria/core';\nconst styles = css.create({ card: {} });`,
    `import { 'css' as core } from '@plumeria/core';\nconst styles = core['create']({ card: {} });`,
    `const styles = create({ card: {} });`,
    `const styles = css.create({ card: {} }), other = 1;`,
    `export const styles = css.create({ card: {} });`,
    `const key = 'card';\n<div classStyle={styles[key]} />;`,
    `const key = 'card';\n<div className="kept" classStyle={styles[key]} />;`,
    `const key = 'card';\n<div className={kept} classStyle />;`,
    `const key = 'card';\n<div className classStyle={styles.card} />;`,
    `<div classStyle={css.use()} />;`,
    `<div classStyle={css.use(styles.card, on && styles.size(2))} />;`,
    `<div classStyle={[styles.card, on ? styles.size(2) : styles.card]} style={{ color: 'red' }} />;`,
    `<div classStyle={[]} />;`,
    `<div ns:classStyle={styles.card} />;`,
    `type Value = css.Style;\nconst value: Value = styles.card;`,
    `type StyleValue = Style;\ntype OtherValue = Other;`,
    `const value = other[key];\nconst literal = other['card'];`,
    `const value = other[1];\nconst missing = other['missing'];`,
    `<div classStyle={on && unknown} />;`,
    `<div classStyle={on ? styles.card : unknown} />;`,
    `<div classStyle={css.use(styles.card, styles.size)} />;`,
    `<div classStyle={[styles.card, unknown]} />;`,
  ])('handles an ESTree boundary without crashing: %s', (code) => {
    expect(() => settle(code)).not.toThrow();
  });

  it('covers complete-mode type and inactive module boundaries', () => {
    expect(() =>
      settle(
        `import * as css from '@plumeria/core';\ntype A = Style;\ntype B = css.Style;\ntype C = Other;`,
        { modules: {}, complete: true },
      ),
    ).not.toThrow();
    expect(() =>
      settle(`import * as css from '@plumeria/core';\nconst value = 1;`, {
        modules: {},
      }),
    ).not.toThrow();
  });

  it('covers absent and conditional composition overrides', () => {
    const target = path.join(
      process.cwd(),
      'packages/codemod/__tests__/Boundary.module.css',
    );
    expect(() =>
      settle(`<div classStyle={[styles.card, styles.size]} />;`, {
        modules: {
          [boundaryFilename]: {
            source: './Boundary.module.css',
            target,
            binding: 'styles',
            functions: {},
            merges: {},
            overrides: {},
          },
        },
      }),
    ).not.toThrow();
    expect(() =>
      settle(`<div classStyle={[styles.card, on && styles.size]} />;`, {
        modules: {
          [boundaryFilename]: {
            source: './Boundary.module.css',
            target,
            binding: 'styles',
            functions: {},
            merges: {},
            overrides: {
              'card|size': { 1: 'sizeOverride' },
            },
          },
        },
      }),
    ).not.toThrow();
    expect(() =>
      settle(`<div classStyle={[styles.card, styles.size]} />;`, {
        modules: {
          [boundaryFilename]: {
            source: './Boundary.module.css',
            target,
            binding: 'styles',
            functions: {},
            merges: {},
            overrides: {
              'card|size': { 1: 'sizeOverride' },
            },
          },
        },
      }),
    ).not.toThrow();
  });

  it('inlines string, number, object, and missing imported values', () => {
    const values = {
      [boundaryValues]: {
        text: "a'b\\c",
        count: 2,
        nested: { card: 'token' },
      },
    };
    expect(() =>
      settle(
        `import { text, count, nested, absent } from './Boundary.values';
         export { count };
         const a = text;
         const b = count;
         const c = absent;
         const d = nested.card;
         const e = nested[key];
         const f = nested['missing'];
         const g = { text };
         const h = { [text]: true };`,
        { values },
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import { text } from './Boundary.values';
         const object = {};
         const a = object.text;
         const b = { text: 1 };
         const c = { [text]: 1 };`,
        { values },
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import value, { text } from './Boundary.values';\nconst a = text;`,
        {
          values,
        },
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import { 'text' as text, missing } from './Boundary.values';\nconst a = text;`,
        { values },
      ),
    ).not.toThrow();
  });

  it('covers definition-only imports with and without generated targets', () => {
    expect(() =>
      settle(
        `import { styles, value } from './Boundary.styles';\n<div classStyle={styles.card}>{value}</div>;`,
        {
          modules: {
            [boundaryStyles]: {
              source: './Boundary.module.css',
              binding: 'styles',
              definitionOnly: true,
            },
          },
        },
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import { styles } from './Boundary.styles';\n<div classStyle={styles.card} />;`,
        {
          modules: {
            [boundaryStyles]: {
              source: './Boundary.module.css',
              target: path.join(path.dirname(boundaryStyles), 'Generated.ts'),
              binding: 'styles',
              definitionOnly: true,
            },
          },
        },
      ),
    ).not.toThrow();
  });

  it('covers kept definitions and unsupported core reads', () => {
    expect(() =>
      settle(
        `import * as css from '@plumeria/core';
         const { card } = css.create({ card: {} });
         const other = css.create({ other: {} });
         css['unknown']();
         css[key]();`,
        {
          modules: {
            [boundaryFilename]: {
              source: './Boundary.module.css',
              binding: 'styles',
              definitionOnly: true,
            },
          },
        },
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import * as css from '@plumeria/core';
         css.unknown();
         css[key]();
         const first = css.createStatic({ key: 'card' });
         const { card } = css.create({ card: {} });
         const other = css.create({ other: {} });`,
      ),
    ).not.toThrow();
  });

  it('covers aliases, folded constants, and default CSS imports', () => {
    expect(settle(`const value = other.card;`)).toContain(
      "styles['other-card']",
    );
    expect(() =>
      settle(
        `export const other = css.create({ card: {} });
         const unrelated = css.create({ card: {} });`,
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `const value = styles[{}];
         const key = 'card';`,
        { constants: { [boundaryFilename]: { key: 'card' } } },
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import { 'key' as key } from './Boundary.values';
         const value = other[key];`,
        {
          values: { [boundaryValues]: { key: 'card' } },
          constants: { [boundaryFilename]: { key: 'card' } },
        },
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import styles from './Boundary.module.css';\n<div classStyle={styles.card} />;`,
        {
          modules: {
            [boundaryStyles]: {
              source: './Boundary.module.css',
              target: boundaryCss,
              binding: 'styles',
            },
          },
        },
      ),
    ).not.toThrow();
  });

  it('covers removal adjacency and nested final statements', () => {
    expect(() =>
      settle(
        `import * as css from '@plumeria/core';
         const styles = css.create({ card: {} });
         const { card } = css.create({ card: {} });`,
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import * as css from '@plumeria/core';
         const styles = css.create({ card: {} });
         const other = css.create({ card: {} });`,
      ),
    ).not.toThrow();
    expect(() =>
      settle(`function read() { styles[key]; const key = 'card'; }`, {
        constants: { [boundaryFilename]: { key: 'card' } },
      }),
    ).not.toThrow();
  });

  it('covers className without a value and verifies both override shapes', () => {
    expect(() =>
      settle(`<div className classStyle={styles.card} />;`),
    ).not.toThrow();
    const target = path.join(
      process.cwd(),
      'packages/codemod/__tests__/Boundary.module.css',
    );
    const modules = {
      [boundaryFilename]: {
        source: './Boundary.module.css',
        target,
        binding: 'styles',
        functions: {},
        merges: {},
        overrides: {
          'card|size': { 1: 'sizeOverride' },
        },
      },
    };
    expect(
      settle(`<div classStyle={[styles.card, styles.size]} />;`, { modules }),
    ).toContain('styles.sizeOverride');
    expect(
      settle(`<div classStyle={[styles.card, on && styles.size]} />;`, {
        modules,
      }),
    ).toContain('on && styles.sizeOverride');
    expect(
      settle(`<div className="kept" classStyle={styles.card} />;`),
    ).toContain('kept');
    expect(settle(`<div classStyle={styles['bad-key']} />;`)).toContain(
      "styles['bad-key']",
    );
  });

  it('covers removable import adjacency and static liveness', () => {
    const themes = { [boundaryValues]: ['theme'] };
    expect(() =>
      settle(
        `import { theme } from './Boundary.values';
         import * as css from '@plumeria/core';
         const value = 1;`,
        { themes },
      ),
    ).not.toThrow();
    expect(() =>
      settle(
        `import { theme } from './Boundary.values';
         import { 'theme' as otherTheme } from './Boundary.values';
         const value = 1;`,
        { themes },
      ),
    ).not.toThrow();
    expect(() =>
      settle(`import { theme } from './Boundary.values';\nconst value = 1;`, {
        themes,
        modules: {
          [boundaryFilename]: {
            source: './Boundary.module.css',
            binding: 'styles',
            definitionOnly: true,
          },
        },
      }),
    ).not.toThrow();
    expect(() =>
      settle(`import { key } from './Boundary.values';\nconst value = 1;`, {
        modules: {},
        active: true,
        statics: { [boundaryValues]: ['key'] },
      }),
    ).not.toThrow();
    expect(() =>
      settle(
        `import { key } from './Boundary.values';
         import * as css from '@plumeria/core';
         const styles = css.create({ card: { color: 'red' } });`,
        { statics: { [boundaryValues]: ['key'] } },
      ),
    ).not.toThrow();
  });

  it('covers independent dynamic core and alias keys', () => {
    expect(() =>
      settle(`import * as css from '@plumeria/core';\ncss[key]();`),
    ).not.toThrow();
    expect(() =>
      settle(`const key = 'card';\nconst value = other[key];`, {
        constants: { [boundaryFilename]: { key: 'card' } },
      }),
    ).not.toThrow();
    expect(() => settle(`const value = other[{}];`)).not.toThrow();
  });
});
