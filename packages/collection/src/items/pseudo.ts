const lang = (str: string) => `:lang(${str})` as ':lang()';
const not = (str: string) => `:not(${str})` as ':not()';
const has = (str: string) => `:has(${str})` as ':has()';
const is = (str: string) => `:is(${str})` as ':is()';
const where = (str: string) => `:where(${str})` as ':where()';
const nthChild = (str: string) => `:nth-child(${str})` as ':nth-child()';
const nthLastChild = (str: string) =>
  `:nth-last-child(${str})` as ':nth-last-child()';
const nthLastOfType = (str: string) =>
  `:nth-last-of-type(${str})` as ':nth-last-of-type()';
const nthOfType = (str: string) => `:nth-of-type(${str})` as ':nth-of-type()';

const viewTransitionOld = (str: string) =>
  `::view-transition-old(${str})` as '::view-transition-old()';
const viewTransitionNew = (str: string) =>
  `::view-transition-new(${str})` as '::view-transition-new()';
const viewTransitionGroup = (str: string) =>
  `::view-transition-group(${str})` as '::view-transition-group()';
const viewTransitionImagePair = (str: string) =>
  `::view-transition-image-pair(${str})` as '::view-transition-image-pair()';

export const pseudo = {
  // User action pseudo-classes
  active: ':active',
  hover: ':hover',
  focus: ':focus',
  link: ':link',
  visited: ':visited',
  target: ':target',

  // Language pseudo-class functions
  lang,
  not,
  has,
  is,
  where,

  // Structural pseudo-classes
  firstChild: ':first-child',
  lastChild: ':last-child',
  firstOfType: ':first-of-type',
  lastOfType: ':last-of-type',
  onlyOfType: ':only-of-type',
  onlyChild: ':only-child',

  // Structural pseudo-class functions
  nthChild,
  nthLastChild,
  nthLastOfType,
  nthOfType,

  // Other pseudo-classes
  empty: ':empty',

  // Form state pseudo-classes
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

  // Pseudo-elements
  after: '::after',
  before: '::before',
  firstLetter: '::first-letter',
  firstLine: '::first-line',
  marker: '::marker',
  selection: '::selection',

  // View Transition pseudo-element functions
  viewTransition: '::view-transition',
  viewTransitionImagePair,
  viewTransitionGroup,
  viewTransitionOld,
  viewTransitionNew,
} as const;
