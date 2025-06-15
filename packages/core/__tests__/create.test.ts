/* eslint-disable @plumeria/no-inner-call */
import { css } from '../src/css';

const styleSheet = 'button_xhash67 { color: red; background: blue }';
const base36hash = 'xhash67';

jest.mock('zss-engine', () => ({
  isDevAndTest: true,
  isServer: false,
  transpiler: jest.fn(() => ({ styleSheet: styleSheet })),
  genBase36Hash: jest.fn(() => base36hash),
  injectServerCSS: jest.fn(),
  injectClientCSS: jest.fn(),
}));

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
    expect(css.props(styles.button)).toBe('button_xhash67'); // Expected value using mock base36Hash;
    expect(Object.isFrozen(styles)).toBe(true); // Check that the resulting object is frozen;
  });
});
