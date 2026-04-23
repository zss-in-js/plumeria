const fontSizeSubValues = [
  'xx-small',
  'x-small',
  'small',
  'medium',
  'large',
  'x-large',
  'xx-large',
  'math',
  'smaller',
  'larger',
];
const lengthSubValues = ['max-content', 'min-content', 'fit-content'];
const widthKeywords = ['thin', 'medium', 'thick'];
const alignKeywords = [
  'start',
  'end',
  'left',
  'right',
  'center',
  'justify',
  'match-parent',
];
const breakBeforeAfterValues = [
  'auto',
  'avoid',
  'always',
  'all',
  'avoid-page',
  'page',
  'left',
  'right',
  'recto',
  'verso',
  'avoid-column',
  'column',
  'avoid-region',
  'region',
];
const lineStyle = [
  'none',
  'hidden',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
];
const overflowKeyword = ['visible', 'hidden', 'clip', 'scroll', 'auto'];
const overflowAlignment = [
  'safe start',
  'safe end',
  'safe center',
  'safe flex-start',
  'safe flex-end',
  'unsafe start',
  'unsafe end',
  'unsafe center',
  'unsafe flex-start',
  'unsafe flex-end',
];

const validData: { [key: string]: readonly string[] } = {
  all: [], // 1
  appearance: [
    'none',
    'auto',
    'base',
    // <compat-auto> =
    'searchfield',
    'textarea',
    'checkbox',
    'radio',
    'menulist',
    'listbox',
    'meter',
    'progress-bar',
    'button',
    // <compat-special> =
    'textfield',
    'menulist-button',
  ], // 2
  alignContent: [
    'normal',
    /* align-content does not take left and right values */
    'start',
    'center',
    'end',
    'flex-start',
    'flex-end',
    /* Baseline alignment */
    'baseline',
    // 'first baseline',
    // 'last baseline',
    /* Distributed alignment */
    'space-between',
    'space-around',
    'space-evenly',
    'stretch',
    // ...overflowAlignment,
  ], // 3
  alignmentBaseline: [
    'auto',
    'baseline',
    'before-edge',
    'text-before-edge',
    'middle',
    'central',
    'after-edge',
    'text-after-edge',
    'ideographic',
    'alphabetic',
    'hanging',
    'mathematical',
  ], // 4

  alignItems: [
    'normal',
    'stretch',
    'center',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'self-start',
    'self-end',
    'anchor-center',
    /* Baseline alignment */
    'baseline',
    // 'first baseline',
    // 'last baseline',
    /* Overflow alignment */
    // ...overflowAlignment,
    // 'safe self-start',
    // 'safe self-end',
    // 'safe anchor-center',
    // 'unsafe self-start',
    // 'unsafe self-end',
    // 'unsafe anchor-center',
  ], // 5
  alignSelf: [
    'auto',
    'normal',
    'stretch',
    'center',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'self-start',
    'self-end',
    'anchor-center',
    /* Baseline alignment */
    'baseline',
    // 'first baseline',
    // 'last baseline',
    /* Overflow alignment */
    // ...overflowAlignment,
    // 'safe self-start',
    // 'safe self-end',
    // 'safe anchor-center',
    // 'unsafe self-start',
    // 'unsafe self-end',
    // 'unsafe anchor-center',
  ], // 6
  animationDelay: [], // <times>#, // 7
  animationDirection: [], // Single animation#, // 8
  animationDuration: ['auto'], // auto, <times>#, // 9
  animationFillMode: [], // Single animation#, // 10
  animationIterationCount: [], // <number|infinite>#, // 11
  animationName: ['none', 'slide', 'bounce'], // <custom-indent> | <string>#, // 12
  animationPlayState: [], // paused running #, // 13
  animationTimingFunction: [], // <easing keyword | cubic-bezier() | linear() | steps()>#, // 14
  aspectRatio: ['auto'], // 15

  backdropFilter: ['none'], // 16
  baselineShift: ['baseline', 'sub', 'super'], // 17
  backfaceVisibility: ['visible', 'hidden'], // 18
  background: ['none'], // 19
  backgroundAttachment: [], // 20
  backgroundBlendMode: [], // <brend-mode>#, // 21
  backgroundClip: ['text', 'border-area'], // 22
  backgroundImage: ['none'], // 23
  backgroundOrigin: [], // 24
  backgroundPosition: [], // 25
  backgroundPositionX: [], // 26
  backgroundPositionY: [], // 27
  backgroundRepeat: [
    'repeat',
    'repeat-x',
    'repeat-y',
    'space',
    'round',
    'no-repeat',
    // 'repeat repeat',
    // 'repeat no-repeat',
    // 'repeat space',
    // 'repeat round',
    // 'no-repeat repeat',
    // 'no-repeat no-repeat',
    // 'no-repeat space',
    // 'no-repeat round',
    // 'space repeat',
    // 'space no-repeat',
    // 'space space',
    // 'space round',
    // 'round repeat',
    // 'round no-repeat',
    // 'round space',
    // 'round round',
  ], // 28
  backgroundSize: ['auto', 'cover', 'contain'], // 29
  blockSize: ['auto', ...lengthSubValues], // 30
  boxDecorationBreak: ['slice', 'clone'], // 31
  boxShadow: [], // 32
  boxSizing: ['content-box', 'border-box'], // 33
  breakAfter: [...breakBeforeAfterValues], // 34
  breakBefore: [...breakBeforeAfterValues], // 35
  breakInside: ['auto', 'avoid', 'avoid-page', 'avoid-column', 'avoid-region'], // 36
  // single value
  top: ['auto'], // 37
  right: ['auto'], // 38
  bottom: ['auto'], // 39
  left: ['auto'], // 40
  marginTop: ['auto'], // 41
  marginRight: ['auto'], // 42
  marginBottom: ['auto'], // 43
  marginLeft: ['auto'], // 44
  paddingTop: [], // 45
  paddingRight: [], // 46
  paddingBottom: [], // 47
  paddingLeft: [], // 48
  borderTopWidth: [...widthKeywords], // 49
  borderBottomWidth: [...widthKeywords], //48, // 50
  borderLeftWidth: [...widthKeywords], // 51
  borderRightWidth: [...widthKeywords], // 52
  borderTopStyle: ['none', ...lineStyle], // 53
  borderBottomStyle: ['none', ...lineStyle], // 54
  borderLeftStyle: ['none', ...lineStyle], // 55
  borderRightStyle: ['none', ...lineStyle], // 56
  borderBlockStyle: [...lineStyle], // 57
  borderBlockStartStyle: [...lineStyle], // 58
  borderBlockEndStyle: [...lineStyle], // 59
  borderBlockStartWidth: [...widthKeywords], // 60
  borderBlockEndWidth: [...widthKeywords], // 61
  borderInlineStyle: [...lineStyle], // 62
  borderInlineStartStyle: [...lineStyle], // 63
  borderInlineEndStyle: [...lineStyle], // 64
  borderInlineStartWidth: [...widthKeywords], // 65
  borderInlineEndWidth: [...widthKeywords], // 66
  borderCollapse: ['collapse', 'separate'], // 67
  borderImageSource: ['none'], // 68
  lineHeight: ['normal'], // 69
  letterSpacing: ['normal'], // 70
  wordSpacing: ['normal'], //69, // 71
  opacity: [], // 72
  zIndex: ['auto'], // 73
  fontSize: [...fontSizeSubValues], // 74
  fontWeight: ['normal', 'bold', 'lighter', 'bolder'], // 75

  // length value
  maxWidth: ['none', 'stretch', ...lengthSubValues], // 76
  maxHeight: ['none', 'stretch', ...lengthSubValues], // 77
  minWidth: ['none', 'stretch', ...lengthSubValues], // 78
  minHeight: ['none', 'stretch', ...lengthSubValues], // 79
  width: ['auto', 'stretch', ...lengthSubValues], // 80
  height: ['auto', 'stretch', ...lengthSubValues], // 81
  flexBasis: ['auto', 'content', ...lengthSubValues], // 82

  // multiple value
  gap: [], // 83
  inset: ['auto'], // 84
  margin: ['auto'], // 85
  padding: [], // 86
  border: [...widthKeywords, ...lineStyle], // 87
  borderTop: [...widthKeywords, ...lineStyle], // 88
  borderBottom: [...widthKeywords, ...lineStyle], // 89
  borderLeft: [...widthKeywords, ...lineStyle], // 90
  borderRight: [...widthKeywords, ...lineStyle], // 91
  borderBlock: [...widthKeywords, ...lineStyle], // 92
  borderBlockStart: [...widthKeywords, ...lineStyle], // 93
  borderBlockEnd: [...widthKeywords, ...lineStyle], // 94
  borderInline: [...widthKeywords, ...lineStyle], // 95
  borderInlineStart: [...widthKeywords, ...lineStyle], // 96
  borderInlineEnd: [...widthKeywords, ...lineStyle], // 97
  borderWidth: [...widthKeywords], // 98
  borderBlockWidth: [...widthKeywords], // 99
  borderInlineWidth: [...widthKeywords], // 100
  borderStyle: [...lineStyle], // 101
  borderSpacing: [], // 102
  borderEndEndRadius: [], // 103
  borderEndStartRadius: [], // 104
  borderStartEndRadius: [], // 105
  borderStartStartRadius: [], // 106
  borderTopLeftRadius: [], // 107
  borderTopRightRadius: [], // 108
  borderBottomLeftRadius: [], // 109
  borderBottomRightRadius: [], // 110
  borderImageWidth: ['auto'], // 111
  // borderRadius
  borderRadius: [], // 112

  // borderImage
  borderImage: ['none'], // 113

  // borderImageSlice
  borderImageSlice: ['fill'], // 114

  // borderImageSlice
  borderImageRepeat: [], // 115

  // borderImageOutset
  borderImageOutset: [], // 116

  // singleColor
  accentColor: ['auto'], // 117
  color: [], // 118
  borderLeftColor: [], // 119
  borderRightColor: [], // 120
  borderTopColor: [], // 121
  borderBottomColor: [], // 122
  borderBlockColor: [], // 123
  borderBlockStartColor: [], // 124
  borderBlockEndColor: [], // 125
  borderInlineColor: [], // 126
  borderInlineStartColor: [], // 127
  borderInlineEndColor: [], // 128
  backgroundColor: [], // 129
  outlineColor: [], // 130
  textDecorationColor: [], // 131
  caretColor: ['auto'], // 132
  columnRuleColor: [], // 133

  // borderColor
  borderColor: [], // 4 value, // 134

  // AB is done. next Alphabet C continue
  captionSide: ['top', 'bottom'], // 135
  // caretColor: ['auto'] // in the single color group
  clear: [
    'inline-start',
    'inline-end',
    'block-start',
    'block-end',
    'left',
    'right',
    'top',
    'bottom',
    'both-inline',
    'both-block',
    'both',
    'none',
  ], // 136
  clipPath: [], // 137
  clipRule: ['nonzero', 'evenodd'], // 138
  colorInterpolation: ['auto', 'sRGB', 'linearRGB'], // 139
  colorInterpolationFilters: ['auto', 'sRGB', 'linearRGB'], // 140
  colorScheme: ['normal', 'dark', 'light'], // 141
  columnCount: ['auto'], // 142
  columnFill: ['auto', 'balance'], // 143
  columnGap: [], // 144
  columnRule: [], // 141 // use border function, // 145
  columnRuleStyle: [...lineStyle], // 146
  columnRuleWidth: [], // 147
  columnSpan: ['none', 'all'], // 148
  columnWidth: ['auto', 'max-content', 'min-content'], // 149
  columns: [], // 150
  contain: ['none', 'strict', 'content'], // 151
  containerType: ['size', 'inline-size', 'normal'], // 152
  content: [
    'open-quote',
    'close-quote',
    'no-open-quote',
    'no-close-quote',
    'normal',
    'none',
  ], // 153
  contentVisibility: ['visible', 'hidden', 'auto'], // 154
  counterIncrement: ['none'], // 155
  counterReset: ['none'], // 156
  counterSet: ['none'], // 157
  cursor: ['auto'], // 158

  direction: ['ltr', 'rtl'], // 159
  position: ['static', 'relative', 'absolute', 'fixed', 'sticky'], // 160
  display: [
    // <display-outside> =
    'block',
    'inline',
    'run-in',

    // <display-inside> =
    'flow',
    'flow-root',
    'table',
    'flex',
    'grid',
    'ruby',
    'math',

    // // multi-keyword syntax
    // 'block flex',
    // 'block flow',
    // 'block flow-root',
    // 'block table',
    // 'block grid',
    // 'block ruby',
    // 'block math',

    // 'inline flex',
    // 'inline flow',
    // 'inline flow-root',
    // 'inline table',
    // 'inline grid',
    // 'inline ruby',
    // 'inline math',

    // // <display-listitem> =
    // 'list-item',
    // 'list-item block',
    // 'list-item inline',
    // 'list-item flow',
    // 'list-item flow-root',
    // 'list-item block flow',
    // 'list-item block flow-root',
    // 'list-item inline flow',
    // 'list-item inline flow-root',

    // // listitem run-in
    // 'list-item run-in',
    // 'list-item run-in flow',
    // 'list-item run-in flow-root',

    // <display-internal> =
    'table-header-group',
    'table-footer-group',
    'table-row',
    'table-row-group',
    'table-cell',
    'table-column-group',
    'table-column',
    'table-caption',
    'ruby-base',
    'ruby-text',
    'ruby-base-container',
    'ruby-text-container',

    // <display-box> =
    'contents',
    'none',

    // <display-legacy> =
    'inline-block',
    'inline-table',
    'inline-flex',
    'inline-grid',
    'inline-list-item',
  ], // 161
  dominantBaseline: [
    'auto',
    'use-script',
    'no-change',
    'reset-size',
    'ideographic',
    'alphabetic',
    'hanging',
    'mathematical',
    'central',
    'middle',
    'text-after-edge',
    'text-before-edge',
  ], // 162
  emptyCells: ['show', 'hide'], // 163
  fill: ['none', 'currentColor'], // 164
  fillOpacity: [], // 165
  fillRule: ['nonzero', 'evenodd'], // 166
  filter: ['none'], // 167
  flex: ['none'], // 168
  flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'], // 169
  flexFlow: [
    // <'flex-direction'>
    'row',
    'row-reverse',
    'column',
    'column-reverse',

    // <'flex-wrap'>
    'nowrap',
    'wrap',
    'wrap-reverse',

    // // <'flex-direction'> and <'flex-wrap'>
    // 'row nowrap',
    // 'row wrap',
    // 'row wrap-reverse',
    // 'row-reverse nowrap',
    // 'row-reverse wrap',
    // 'row-reverse wrap-reverse',
    // 'column nowrap',
    // 'column wrap',
    // 'column wrap-reverse',
    // 'column-reverse nowrap',
    // 'column-reverse wrap',
    // 'column-reverse wrap-reverse',
  ], // 170
  flexGrow: [], // 171
  flexShrink: [], // 172
  flexWrap: ['nowrap', 'wrap', 'wrap-reverse'], // 173
  float: ['inline-start', 'inline-end', 'left', 'none', 'right'], // 174
  font: ['none'], // 175
  forcedColorAdjust: ['auto', 'none'], // 176
  fontFamily: [], // 177
  fontFeatureSettings: [], // 178
  fontKerning: ['auto', 'normal', 'none'], // 179
  fontLanguageOverride: ['normal'], // 180
  fontOpticalSizing: ['auto', 'none'], // 181
  fontPalette: ['normal', 'light', 'dark'], // 182
  fontSizeAdjust: ['none'], // 183
  fontStretch: [
    'normal',
    'ultra-condensed',
    'extra-condensed',
    'condensed',
    'semi-condensed',
    'semi-expanded',
    'expanded',
    'extra-expanded',
    'ultra-expanded',
  ], // 184
  fontStyle: ['normal', 'italic', 'oblique'], // 185
  fontSynthesis: ['none', 'weight', 'style', 'small-caps', 'position'], // 186
  fontSynthesisSmallCaps: ['auto', 'none'], // 187
  fontSynthesisStyle: ['auto', 'none'], // 188
  fontSynthesisWeight: ['auto', 'none'], // 189
  fontVariant: ['normal', 'none'], // 190
  fontVariantAlternates: ['normal', 'historical-forms'], // 191
  fontVariantCaps: [
    'normal',
    'small-caps',
    'all-small-caps',
    'petite-caps',
    'all-petite-caps',
    'unicase',
    'titling-caps',
  ], // 192
  fontVariantEastAsian: [
    'normal',
    'ruby',
    'jis78',
    'jis83',
    'jis90',
    'jis04',
    'simplified',
    'traditional',
    'full-width',
    'proportional-width',
  ], // 193
  fontVariantEmoji: ['normal', 'text', 'emoji', 'unicode'], // 194
  fontVariantLigatures: ['none', 'normal'], // 195
  fontVariantNumeric: ['normal'], // 196
  fontVariantPosition: ['normal', 'sub', 'super'], // 197
  fontVariationSettings: [
    'normal',
    '"wght"',
    '"wdth"',
    '"slnt"',
    '"ital"',
    '"opsz"',
  ], // 198
  grid: ['none'], // 199
  gridArea: ['auto'], //187, // 200
  gridAutoColumns: ['auto'], // 201
  gridAutoFlow: ['row', 'column', 'dense', 'row dense', 'column dense'], // 202
  gridAutoRows: ['auto'], // 203
  gridColumn: ['auto'], // 204
  gridColumnEnd: ['auto'], // 205
  gridColumnStart: ['auto'], // 206
  gridRow: ['auto'], // 207
  gridRowEnd: ['auto'], // 208
  gridRowStart: ['auto'], // 209
  gridTemplate: ['none'], // 210
  gridTemplateAreas: ['none'], // 211
  gridTemplateColumns: ['none'], // 212
  gridTemplateRows: ['none'], // 213

  hangingPunctuation: [
    'none',
    'first',
    'last',
    'allow-end',
    'force-end',
    // 'first force-end',
    // 'first allow-end',
    // 'first last',
    // 'last allow-end',
    // 'last force-end',
    // 'first allow-end last',
    // 'first force-end last',
  ], // 214
  hyphenateCharacter: ['auto'], // 215
  hyphenateLimitChars: ['auto'], // 216
  hyphens: ['none', 'manual', 'auto'], // 217
  imageOrientation: ['none', 'from-image'], // 218
  imageRendering: [
    'auto',
    'smooth',
    'high-quality',
    'crisp-edges',
    'pixelated',
  ], // 219
  initialLetter: ['normal'], // 220
  inlineSize: ['auto', ...lengthSubValues], // 221
  insetBlock: ['auto'], // 222
  insetBlockEnd: ['auto'], // 223
  insetBlockStart: ['auto'], // 224
  insetInline: ['auto'], // 225
  insetInlineEnd: ['auto'], // 226
  insetInlineStart: ['auto'], // 227
  isolation: ['auto', 'isolate'], // 228
  justifyContent: [
    'normal',
    'stretch',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'center',
    'left',
    'right',
    'space-between',
    'space-around',
    'space-evenly',
    ...overflowAlignment,
    'safe left',
    'safe right',
    'unsafe left',
    'unsafe right',
  ], // 229
  justifyItems: [
    'normal',
    'stretch',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'center',
    'left',
    'right',
    'anchor-center',
    'baseline',
    // 'first baseline',
    // 'last baseline',
    // ...overflowAlignment,
    // 'legacy left',
    // 'legacy right',
    // 'legacy center',
  ], // 230
  justifySelf: [
    'auto',
    'normal',
    'stretch',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'center',
    'left',
    'right',
    'anchor-center',
    'baseline',
    'first baseline',
    'last baseline',
    // ...overflowAlignment,
    // 'safe left',
    // 'safe right',
    // 'unsafe left',
    // 'unsafe right',
    // 'safe self-start',
    // 'safe self-end',
    // 'safe anchor-center',
    // 'unsafe self-start',
    // 'unsafe self-end',
    // 'unsafe anchor-center',
  ], // 231
  lineBreak: ['auto', 'loose', 'normal', 'strict', 'anywhere'], // 232
  listStyleImage: ['none'], // 233
  listStylePosition: ['inside', 'outside'], // 234
  listStyleType: ['none'], // 235
  marginBlock: ['auto'], // 236
  marginBlockEnd: ['auto'], // 237
  marginBlockStart: ['auto'], // 238
  marginInline: ['auto'], // 239
  marginInlineEnd: ['auto'], // 240
  marginInlineStart: ['auto'], // 241
  marker: ['none'], // 242
  markerEnd: ['none'], // 243
  markerMid: ['none'], // 244
  markerStart: ['none'], // 245
  mask: ['none'], // 246
  maskBorder: ['none'], // 247
  maskBorderMode: ['luminance', 'alpha'], // 248
  maskBorderOutset: [], // 249
  maskBorderRepeat: [
    'stretch',
    'repeat',
    'round',
    'space',
    // 'stretch stretch',
    // 'stretch repeat',
    // 'stretch round',
    // 'stretch space',
    // 'repeat stretch',
    // 'repeat repeat',
    // 'repeat round',
    // 'repeat space',
    // 'round stretch',
    // 'round repeat',
    // 'round round',
    // 'round space',
    // 'space stretch',
    // 'space repeat',
    // 'space round',
    // 'space space',
  ], // 250
  maskBorderSlice: ['fill'], // 251
  maskBorderSource: ['none'], // 252
  maskBorderWidth: ['auto'], // 253
  maskClip: ['no-clip'], // 254
  maskComposite: ['add', 'subtract', 'intersect', 'exclude'], // 255
  maskImage: ['none'], // 256
  maskMode: ['alpha', 'luminance', 'match-source'], // 257
  maskOrigin: [], // 258
  maskPosition: ['top', 'bottom', 'left', 'right', 'center'], // 259
  maskRepeat: ['repeat-x', 'repeat-y', 'repeat', 'space', 'round', 'no-repeat'], // 260
  maskSize: ['cover', 'contain'], // 261
  maskType: ['luminance', 'alpha'], // 262
  mathDepth: ['auto-add'], // 263
  mathStyle: ['normal', 'compact'], // 264
  maxBlockSize: ['none', ...lengthSubValues], // 265
  minBlockSize: ['none', ...lengthSubValues], // 266
  maxInlineSize: ['none', ...lengthSubValues], // 267
  minInlineSize: ['none', ...lengthSubValues], // 268
  mixBlendMode: [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity',
    'plus-darker',
    'plus-lighter',
  ], // 269

  objectFit: ['none', 'contain', 'cover', 'fill', 'scale-down'], // 270
  objectPosition: ['top', 'bottom', 'left', 'right', 'center'], // 271
  offset: [], // 272
  offsetAnchor: ['auto'], // 273
  offsetDistance: [], // 274
  offsetPath: [], // 275
  offsetPosition: [], // 276
  offsetRotate: ['auto', 'reverse'], // 277
  order: [], // 278
  outline: [], // 279
  // outlineColor: [], // single coloer group
  outlineOffset: [], // 280
  outlineStyle: [...lineStyle.filter((style) => style !== 'hidden')], // 281
  outlineWidth: [...widthKeywords], // 282
  overflow: [...overflowKeyword], // 283
  overflowAnchor: ['none', 'auto'], // 284
  overflowBlock: [...overflowKeyword], // 285
  overflowClipMargin: ['content-box', 'padding-box', 'border-box'], // 286
  overflowInline: [...overflowKeyword], // 287
  overflowWrap: ['normal', 'anywhere', 'break-word'], // 288
  overflowX: [...overflowKeyword], // 289
  overflowY: [...overflowKeyword], // 290
  overscrollBehavior: ['none', 'auto', 'contain'], // 291
  overscrollBehaviorBlock: ['none', 'auto', 'contain'], // 292
  overscrollBehaviorInline: ['none', 'auto', 'contain'], // 293
  overscrollBehaviorX: ['none', 'auto', 'contain'], // 294
  overscrollBehaviorY: ['none', 'auto', 'contain'], // 295
  paddingBlock: [], // 296
  paddingBlockEnd: [], // 297
  paddingBlockStart: [], // 298
  paddingInline: [], // 299
  paddingInlineEnd: [], // 300
  paddingInlineStart: [], // 301
  paintOrder: ['normal'], // 302
  perspective: ['none'], // 303
  placeContent: [], // 304
  placeItems: [], // 292, // 305
  placeSelf: [], // 306
  pointerEvents: [
    'none',
    'auto',
    'all',
    'bounding-box',
    'visiblePainted',
    'visibleFill',
    'visibleStroke',
    'visible',
    'painted',
    'fill',
    'stroke',
  ], // 307
  printColorAdjust: ['economy', 'exact'], // 308
  quotes: ['none', 'auto', 'match-parent'], // 309
  r: [], // 310
  resize: ['none', 'both', 'horizontal', 'vertical', 'block', 'inline'], // 311
  rotate: ['none'], // 312
  rowGap: [], // 313
  rubyAlign: ['start', 'center', 'space-between', 'space-around'], // 314
  rubyPosition: [
    'over',
    'under',
    'alternate',
    'alternate over',
    'alternate under',
    'inter-character',
  ], // 315
  rx: ['auto'], // 316
  ry: ['auto'], // 317
  scale: ['none'], // 318
  scrollBehavior: ['auto', 'smooth'], // 319
  scrollMargin: [], // 320
  scrollMarginBlock: [], // 321
  scrollMarginBlockEnd: [], // 322
  scrollMarginBlockStart: [], // 323
  scrollMarginInline: [], // 324
  scrollMarginInlineEnd: [], // 325
  scrollMarginInlineStart: [], // 326
  scrollMarginTop: [], // 327
  scrollMarginRight: [], // 328
  scrollMarginBottom: [], // 329
  scrollMarginLeft: [], // 330
  scrollPadding: [], // 331
  scrollPaddingBlock: [], // 332
  scrollPaddingBlockEnd: [], // 333
  scrollPaddingBlockStart: [], // 334
  scrollPaddingInline: [], // 335
  scrollPaddingInlineEnd: [], // 336
  scrollPaddingInlineStart: [], // 337
  scrollPaddingLeft: [], // 338
  scrollPaddingRight: [], // 339
  scrollPaddingTop: [], // 340
  scrollPaddingBottom: [], // 341
  scrollSnapAlign: [
    'none',
    'start',
    'end',
    'center',
    // 'start start',
    // 'start center',
    // 'start end',
    // 'center start',
    // 'center center',
    // 'center end',
    // 'end start',
    // 'end center',
    // 'end end',
  ], // 342
  scrollSnapStop: ['normal', 'always'], // 343
  scrollSnapType: [
    'none',
    'x',
    'y',
    'block',
    'inline',
    'both',
    // 'x mandatory',
    // 'x proximity',
    // 'y mandatory',
    // 'y proximity',
    // 'block mandatory',
    // 'block proximity',
    // 'inline mandatory',
    // 'inline proximity',
    // 'both mandatory',
    // 'both proximity',
  ], // 344
  scrollbarColor: ['auto'], // 345
  scrollbarGutter: ['auto', 'stable', 'stable both-edges'], // 346
  scrollbarWidth: ['none', 'auto', 'thin'], // 347
  shapeImageThreshold: [], // 348
  shapeMargin: [], // 349
  shapeOutside: ['none'], // 350
  shapeRendering: ['auto', 'optimizeSpeed', 'crispEdges', 'geometricPrecision'], // 351
  stopColor: [], // 352
  stopOpacity: [], // 353
  stroke: ['context-stroke'], // 354
  strokeDasharray: ['none'], // 355
  strokeDashoffset: ['none'], // 356
  strokeLinecap: ['butt', 'round', 'square'], // 357
  strokeLinejoin: ['miter', 'round', 'bevel'], // 358
  strokeMiterlimit: [], // 359
  strokeOpacity: [], // 360
  strokeWidth: [], // 361
  tabSize: [], // 362
  tableLayout: ['auto', 'fixed'], // 363
  textAlign: [...alignKeywords], // 364
  textAlignLast: ['auto', ...alignKeywords], // 365
  textAnchor: ['start', 'middle', 'end'], // 366
  textCombineUpright: ['none', 'all'], // 367
  textDecorationLine: [
    'none',
    'underline',
    'overline',
    'line-through',
    'blink',
  ], // 368
  textDecorationSkipInk: ['none', 'auto', 'all'], // 369
  textDecorationStyle: ['solid', 'double', 'dotted', 'dashed', 'wavy'], // 370
  textDecorationThickness: ['auto', 'from-font'], // 371
  textEmphasis: [
    'none',
    'filled',
    'open',
    'dot',
    'circle',
    'double-circle',
    'triangle',
    'sesame',
  ], // 372
  textEmphasisColor: [], // 373
  textEmphasisPosition: [
    'auto',
    'over',
    'under',
    // 'over right',
    // 'over left',
    // 'under right',
    // 'under left',
    // 'left over',
    // 'right over',
    // 'right under',
    // 'left under',
  ], // 374
  textEmphasisStyle: [
    'none',
    'filled',
    'open',
    'dot',
    'circle',
    'double-circle',
    'triangle',
    'sesame',
    // 'filled dot',
    // 'filled circle',
    // 'filled double-circle',
    // 'filled triangle',
    // 'filled sesame',
    // 'open dot',
    // 'open circle',
    // 'open double-circle',
    // 'open triangle',
    // 'open sesame',
  ], // 375
  textIndent: [], // 376
  textJustify: ['none', 'auto', 'inter-word', 'inter-character', 'distribute'], // 377
  textOrientation: [
    'mixed',
    'upright',
    'sideways',
    'sideways-right',
    'use-glyph-orientation',
  ], // 378
  textOverflow: ['clip', 'ellipsis'], // 379
  textRendering: [
    'auto',
    'optimizeSpeed',
    'optimizeLegibility',
    'geometricPrecision',
  ], // 380
  textShadow: [], // 381
  textSizeAdjust: ['none', 'auto'], // 382
  textTransform: [
    'none',
    'captalize',
    'uppercase',
    'lowercase',
    'full-width',
    'full-size-kana',
    'math-auto',
  ], // 383
  textUnderlineOffset: ['auto'], // 384
  textUnderlinePosition: [
    'auto',
    'under',
    'left',
    'right',
    'under left',
    'left under',
    'under right',
    'right under',
  ], // 385
  textWrap: [
    'auto',
    'wrap',
    'nowrap',
    'balance',
    'pretty',
    'stable',
    'avoid-orphans',
  ], // 386
  textWrapMode: ['wrap', 'nowrap'], // 387
  textWrapStyle: ['auto', 'balance', 'stable', 'pretty', 'avoid-orphans'], // 388
  touchAction: ['auto', 'none'], // 389
  transform: ['none'], // 390
  transformBox: [
    'content-box',
    'border-box',
    'fill-box',
    'stroke-box',
    'view-box',
  ], // 391
  transformOrigin: [], // 392
  transformStyle: ['flat', 'preserve-3d'], // 393
  transition: [], // 394
  transitionBehavior: ['normal', 'allow-discrete'], // 395
  transitionDelay: [], // 396
  transitionDuration: [], // 397
  transitionProperty: ['none', 'all'], // 398
  transitionTimingFunction: [], // 399
  translate: ['none'], // 400
  unicodeBidi: [
    'normal',
    'embed',
    'isolate',
    'bidi-override',
    'isolate-override',
    'plaintext',
  ], // 401
  userSelect: ['none', 'auto', 'text', 'all'], // 402
  vectorEffect: [
    'none',
    'non-scaling-stroke',
    'non-scaling-size',
    'non-rotation',
    'fixed-position',
  ], // 403
  verticalAlign: [
    'baseline',
    'sub',
    'super',
    'text-top',
    'text-bottom',
    'middle',
    'top',
    'bottom',
  ], // 404
  visibility: ['visible', 'hideen', 'collapse'], // 405
  whiteSpace: [
    'normal',
    'pre',
    'nowrap',
    'pre-wrap',
    'break-spaces',
    'pre-line',
  ], // 406
  whiteSpaceCollapse: [
    'collapse',
    'discard',
    'preserve',
    'preserve-breaks',
    'preserve-spaces',
    'break-spaces',
  ], // 407
  widows: [], // 408
  willChange: [], // 409
  wordBreak: ['normal', 'keep-all', 'break-all', 'break-word', 'auto-phrase'], // 410
  writingMode: [
    'horizontal-tb',
    'vertical-rl',
    'vertical-lr',
    'sideways-rl',
    'sideways-lr',
  ], // 411
  zoom: ['normal', 'reset'], // 412
};

export { validData };
