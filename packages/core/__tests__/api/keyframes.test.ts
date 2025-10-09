import { keyframes } from '../../src/api/keyframes';

describe('keyframes', () => {
  it('should generate a hash the first string in the returned hash is "kf-"', () => {
    const animationName = keyframes({
      from: { opacity: 0 },
      to: { opacity: 1 },
    });
    expect(animationName.startsWith('kf-')).toBe(true);
  });
});
