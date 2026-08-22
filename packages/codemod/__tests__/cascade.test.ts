import { depthOf, overlaps, rankOf, unrepresentable } from '../src/cascade';
import type { Held } from '../src/cascade';

const held = (
  property: string,
  conditional: boolean,
  place: number,
  suffix = '',
): Held => ({
  property,
  suffix,
  rank: rankOf(property, conditional),
  place,
});

describe('rankOf', () => {
  it('puts a longhand above the shorthand that writes it', () => {
    expect(depthOf('padding-top')).toBeGreaterThan(depthOf('padding'));
    expect(rankOf('padding-top', false)).toBeGreaterThan(
      rankOf('padding', false),
    );
  });

  it('puts a conditional declaration one step above a plain one', () => {
    expect(rankOf('color', true)).toBe(rankOf('color', false) + 1);
  });

  it('leaves a custom property where it is', () => {
    expect(rankOf('--brand', true)).toBe(0);
  });
});

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

  it('reads a longhand against a shorthand written after it', () => {
    // CSS lets the later `padding` reset `padding-top`; Plumeria ranks the
    // longhand above it, so no array can put that back.
    expect(
      unrepresentable(
        [held('padding-top', false, 0)],
        [held('padding', false, 1)],
      ),
    ).toBe(true);
  });

  it('says no when the shorthand came first', () => {
    // Both sides give it to the longhand: CSS by order, Plumeria by rank.
    expect(
      unrepresentable(
        [held('padding', false, 0)],
        [held('padding-top', false, 1)],
      ),
    ).toBe(false);
  });

  it('reads two declarations of one rule in the order they were written', () => {
    const declarations = [
      held('padding-top', false, 0),
      held('padding', false, 1),
    ];
    expect(unrepresentable(declarations, declarations)).toBe(true);
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
