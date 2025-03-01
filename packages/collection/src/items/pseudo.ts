const lang = (str: string): string => `:lang(${str})`;
const not = (str: string): string => `:not(${str})`;
const has = (str: string): string => `:has(${str})`;
const is = (str: string): string => `:is(${str})`;
const where = (str: string): string => `:where(${str})`;
const nthChild = (str: string): string => `:nth-child(${str})`;
const nthLastChild = (str: string): string => `:nth-last-child(${str})`;
const nthLastOfType = (str: string): string => `:nth-last-of-type(${str})`;
const nthOfType = (str: string): string => `:nth-of-type(${str})`;
const viewTransitionOld = (str: string): string =>
  `::view-transition-old(${str})`;
const viewTransitionNew = (str: string): string =>
  `::view-transition-new(${str})`;
const viewTransitionGroup = (str: string): string =>
  `::view-transition-group(${str})`;
const viewTransitionImagePair = (str: string): string =>
  `::view-transition-image-pair(${str})`;

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
