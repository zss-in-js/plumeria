/* eslint-disable @plumeria/no-inner-call */

import { css, x } from '../src/css';

describe('css runtime stubs', () => {
  test('create throws runtime error', () => {
    expect(() => {
      css.create({ a: { color: 'red' } });
    }).toThrow(/requires bundler-plugin/);
  });

  test('createStatic throws runtime error', () => {
    expect(() => {
      css.createStatic({ a: 'b' });
    }).toThrow(/requires bundler-plugin/);
  });

  test('createTheme throws runtime error', () => {
    expect(() => {
      css.createTheme({});
    }).toThrow(/requires bundler-plugin/);
  });

  test('keyframes throws runtime error', () => {
    expect(() => {
      css.keyframes({});
    }).toThrow(/requires bundler-plugin/);
  });

  test('viewTransition throws runtime error', () => {
    expect(() => {
      css.viewTransition({});
    }).toThrow(/requires bundler-plugin/);
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
