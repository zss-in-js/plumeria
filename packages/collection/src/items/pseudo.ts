const lang = (str: string) => `:lang(${str})` as ':lang()';
const not = (str: string) => `:not(${str})` as ':not()';
const has = (str: string) => `:has(${str})` as ':has()';
const is = (str: string) => `:is(${str})` as ':is()';
const where = (str: string) => `:where(${str})` as ':where()';
const nthChild = (str: string) => `:nth-child(${str})` as ':nth-child()';
const nthLastChild = (str: string) => `:nth-last-child(${str})` as ':nth-last-child()';
const nthLastOfType = (str: string) => `:nth-last-of-type(${str})` as ':nth-last-of-type()';
const nthOfType = (str: string) => `:nth-of-type(${str})` as ':nth-of-type()';

export const pseudo = {
  active: ':active',
  hover: ':hover',
  focus: ':focus',
  link: ':link',
  visited: ':visited',
  target: ':target',
  lang,
  not,
  has,
  is,
  where,
  firstChild: ':first-child',
  lastChild: ':last-child',
  firstOfType: ':first-of-type',
  lastOfType: ':last-of-type',
  onlyOfType: ':only-of-type',
  onlyChild: ':only-child',
  nthChild,
  nthLastChild,
  nthLastOfType,
  nthOfType,
  empty: ':empty',
  checked: ':checked',
  disabled: ':disabled',
  enabled: ':enabled',
  optional: ':optional',
  required: ':required',
  inRange: ':in-range',
  outOfRange: ':out-of-range',
  invalid: ':invalid',
  valid: ':valid',
  readOnly: ':read-only',
  readWrite: ':read-write',
  after: '::after',
  before: '::before',
  firstLetter: '::first-letter',
  firstLine: '::first-line',
  marker: '::marker',
  selection: '::selection',
} as const;
