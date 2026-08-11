import postcss from 'postcss';
import {
  convertStylesheet,
  toProperty,
  toValue,
} from '../src/transforms/css-modules';

describe('convertStylesheet', () => {
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

  it('reports a sibling combinator', () => {
    const { reports } = convertStylesheet('.item + .item { margin: 1px }');
    expect(reports).toHaveLength(1);
    expect(reports[0].kind).toBe('sibling-combinator');
    expect(reports[0].line).toBe(1);
  });

  it.each([
    ['.card.active', 'Two classes on one element'],
    ['.card .body .title', 'Only one level of nesting'],
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
    expect(reports.map((r) => r.kind).sort()).toEqual([
      'composes-external',
      'global',
    ]);
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
