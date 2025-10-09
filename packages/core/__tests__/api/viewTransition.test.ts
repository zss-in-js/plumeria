import { viewTransition } from '../../src/api/viewTransition';

describe('viewTransition', () => {
  it('should generate a hash the first string in the returned hash is "vt-"', () => {
    const transitionName = viewTransition({
      new: { opacity: 0 },
      old: { opacity: 1 },
    });
    expect(transitionName.startsWith('vt-')).toBe(true);
  });
});
