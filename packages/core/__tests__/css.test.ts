import * as css from '../src/css';

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

  test('marker throws runtime error', () => {
    expect(() => {
      css.marker('a', 'b');
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
  });

  test('extended throws runtime error', () => {
    expect(() => {
      css.extended('a', 'b');
    }).toThrow('Runtime is not supported. Configure the bundler plugin.');
  });
});
