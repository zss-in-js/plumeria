/* eslint-disable @plumeria/no-inner-call */

import { css, x } from '../src/css';

describe('css runtime stubs', () => {
  test('create throws runtime error', () => {
    expect(() => {
      css.create({ a: { color: 'red' } });
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
  });

  test('props throws runtime error', () => {
    expect(() => {
      css.props({});
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
  });

  test('createStatic throws runtime error', () => {
    expect(() => {
      css.createStatic({ a: 'b' });
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
  });

  test('createTheme throws runtime error', () => {
    expect(() => {
      css.createTheme({});
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
  });

  test('keyframes throws runtime error', () => {
    expect(() => {
      css.keyframes({});
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
  });

  test('viewTransition throws runtime error', () => {
    expect(() => {
      css.viewTransition({});
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
  });

  test('variants throws runtime error', () => {
    const getVariants = css.variants({});
    expect(() => {
      getVariants({});
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
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
