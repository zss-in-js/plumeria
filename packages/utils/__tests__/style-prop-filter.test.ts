import { needsCompile, usesStyleProp } from '../src/stylePropFilter';

const uses = (source: string, styleProp = 'sx', filePath = 'App.tsx') =>
  usesStyleProp(source, styleProp, filePath);

describe('usesStyleProp: an attribute it has to find', () => {
  it.each([
    ['a plain attribute', '<div sx={a} />'],
    ['spaces around the equals sign', '<div sx = \n {a} />'],
    ['an apostrophe in JSX text', "<p>Don't <b sx={a} /> won't</p>"],
    ['a URL in JSX text', '<a>http://x <b sx={a} /></a>'],
    ['a regex before it', "const r = /'/; <div sx={a} />"],
    ['a regex with a slash in a class', "const r = /[/']/; <div sx={a} />"],
    ['divisions before it', 'const x = a / b; const y = c / d; <div sx={a} />'],
    ['JSX inside a template expression', 'const t = `${<div sx={a} />}`;'],
    ['a nested template before it', 'const t = `${`${x}`}`; <div sx={a} />'],
    ['a block comment before it', '/* sx={x} */ <div sx={a} />'],
    ['an escaped backtick in a template', 'const t = `\\``; <div sx={a} />'],
    ['an escaped slash in a regex', 'const r = /\\//; <div sx={a} />'],
    ['a division after an increment', 'const x = i++ / 2; <div sx={a} />'],
    ['a division after a decrement', 'const x = i-- / 2; <div sx={a} />'],
    ['a regex after a plus sign', "const x = a + /'/.source; <div sx={a} />"],
    [
      'a less-than sign that does not open a tag',
      'const x = y = < 3; <div sx={a} />',
    ],
    ['a string holding a brace', "const s = '{'; <div sx={a} />"],
    ['a string holding an escaped quote', "const s = 'it\\'s'; <div sx={a} />"],
    [
      'JSX returned from a function',
      "function A() { return <p>it's <b sx={a} /></p>; }",
    ],
    ['a fragment', "const A = () => <><p>'</p><b sx={a} /></>;"],
    [
      'a quote in an attribute string',
      `const A = () => <p title="it's"><b sx={a} /></p>;`,
    ],
    [
      'a string in a child expression',
      'const A = () => <p>{"}"}<b sx={a} /></p>;',
    ],
    [
      'a generic arrow in TSX',
      "const f = <T,>(x: T) => x; const s = 'a'; <b sx={a} />",
    ],
    ['a comparison before it', 'if (a < b) { const s = "x"; } <b sx={a} />'],
    [
      'a JSX branch of a ternary',
      "const A = ok ? <p>'</p> : null; <b sx={a} />",
    ],
    ['an attribute after an expression attribute', '<p a={{ b: 1 }} sx={a} />'],
    ['an attribute after a nested element', '<p><i /><b>x</b><b sx={a} /></p>'],
  ])('%s', (_, source) => {
    expect(uses(source)).toBe(true);
  });
});

describe('usesStyleProp: text that only looks like the attribute', () => {
  it.each([
    ['a line comment', '// <Box sx={a} />\nexport const x = 1;'],
    ['a JSDoc block', '/**\n * <Box sx={a} />\n */\nexport const x = 1;'],
    ['a string', "const s = '<Box sx={a} />';"],
    ['a double-quoted string', 'const s = "<Box sx={a} />";'],
    ['template text', 'const s = `<Box sx={a} />`;'],
    ['template text after an expression', 'const s = `${x}<Box sx={a} />`;'],
    ['a longer name', '<Box tsx={a} />'],
    ['a member assignment', 'box.sx = {};'],
    ['a value that is not an expression', '<Box sx="a" />'],
    ['a name without an equals sign', 'const sx = 1; sx + {};'],
    ['a line comment at the end', 'const x = 1; // sx={a}'],
    ['a regex holding the attribute', 'const r = /sx={a}/;'],
  ])('%s', (_, source) => {
    expect(uses(source)).toBe(false);
  });

  it('never looks for JSX in a TypeScript file', () => {
    expect(uses('<div sx={a} />', 'sx', 'styles.ts')).toBe(false);
    expect(uses('<div sx={a} />', 'sx', 'styles.mts')).toBe(false);
  });

  it('does nothing for an empty prop name', () => {
    expect(uses('<div sx={a} />', '')).toBe(false);
  });
});

describe('usesStyleProp: input it cannot read sends the file to the parser', () => {
  it.each([
    ['an unterminated string', "const s = 'x\n; // sx={a}"],
    ['an unterminated block comment', '/* sx={a}'],
    ['an unterminated template', '`abc sx={a}'],
    ['a regex that does not close on its line', "const r = /'\n<div sx={a} />"],
    ['an unterminated template after an expression', '`${x} sx={a}'],
    ['an unterminated template expression', '`${x}` + `${ sx={a}'],
    ['a closing brace with nothing open', '}; // sx={a}'],
    ['an unterminated attribute string', '<p title="x // sx={a}'],
    ['an unterminated closing tag', '<p></p // sx={a}'],
  ])('%s', (_, source) => {
    expect(uses(source)).toBe(true);
  });
});

describe('needsCompile', () => {
  it('compiles a file that imports the core package', () => {
    expect(needsCompile("import '@plumeria/core';", 'classStyle', 'a.ts')).toBe(
      true,
    );
  });

  it('compiles a file that writes the style prop without the import', () => {
    expect(
      needsCompile('<div classStyle={s.a} />', 'classStyle', 'a.tsx'),
    ).toBe(true);
  });

  it('skips a file that only mentions the style prop in a comment', () => {
    expect(
      needsCompile('// <div classStyle={s.a} />', 'classStyle', 'a.tsx'),
    ).toBe(false);
  });
});
