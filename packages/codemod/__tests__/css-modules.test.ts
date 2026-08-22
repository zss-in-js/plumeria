import postcss from 'postcss';
import { rankOf } from '../src/cascade';
import {
  convertStylesheet,
  toKey,
  toProperty,
  toValue,
} from '../src/transforms/css-modules';

describe('convertStylesheet', () => {
  it('converts a CSS class name to its style key', () => {
    expect(toKey('card-title')).toBe('cardTitle');
  });
  it('converts a flat class', () => {
    const { code, names } = convertStylesheet(
      '.card { padding: 16px; color: red }',
    );
    expect(code).toContain('card: {');
    expect(code).toContain('padding: 16,');
    expect(code).toContain("color: 'red',");
    expect(names).toEqual({ card: 'card' });
  });

  it('camel-cases the class name and the property', () => {
    const { code, names } = convertStylesheet(
      '.card-title { font-size: 12px }',
    );
    expect(code).toContain('cardTitle: {');
    expect(code).toContain('fontSize: 12,');
    expect(names).toEqual({ 'card-title': 'cardTitle' });
  });

  it('normalises vendor, custom, numeric, and unit values', () => {
    expect(toProperty('-webkit-line-clamp')).toBe('WebkitLineClamp');
    expect(toProperty('--card-gap')).toBe('--card-gap');
    expect(toValue('-1.5px')).toBe(-1.5);
    expect(toValue('.5')).toBe(0.5);
    expect(toValue('calc(1px + 2px)')).toBe('calc(1px + 2px)');

    const { code } = convertStylesheet(
      '.card { --card-gap: 2px; -webkit-line-clamp: 2 }',
    );
    expect(code).toContain("'--card-gap': 2,");
    expect(code).toContain('WebkitLineClamp: 2,');
  });

  it('nests a pseudo-class and an at-rule', () => {
    const { code } = convertStylesheet(`
.card:hover { color: teal }
@media (min-width: 600px) { .card { padding: 24px } }
`);
    expect(code).toContain("':hover': {");
    expect(code).toContain("'@media (min-width: 600px)': {");
  });

  it('reuses a nested node for declarations split across rules', () => {
    const { code } = convertStylesheet(
      '.card:hover { color: teal } .card:hover { padding: 2px }',
    );
    expect(code.match(/':hover': \{/g)).toHaveLength(1);
    expect(code).toContain('padding: 2,');
  });

  it('pairs a descendant selector into marker and extended', () => {
    const { code } = convertStylesheet(
      '.card { padding: 1px } .card .title { color: red }',
    );
    expect(code).toContain("...css.marker('card', ':defined'),");
    expect(code).toContain("[css.extended('card', ':defined')]: {");
  });

  it('shares one marker between two descendants of the same class', () => {
    const { code } = convertStylesheet(
      '.card .a { color: red } .card .b { color: blue }',
    );
    expect(code.match(/css\.marker\('card', ':defined'\)/g)).toHaveLength(1);
  });

  it('carries the ancestor pseudo into the marker', () => {
    const { code } = convertStylesheet('.card:hover .title { color: red }');
    expect(code).toContain("...css.marker('card', ':hover'),");
    expect(code).toContain("[css.extended('card', ':hover')]: {");
  });

  it('records composes for the call site', () => {
    const { code, composes } = convertStylesheet(
      '.base { font-size: 12px } .card { composes: base; padding: 1px }',
    );
    expect(composes).toEqual({ card: ['base'] });
    expect(code).not.toContain('composes');
  });

  // An ordinal counts children of the parent; the combinator reads the one
  // element before. They only agree where every sibling carries the class,
  // which is a fact about the markup and not about the stylesheet.
  it.each(['.item + .item', '.item ~ .item', '.icon + .label', '.card + h2'])(
    'reports the sibling combinator in %s',
    (selector) => {
      const { reports } = convertStylesheet(`${selector} { margin: 1px }`);
      expect(reports).toHaveLength(1);
      expect(reports[0].kind).toBe('sibling-combinator');
      expect(reports[0].line).toBe(1);
    },
  );

  it('gates each marker of a chain by the marker above it', () => {
    const { code, reports } = convertStylesheet(
      '.card .body .note { color: red }',
    );
    expect(reports).toHaveLength(0);
    // `body` only signals inside a `card`, so a `.note` under a bare `.body`
    // stays untouched.
    expect(code).toContain("...css.marker('card', ':defined'),");
    expect(code).toContain("[css.extended('card', ':defined')]: {");
    expect(code).toContain("...css.marker('body', ':defined'),");
    expect(code).toContain("[css.extended('body', ':defined')]: {");
  });

  it('gives a bare tag a key of its own under the class that reached it', () => {
    const { code, tags, reports } = convertStylesheet(
      '.card { padding: 1px } .card h2 { font-size: 20px }',
    );
    expect(reports).toHaveLength(0);
    expect(tags).toEqual([
      { key: 'cardH2', tag: 'h2', under: 'card', direct: false, order: 0 },
    ]);
    expect(code).toContain('cardH2: {');
    expect(code).toContain("[css.extended('card', ':defined')]: {");
  });

  it('marks a child combinator so the consumer reaches one level only', () => {
    const { tags } = convertStylesheet('.panel > h2 { color: red }');
    expect(tags).toEqual([
      {
        key: 'panelChildH2',
        tag: 'h2',
        under: 'panel',
        direct: true,
        order: 0,
      },
    ]);
  });

  it('keeps a child and a descendant rule on separate keys', () => {
    // One key would let whichever relation was read first decide for both:
    // either the nested `h2` gains the child rule or it loses the other.
    const { code, tags } = convertStylesheet(
      '.card h2 { color: red } .card > h2 { font-weight: bold }',
    );
    expect(tags.map((t) => t.key)).toEqual(['cardH2', 'cardChildH2']);
    expect(code).toContain('cardH2: {');
    expect(code).toContain('cardChildH2: {');
  });

  it('keeps a class off names when no rule wrote a key for it', () => {
    // `.card.active` writes `active`; nothing was written for `card`, so a
    // consumer reading it has nothing faithful to be pointed at.
    const { names } = convertStylesheet('.card.active { color: red }');
    expect(names).toEqual({ active: 'active' });
  });

  it('keeps a compound class on names when a rule of its own wrote one', () => {
    const { names } = convertStylesheet(
      '.card { padding: 1px } .card.active { color: red }',
    );
    expect(names).toEqual({ card: 'card', active: 'active' });
  });

  it('reports a class name a synthetic tag key collides with', () => {
    const { reports, unconvertible } = convertStylesheet(
      '.card h2 { color: red } .card-h2 { color: blue }',
    );
    expect(reports.map((r) => r.kind)).toContain('key-collision');
    expect(unconvertible).toContain('card-h2');
  });

  it('leaves a tag with no class above it alone', () => {
    const { reports, tags } = convertStylesheet('h2 { font-size: 20px }');
    expect(tags).toEqual([]);
    expect(reports[0].kind).toBe('unsupported-selector');
  });

  it('names the classes a refused rule leaves nothing faithful for', () => {
    const { unconvertible } = convertStylesheet(
      '.item { padding: 1px } .item + .item { margin: 1px } .card { color: red }',
    );
    // `item` keeps a key, but a rule naming it was refused, so a consumer
    // reading it would silently lose that rule.
    expect(unconvertible).toEqual(['item']);
  });

  it('names a class whose only refusal is a declaration', () => {
    const { unconvertible } = convertStylesheet(
      ".title { composes: base from './shared.module.css'; color: red }",
    );
    expect(unconvertible).toEqual(['title']);
  });

  it('leaves a clean stylesheet with nothing unconvertible', () => {
    const { unconvertible } = convertStylesheet('.card { padding: 1px }');
    expect(unconvertible).toEqual([]);
  });

  it('records where each key was last written', () => {
    const { order } = convertStylesheet(
      '.a { color: red } .b { color: blue } .c { color: teal }',
    );
    expect(order).toEqual({ a: 0, b: 1, c: 2 });
  });

  it('moves a class written again later to its last place', () => {
    const { order } = convertStylesheet(
      '.a { color: red } .b { color: blue } .a { padding: 1px }',
    );
    expect(order.a).toBeGreaterThan(order.b);
  });

  it('reports a class written on both sides of one it shares a property with', () => {
    const { reports, unconvertible } = convertStylesheet(
      '.a { color: red } .b { color: blue } .a { padding: 1px }',
    );
    expect(reports.map((r) => r.kind)).toContain('split-order');
    expect(unconvertible.sort()).toEqual(['a', 'b']);
  });

  it('says nothing where the split classes share no property', () => {
    const { reports } = convertStylesheet(
      '.a { color: red } .b { margin: 1px } .a { padding: 1px }',
    );
    expect(reports).toHaveLength(0);
  });

  it('says nothing where the property meets under another at-rule', () => {
    const { reports } = convertStylesheet(
      '.a { color: red } @media print { .b { color: blue } } .a { padding: 1px }',
    );
    expect(reports).toHaveLength(0);
  });

  it('records what each key writes and where', () => {
    const { held } = convertStylesheet(
      '@media print { .a { color: black } } .b:hover { padding: 1px }',
    );
    expect(held).toEqual({
      a: [
        {
          property: 'color',
          suffix: '',
          rank: rankOf('color', true),
          place: 0,
        },
      ],
      b: [
        {
          property: 'padding',
          suffix: ':hover',
          rank: rankOf('padding', false),
          place: 1,
        },
      ],
    });
  });

  // One key holds both declarations, so there is no array to settle them with.
  it.each([
    [
      'a conditional rule',
      '@media print { .a { color: black } } .a { color: blue }',
    ],
    ['a longhand', '.a { padding-top: 1px; padding: 2px }'],
  ])(
    'reports a declaration outranked by one written before it: %s',
    (_l, css) => {
      const { reports, unconvertible } = convertStylesheet(css);
      expect(reports.map((r) => r.kind)).toContain('rank-order');
      expect(unconvertible).toEqual(['a']);
    },
  );

  it('names the two declarations rather than guessing at a cause', () => {
    const { reports } = convertStylesheet(
      '.a { padding-top: 1px; padding: 2px }',
    );
    const found = reports.find((r) => r.kind === 'rank-order');
    expect(found?.hint).toContain('`padding` after `padding-top`');
    // There is no at-rule here, so the hint may not name one.
    expect(found?.hint).not.toContain('at-rule is one step up');
  });

  it('names the at-rule where that is what raised the rank', () => {
    const { reports } = convertStylesheet(
      '@media print { .a { color: black } } .a { color: blue }',
    );
    const found = reports.find((r) => r.kind === 'rank-order');
    expect(found?.hint).toContain('an at-rule is one step up');
    expect(found?.hint).not.toContain('`color` after `color`');
  });

  it('says nothing when that key writes the plain rule first', () => {
    const { reports } = convertStylesheet(
      '.a { color: blue } @media print { .a { color: black } }',
    );
    expect(reports).toHaveLength(0);
  });

  // Two classes are the call site's business: they only settle anything where
  // one element carries both, which the stylesheet cannot see.
  it('says nothing about two classes, whatever their at-rules', () => {
    const { reports } = convertStylesheet(
      '@media print { .a { color: black } } .b { color: blue }',
    );
    expect(reports).toHaveLength(0);
  });

  it('wraps an attribute selector into a selector key', () => {
    const { code, reports } = convertStylesheet(
      ".card[data-open='true'] { display: block }",
    );
    expect(reports).toHaveLength(0);
    expect(code).toContain('\':is([data-open="true"])\': {');
  });

  it('keeps a global ancestor as a selector key on the target', () => {
    const { code, reports } = convertStylesheet(
      ':global(.dark) .card { background: black }',
    );
    expect(reports).toHaveLength(0);
    expect(code).toContain("':is(.dark *)': {");
  });

  it('rides a compound class on the one written last', () => {
    const { code, reports } = convertStylesheet(
      '.card { padding: 1px } .card.active { color: red }',
    );
    expect(reports).toHaveLength(0);
    // The call site already writes both, so `active` carries the pair.
    expect(code).toContain('active: {');
    expect(code).toContain("color: 'red',");
  });

  it.each([
    ['#card', 'Only a local class'],
    [':hover', 'Only a local class'],
  ])('reports unsupported selector %s', (selector, hint) => {
    const { reports } = convertStylesheet(`${selector} { color: red }`);
    expect(reports).toEqual([
      expect.objectContaining({
        kind: 'unsupported-selector',
        source: selector,
        hint: expect.stringContaining(hint),
      }),
    ]);
  });

  it('reads a custom property nothing declares back as a function style', () => {
    const { code, functions } = convertStylesheet(
      `.size {\n  width: var(--styles-size-width);\n  color: var(--styles-size-tone);\n}\n`,
    );

    // The variable names the key and the parameter, and the shorthand form is
    // used where the property and the parameter agree.
    expect(functions).toEqual({
      size: ['--styles-size-width', '--styles-size-tone'],
    });
    expect(code).toContain(
      'size: (width: string | number, tone: string | number) => ({',
    );
    expect(code).toContain('width,');
    expect(code).toContain('color: tone,');
  });

  it('names one parameter once when two properties read it', () => {
    const { code, functions } = convertStylesheet(
      `.size {\n  width: var(--styles-size-span);\n}\n@media (min-width: 600px) {\n  .size {\n    height: var(--styles-size-span);\n  }\n}\n`,
    );

    expect(functions).toEqual({ size: ['--styles-size-span'] });
    expect(code).toContain('size: (span: string | number) => ({');
    expect(code).toContain('width: span,');
    expect(code).toContain('height: span,');
  });

  it('leaves a var() the sheet declares or a hash names as a value', () => {
    const { code, functions } = convertStylesheet(
      `.root {\n  --styles-root-gap: 4px;\n}\n.size {\n  gap: var(--styles-root-gap);\n  color: var(--x5w827vw-size-tone);\n}\n`,
    );

    expect(functions).toEqual({});
    expect(code).toContain("gap: 'var(--styles-root-gap)'");
    expect(code).toContain("color: 'var(--x5w827vw-size-tone)'");
  });

  it('ignores non-declaration children in a local rule', () => {
    const { code } = convertStylesheet(
      '.card { color: red; @media (width > 1px) { color: blue } }',
    );
    expect(code).toContain("color: 'red',");
  });

  it('reports :global and composes from another file', () => {
    const { reports } = convertStylesheet(`
:global(.theme) .card { color: red }
.card { composes: base from './shared.css' }
`);
    expect(reports.map((r) => r.kind).sort()).toEqual(['composes-external']);
  });

  it('reports a key collision', () => {
    const { reports } = convertStylesheet(
      '.card-title { color: red } .cardTitle { color: blue }',
    );
    expect(reports.some((r) => r.kind === 'key-collision')).toBe(true);
  });

  it('handles a parser AST without locations or regex class matches', () => {
    const rule = (selector: string) => ({
      type: 'rule',
      selector,
      selectors: [selector],
      parent: undefined,
      each: (visit: (child: unknown) => void) =>
        visit({ type: 'decl', prop: 'color', value: 'red' }),
    });
    const rules = [rule('.card-title'), rule('.cardTitle'), rule('.orphan')];
    const parse = jest.spyOn(postcss, 'parse').mockReturnValue({
      walkRules: (visit: (item: unknown) => void) => rules.forEach(visit),
      walkDecls: () => undefined,
    } as never);
    const originalMatch = String.prototype.match;
    const match = jest
      .spyOn(String.prototype, 'match')
      .mockImplementation(function (
        this: string,
        pattern: Parameters<string['match']>[0],
      ) {
        return this.toString() === '.orphan'
          ? null
          : originalMatch.call(this, pattern);
      });

    try {
      const { code, reports } = convertStylesheet('ignored by the parser mock');
      expect(code).toContain('orphan: {');
      expect(reports[0]).toEqual(
        expect.objectContaining({ line: 0, column: 0, kind: 'key-collision' }),
      );
    } finally {
      match.mockRestore();
      parse.mockRestore();
    }
  });
});
