// Regression harness for bracket-notation lookup tables.
//
// The oracle is the specified behaviour, not a second reading of the compiler:
//
//   1. Entries apply in written order.
//   2. Only identical property names collide, with the last entry winning.
//      Shorthands and their longhands are distinct properties, so both remain
//      and zss-engine's specificity depth settles their partial overlap.
//   3. Nested blocks and at-rules merge by their own key, property by property.
//
// Every case runs over its whole input space, keys outside the table included,
// against the structural invariant that no style object survives into the
// output. Mirrors the unplugin harness of the same name: the two carry the same
// lookup-table logic and must stay in step.
jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import loader from '../src/index';
import { getStyleRecords, deepMerge } from '@plumeria/utils';
import { genBase36Hash } from 'zss-engine';

type Style = Record<string, any>;

// One definition, driving both the source and the oracle.
const DEFS: Record<string, Record<string, Style>> = {
  styles: {
    base: {
      display: 'inline-flex',
      borderRadius: '4px',
      backgroundColor: 'blue',
      color: 'white',
    },
    muted: { color: 'slategray' },
    wide: { width: '100%' },
  },
  // Touches nothing the base does -- an independent axis.
  sizeStyles: {
    small: { fontSize: '12px', padding: '4px 8px' },
    large: { fontSize: '18px', padding: '12px 24px' },
    huge: { fontSize: '24px', padding: '20px 40px' },
  },
  // Collides with the base on `color`.
  toneStyles: {
    brand: { color: 'royalblue' },
    danger: { color: 'crimson' },
  },
  // Key names holding the separator the compound key is joined with: unless
  // the parts are told apart, (a, b__c) and (a__b, c) read alike.
  sepStyles: {
    a: { color: 'darkred' },
    a__b: { color: 'darkblue' },
  },
  altSepStyles: {
    b__c: { color: 'darkgreen' },
    c: { color: 'darkgoldenrod' },
  },
  // Keys another object also has, to put two groups with overlapping keys in
  // the branches of one condition.
  dualStyles: {
    small: { letterSpacing: '1px' },
    large: { letterSpacing: '4px' },
  },
  altToneStyles: {
    brand: { color: 'seagreen' },
    danger: { color: 'darkorange' },
  },
  hoverStyles: {
    lift: { ':hover': { color: 'gold', transform: 'translateY(-1px)' } },
    sink: { ':hover': { color: 'olive' } },
  },
  mediaStyles: {
    narrow: { '@media (max-width: 600px)': { fontSize: '10px' } },
    roomy: { '@media (max-width: 600px)': { fontSize: '20px' } },
  },
  varStyles: {
    a: { '--gap': '2px' },
    b: { '--gap': '8px' },
  },
  // Longhand of the shorthand sizeStyles sets.
  padStyles: {
    tight: { paddingTop: '1px' },
    loose: { paddingTop: '9px' },
  },
  // Shorthand of the longhand the base sets.
  bgStyles: {
    plain: { background: 'red' },
    fancy: { background: 'green' },
  },
  // `dyn` is a function key, which a lookup table leaves out.
  fnStyles: {
    solid: { letterSpacing: '1px' },
  },
};

// A function key resolves to its body with the parameter replaced by a custom
// property, and the property is named after the hash of that body read against
// the parameter names. `dyn` touches nothing else; `tint` collides on `color`.
const FN_STYLES: Record<string, Style> = {
  dyn: {
    outlineColor: `var(--${genBase36Hash({ outlineColor: 'outline' }, 1, 8)}-outline)`,
  },
  tint: {
    color: `var(--${genBase36Hash({ color: 'tone' }, 1, 8)}-tone)`,
  },
};

const HEAD = [
  `import * as css from '@plumeria/core';`,
  ...Object.entries(DEFS)
    .filter(([name]) => name !== 'fnStyles')
    .map(
      ([name, obj]) => `const ${name} = css.create(${JSON.stringify(obj)});`,
    ),
  `const fnStyles = css.create({`,
  `  solid: ${JSON.stringify(DEFS.fnStyles.solid)},`,
  `  dyn: (outline: string) => ({ outlineColor: outline }),`,
  `  tint: (tone: string) => ({ color: tone }),`,
  `  named: ({ tone }: { tone: string }) => ({ color: tone }),`,
  `});`,
  '',
].join('\n');

const VARS = [
  'size',
  'size2',
  'tone',
  'tone2',
  'dk',
  't2',
  'hk',
  'mk',
  'vk',
  'pk',
  'bk',
  'fk',
  'uk',
  'sk',
  'ak',
  'a',
  'b',
  'c',
];

let fixtureCount = 0;

const compile = async (styleExpr: string) => {
  const source = `${HEAD}export const A = ({ ${VARS.join(', ')} }: any) => <div classStyle={${styleExpr}} />;\n`;
  const code = await new Promise<string>((resolve, reject) => {
    const ctx = {
      resourcePath: `${__dirname}/fixture-${fixtureCount++}.tsx`,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, source);
  });

  // A dynamic style function puts a `style` attribute after the class list.
  const dynamic = code.match(/className=\{([\s\S]*?)\}(?= style=| \/>)/);
  const literal = code.match(/className="([^"]*)"/);
  if (!dynamic && !literal) throw new Error(`no className in:\n${code}`);
  return dynamic ? dynamic[1] : JSON.stringify(literal![1]);
};

const norm = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).sort().join(' ');

const evaluate = (expr: string, vars: Record<string, unknown>) =>
  norm(
    new Function(...VARS, `return (${expr});`)(...VARS.map((n) => vars[n])) ??
      '',
  );

// ---------------------------------------------------------------------------
// Oracle
// ---------------------------------------------------------------------------

// The source expression as data the oracle can walk once per input.
type Entry =
  | { kind: 'style'; obj: string; key: string }
  | { kind: 'lookup'; obj: string; keyVar: string }
  | { kind: 'fn'; key: string }
  | { kind: 'and'; test: string; entry: Entry }
  | { kind: 'cond'; test: string; yes: Entry; no: Entry };

const s = (obj: string, key: string): Entry => ({ kind: 'style', obj, key });
const fn = (key: string): Entry => ({ kind: 'fn', key });
const at = (obj: string, keyVar: string): Entry => ({
  kind: 'lookup',
  obj,
  keyVar,
});
const and = (test: string, entry: Entry): Entry => ({
  kind: 'and',
  test,
  entry,
});
const cond = (test: string, yes: Entry, no: Entry): Entry => ({
  kind: 'cond',
  test,
  yes,
  no,
});

const resolve = (entry: Entry, vars: Record<string, any>): Style | null => {
  switch (entry.kind) {
    case 'style':
      return DEFS[entry.obj][entry.key] ?? null;
    case 'lookup':
      return DEFS[entry.obj][vars[entry.keyVar]] ?? null;
    case 'fn':
      return FN_STYLES[entry.key];
    case 'and':
      return vars[entry.test] ? resolve(entry.entry, vars) : null;
    case 'cond':
      return vars[entry.test]
        ? resolve(entry.yes, vars)
        : resolve(entry.no, vars);
  }
};

const expected = (entries: Entry[], vars: Record<string, any>) => {
  const units: Array<{ order: number; style: Style }> = [];

  entries.forEach((entry, order) => {
    const style = resolve(entry, vars);
    if (!style) return;
    units.push({ order, style });
  });

  // Rule 2: last writer of a given property name wins it.
  const winners: Style = {};
  units
    .sort((x, y) => x.order - y.order)
    .forEach(({ style }) => {
      for (const [key, value] of Object.entries(style)) {
        winners[key] =
          value && typeof value === 'object' && winners[key]
            ? deepMerge(winners[key], value)
            : value;
      }
    });

  // Each surviving property stands as its own atom.
  return norm(
    Object.entries(winners)
      .flatMap(([key, value]) =>
        getStyleRecords({ [key]: value }).map((r) => r.hash),
      )
      .join(' '),
  );
};

// ---------------------------------------------------------------------------

const SPACES: Record<string, unknown[]> = {
  size: ['small', 'large', 'huge'],
  size2: ['small', 'huge'],
  tone: ['brand', 'danger'],
  tone2: ['brand', 'danger'],
  dk: ['small', 'large'],
  t2: ['brand', 'danger'],
  hk: ['lift', 'sink'],
  mk: ['narrow', 'roomy'],
  vk: ['a', 'b'],
  pk: ['tight', 'loose'],
  bk: ['plain', 'fancy'],
  // A function key and a key that is not in the object at all.
  fk: ['solid', 'dyn'],
  uk: ['small', 'nope'],
  sk: ['a', 'a__b'],
  ak: ['b__c', 'c'],
  a: [true, false],
  b: [true, false],
  c: [true, false],
};

const base = s('styles', 'base');
const muted = s('styles', 'muted');
const wide = s('styles', 'wide');

type Case = [label: string, source: string, entries: Entry[], vars: string[]];

const CASES: Case[] = [
  // -- one bracket beside the base, over every kind of property ------------
  [
    'disjoint axis',
    `[styles.base, sizeStyles[size]]`,
    [base, at('sizeStyles', 'size')],
    ['size'],
  ],
  [
    'colliding axis',
    `[styles.base, toneStyles[tone]]`,
    [base, at('toneStyles', 'tone')],
    ['tone'],
  ],
  [
    'nested block',
    `[styles.base, hoverStyles[hk]]`,
    [base, at('hoverStyles', 'hk')],
    ['hk'],
  ],
  [
    'at-rule',
    `[styles.base, mediaStyles[mk]]`,
    [base, at('mediaStyles', 'mk')],
    ['mk'],
  ],
  [
    'custom property',
    `[styles.base, varStyles[vk]]`,
    [base, at('varStyles', 'vk')],
    ['vk'],
  ],
  [
    'shorthand over the base longhand',
    `[styles.base, bgStyles[bk]]`,
    [base, at('bgStyles', 'bk')],
    ['bk'],
  ],
  [
    'longhand with no competing shorthand',
    `[styles.base, padStyles[pk]]`,
    [base, at('padStyles', 'pk')],
    ['pk'],
  ],
  [
    'function key in the object',
    `[styles.base, fnStyles[fk]]`,
    [base, at('fnStyles', 'fk')],
    ['fk'],
  ],
  [
    'bracket with no base',
    `sizeStyles[size]`,
    [at('sizeStyles', 'size')],
    ['size'],
  ],
  [
    'key outside the table',
    `[styles.base, sizeStyles[uk]]`,
    [base, at('sizeStyles', 'uk')],
    ['uk'],
  ],
  [
    'literal string key',
    `[styles.base, sizeStyles['small']]`,
    [base, s('sizeStyles', 'small')],
    [],
  ],

  // -- where the base sits -------------------------------------------------
  [
    'base after a disjoint bracket',
    `[sizeStyles[size], styles.base]`,
    [at('sizeStyles', 'size'), base],
    ['size'],
  ],
  [
    'base after a colliding bracket',
    `[toneStyles[tone], styles.base]`,
    [at('toneStyles', 'tone'), base],
    ['tone'],
  ],
  [
    'base between two brackets',
    `[toneStyles[tone], styles.base, sizeStyles[size]]`,
    [at('toneStyles', 'tone'), base, at('sizeStyles', 'size')],
    ['tone', 'size'],
  ],
  [
    'two statics then a bracket',
    `[styles.base, styles.wide, toneStyles[tone]]`,
    [base, wide, at('toneStyles', 'tone')],
    ['tone'],
  ],
  [
    'static after a bracket, colliding',
    `[styles.base, toneStyles[tone], styles.muted]`,
    [base, at('toneStyles', 'tone'), muted],
    ['tone'],
  ],
  [
    'static after a bracket, disjoint',
    `[styles.base, sizeStyles[size], styles.wide]`,
    [base, at('sizeStyles', 'size'), wide],
    ['size'],
  ],

  // -- conditions ----------------------------------------------------------
  [
    '&& over a disjoint bracket',
    `[styles.base, a && sizeStyles[size]]`,
    [base, and('a', at('sizeStyles', 'size'))],
    ['a', 'size'],
  ],
  [
    '&& over a colliding bracket',
    `[styles.base, a && toneStyles[tone]]`,
    [base, and('a', at('toneStyles', 'tone'))],
    ['a', 'tone'],
  ],
  [
    'chained &&',
    `[styles.base, a && (b && toneStyles[tone])]`,
    [base, and('a', and('b', at('toneStyles', 'tone')))],
    ['a', 'b', 'tone'],
  ],
  [
    'condition around the brackets',
    `[styles.base, a ? sizeStyles[size] : sizeStyles[size2]]`,
    [base, cond('a', at('sizeStyles', 'size'), at('sizeStyles', 'size2'))],
    ['a', 'size', 'size2'],
  ],
  [
    'condition inside the brackets',
    `[styles.base, sizeStyles[a ? size : size2]]`,
    [base, cond('a', at('sizeStyles', 'size'), at('sizeStyles', 'size2'))],
    ['a', 'size', 'size2'],
  ],
  [
    'condition reaching two objects',
    `[styles.base, a ? sizeStyles[size] : toneStyles[tone]]`,
    [base, cond('a', at('sizeStyles', 'size'), at('toneStyles', 'tone'))],
    ['a', 'size', 'tone'],
  ],
  [
    'condition between two literal keys',
    `[styles.base, a ? sizeStyles.large : sizeStyles.small]`,
    [base, cond('a', s('sizeStyles', 'large'), s('sizeStyles', 'small'))],
    ['a'],
  ],
  [
    'condition mixing a literal and a bracket',
    `[styles.base, a ? styles.muted : toneStyles[tone]]`,
    [base, cond('a', muted, at('toneStyles', 'tone'))],
    ['a', 'tone'],
  ],
  [
    'bracket nested two levels deep',
    `[styles.base, a ? (b ? sizeStyles[size] : sizeStyles.small) : toneStyles[tone]]`,
    [
      base,
      cond(
        'a',
        cond('b', at('sizeStyles', 'size'), s('sizeStyles', 'small')),
        at('toneStyles', 'tone'),
      ),
    ],
    ['a', 'b', 'size', 'tone'],
  ],
  [
    '&& nested inside a condition',
    `[styles.base, a ? (b && toneStyles[tone]) : styles.muted]`,
    [base, cond('a', and('b', at('toneStyles', 'tone')), muted)],
    ['a', 'b', 'tone'],
  ],
  [
    'condition over a key outside the table',
    `[styles.base, a && sizeStyles[uk]]`,
    [base, and('a', at('sizeStyles', 'uk'))],
    ['a', 'uk'],
  ],
  // Two dimensions whose key names hold the compound key's own separator.
  [
    'key names holding the join separator',
    `[sepStyles[sk], altSepStyles[ak]]`,
    [at('sepStyles', 'sk'), at('altSepStyles', 'ak')],
    ['sk', 'ak'],
  ],
  [
    'the same, with a base under them',
    `[styles.base, sepStyles[sk], altSepStyles[ak]]`,
    [base, at('sepStyles', 'sk'), at('altSepStyles', 'ak')],
    ['sk', 'ak'],
  ],
  [
    'a separator key beside a disjoint axis',
    `[styles.base, sepStyles[sk], sizeStyles[size]]`,
    [base, at('sepStyles', 'sk'), at('sizeStyles', 'size')],
    ['sk', 'size'],
  ],
  [
    'separator keys in the branches of one condition',
    `[styles.base, a ? sepStyles[sk] : altSepStyles[ak]]`,
    [base, cond('a', at('sepStyles', 'sk'), at('altSepStyles', 'ak'))],
    ['a', 'sk', 'ak'],
  ],
  // Only one branch ever applies, so a key the other branch would be read
  // with must not reach its style.
  [
    'branches sharing key names, both disjoint from the base',
    `[styles.base, a ? sizeStyles[size] : dualStyles[dk]]`,
    [base, cond('a', at('sizeStyles', 'size'), at('dualStyles', 'dk'))],
    ['a', 'size', 'dk'],
  ],
  [
    'branches sharing key names, both colliding with the base',
    `[styles.base, a ? toneStyles[tone] : altToneStyles[t2]]`,
    [base, cond('a', at('toneStyles', 'tone'), at('altToneStyles', 't2'))],
    ['a', 'tone', 't2'],
  ],
  // Same two objects, but as separate arguments rather than two branches.
  [
    'objects sharing key names as separate entries',
    `[styles.base, sizeStyles[size], dualStyles[dk]]`,
    [base, at('sizeStyles', 'size'), at('dualStyles', 'dk')],
    ['size', 'dk'],
  ],
  [
    'objects sharing key names as separate gated entries',
    `[styles.base, a && sizeStyles[size], b && dualStyles[dk]]`,
    [
      base,
      and('a', at('sizeStyles', 'size')),
      and('b', at('dualStyles', 'dk')),
    ],
    ['a', 'b', 'size', 'dk'],
  ],

  // -- the two orders create.mdx contrasts ---------------------------------
  [
    'bracket then a colliding condition',
    `[styles.base, toneStyles[tone], a && styles.muted]`,
    [base, at('toneStyles', 'tone'), and('a', muted)],
    ['tone', 'a'],
  ],
  [
    'colliding condition then the bracket',
    `[styles.base, a && styles.muted, toneStyles[tone]]`,
    [base, and('a', muted), at('toneStyles', 'tone')],
    ['tone', 'a'],
  ],

  // -- several axes at once ------------------------------------------------
  [
    'disjoint then colliding',
    `[styles.base, sizeStyles[size], toneStyles[tone]]`,
    [base, at('sizeStyles', 'size'), at('toneStyles', 'tone')],
    ['size', 'tone'],
  ],
  [
    'colliding then disjoint',
    `[styles.base, toneStyles[tone], sizeStyles[size]]`,
    [base, at('toneStyles', 'tone'), at('sizeStyles', 'size')],
    ['tone', 'size'],
  ],
  [
    'three brackets',
    `[styles.base, sizeStyles[size], toneStyles[tone], hoverStyles[hk]]`,
    [
      base,
      at('sizeStyles', 'size'),
      at('toneStyles', 'tone'),
      at('hoverStyles', 'hk'),
    ],
    ['size', 'tone', 'hk'],
  ],
  [
    'same object twice',
    `[styles.base, toneStyles[tone], toneStyles[tone2]]`,
    [base, at('toneStyles', 'tone'), at('toneStyles', 'tone2')],
    ['tone', 'tone2'],
  ],
  [
    'same object twice, disjoint from the base',
    `[styles.base, sizeStyles[size], sizeStyles[size2]]`,
    [base, at('sizeStyles', 'size'), at('sizeStyles', 'size2')],
    ['size', 'size2'],
  ],
  [
    'longhand bracket before a shorthand bracket',
    `[styles.base, padStyles[pk], sizeStyles[size]]`,
    [base, at('padStyles', 'pk'), at('sizeStyles', 'size')],
    ['pk', 'size'],
  ],
  [
    'shorthand bracket before a longhand bracket',
    `[styles.base, sizeStyles[size], padStyles[pk]]`,
    [base, at('sizeStyles', 'size'), at('padStyles', 'pk')],
    ['size', 'pk'],
  ],
  [
    'nested block beside a colliding condition',
    `[styles.base, hoverStyles[hk], a && styles.muted]`,
    [base, at('hoverStyles', 'hk'), and('a', muted)],
    ['hk', 'a'],
  ],
  [
    'at-rule beside a disjoint bracket',
    `[styles.base, mediaStyles[mk], sizeStyles[size]]`,
    [base, at('mediaStyles', 'mk'), at('sizeStyles', 'size')],
    ['mk', 'size'],
  ],
  [
    'custom property beside a colliding bracket',
    `[styles.base, varStyles[vk], toneStyles[tone]]`,
    [base, at('varStyles', 'vk'), at('toneStyles', 'tone')],
    ['vk', 'tone'],
  ],
  [
    'bracket, condition and static together',
    `[styles.base, sizeStyles[size], a && toneStyles[tone], styles.wide]`,
    [base, at('sizeStyles', 'size'), and('a', at('toneStyles', 'tone')), wide],
    ['size', 'a', 'tone'],
  ],
  // -- function keys, which carry a runtime value of their own -------------
  [
    'function key beside the base',
    `[styles.base, fnStyles.dyn(sk)]`,
    [base, fn('dyn')],
    ['sk'],
  ],
  [
    'function key colliding with the base',
    `[styles.base, fnStyles.tint(sk)]`,
    [base, fn('tint')],
    ['sk'],
  ],
  [
    'function key under a condition',
    `[styles.base, a && fnStyles.tint(sk)]`,
    [base, and('a', fn('tint'))],
    ['a', 'sk'],
  ],
  [
    'function key against a static in a ternary',
    `[styles.base, a ? fnStyles.tint(sk) : styles.muted]`,
    [base, cond('a', fn('tint'), muted)],
    ['a', 'sk'],
  ],
  [
    'function key in both branches of a ternary',
    `[styles.base, a ? fnStyles.tint(sk) : fnStyles.dyn(ak)]`,
    [base, cond('a', fn('tint'), fn('dyn'))],
    ['a', 'sk', 'ak'],
  ],
  [
    'function key beside a bracket and a condition',
    `[styles.base, sizeStyles[size], a && fnStyles.dyn(sk), b && styles.muted]`,
    [base, at('sizeStyles', 'size'), and('a', fn('dyn')), and('b', muted)],
    ['size', 'a', 'b'],
  ],
  // Naming the parameter by destructuring it is the same declaration, so it
  // lands on the same atom and the same custom property as `tint`.
  [
    'function key with named parameters',
    `[styles.base, fnStyles.named({ tone: sk })]`,
    [base, fn('tint')],
    ['sk'],
  ],
  [
    'every axis at once',
    `[styles.base, sizeStyles[size], toneStyles[tone], hoverStyles[hk], mediaStyles[mk], varStyles[vk]]`,
    [
      base,
      at('sizeStyles', 'size'),
      at('toneStyles', 'tone'),
      at('hoverStyles', 'hk'),
      at('mediaStyles', 'mk'),
      at('varStyles', 'vk'),
    ],
    ['size', 'tone', 'hk', 'mk', 'vk'],
  ],
];

const combosOf = (varNames: string[]) =>
  varNames.reduce<Array<Record<string, unknown>>>(
    (acc, name) =>
      acc.flatMap((v) =>
        SPACES[name].map((value) => ({ ...v, [name]: value })),
      ),
    [{}],
  );

describe.each(CASES)('%s', (_label, source, entries, varNames) => {
  it('produces the specified class list for every input', async () => {
    const expr = await compile(source);

    const mismatches = combosOf(varNames).flatMap((combo) => {
      const got = evaluate(expr, combo);
      const want = expected(entries, combo);
      return got === want ? [] : [{ combo, got, want }];
    });

    expect({ compiled: expr, mismatches }).toEqual({
      compiled: expr,
      mismatches: [],
    });
  });

  it('leaves nothing of the style objects behind', async () => {
    const expr = await compile(source);

    expect(Object.keys(DEFS).filter((name) => expr.includes(name))).toEqual([]);
  });
});
