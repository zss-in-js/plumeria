/* eslint-disable @plumeria/no-inner-call */
import { css, rx } from '../src/css';

describe('css static methods', () => {
  new (css as any)();
  it('delegates keyframes()', () => {
    const res = css.keyframes({
      from: { opacity: 0 },
      to: { opacity: 1 },
    });
    expect(typeof res).toBe('string');
  });

  it('delegates viewTransition()', () => {
    const res = css.viewTransition({ new: { opacity: 0 } });
    expect(typeof res).toBe('string');
  });

  it('delegates defineConsts()', () => {
    const res = css.defineConsts({ primary: 'blue' });
    expect(res.primary).toBe('blue');
  });

  it('delegates defineTokens()', () => {
    const res = css.defineTokens({
      color: { primary: '#fff' },
    });
    expect(res.color.startsWith('var')).toBe(true);
  });

  it('delegates create() and props()', () => {
    const res = css.create({
      text: {
        fontSize: 24,
      },
    });
    const className = css.props(res.text);
    expect(typeof res.text).toBe('object');
    expect(typeof className).toBe('string');
  });
});

describe('rx', () => {
  it('should return an object with the given className and varSet as style', () => {
    const className = 'my-class';
    const varSet = {
      '--primary-color': 'blue',
      '--font-weight': 'bold',
    };

    const result = rx(className, varSet);

    expect(result).toEqual({
      className: className,
      style: varSet,
    });
  });
});
