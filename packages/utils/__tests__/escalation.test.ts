import type { CSSProperties } from 'zss-engine';
import { getStateWeights } from '../src/escalation';
import { getSpecificity, getPseudoElement } from 'zss-engine';
import { getStyleRecords } from '../src/create';
import { deepMerge } from '../src/parser';

/**
 * States that hold at once carry no ordering of their own, so the winner of the
 * intersection is taken from the composition: the source written further right
 * gets one more `:not(#\#)`. Every axis that already decides is left alone.
 */

const compose = (...sources: CSSProperties[]) => {
  const weights = getStateWeights(
    sources.map((style, order) => ({ order, style })),
  );
  const merged = sources.reduce<CSSProperties>(
    (acc, style) => deepMerge(acc, style) as CSSProperties,
    {},
  );
  return { weights, records: getStyleRecords(merged, weights) };
};

const sheetFor = (
  records: ReturnType<typeof getStyleRecords>,
  needle: string,
) => records.find((record) => record.sheet.includes(needle))?.sheet.trim();

const weightOf = (sheet: string | undefined) =>
  (sheet?.match(/:not\(#\\#\)/g) ?? []).length;

describe('state escalation', () => {
  it('leaves a single source untouched', () => {
    const { weights, records } = compose({
      ':focus': { color: 'red' },
    } as CSSProperties);

    expect(weights).toEqual({});
    expect(sheetFor(records, 'red')).toBe(
      '.x4ekexkg:not(#\\#):focus { color: red; }',
    );
  });

  it('weights the state written on the right', () => {
    const { weights, records } = compose(
      { ':focus': { color: 'red' } } as CSSProperties,
      { ':hover': { color: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({ ':hover:color': 1 });
    expect(weightOf(sheetFor(records, 'red'))).toBe(1);
    expect(weightOf(sheetFor(records, 'blue'))).toBe(2);
  });

  it('reverses the winner when the composition is reversed', () => {
    const { weights, records } = compose(
      { ':hover': { color: 'blue' } } as CSSProperties,
      { ':focus': { color: 'red' } } as CSSProperties,
    );

    expect(weights).toEqual({ ':focus:color': 1 });
    expect(weightOf(sheetFor(records, 'blue'))).toBe(1);
    expect(weightOf(sheetFor(records, 'red'))).toBe(2);
  });

  it('gives the escalated atom a class of its own', () => {
    const plain = compose({ ':focus': { color: 'red' } } as CSSProperties);
    const escalated = compose(
      { ':hover': { color: 'blue' } } as CSSProperties,
      { ':focus': { color: 'red' } } as CSSProperties,
    );

    const plainHash = plain.records[0].hash;
    const escalatedHash = escalated.records.find(
      (record) => record.key === ':focus:color',
    )?.hash;

    expect(escalatedHash).not.toBe(plainHash);
  });

  it('lets the right-most of three states win over both', () => {
    const { weights } = compose(
      { ':hover': { color: 'h' } } as CSSProperties,
      { ':focus': { color: 'f' } } as CSSProperties,
      { ':active': { color: 'a' } } as CSSProperties,
    );

    expect(weights).toEqual({ ':focus:color': 1, ':active:color': 2 });
  });

  it('follows the last source to set a state, not the first', () => {
    const { weights, records } = compose(
      { ':hover': { color: 'A' } } as CSSProperties,
      { ':focus': { color: 'B' } } as CSSProperties,
      { ':hover': { color: 'C' } } as CSSProperties,
    );

    expect(weights).toEqual({ ':hover:color': 1 });
    expect(weightOf(sheetFor(records, 'C'))).toBe(2);
    expect(weightOf(sheetFor(records, 'B'))).toBe(1);
  });

  it('weights states on the same pseudo-element', () => {
    const { weights } = compose(
      { ':hover::before': { color: 'red' } } as CSSProperties,
      { ':focus::before': { color: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({ ':focus::before:color': 1 });
  });

  it('leaves different pseudo-elements alone', () => {
    const { weights } = compose(
      { ':hover::before': { color: 'red' } } as CSSProperties,
      { ':focus::after': { color: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({});
  });

  it('leaves states from one source alone', () => {
    const { weights } = compose({
      ':focus': { color: 'red' },
      ':hover': { color: 'orange' },
    } as CSSProperties);

    expect(weights).toEqual({});
  });

  it('leaves states alone when both sources set both of them', () => {
    const { weights, records } = compose(
      {
        ':focus': { color: 'red' },
        ':hover': { color: 'orange' },
      } as CSSProperties,
      {
        ':hover': { color: 'green' },
        ':focus': { color: 'blue' },
      } as CSSProperties,
    );

    expect(weights).toEqual({});
    expect(weightOf(sheetFor(records, 'blue'))).toBe(1);
    expect(weightOf(sheetFor(records, 'green'))).toBe(1);
  });

  it('leaves an unrelated property alone', () => {
    const { weights } = compose(
      { ':focus': { color: 'red' } } as CSSProperties,
      { ':hover': { color: 'blue', textAlign: 'center' } } as CSSProperties,
    );

    expect(weights).toEqual({ ':hover:color': 1 });
  });

  it('weights states inside the same at-rule', () => {
    const { weights } = compose(
      {
        '@media (min-width: 700px)': { ':hover': { color: 'red' } },
      } as CSSProperties,
      {
        '@media (min-width: 700px)': { ':focus': { color: 'blue' } },
      } as CSSProperties,
    );

    expect(weights).toEqual({
      '@media (min-width: 700px)::focus:color': 1,
    });
  });

  it('leaves a differing at-rule to the rule order', () => {
    const { weights } = compose(
      {
        '@media (min-width: 700px)': { ':hover': { color: 'red' } },
      } as CSSProperties,
      { ':focus': { color: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({});
  });

  it('leaves a differing shorthand depth to the depth it already has', () => {
    const { weights } = compose(
      { ':hover': { backgroundColor: 'red' } } as CSSProperties,
      { ':focus': { background: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({});
  });

  it('leaves a differing selector specificity alone', () => {
    const { weights } = compose(
      { ':is(#promo)': { color: 'red' } } as CSSProperties,
      { ':hover': { color: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({});
  });

  it('keeps an explicit compound state above its weighted sibling', () => {
    const { weights, records } = compose(
      { ':hover': { color: 'blue' } } as CSSProperties,
      {
        ':focus': { color: 'red' },
        ':hover:focus': { color: 'green' },
      } as CSSProperties,
    );

    expect(weights).toEqual({
      ':focus:color': 1,
      ':hover:focus:color': 1,
    });
    expect(weightOf(sheetFor(records, 'red'))).toBe(2);
    expect(weightOf(sheetFor(records, 'green'))).toBe(2);
    expect(getSpecificity(':hover:focus')).toEqual([0, 2, 0]);
  });

  it('keeps a longhand above a weighted shorthand', () => {
    const { weights, records } = compose(
      { ':hover': { background: 'red' } } as CSSProperties,
      { ':focus': { background: 'blue' } } as CSSProperties,
      { ':active': { backgroundColor: 'green' } } as CSSProperties,
    );

    expect(weights).toEqual({
      ':focus:background': 1,
      ':active:backgroundColor': 1,
    });
    expect(weightOf(sheetFor(records, 'blue'))).toBe(2);
    expect(weightOf(sheetFor(records, 'green'))).toBe(3);
  });

  it('weights a custom property up from zero', () => {
    const { weights, records } = compose(
      { ':focus': { '--x': 'red' } } as CSSProperties,
      { ':hover': { '--x': 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({ ':hover:--x': 1 });
    expect(weightOf(sheetFor(records, 'red'))).toBe(0);
    expect(weightOf(sheetFor(records, 'blue'))).toBe(1);
  });

  it('leaves a host selector that already outranks the state alone', () => {
    const { weights } = compose(
      { ':host(.active)': { color: 'red' } } as CSSProperties,
      { ':hover': { color: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({});
  });

  it('separates pseudo-elements that differ only by argument', () => {
    const { weights } = compose(
      { ':hover::part(icon)': { color: 'red' } } as CSSProperties,
      { ':focus::part(label)': { color: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({});
  });

  it('weights states on the same parted pseudo-element', () => {
    const { weights } = compose(
      { ':hover::part(icon)': { color: 'red' } } as CSSProperties,
      { ':focus::part(icon)': { color: 'blue' } } as CSSProperties,
    );

    expect(weights).toEqual({ ':focus::part(icon):color': 1 });
  });

  it('ignores declarations that cannot become state atoms', () => {
    const weights = getStateWeights([
      {
        order: 0,
        style: {
          color: 'red',
          empty: null,
          ':hover': { color: { nested: true }, opacity: 1 },
          '@media (min-width: 1px)': {
            color: 'red',
            empty: null,
            ':focus': { opacity: 0 },
          },
        } as unknown as CSSProperties,
      },
    ]);

    expect(weights).toEqual({});
  });

  it('repairs only atoms on the same cascade target', () => {
    const { weights } = compose(
      { ':hover': { color: 'red' } } as CSSProperties,
      { ':focus': { color: 'blue' } } as CSSProperties,
      {
        ':hover:focus': { margin: 1 },
        ':active': { color: 'green' },
        '@media (min-width: 1px)': {
          ':focus': { color: 'purple' },
        },
      } as CSSProperties,
    );

    expect(weights).toEqual({ ':focus:color': 1, ':active:color': 2 });
  });
});

describe('selector specificity', () => {
  it.each([
    [':hover', [0, 1, 0]],
    [':focus-visible', [0, 1, 0]],
    ['[data-open="true"]', [0, 1, 0]],
    [':nth-child(2)', [0, 1, 0]],
    [':not(.plain)', [0, 1, 0]],
    [':is(#promo)', [1, 0, 0]],
    [':has(.badge)', [0, 1, 0]],
    [':has(#badge)', [1, 0, 0]],
    [':where(.x)', [0, 0, 0]],
    ['::before', [0, 0, 1]],
    [':hover::before', [0, 1, 1]],
    [':is(.a, #b, span)', [1, 0, 0]],
    [':nth-child(2 of .item)', [0, 2, 0]],
    [':nth-child(2\tof .item)', [0, 2, 0]],
    [':nth-child(2\nof   .item)', [0, 2, 0]],
    [':host', [0, 1, 0]],
    [':host(.active)', [0, 2, 0]],
    [':host-context(.theme)', [0, 2, 0]],
    ['::slotted(.item)', [0, 1, 1]],
    ['::cue(.warning)', [0, 1, 1]],
    ['::part(icon)', [0, 0, 1]],
    ['::highlight(search)', [0, 0, 1]],
    [':hover::part(icon)', [0, 1, 1]],
    [':is([data-value=")"], :hover)', [0, 1, 0]],
    ['[data-value="]"]', [0, 1, 0]],
    [':matches(.a, #b)', [0, 1, 0]],
  ])('reads %s', (selector, expected) => {
    expect(getSpecificity(selector as string)).toEqual(expected);
  });

  it.each([
    [':hover', ''],
    ['::before', '::before'],
    [':hover::after', '::after'],
    ['::part(icon)', '::part(icon)'],
    ['::part(label)', '::part(label)'],
    [':hover::part(icon)', '::part(icon)'],
    ['::slotted(.item)', '::slotted(.item)'],
    [':is([data-value="::before"], :hover)', ''],
    [':before', '::before'],
    [':not(::before)', ''],
  ])('finds the pseudo-element of %s', (selector, expected) => {
    expect(getPseudoElement(selector as string)).toBe(expected);
  });
});
