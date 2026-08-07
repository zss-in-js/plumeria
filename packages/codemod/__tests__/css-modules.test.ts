import { convertStylesheet } from '../src/transforms/css-modules';

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

  it('nests a pseudo-class and an at-rule', () => {
    const { code } = convertStylesheet(`
.card:hover { color: teal }
@media (min-width: 600px) { .card { padding: 24px } }
`);
    expect(code).toContain("':hover': {");
    expect(code).toContain("'@media (min-width: 600px)': {");
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
});
