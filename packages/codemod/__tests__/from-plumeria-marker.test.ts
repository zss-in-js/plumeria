import { convertPlumeriaModule } from '../src/transforms/from-plumeria';

const convert = (body: string) =>
  convertPlumeriaModule(
    `import * as css from '@plumeria/core';\nconst styles = css.create(${body});`,
  )!;

describe('css.marker and css.extended', () => {
  it('turns a marker spread into a custom property on the pseudo', () => {
    const converted = convert(
      `{ grand: { color: 'red', ...css.marker('grand', ':hover') } }`,
    );

    expect(converted.reports).toEqual([]);
    expect(converted.css).toContain('.grand {\n  color: red;\n}');
    expect(converted.css).toMatch(
      /\.grand:hover \{\n {2}--[a-z\d]{8}-grand-hover: 1;\n\}/,
    );
  });

  it('turns an extended key into a style container query', () => {
    const converted = convert(
      `{ child: { [css.extended('grand', ':hover')]: { color: 'blue' } } }`,
    );

    expect(converted.reports).toEqual([]);
    expect(converted.css).toMatch(
      /@container style\(--[a-z\d]{8}-grand-hover: 1\) \{\n {2}\.child \{\n {4}color: blue;\n {2}\}\n\}/,
    );
  });

  it('names the same variable on both sides of the pair', () => {
    const converted = convert(
      `{
        grand: { ...css.marker('grand', ':hover') },
        child: { [css.extended('grand', ':hover')]: { color: 'blue' } },
      }`,
    );

    expect(converted.reports).toEqual([]);
    const declared = converted.css.match(/(--[a-z\d]{8}-grand-hover): 1;/)![1];
    expect(converted.css).toContain(`@container style(${declared}: 1)`);
  });

  it('keeps the two ids apart', () => {
    const converted = convert(
      `{
        grand: { ...css.marker('grand', ':hover') },
        parent: { ...css.marker('parent', ':hover') },
      }`,
    );

    const variables = converted.css.match(/--[a-z\d]{8}-\w+-hover/g)!;
    expect(new Set(variables).size).toBe(2);
  });

  it('still reports a spread it cannot expand', () => {
    const converted = convert(`{ card: { ...base, color: 'red' } }`);

    expect(converted.reports.map((report) => report.kind)).toEqual([
      'spread-style',
    ]);
  });

  it('still reports a marker whose arguments are not static', () => {
    const converted = convert(
      `{ card: { ...css.marker(id, ':hover'), color: 'red' } }`,
    );

    expect(converted.reports.map((report) => report.kind)).toEqual([
      'spread-style',
    ]);
  });
});
