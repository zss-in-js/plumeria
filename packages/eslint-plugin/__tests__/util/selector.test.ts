import { getSpecificity, getPseudoElement } from 'zss-engine';
import {
  isStateSelector,
  areExclusive,
  statesOf,
  compoundOf,
  covers,
  tokenize,
} from '../../src/util/selector';

describe('selector parsing', () => {
  it.each([
    [':hover', [0, 1, 0]],
    ['[data-value="]"]', [0, 1, 0]],
    [':nth-child(2 of .item)', [0, 2, 0]],
    [':nth-child(2\nof   .item)', [0, 2, 0]],
    [':is(#promo)', [1, 0, 0]],
    [':is([data-value=")"], :hover)', [0, 1, 0]],
    [':where(.x)', [0, 0, 0]],
    [':matches(.a, #b)', [0, 1, 0]],
    [':host', [0, 1, 0]],
    [':host(.active)', [0, 2, 0]],
    [':host-context(.theme)', [0, 2, 0]],
    ['::slotted(.item)', [0, 1, 1]],
    ['::cue(.warning)', [0, 1, 1]],
    ['::part(icon)', [0, 0, 1]],
    ['::highlight(search)', [0, 0, 1]],
    [':hover::part(icon)', [0, 1, 1]],
  ])('reads the specificity of %s', (selector, expected) => {
    expect(getSpecificity(selector as string)).toEqual(expected);
  });

  it.each([
    ['::part(icon)', '::part(icon)'],
    ['::part(label)', '::part(label)'],
    [':hover::part(icon)', '::part(icon)'],
    ['::slotted(.item)', '::slotted(.item)'],
    [':hover', ''],
    [':is([data-value="::before"], :hover)', ''],
  ])('finds the pseudo-element of %s', (selector, expected) => {
    expect(getPseudoElement(selector as string)).toBe(expected);
  });

  it.each([
    ['.foo\\:bar', ['.foo\\:bar']],
    [':state(foo\\)bar)', [':state(foo\\)bar)']],
    [':state("a\\"b")', [':state("a\\"b")']],
    [':not(:is(:hover))', [':not(:is(:hover))']],
    [':not(:hover', [':not(:hover']],
    ['[data\\]name]', ['[data\\]name]']],
    ['[data-x="a\\"b"]', ['[data-x="a\\"b"]']],
    ['[data-open', ['[data-open']],
    ['& >', []],
  ])('tokenizes the edge syntax in %s', (selector, expected) => {
    expect(tokenize(selector as string).map((token) => token.text)).toEqual(
      expected,
    );
  });
});

describe('state selectors', () => {
  it.each([
    [':hover', true],
    [':hover:focus', true],
    ['[data-open]', true],
    ['::before', true],
    [':hover::part(icon)', true],
    ['.class', false],
    ['div', false],
    ['', false],
  ])('reads %s as a state selector: %s', (selector, expected) => {
    expect(isStateSelector(selector as string)).toBe(expected);
  });

  it('splits a selector into its states', () => {
    expect(statesOf(':hover:focus::part(icon)')).toEqual([':hover', ':focus']);
  });

  it('builds the compound of two states', () => {
    expect(compoundOf(':hover', ':focus')).toBe(':hover:focus');
    expect(compoundOf(':hover::part(icon)', ':focus::part(icon)')).toBe(
      ':hover:focus::part(icon)',
    );
  });

  it('sees a compound covering both states', () => {
    expect(covers(':hover:focus', ':hover', ':focus')).toBe(true);
    expect(covers(':hover:active', ':hover', ':focus')).toBe(false);
    expect(covers(':hover:focus', ':hover::part(icon)', ':focus')).toBe(false);
  });
});

describe('mutually exclusive states', () => {
  it.each([
    [':link', ':visited'],
    [':enabled', ':disabled'],
    [':read-only', ':read-write'],
    [':valid', ':invalid'],
    [':in-range', ':out-of-range'],
    [':required', ':optional'],
    [':hover', ':not(:hover)'],
    [':not(:placeholder-shown)', ':placeholder-shown'],
    [':focus:hover', ':not(:hover)'],
  ])('sees %s and %s as exclusive', (first, second) => {
    expect(areExclusive(first as string, second as string)).toBe(true);
  });

  it.each([
    [':hover', ':hover'],
    [':hover', ':focus'],
    [':checked', ':indeterminate'],
    [':focus', ':focus-visible'],
    [':hover', ':not(:focus)'],
  ])('sees %s and %s as able to hold at once', (first, second) => {
    expect(areExclusive(first as string, second as string)).toBe(false);
  });
});
