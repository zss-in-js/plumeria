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
    ['var(--width) var(--color) solid', null],
    [
      '1px solid var(--color)',
      { width: '1px', style: 'solid', color: 'var(--color)' },
    ],
    [
      'var(--width) solid red',
      { width: 'var(--width)', style: 'solid', color: 'red' },
    ],
    [
      'calc(var(--width) * 2) solid red',
      { width: 'calc(var(--width) * 2)', style: 'solid', color: 'red' },
    ],
    ['inherit', null],
    ['initial', null],
    ['unset', null],
    ['revert-layer', null],
    ['solid  dashed', { width: 'medium', style: 'solid', color: 'dashed' }],
    ['thin thick', { width: 'thin', style: 'none', color: 'thick' }],
    ['red blue', null],
    ['???', null],
    ['solid', { width: 'medium', style: 'solid', color: 'currentColor' }],
    ['THICK', { width: 'THICK', style: 'none', color: 'currentColor' }],
    ['+.5rem', { width: '+.5rem', style: 'none', color: 'currentColor' }],
    ['10%', { width: '10%', style: 'none', color: 'currentColor' }],
    [
      'calc(100% - 1px)',
      {
        width: 'calc(100% - 1px)',
        style: 'none',
        color: 'currentColor',
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
