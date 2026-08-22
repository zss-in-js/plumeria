import { overlaps, relate, type Held } from '../src/cascade';

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

describe('relate', () => {
  it('calls two plain declarations of one property a crossing', () => {
    // Level in Plumeria, so the order of the array is what decides.
    expect(
      relate([held('color', false, 0)], [held('color', false, 1)]),
    ).toEqual({ ranked: undefined, crossing: true });
  });

  it('calls two conditional declarations a crossing as well', () => {
    // Plumeria ranks every at-rule declaration alike, whichever at-rule it is.
    expect(relate([held('color', true, 0)], [held('color', true, 1)])).toEqual({
      ranked: undefined,
      crossing: true,
    });
  });

  it('ranks a conditional declaration above a plain one', () => {
    expect(relate([held('color', true, 0)], [held('color', false, 1)])).toEqual(
      {
        ranked: 'left',
        crossing: false,
      },
    );
    expect(relate([held('color', false, 0)], [held('color', true, 1)])).toEqual(
      {
        ranked: 'right',
        crossing: false,
      },
    );
  });

  it('ranks a shorthand against the longhand it covers', () => {
    expect(
      relate([held('padding-top', true, 0)], [held('padding', false, 1)]),
    ).toEqual({ ranked: 'left', crossing: false });
  });

  it('says nothing where the two never meet', () => {
    expect(
      relate([held('color', true, 0)], [held('margin', false, 1)]),
    ).toEqual({ ranked: undefined, crossing: false });
    expect(
      relate([held('color', true, 0, ':hover')], [held('color', false, 1)]),
    ).toEqual({ ranked: undefined, crossing: false });
  });
});
