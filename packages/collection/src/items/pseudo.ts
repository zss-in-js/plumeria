// Functional classes
const dir = (str: string) => `:dir(${str})` as ':dir()';
const has = (str: string) => `:has(${str})` as ':has()';
const hostContext = (str: string) =>
  `:host-context(${str})` as ':host-context()';
const host = (str: string) => `:host(${str})` as ':host()';
const is = (str: string) => `:is(${str})` as ':is()';
const lang = (str: string) => `:lang(${str})` as ':lang()';
const nthChild = (str: string) => `:nth-child(${str})` as ':nth-child()';
const nthLastChild = (str: string) =>
  `:nth-last-child(${str})` as ':nth-last-child()';
const nthLastOfType = (str: string) =>
  `:nth-last-of-type(${str})` as ':nth-last-of-type()';
const nthOfType = (str: string) => `:nth-of-type(${str})` as ':nth-of-type()';
const not = (str: string) => `:not(${str})` as ':not()';
const state = (str: string) => `:state(${str})` as ':state()';
const where = (str: string) => `:where(${str})` as ':where()';

// Functional element
const cue = (str: string) => `::cue(${str})` as '::cue()';
const highlight = (str: string) => `::highlight(${str})` as '::highlight()';
const part = (str: string) => `::part(${str})` as '::part()';
const slotted = (str: string) => `::slotted(${str})` as '::slotted()';
const viewTransitionOld = (str: string) =>
  `::view-transition-old(${str})` as '::view-transition-old()';
const viewTransitionNew = (str: string) =>
  `::view-transition-new(${str})` as '::view-transition-new()';
const viewTransitionGroup = (str: string) =>
  `::view-transition-group(${str})` as '::view-transition-group()';
const viewTransitionImagePair = (str: string) =>
  `::view-transition-image-pair(${str})` as '::view-transition-image-pair()';

export const pseudo = {
  // Pseudo-classes
  // A
  active: ':active',
  anyLink: ':any-link',
  autoFill: ':autofill',
  // B
  buffering: ':buffering',

  // C
  checked: ':checked',

  // D
  default: ':default',
  defined: ':defined',
  disabled: ':disabled',

  // E
  empty: ':empty',
  enabled: ':enabled',

  // F
  first: ':first',
  firstChild: ':first-child',
  firstOfType: ':first-of-type',
  focus: ':focus',
  focusVisible: ':focus-visible',
  focusWithin: ':focus-within',
  fullscreen: ':fullscreen',
  future: ':future',

  // H
  hasSlotted: ':has-slotted',
  host: ':host',
  hover: ':hover',

  // I
  inRange: ':in-range',
  indeterminate: ':indeterminate',
  invalid: ':invalid',

  // L
  lastChild: ':last-child',
  lastOfType: ':last-of-type',
  left: ':left',
  link: ':link',

  // M
  modal: ':modal',
  muted: ':muted',

  // N

  // O
  onlyChild: ':only-child',
  onlyOfType: ':only-of-type',
  open: ':open',
  optional: ':optional',
  outOfRange: ':out-of-range',

  // P
  past: ':past',
  paused: ':paused',
  pictureInPicture: ':picture-in-picture',
  placeholderShown: ':placeholder-shown',
  playing: ':playing',
  popoverOpen: ':popover-open',

  // R
  readOnly: ':read-only',
  readWrite: ':read-write',
  required: ':required',
  right: ':right',
  root: 'root',

  // S
  scope: ':scope',
  seeking: ':seeking',
  stalled: ':stalled',

  // T
  target: ':target',

  // U
  userInvalid: ':user-invalid',
  userValid: ':user-valid',

  // V
  valid: ':valid',
  visited: ':visited',
  volumeLocked: ':volume-locked',

  // Pseudo-elements
  // A
  after: '::after',

  // B
  backdrop: '::backdrop',
  before: '::before',

  // C
  cue: '::cue',

  // D
  detailsContent: '::details-content',

  // F
  firstSelectorButton: '::first-selector-button',
  firstLetter: '::first-letter',
  firstLine: '::first-line',

  // G
  grammarError: '::grammar-error',

  // H

  // M
  marker: '::marker',

  // P
  placeholder: '::placeholder',

  // S
  selection: '::selection',
  spellingError: '::spellingError',

  // T
  targetText: '::target-text',

  // V
  viewTransition: '::view-transition',

  fn: {
    // Functional pseudo-classes
    cue,
    dir,
    has,
    host,
    hostContext,
    is,
    lang,
    nthChild,
    nthLastChild,
    nthLastOfType,
    nthOfType,
    not,
    state,
    where,

    // Functional pseudo-elements
    highlight,
    part,
    slotted,
    viewTransitionImagePair,
    viewTransitionGroup,
    viewTransitionOld,
    viewTransitionNew,
  },
} as const;
