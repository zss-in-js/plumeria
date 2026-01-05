/* eslint-disable @plumeria/validate-values */
/* eslint-disable @plumeria/no-inner-call */

import { css, x } from '../src/css';

describe('css runtime stubs', () => {
  test('create throws runtime error', () => {
    expect(() => {
      css.create({ a: { color: 'red' } });
    }).toThrow('Runtime execution is not supported');
  });

  test('createStatic throws runtime error', () => {
    expect(() => {
      css.createStatic({ a: 'b' });
    }).toThrow('Runtime execution is not supported');
  });

  test('createTheme throws runtime error', () => {
    expect(() => {
      css.createTheme({});
    }).toThrow('Runtime execution is not supported');
  });

  test('keyframes throws runtime error', () => {
    expect(() => {
      css.keyframes({});
    }).toThrow('Runtime execution is not supported');
  });

  test('viewTransition throws runtime error', () => {
    expect(() => {
      css.viewTransition({});
    }).toThrow('Runtime execution is not supported');
  });
});

describe('x helper', () => {
  test('returns object as-is', () => {
    const result = x('cls', { color: 'red' } as any);
    expect(result).toEqual({
      className: 'cls',
      style: { color: 'red' },
    });
  });
});

describe('css.props', () => {
  test('returns empty string for no args', () => {
    expect(css.props()).toBe('');
  });

  test('ignores falsy values', () => {
    expect(css.props(false, null, undefined, { color: 'a' })).toBe('a');
  });

  test('different keys preserve left-to-right order', () => {
    expect(css.props({ color: 'a' }, { background: 'b' })).toBe('a b');
  });

  test('rightmost key is emitted last', () => {
    expect(css.props({ color: 'a', background: 'b' }, { color: 'c' })).toBe(
      'b c',
    );
  });

  test('mixed multiple overrides behave correctly', () => {
    expect(
      css.props({ color: 'a', margin: 'm1' }, { color: 'b' }, { margin: 'm2' }),
    ).toBe('b m2');
  });
});
