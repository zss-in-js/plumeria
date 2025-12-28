/* eslint-disable @plumeria/no-inner-call */

import { css, x } from '../src/css';

describe('css runtime stubs', () => {
  test('create throws runtime error', () => {
    expect(() => {
      css.create({ a: { color: 'red' } });
    }).toThrow(/runtime not supported/);
  });

  test('createStatic throws runtime error', () => {
    expect(() => {
      css.createStatic({ a: 'b' } as any);
    }).toThrow(/runtime not supported/);
  });

  test('createTheme throws runtime error', () => {
    expect(() => {
      css.createTheme({} as any);
    }).toThrow(/runtime not supported/);
  });

  test('keyframes throws runtime error', () => {
    expect(() => {
      css.keyframes({} as any);
    }).toThrow(/runtime not supported/);
  });

  test('viewTransition throws runtime error', () => {
    expect(() => {
      css.viewTransition({} as any);
    }).toThrow(/runtime not supported/);
  });
});

describe('x helper', () => {
  test('returns object as-is', () => {
    const result = x('cls', { color: 'red' } as any);
    expect(result).toEqual({
      className: 'cls',
      styles: { color: 'red' },
    });
  });
});
