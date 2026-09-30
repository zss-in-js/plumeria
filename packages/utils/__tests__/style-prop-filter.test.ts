import { needsCompile, usesStyleProp } from '../src/stylePropFilter';

const uses = (source: string, filePath = 'App.tsx') =>
  usesStyleProp(source, 'sx', filePath);

describe('usesStyleProp', () => {
  it('filters file extensions and sources without an attribute candidate', () => {
    expect(uses('<div sx={a} />', 'App.ts')).toBe(false);
    expect(uses('<div sx={a} />', 'App.mts')).toBe(false);
    expect(usesStyleProp('<div sx={a} />', '', 'App.tsx')).toBe(false);
    expect(uses('<div />')).toBe(false);
    expect(uses('<div prefixsx={a} />')).toBe(false);
    expect(uses('<div sx />')).toBe(false);
    expect(uses('<div sx /* comment */ = // comment\n {a} />')).toBe(true);
    expect(uses('<div sx /*')).toBe(false);
    expect(uses('<div sx //')).toBe(false);
  });

  it.each([
    '<div sx={a} />',
    '<div /* comment */ sx={a} />',
    '<div // comment\n sx={a} />',
    '<div title="escaped \\" quote" sx={a} />',
    "<div title='escaped \\' quote' sx={a} />",
    '<div>{value}<span sx={a} /></div>',
    '<div>text<span sx={a} /></div>',
    '<><div sx={a} /></>',
    '<div><span /></div>; <p sx={a} />',
    '<div>{<span sx={a} />}</div>',
    '<div prop={{ nested: true }} sx={a} />',
  ])('finds an attribute through JSX syntax in %s', (source) => {
    expect(uses(source)).toBe(true);
  });

  it.each([
    '/* comment */ <div sx={a} />',
    '// comment\n<div sx={a} />',
    "'string'; <div sx={a} />",
    '"string"; <div sx={a} />',
    '`template`; <div sx={a} />',
    '`escaped \\` template`; <div sx={a} />',
    '`template ${value}`; <div sx={a} />',
    '`template ${first} between ${second}`; <div sx={a} />',
    '`template ${`nested ${value}`} tail`; <div sx={a} />',
    '/regexp/.test(value); <div sx={a} />',
    '/escaped\\//.test(value); <div sx={a} />',
    '/[a/]/.test(value); <div sx={a} />',
    'return /regexp/; <div sx={a} />',
    'yield /regexp/; <div sx={a} />',
    'default: /regexp/; <div sx={a} />',
    'else /regexp/; <div sx={a} />',
    'case /regexp/: <div sx={a} />',
    'await /regexp/; <div sx={a} />',
    'do /regexp/; <div sx={a} />',
    'typeof /regexp/; <div sx={a} />',
    'void /regexp/; <div sx={a} />',
    'value in /regexp/; <div sx={a} />',
    'value of /regexp/; <div sx={a} />',
    'new /regexp/; <div sx={a} />',
    'delete /regexp/; <div sx={a} />',
    'throw /regexp/; <div sx={a} />',
    'fn(.../regexp/); <div sx={a} />',
    'value++ / divisor; <div sx={a} />',
    'value-- / divisor; <div sx={a} />',
    '{ value }; <div sx={a} />',
    '<1; <div sx={a} />',
  ])('scans JavaScript preceding JSX in %s', (source) => {
    expect(uses(source)).toBe(true);
  });

  it('returns according to incomplete constructs before a later candidate', () => {
    expect(uses('// no newline sx ={a}')).toBe(false);
    expect(uses('/* unterminated sx ={a}')).toBe(true);
    expect(uses("'unterminated\n sx ={a}")).toBe(true);
    expect(uses("'unterminated sx ={a}")).toBe(true);
    expect(uses('`unterminated sx ={a}')).toBe(true);
    expect(uses('`interpolation ${value} unterminated sx ={a}')).toBe(true);
    expect(uses('} sx ={a}')).toBe(true);
    expect(uses('/unterminated\n sx ={a}')).toBe(true);
    expect(uses('<div /* unterminated sx ={a}')).toBe(true);
    expect(uses('<div // unterminated sx ={a}')).toBe(true);
    expect(uses('<div title="unterminated sx ={a}')).toBe(true);
    expect(uses('<div></div sx ={a}')).toBe(true);
  });

  it('ignores candidates skipped as non-code', () => {
    expect(uses("'sx={a}'")).toBe(false);
    expect(uses('"sx={a}"')).toBe(false);
    expect(uses('`sx={a}`')).toBe(false);
    expect(uses('// sx={a}')).toBe(false);
  });
});

describe('needsCompile', () => {
  it('accepts either a core import or a style prop', () => {
    expect(needsCompile("import '@plumeria/core';", 'sx', 'App.tsx')).toBe(
      true,
    );
    expect(needsCompile('<div sx={a} />', 'sx', 'App.tsx')).toBe(true);
    expect(needsCompile('<div />', 'sx', 'App.tsx')).toBe(false);
  });
});
