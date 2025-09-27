/* eslint-disable @plumeria/sort-properties */
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
  ], // 4
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
  ], // 5
  animationDelay: [], // <times># // 6
  animationDirection: [], // Single animation# // 7
  animationDuration: ['auto'], // auto, <times># // 8
  animationFillMode: [], // Single animation# // 9
  animationIterationCount: [], // <number|infinite># // 10
  animationName: ['none', 'slide', 'bounce'], // <custom-indent> | <string># // 11
  animationPlayState: [], // paused running # // 12
  animationTimingFunction: [], // <easing keyword | cubic-bezier() | linear() | steps()># // 13
  aspectRatio: ['auto'], // 14

  backdropFilter: ['none'], // 15
  backfaceVisibility: ['visible', 'hidden'], // 16
  background: ['none'], // 17
  backgroundAttachment: [], // 18
  backgroundBlendMode: [], // <brend-mode># // 19
  backgroundClip: ['text', 'border-area'], // 20
  backgroundImage: ['none'], // 21
  backgroundOrigin: [], // 22
  backgroundPosition: [], // 23
  backgroundPositionX: [], // 24
  backgroundPositionY: [], // 25
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
  ], // 26
  backgroundSize: ['auto', 'cover', 'contain'], // 27
  blockSize: ['auto'], // 28
  boxDecorationBreak: ['slice', 'clone'], // 29
  boxShadow: [], // 30
  boxSizing: ['content-box', 'border-box'], // 31
  breakAfter: [...breakBeforeAfterValues], // 32
  breakBefore: [...breakBeforeAfterValues], // 33
  breakInside: ['auto', 'avoid', 'avoid-page', 'avoid-column', 'avoid-region'], // 34
  // single value
  top: ['auto'], // 35
  right: ['auto'], // 36
  bottom: ['auto'], // 37
  left: ['auto'], // 38
  marginTop: ['auto'], // 39
  marginRight: ['auto'], // 40
  marginBottom: ['auto'], // 41
  marginLeft: ['auto'], // 42
  paddingTop: [], // 43
  paddingRight: [], // 44
  paddingBottom: [], // 45
  paddingLeft: [], // 46
  borderTopWidth: [...widthKeywords], // 47
  borderBottomWidth: [...widthKeywords], //48
  borderLeftWidth: [...widthKeywords], // 49
  borderRightWidth: [...widthKeywords], // 50
  borderTopStyle: ['none', ...lineStyle], // 51
  borderBottomStyle: ['none', ...lineStyle], // 52
  borderLeftStyle: ['none', ...lineStyle], // 53
  borderRightStyle: ['none', ...lineStyle], // 54
  borderBlockStyle: [...lineStyle], // 55
  borderBlockStartStyle: [...lineStyle], // 56
  borderBlockEndStyle: [...lineStyle], // 57
  borderBlockStartWidth: [...widthKeywords], // 58
  borderBlockEndWidth: [...widthKeywords], // 59
  borderInlineStyle: [...lineStyle], // 60
  borderInlineStartStyle: [...lineStyle], // 61
  borderInlineEndStyle: [...lineStyle], // 62
  borderInlineStartWidth: [...widthKeywords], // 63
  borderInlineEndWidth: [...widthKeywords], // 64
  borderCollapse: ['collapse', 'separate'], // 65
  borderImageSource: ['none'], // 66
  lineHeight: ['normal'], // 67
  letterSpacing: ['normal'], // 68
  wordSpacing: ['normal'], //69
  opacity: [], // 70
  zIndex: ['auto'], // 71
  fontSize: [...fontSizeSubValues], // 72
  fontWeight: ['normal', 'bold', 'lighter', 'bolder'], // 73

  // length value
  maxWidth: ['none', 'stretch', ...lengthSubValues], // 74
  maxHeight: ['none', 'stretch', ...lengthSubValues], // 75
  minWidth: ['none', 'stretch', ...lengthSubValues], // 76
  minHeight: ['none', 'stretch', ...lengthSubValues], // 77
  width: ['auto', 'stretch', ...lengthSubValues], // 78
  height: ['auto', 'stretch', ...lengthSubValues], // 79
  flexBasis: ['auto', 'content', ...lengthSubValues], // 80

  // multiple value
  gap: [], // 81
  inset: ['auto'], // 82
  margin: ['auto'], // 83
  padding: [], // 84
  border: [...widthKeywords, ...lineStyle], // 85
  borderTop: [...widthKeywords, ...lineStyle], // 86
  borderBottom: [...widthKeywords, ...lineStyle], // 87
  borderLeft: [...widthKeywords, ...lineStyle], // 88
  borderRight: [...widthKeywords, ...lineStyle], // 89
  borderBlock: [...widthKeywords, ...lineStyle], // 90
  borderBlockStart: [...widthKeywords, ...lineStyle], // 91
  borderBlockEnd: [...widthKeywords, ...lineStyle], // 92
  borderInline: [...widthKeywords, ...lineStyle], // 93
  borderInlineStart: [...widthKeywords, ...lineStyle], // 94
  borderInlineEnd: [...widthKeywords, ...lineStyle], // 95
  borderWidth: [...widthKeywords], // 96
  borderBlockWidth: [...widthKeywords], // 97
  borderInlineWidth: [...widthKeywords], // 98
  borderStyle: [...lineStyle], // 99
  borderSpacing: [], // 100
  borderEndEndRadius: [], // 101
  borderEndStartRadius: [], // 102
  borderStartEndRadius: [], // 103
  borderStartStartRadius: [], // 104
  borderTopLeftRadius: [], // 105
  borderTopRightRadius: [], // 106
  borderBottomLeftRadius: [], // 107
  borderBottomRightRadius: [], // 108
  borderImageWidth: ['auto'], // 109
  // borderRadius
  borderRadius: [], // 110

  // borderImage
  borderImage: ['none'], // 111

  // borderImageSlice
  borderImageSlice: ['fill'], // 112

  // borderImageSlice
  borderImageRepeat: [], // 113

  // borderImageOutset
  borderImageOutset: [], // 114

  // singleColor
  accentColor: ['auto'], // 115
  color: [], // 116
  borderLeftColor: [], // 117
  borderRightColor: [], // 118
  borderTopColor: [], // 119
  borderBottomColor: [], // 120
  borderBlockColor: [], // 121
  borderBlockStartColor: [], // 122
  borderBlockEndColor: [], // 123
  borderInlineColor: [], // 124
  borderInlineStartColor: [], // 125
  borderInlineEndColor: [], // 126
  backgroundColor: [], // 127
  outlineColor: [], // 128
  textDecorationColor: [], // 129
  caretColor: ['auto'], // 130
  columnRuleColor: [], // 131

  // borderColor
  borderColor: [], // 4 value // 132

  // AB is done. next Alphabet C continue
  captionSide: ['top', 'bottom'], // 133
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
  ], // 134
  clipPath: [], // 135
  clipRule: ['nonzero', 'evenodd'], // 136
  colorScheme: ['normal', 'dark', 'light'], // 137
  columnCount: ['auto'], // 138
  columnFill: ['auto', 'balance'], // 139
  columnGap: [], // 140
  columnRule: [], // 141 // use border function
  columnRuleStyle: [...lineStyle], // 142
  columnRuleWidth: [], // 143
  columnSpan: ['none', 'all'], // 144
  columnWidth: ['auto'], // 145
  columns: [], // 146
  content: [
    'open-quote',
    'close-quote',
    'no-open-quote',
    'no-close-quote',
    'normal',
    'none',
  ], // 147
  counterIncrement: ['none'], // 148
  counterReset: ['none'], // 149
  counterSet: ['none'], // 150
  cursor: ['auto'], // 151

  position: ['static', 'relative', 'absolute', 'fixed', 'sticky'], // 152
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
  ], // 153
  emptyCells: ['show', 'hide'], // 154
  filter: ['none'], // 155
  flex: ['none'], // 156
  flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'], // 157
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
  ], // 158
  flexGrow: [], // 159
  flexShrink: [], // 160
  flexWrap: ['nowrap', 'wrap', 'wrap-reverse'], // 161
  float: ['inline-start', 'inline-end', 'left', 'none', 'right'], // 162
  font: ['none'], // 163
  fontFamily: [], // 164
  fontFeatureSettings: [], // 165
  fontKerning: ['auto', 'normal', 'none'], // 166
  fontLanguageOverride: ['normal'], // 167
  fontOpticalSizing: ['auto', 'none'], // 168
  fontPalette: ['normal', 'light', 'dark'], // 169
  fontSizeAdjust: ['none'], // 170
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
  ], // 171
  fontStyle: ['normal', 'italic', 'oblique'], // 172
  fontSynthesis: ['none', 'weight', 'style', 'small-caps', 'position'], // 173
  fontSynthesisSmallCaps: ['auto', 'none'], // 174
  fontSynthesisStyle: ['auto', 'none'], // 175
  fontSynthesisWeight: ['auto', 'none'], // 176
  fontVariant: ['normal', 'none'], // 177
  fontVariantAlternates: ['normal', 'historical-forms'], // 178
  fontVariantCaps: [
    'normal',
    'small-caps',
    'all-small-caps',
    'petite-caps',
    'all-petite-caps',
    'unicase',
    'titling-caps',
  ], // 179
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
  ], // 180
  fontVariantEmoji: ['normal', 'text', 'emoji', 'unicode'], // 181
  fontVariantLigatures: ['none', 'normal'], // 182
  fontVariantNumeric: ['normal'], // 183
  fontVariantPosition: ['normal', 'sub', 'super'], // 184
  fontVariationSettings: [
    'normal',
    '"wght"',
    '"wdth"',
    '"slnt"',
    '"ital"',
    '"opsz"',
  ], // 185
  grid: ['none'], // 186
  gridArea: ['auto'], //187
  gridAutoColumns: ['auto'], // 188
  gridAutoFlow: ['row', 'column', 'dense', 'row dense', 'column dense'], // 189
  gridAutoRows: ['auto'], // 190
  gridColumn: ['auto'], // 191
  gridColumnEnd: ['auto'], // 192
  gridColumnStart: ['auto'], // 193
  gridRow: ['auto'], // 194
  gridRowEnd: ['auto'], // 195
  gridRowStart: ['auto'], // 196
  gridTemplate: ['none'], // 197
  gridTemplateAreas: ['none'], // 198
  gridTemplateColumns: ['none'], // 199
  gridTemplateRows: ['none'], // 200

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
  ], // 201
  hyphenateCharacter: ['auto'], // 202
  hyphenateLimitChars: ['auto'], // 203
  hyphens: ['none', 'manual', 'auto'], // 204
  imageOrientation: ['none', 'from-image'], // 205
  imageRendering: [
    'auto',
    'smooth',
    'high-quality',
    'crisp-edges',
    'pixelated',
  ], // 206
  initialLetter: ['normal'], // 207
  inlineSize: ['auto'], // 208
  insetBlock: ['auto'], // 209
  insetBlockEnd: ['auto'], // 210
  insetBlockStart: ['auto'], // 211
  insetInline: ['auto'], // 212
  insetInlineEnd: ['auto'], // 213
  insetInlineStart: ['auto'], // 214
  isolation: ['auto', 'isolate'], // 215
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
  ], // 216
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
  ], // 217
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
  ], // 218
  lineBreak: ['auto', 'loose', 'normal', 'strict', 'anywhere'], // 219
  listStyleImage: ['none'], // 220
  listStylePosition: ['inside', 'outside'], // 221
  listStyleType: ['none'], // 222
  marginBlock: ['auto'], // 223
  marginBlockEnd: ['auto'], // 224
  marginBlockStart: ['auto'], // 225
  marginInline: ['auto'], // 226
  marginInlineEnd: ['auto'], // 227
  marginInlineStart: ['auto'], // 228
  marker: ['none'], // 229
  markerEnd: ['none'], // 230
  markerMid: ['none'], // 231
  markerStart: ['none'], // 232
  mask: ['none'], // 233
  maskBorder: ['none'], // 234
  maskBorderMode: ['luminance', 'alpha'], // 235
  maskBorderOutset: [], // 236
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
  ], // 237
  maskBorderSlice: ['fill'], // 238
  maskBorderSource: ['none'], // 239
  maskBorderWidth: ['auto'], // 240
  maskClip: ['no-clip'], // 241
  maskComposite: ['add', 'subtract', 'intersect', 'exclude'], // 242
  maskImage: ['none'], // 243
  maskMode: ['alpha', 'luminance', 'match-source'], // 244
  maskOrigin: [], // 245
  maskPosition: ['top', 'bottom', 'left', 'right', 'center'], // 246
  maskRepeat: [], // 247
  maskSize: ['cover', 'contain'], // 248
  maskType: ['luminance', 'alpha'], // 249
  mathDepth: ['auto-add'], // 250
  mathStyle: ['normal', 'compact'], // 251
  maxBlockSize: ['none', ...lengthSubValues], // 252
  minBlockSize: ['none', ...lengthSubValues], // 253
  maxInlineSize: ['none', ...lengthSubValues], // 254
  minInlineSize: ['none', ...lengthSubValues], // 255
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
  ], // 256

  objectFit: ['none', 'contain', 'cover', 'fill', 'scale-down'], // 257
  objectPosition: ['top', 'bottom', 'left', 'right', 'center'], // 258
  offset: [], // 259
  offsetAnchor: ['auto'], // 260
  offsetDistance: [], // 261
  offsetPath: [], // 262
  offsetPosition: [], // 263
  offsetRotate: ['auto', 'reverse'], // 264
  order: [], // 265
  outline: [], // 266
  // outlineColor: [], // single coloer group
  outlineOffset: [], // 267
  outlineStyle: [...lineStyle.filter((style) => style !== 'hidden')], // 268
  outlineWidth: [...widthKeywords], // 269
  overflow: [...overflowKeyword], // 270
  overflowAnchor: ['none', 'auto'], // 271
  overflowBlock: [...overflowKeyword], // 272
  overflowClipMargin: ['content-box', 'padding-box', 'border-box'], // 273
  overflowInline: [...overflowKeyword], // 274
  overflowWrap: ['normal', 'anywhere', 'break-word'], // 275
  overflowX: [...overflowKeyword], // 276
  overflowY: [...overflowKeyword], // 277
  overscrollBehavior: ['none', 'auto', 'contain'], // 278
  overscrollBehaviorBlock: ['none', 'auto', 'contain'], // 279
  overscrollBehaviorInline: ['none', 'auto', 'contain'], // 280
  overscrollBehaviorX: ['none', 'auto', 'contain'], // 281
  overscrollBehaviorY: ['none', 'auto', 'contain'], // 282
  paddingBlock: [], // 283
  paddingBlockEnd: [], // 284
  paddingBlockStart: [], // 285
  paddingInline: [], // 286
  paddingInlineEnd: [], // 287
  paddingInlineStart: [], // 288
  paintOrder: ['normal'], // 289
  perspective: ['none'], // 290
  placeContent: [], // 291
  placeItems: [], // 292,
  placeSelf: [], // 293
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
  ], // 294
  printColorAdjust: ['economy', 'exact'], // 295
  quotes: ['none', 'auto', 'match-parent'], // 296
  r: [], // 297
  resize: ['none', 'both', 'horizontal', 'vertical', 'block', 'inline'], // 298
  rotate: ['none'], // 299
  rowGap: [], // 300
  rubyAlign: ['start', 'center', 'space-between', 'space-around'], // 301
  rubyPosition: [
    'over',
    'under',
    'alternate',
    'alternate over',
    'alternate under',
    'inter-character',
  ], // 302
  rx: ['auto'], // 303
  ry: ['auto'], // 304
  scale: ['none'], // 305
  scrollBehavior: ['auto', 'smooth'], // 306
  scrollMargin: [], // 307
  scrollMarginBlock: [], // 308
  scrollMarginBlockEnd: [], // 309
  scrollMarginBlockStart: [], // 310
  scrollMarginInline: [], // 311
  scrollMarginInlineEnd: [], // 312
  scrollMarginInlineStart: [], // 313
  scrollMarginTop: [], // 314
  scrollMarginRight: [], // 315
  scrollMarginBottom: [], // 316
  scrollMarginLeft: [], // 317
  scrollPadding: [], // 318
  scrollPaddingBlock: [], // 319
  scrollPaddingBlockEnd: [], // 320
  scrollPaddingBlockStart: [], // 321
  scrollPaddingInline: [], // 322
  scrollPaddingInlineEnd: [], // 323
  scrollPaddingInlineStart: [], // 324
  scrollPaddingLeft: [], // 325
  scrollPaddingRight: [], // 326
  scrollPaddingTop: [], // 327
  scrollPaddingBottom: [], // 328
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
  ], // 329
  scrollSnapStop: ['normal', 'always'], // 330
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
  ], // 331
  scrollbarColor: ['auto'], // 332
  scrollbarGutter: ['auto', 'stable', 'stable both-edges'], // 333
  scrollbarWidth: ['none', 'auto', 'thin'], // 334
  shapeImageThreshold: [], // 335
  shapeOutSide: ['none'], // 336
  shapeRendering: ['auto', 'optimizeSpeed', 'crispEdges', 'geometricPrecision'], // 337
  stopColor: [], // 338
  stopOpacity: [], // 339
  stroke: ['context-stroke'], // 340
  strokeDasharray: ['none'], // 341
  strokeDashoffset: ['none'], // 342
  strokeLinecap: ['butt', 'round', 'square'], // 343
  strokeLinejoin: ['miter', 'round', 'bevel'], // 344
  strokeMiterlimit: [], // 345
  strokeOpacity: [], // 346
  strokeWidth: [], // 347
  tabSize: [], // 348
  tableLayout: ['auto', 'fixed'], // 349
  textAlign: [...alignKeywords], // 350
  textAlignLast: ['auto', ...alignKeywords], // 351
  textAnchor: ['start', 'middle', 'end'], // 352
  textCombineUpright: ['none', 'all'], // 353
  textDecorationLine: [
    'none',
    'underline',
    'overline',
    'line-through',
    'blink',
  ], // 354
  textDecorationSkipInk: ['none', 'auto', 'all'], // 355
  textDecorationStyle: ['solid', 'double', 'dotted', 'dashed', 'wavy'], // 356
  textDecorationThickness: ['auto', 'from-font'], // 357
  textEmphasis: [
    'none',
    'filled',
    'open',
    'dot',
    'circle',
    'double-circle',
    'triangle',
    'sesame',
  ], // 358
  textEmphasisColor: [], // 359
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
  ], // 360
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
  ], // 361
  textIndent: [], // 362
  textJustify: ['none', 'auto', 'inter-word', 'inter-character', 'distribute'], // 363
  textOrientation: [
    'mixed',
    'upright',
    'sideways',
    'sideways-right',
    'use-glyph-orientation',
  ], // 364
  textOverflow: ['clip', 'ellipsis'], // 365
  textRendering: [
    'auto',
    'optimizeSpeed',
    'optimizeLegibility',
    'geometricPrecision',
  ], // 366
  textShadow: [], // 367
  textTransform: [
    'none',
    'captalize',
    'uppercase',
    'lowercase',
    'full-width',
    'full-size-kana',
    'math-auto',
  ], // 368
  textUnderlineOffset: ['auto'], // 369
  textUnderlinePosition: [
    'auto',
    'under',
    'left',
    'right',
    'under left',
    'left under',
    'under right',
    'right under',
  ], // 370
  textWrap: [
    'auto',
    'wrap',
    'nowrap',
    'balance',
    'pretty',
    'stable',
    'avoid-orphans',
  ], // 371
  textWrapMode: ['wrap', 'nowrap'], // 372
  textWrapStyle: ['auto', 'balance', 'stable', 'pretty', 'avoid-orphans'], // 373
  touchAction: ['auto', 'none'], // 374
  transform: ['none'], // 375
  transformBox: [
    'content-box',
    'border-box',
    'fill-box',
    'stroke-box',
    'view-box',
  ], // 376
  transformOrigin: [], // 377
  transformStyle: ['flat', 'preserve-3d'], // 378
  transition: [], // 379
  transitionBehavior: ['normal', 'allow-discrete'], // 380
  transitionDelay: [], // 381
  transitionDuration: [], // 382
  transitionProperty: ['none', 'all'], // 383
  transitionTimingFunction: [], // 384
  translate: ['none'], // 385
  unicodeBibi: [
    'normal',
    'embed',
    'isolate',
    'bibi-override',
    'isolate-override',
    'plaintext',
  ], // 386
  userSelect: ['none', 'auto', 'text', 'all'], // 387
  vectorEffect: [
    'none',
    'non-scaling-stroke',
    'non-scaling-size',
    'non-rotation',
    'fixed-position',
  ], // 388
  verticalAlign: [
    'baseline',
    'sub',
    'super',
    'text-top',
    'text-bottom',
    'middle',
    'top',
    'bottom',
  ], // 389
  visibility: ['visible', 'hideen', 'collapse'], // 390
  whiteSpace: [
    'normal',
    'pre',
    'nowrap',
    'pre-wrap',
    'break-spaces',
    'pre-line',
  ], // 391
  whiteSpaceCollapse: [
    'collapse',
    'discard',
    'preserve',
    'preserve-breaks',
    'preserve-spaces',
    'break-spaces',
  ], // 392
  widows: [], // 393
  willChange: [], // 394
  wordBreak: ['normal', 'keep-all', 'break-all', 'break-word', 'auto-phrase'], // 395
  writingMode: [
    'horizontal-tb',
    'vertical-rl',
    'vertical-lr',
    'sideways-rl',
    'sideways-lr',
  ], // 396
  zoom: ['normal', 'reset'], // 397
};

export { validData };
