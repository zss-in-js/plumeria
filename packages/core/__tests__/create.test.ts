/* eslint-disable @plumeria/no-inner-call */
import { css } from '../src/css';

describe('create function', () => {
  it('should correctly create and freeze the object', () => {
    const styleObject = {
      button: {
        color: 'red',
        background: 'blue',
      },
    };

    const styles = css.create(styleObject);
    expect(typeof styles).toBe('object');
    expect(typeof css.props(styles.button)).toBe('string');
    expect(styles).toHaveProperty('button');
    expect(Object.isFrozen(styles)).toBe(true); // Check that the resulting object is frozen;
  });
});
