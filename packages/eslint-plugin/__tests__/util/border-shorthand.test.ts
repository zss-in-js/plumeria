import { splitBorderValue } from '../../src/util/borderShorthand';

describe('splitBorderValue', () => {
  it.each([
    ['', null],
    ['   ', null],
    ['1px solid red extra', null],
    ['rgb(0 0 0', null],
    ['rgb(0 0 0))', null],
    ['var(--border)', null],
    ['1px var(--color)', null],
    ['inherit', null],
    ['initial', null],
    ['unset', null],
    ['revert-layer', null],
    ['solid  dashed', { width: 'medium', style: 'solid', color: 'dashed' }],
    ['thin thick', { width: 'thin', style: 'none', color: 'thick' }],
    ['red blue', null],
    ['???', null],
    ['solid', { width: 'medium', style: 'solid', color: 'currentcolor' }],
    ['THICK', { width: 'THICK', style: 'none', color: 'currentcolor' }],
    ['+.5rem', { width: '+.5rem', style: 'none', color: 'currentcolor' }],
    ['10%', { width: '10%', style: 'none', color: 'currentcolor' }],
    [
      'calc(100% - 1px)',
      {
        width: 'calc(100% - 1px)',
        style: 'none',
        color: 'currentcolor',
      },
    ],
    ['#fff', { width: 'medium', style: 'none', color: '#fff' }],
    [
      'light-dark(black, white)',
      {
        width: 'medium',
        style: 'none',
        color: 'light-dark(black, white)',
      },
    ],
    [
      '1px\tSOLID\trgb(0 0 0 / 50%)',
      { width: '1px', style: 'SOLID', color: 'rgb(0 0 0 / 50%)' },
    ],
  ] as const)('splits %j', (value, expected) => {
    expect(splitBorderValue(value)).toEqual(expected);
  });
});
