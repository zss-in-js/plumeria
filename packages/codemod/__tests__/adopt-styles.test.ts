import { Linter, RuleTester } from 'eslint';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as tsParser from '@typescript-eslint/parser';
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
      output: `import * as css from '@plumeria/core';\nimport { styles } from './Card.styles';\nconst dynamic = styles[key];\nconst nested = css.use(styles.card).value;\n<div x:className={css.use(styles.card)} />;\n<div classStyle={styles[key]} />;`,
      errors: 6,
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
      // a template literal is the other shape a composition arrives in
      code: `import s from './Card.module.css';\n<div className={\`\${s.base} \${s['card-title']}\`} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={[styles.base, styles.cardTitle]} />;`,
      errors: 5,
    },
    {
      // a key the call site computes has no name in the stylesheet to spell
      code: `import s from './Card.module.css';\n<div className={[s.base, s[key]].join(' ')} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={[styles.base, styles[key]]} />;`,
      errors: 5,
    },
    {
      // a name the stylesheet never declared keeps the spelling it was given
      code: `import s from './Card.module.css';\n<div className={[s.base, s.unknown].join(' ')} />;`,
      options,
      output: `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={[styles.base, styles.unknown]} />;`,
      errors: 5,
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
  const settle = (
    code: string,
    modules: Record<string, unknown>,
    filename?: string,
  ) =>
    new Linter().verifyAndFix(
      code,
      {
        languageOptions: {
          parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
        },
        plugins: { codemod: { rules: { 'adopt-styles': adoptStyles } } },
        rules: { 'codemod/adopt-styles': ['error', { modules }] },
      },
      filename,
    ).output;

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

  it('carries a tag rule onto the markup it can see', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={s.card}><h2>t</h2></div>;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { card: 'card' },
            tags: [{ key: 'cardH2', tag: 'h2', under: 'card' }],
          },
        },
      ),
    ).toContain('<h2 classStyle={styles.cardH2}>');
  });

  it('merges a tag rule to the left of the class already there', () => {
    // `.list > li` is the weaker of the two in CSS, so the class has to win.
    expect(
      settle(
        `import s from './Card.module.css';\n<ul className={s.list}><li className={s.item}>a</li></ul>;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { list: 'list', item: 'item' },
            tags: [{ key: 'listLi', tag: 'li', under: 'list' }],
          },
        },
      ),
    ).toContain('<li classStyle={[styles.listLi, styles.item]}>');
  });

  it('carries two tag rules onto one element without repeating either', () => {
    const output = settle(
      `import c from './Card.module.css';\nimport p from './Panel.module.css';\n<div className={c.card}><div className={p.panel}><h2>t</h2></div></div>;`,
      {
        './Card.module.css': {
          source: './Card.styles',
          names: { card: 'card' },
          tags: [{ key: 'cardH2', tag: 'h2', under: 'card' }],
        },
        './Panel.module.css': {
          source: './Panel.styles',
          names: { panel: 'panel' },
          tags: [{ key: 'panelH2', tag: 'h2', under: 'panel' }],
        },
      },
    );
    expect(output.match(/cardH2/g)).toHaveLength(1);
    expect(output.match(/panelH2/g)).toHaveLength(1);
  });

  it('reaches one level only for a child combinator', () => {
    const output = settle(
      `import s from './Card.module.css';\n<div className={s.card}><h2>a</h2><section><h2>b</h2></section></div>;`,
      {
        './Card.module.css': {
          source: './Card.styles',
          names: { card: 'card' },
          tags: [{ key: 'cardH2', tag: 'h2', under: 'card', direct: true }],
        },
      },
    );
    expect(output.match(/cardH2/g)).toHaveLength(1);
    expect(output).toContain('<h2 classStyle={styles.cardH2}>a</h2>');
    expect(output).toContain('<h2>b</h2>');
  });

  it('carries tag rules in the order the stylesheet wrote them', () => {
    // Equal specificity in CSS, so the later rule wins; the merge reads the
    // rightmost entry, which is where the later rule has to land.
    const output = settle(
      `import s from './Card.module.css';\n<div className={s.card}><h2>a</h2></div>;`,
      {
        './Card.module.css': {
          source: './Card.styles',
          names: { card: 'card' },
          tags: [
            { key: 'cardH2', tag: 'h2', under: 'card' },
            { key: 'cardChildH2', tag: 'h2', under: 'card', direct: true },
          ],
        },
      },
    );
    expect(output).toContain('[styles.cardH2, styles.cardChildH2]');
  });

  it.each([
    ['an empty array', '{[]}', '[styles.cardH2]'],
    ['an array of holes', '{[, ,]}', '[styles.cardH2]'],
    [
      'an array holding a style',
      '{[styles.own]}',
      '[styles.cardH2, styles.own]',
    ],
    [
      'a sparse array holding a style',
      '{[, styles.own]}',
      '[, styles.cardH2, styles.own]',
    ],
    ['a trailing hole', '{[styles.own, ,]}', '[styles.cardH2, styles.own, ,]'],
    ['a bare style', '{styles.own}', '[styles.cardH2, styles.own]'],
  ])('writes a tag rule into %s', (_label, held, expected) => {
    // Nothing to sit against — empty, or holes only — means the array itself
    // is written; anything else is inserted around what is there. A hole has
    // no text to read, so it never reaches `getText`.
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={s.card}><h2 classStyle=${held}>t</h2></div>;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { card: 'card', own: 'own' },
            tags: [{ key: 'cardH2', tag: 'h2', under: 'card' }],
          },
        },
      ),
    ).toContain(`classStyle={${expected}}`);
  });

  it('writes a class list in stylesheet order, not the order it was written', () => {
    // A class list carries no order in CSS, so the array cannot take one from it.
    expect(
      settle(
        "import s from './Card.module.css';\n<div className={`${s.b} ${s.a}`} />;",
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { a: 'a', b: 'b' },
            order: { a: 0, b: 1 },
          },
        },
      ),
    ).toContain('classStyle={[styles.a, styles.b]}');
  });

  it('expands composes in stylesheet order', () => {
    // `.card { composes: base }` with `.base` written after it: the composed
    // class is the later of the two, so it is the one that wins.
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={s.card} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { card: 'card', base: 'base' },
            composes: { card: ['base'] },
            order: { card: 0, base: 1 },
          },
        },
      ),
    ).toContain('classStyle={[styles.card, styles.base]}');
  });

  it('expands composes the other way when the composed class is first', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={s.card} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { card: 'card', base: 'base' },
            composes: { card: ['base'] },
            order: { base: 0, card: 1 },
          },
        },
      ),
    ).toContain('classStyle={[styles.base, styles.card]}');
  });

  it('keeps two stylesheets apart when they share a basename', () => {
    // Both maps say `./Card.styles`; only the map itself tells them apart.
    // Each module is already in order, so any reordering here is the two
    // being sorted as one.
    const directory = fs.mkdtempSync(path.join(process.cwd(), '.same-name-'));
    const one = path.join(directory, 'one');
    const two = path.join(directory, 'two');
    fs.mkdirSync(one);
    fs.mkdirSync(two);
    fs.writeFileSync(path.join(one, 'Card.module.css'), '');
    fs.writeFileSync(path.join(two, 'Card.module.css'), '');
    try {
      expect(
        settle(
          "import a from './one/Card.module.css';\nimport b from './two/Card.module.css';\n<div className={`${a.x} ${b.p} ${a.y} ${b.q}`} />;",
          {
            [path.join(one, 'Card.module.css')]: {
              source: './Card.styles',
              names: { x: 'x', y: 'y' },
              order: { x: 2, y: 3 },
            },
            [path.join(two, 'Card.module.css')]: {
              source: './Card.styles',
              names: { p: 'p', q: 'q' },
              order: { p: 0, q: 1 },
            },
          },
          path.join(directory, 'Two.js'),
        ),
      ).toContain('[a.x, b.p, a.y, b.q]');
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('leaves two stylesheets in the order the file wrote them', () => {
    // Which of two stylesheets the bundler puts first is not a fact this file
    // holds, so the reads keep the slots they were given.
    expect(
      settle(
        "import a from './A.module.css';\nimport b from './B.module.css';\n<div className={`${b.one} ${a.two}`} />;",
        {
          './A.module.css': {
            source: './A.styles',
            names: { two: 'two' },
            order: { two: 0 },
          },
          './B.module.css': {
            source: './B.styles',
            names: { one: 'one' },
            order: { one: 0 },
          },
        },
      ),
    ).toContain('classStyle={[b.one, a.two]}');
  });

  it('leaves a tag it cannot see in this file alone', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={s.card}>{children}</div>;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { card: 'card' },
            tags: [{ key: 'cardH2', tag: 'h2', under: 'card' }],
          },
        },
      ),
    ).not.toContain('cardH2');
  });

  // The read is reported and left alone; the CLI reads the stylesheet out of
  // the message and drops the whole module before the pass that fixes.
  const messagesFor = (code: string, modules: Record<string, unknown>) =>
    new Linter().verify(code, {
      languageOptions: {
        parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
      },
      plugins: { codemod: { rules: { 'adopt-styles': adoptStyles } } },
      rules: { 'codemod/adopt-styles': ['error', { modules }] },
    });

  it.each([
    ['a class a refused rule named', ['card'], { card: 'card' }],
    ['a class with no generated key at all', [], {}],
  ])('reports %s', (_label, unconvertible, names) => {
    const found = messagesFor(
      `import s from './Card.module.css';\n<div className={s.card} />;`,
      {
        './Card.module.css': {
          source: './Card.styles',
          stylesheet: '/abs/Card.module.css',
          names,
          unconvertible,
        },
      },
    ).filter((m) => m.messageId === 'missing');
    expect(found).toHaveLength(1);
    expect(found[0].message).toBe('/abs/Card.module.css :: card');
  });

  it('says nothing where every class converted', () => {
    expect(
      messagesFor(
        `import s from './Card.module.css';\n<div className={s.card} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            stylesheet: '/abs/Card.module.css',
            names: { card: 'card' },
            unconvertible: [],
          },
        },
      ).filter((m) => m.messageId === 'missing'),
    ).toHaveLength(0);
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

  it('rewrites several stylesheet bindings without reusing styles', () => {
    expect(
      settle(
        `import first from './First.module.css';\nimport second from './Second.module.css';\n<div className={[first.base, second.base].join(' ')} />;`,
        {
          './First.module.css': {
            source: './First.styles',
            names: { base: 'base' },
          },
          './Second.module.css': {
            source: './Second.styles',
            names: { base: 'base' },
          },
        },
      ),
    ).toBe(
      `import '@plumeria/core';\nimport { styles as first } from './First.styles';\nimport { styles as second } from './Second.styles';\n<div classStyle={[first.base, second.base]} />;`,
    );
  });

  it('uses the generated target relative to an absolute consumer', () => {
    const filename = path.join(process.cwd(), 'packages/codemod/pages/Card.js');
    const modules = {
      '../styles/Card.module.css': {
        source: './Card.styles',
        target: path.join(process.cwd(), 'packages/codemod/generated/Card.ts'),
        names: { base: 'base' },
      },
    };
    const output = new Linter().verifyAndFix(
      `import card from '../styles/Card.module.css';\n<div className={card.base} />;`,
      {
        files: ['**/*.js'],
        languageOptions: {
          parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
        },
        plugins: { codemod: { rules: { 'adopt-styles': adoptStyles } } },
        rules: { 'codemod/adopt-styles': ['error', { modules }] },
      },
      { filename },
    ).output;

    expect(output).toBe(
      `import '@plumeria/core';\nimport { styles } from '../generated/Card';\n<div classStyle={styles.base} />;`,
    );
  });

  it('prefers a resolved stylesheet and prefixes a sibling target', () => {
    const directory = fs.mkdtempSync(
      path.join(process.cwd(), '.adopt-styles-'),
    );
    const filename = path.join(directory, 'Consumer.js');
    const stylesheet = path.join(directory, 'Card.module.css');
    const target = path.join(directory, 'Card.styles.ts');
    fs.writeFileSync(stylesheet, '');
    try {
      const output = new Linter().verifyAndFix(
        `import card from './Card.module.css';\n<div className={card.base} />;`,
        {
          files: ['**/*.js'],
          languageOptions: {
            parserOptions: {
              ecmaFeatures: { jsx: true },
              sourceType: 'module',
            },
          },
          plugins: { codemod: { rules: { 'adopt-styles': adoptStyles } } },
          rules: {
            'codemod/adopt-styles': [
              'error',
              {
                modules: {
                  [stylesheet]: {
                    source: './ignored',
                    target,
                    names: { base: 'base' },
                  },
                },
              },
            ],
          },
        },
        { filename },
      ).output;
      expect(output).toContain("from './Card.styles'");
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('reads TypeScript string imports and asserted custom-property keys', () => {
    const code = `import { 'css' as core } from '@plumeria/core';\nimport { 'styles' as card } from './Card.styles';\n<div classStyle={card.size} style={{ ['--size' as string]: width }} />;`;
    const output = new Linter().verifyAndFix(code, {
      languageOptions: {
        parser: tsParser,
        parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
      },
      plugins: { codemod: { rules: { 'adopt-styles': adoptStyles } } },
      rules: {
        'codemod/adopt-styles': [
          'error',
          {
            modules: {
              './Card.module.css': {
                source: './Card.styles',
                names: { size: 'size' },
                functions: { size: ['--size'] },
              },
            },
          },
        ],
      },
    }).output;
    expect(output).toContain('width');
  });

  it('keeps unused custom properties and rewrites every callable array item', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={[on && s.size, s.missing, other].filter(Boolean).join(' ')} style={{ ['--size']: width, ['--kept']: color }} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { size: 'size', missing: 'missing' },
            functions: { size: ['--size'], missing: ['--absent'] },
          },
        },
      ),
    ).toBe(
      `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div className={[other].filter(Boolean).join(' ')} classStyle={[on && styles.size(width), styles.missing]} style={{ ['--kept']: color }} />;`,
    );
  });

  it('keeps non-string computed properties beside a function argument', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={s.size} style={{ ['--size']: width, [1]: other }} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { size: 'size' },
            functions: { size: ['--size'] },
          },
        },
      ),
    ).toBe(
      `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={styles.size(width)} style={{ [1]: other }} />;`,
    );
  });

  it('turns a computed adopted style into a function call', () => {
    expect(
      settle(
        `import { styles } from './Card.styles';\n<div classStyle={styles['size']} style={{ ['--size']: width }} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { size: 'size' },
            functions: { size: ['--size'] },
          },
        },
      ),
    ).toBe(
      `import { styles } from './Card.styles';\n<div classStyle={styles.size(width)} />;`,
    );
  });

  it('leaves dynamic and undeclared reads beside a callable style', () => {
    expect(
      settle(
        `import s from './Card.module.css';\n<div className={[s[key], s.unknown, s.size].filter(Boolean).join(' ')} style={{ ['--size']: width }} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { size: 'size' },
            functions: { size: ['--size'] },
          },
        },
      ),
    ).toBe(
      `import '@plumeria/core';\nimport { styles } from './Card.styles';\n<div classStyle={[styles[key], styles.unknown, styles.size(width)]} />;`,
    );
  });

  it('recognizes an already adopted named styles import', () => {
    expect(
      settle(
        `import { styles as card } from './Card.styles';\n<div className={card.base} />;`,
        {
          './Card.module.css': {
            source: './Card.styles',
            names: { base: 'base' },
          },
        },
      ),
    ).toBe(
      `import { styles as card } from './Card.styles';\n<div classStyle={card.base} />;`,
    );
  });

  it.each([
    `import { css as core } from '@plumeria/core';\nimport s from './Card.module.css';\ncore.use(s.card);`,
    "import s from './Card.module.css';\n<div className={`${s.base}-${s.card}`} />;",
    `import s from './Card.module.css';\n<div className={[s.base, null, s.card].join(' ')} />;`,
    `import s from './Card.module.css';\n<div className={[s.base, s.card].filter(Boolean).join(',')} />;`,
    `import s from './Card.module.css';\n<div className={[s.base, get().card].join(' ')} />;`,
    `import s from './Card.module.css';\n<div className={values.join(' ')} />;`,
    `import defaultCore from '@plumeria/core';\nimport s from './Card.module.css';\n<div className={s.card} />;`,
    `import { value } from './Card.styles';\n<div className={value} />;`,
    `class styles {}\nimport s from './Card.module.css';\n<div className={s.card} />;`,
    `import s from './Card.module.css';\n<div classStyle="card" style={{ plain: value, ...rest }} />;`,
    `import s from './Card.module.css';\n<div className={s.size} style={{ ['--size']: width, plain: value, ...rest }} />;`,
    `import s from './Card.module.css';\n<div className={[s.size, on && other.value]} style={{ ['--size']: width }} />;`,
    `import s from './Card.module.css';\n<div className={s['size']} style={{ ['--size']: width }} />;`,
    `import s from './Card.module.css';\n<div className={s[key]} style={{ ['--size']: width }} />;`,
    `import s from './Card.module.css';\n<div className={[s[key], s.size]} style={{ ['--size']: width, [key]: value, [1]: other }} />;`,
    `import s from './Card.module.css';\n<div className />;`,
    `import s from './Card.module.css';\n<div className="card" />;`,
    `import s from './Card.module.css';\n<div ns:className={s.card} />;`,
    `import s from './Card.module.css';\n<div className={other.card} />;`,
  ])('handles a boundary consumer without crashing: %s', (code) => {
    expect(() =>
      settle(code, {
        './Card.module.css': {
          source: './Card.styles',
          names: { base: 'base', card: 'card', size: 'size' },
          composes: { card: [], size: ['base'] },
          functions: { size: ['--size'] },
        },
      }),
    ).not.toThrow();
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
