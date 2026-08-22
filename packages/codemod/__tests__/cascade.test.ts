import { overlaps, unrepresentable, type Held } from '../src/cascade';

const held = (
  property: string,
  conditional: boolean,
  place: number,
  suffix = '',
): Held => ({ property, suffix, conditional, place });

describe('overlaps', () => {
  it.each([
    ['padding', 'padding-top', true],
    ['padding-top', 'padding', true],
    ['padding', 'padding', true],
    ['padding', 'margin', false],
    ['border', 'border-top-width', true],
    ['color', 'background', false],
  ])('%s against %s', (first, second, expected) => {
    expect(overlaps(first, second)).toBe(expected);
  });
});

describe('unrepresentable', () => {
  it('says no where both are plain, whatever the order', () => {
    // Level in Plumeria, so the array carries their order.
    expect(
      unrepresentable([held('color', false, 0)], [held('color', false, 1)]),
    ).toBe(false);
  });

  it('says no where both are conditional', () => {
    // Plumeria ranks every at-rule declaration alike, whichever at-rule it is.
    expect(
      unrepresentable([held('color', true, 0)], [held('color', true, 1)]),
    ).toBe(false);
  });

  it('says yes where the plain one was written later', () => {
    expect(
      unrepresentable([held('color', true, 0)], [held('color', false, 1)]),
    ).toBe(true);
    expect(
      unrepresentable([held('color', false, 1)], [held('color', true, 0)]),
    ).toBe(true);
  });

  it('says no where the conditional one was written later', () => {
    // Both sides agree: the at-rule wins in CSS by order, in Plumeria by rank.
    expect(
      unrepresentable([held('color', false, 0)], [held('color', true, 1)]),
    ).toBe(false);
  });

  it('reads the place of the declarations, not of the key', () => {
    // `.a` writes `color` first and `margin` last. The `margin` is what moves
    // the key, and it has nothing to do with the pair that disagrees.
    expect(
      unrepresentable(
        [held('color', true, 0), held('margin', false, 2)],
        [held('color', false, 1)],
      ),
    ).toBe(true);
  });

  it('reads a shorthand against the longhand it covers', () => {
    expect(
      unrepresentable(
        [held('padding-top', true, 0)],
        [held('padding', false, 1)],
      ),
    ).toBe(true);
  });

  it('says no where the two never meet', () => {
    expect(
      unrepresentable([held('color', true, 0)], [held('margin', false, 1)]),
    ).toBe(false);
    expect(
      unrepresentable(
        [held('color', true, 0, ':hover')],
        [held('color', false, 1)],
      ),
    ).toBe(false);
  });

  it('asks the question of one key when given its list twice', () => {
    const declarations = [held('color', true, 0), held('color', false, 1)];
    expect(unrepresentable(declarations, declarations)).toBe(true);
  });
});
