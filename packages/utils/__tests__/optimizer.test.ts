import { orderMediaLast } from '../src/optimizer';

describe('orderMediaLast', () => {
  test('moves media rules after the base rules', () => {
    expect(
      orderMediaLast([
        '@media (min-width: 640px){.a{color:red}}',
        '.b{color:b}',
      ]),
    ).toEqual(['.b{color:b}', '@media (min-width: 640px){.a{color:red}}']);
  });

  test('detects a media rule behind leading whitespace', () => {
    const media = ' \n\t\r\f@media (min-width: 640px){.a{color:red}}';
    expect(orderMediaLast([media, '.b{color:b}'])).toEqual([
      '.b{color:b}',
      media,
    ]);
  });

  test('detects a media rule behind a leading comment', () => {
    const media = '/* start */@media screen{.a{color:red}}';
    expect(orderMediaLast([media, '.b{color:b}'])).toEqual([
      '.b{color:b}',
      media,
    ]);
  });

  test('treats an unterminated comment as a base rule', () => {
    const rule = '/* never closed @media screen{.a{color:red}}';
    expect(orderMediaLast([rule, '.b{color:b}'])).toEqual([
      rule,
      '.b{color:b}',
    ]);
  });

  test('treats a rule that only has whitespace as a base rule', () => {
    expect(orderMediaLast(['   ', '.b{color:b}'])).toEqual([
      '   ',
      '.b{color:b}',
    ]);
  });
});
