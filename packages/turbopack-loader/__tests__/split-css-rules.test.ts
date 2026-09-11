import { splitCssRules } from '../src/split-css-rules';

it('splits top-level blocks and statements', () => {
  expect(
    splitCssRules(
      '@charset "UTF-8"; .a { color: red; } @media print { .b { color: black; } }',
    ),
  ).toEqual([
    '@charset "UTF-8";',
    '.a { color: red; }',
    '@media print { .b { color: black; } }',
  ]);
});

it('keeps comment delimiters and rule-like characters inside strings', () => {
  expect(
    splitCssRules(
      ".a { content: \"};/*not a comment*/\"; font-family: 'it\\'s fine'; }",
    ),
  ).toEqual([
    ".a { content: \"};/*not a comment*/\"; font-family: 'it\\'s fine'; }",
  ]);
});

it('keeps comments attached to surrounding rule content', () => {
  expect(
    splitCssRules(
      '/* standalone */ .a /* selector comment */ { /* body comment */ color: red; }',
    ),
  ).toEqual([
    '/* standalone */',
    '.a /* selector comment */ { /* body comment */ color: red; }',
  ]);
});

it('returns a trailing complete statement without a semicolon', () => {
  expect(splitCssRules('@import "theme.css"')).toEqual(['@import "theme.css"']);
});

it('does not return whitespace or an incomplete block', () => {
  expect(splitCssRules('   \n\t')).toEqual([]);
  expect(splitCssRules('.a { color: red;')).toEqual([]);
});

it('preserves a trailing escape in an unterminated string', () => {
  expect(splitCssRules('.a { content: "\\')).toEqual([]);
});
