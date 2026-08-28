const easingKeywords = [
  'ease',
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'step-start',
  'step-end',
];
const timelineRangeNames = [
  'cover',
  'contain',
  'entry',
  'exit',
  'entry-crossing',
  'exit-crossing',
  'scroll',
];
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
const lengthSubValues = [
  'max-content',
  'min-content',
  'fit-content',
  'stretch',
  'contain',
];
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
  animationRange: ['normal', ...timelineRangeNames], // [<animation-range-start> <animation-range-end>?]#, // 14
  animationRangeEnd: ['normal', ...timelineRangeNames], // normal | <length-percentage> | <timeline-range-name> <length-percentage>?#, // 15
  animationRangeStart: ['normal', ...timelineRangeNames], // normal | <length-percentage> | <timeline-range-name> <length-percentage>?#, // 16
  animationTimeline: ['none', 'auto'], // none | auto | <dashed-ident> | scroll() | view()#, // 17
  animationTimingFunction: [...easingKeywords], // <easing keyword | cubic-bezier() | linear() | steps()>#, // 18
  aspectRatio: ['auto'], // 19

  backdropFilter: ['none'], // 20
  baselineShift: ['baseline', 'sub', 'super'], // 21
  backfaceVisibility: ['visible', 'hidden'], // 22
  background: ['none'], // 23
  backgroundAttachment: [], // 24
  backgroundBlendMode: [], // <brend-mode>#, // 25
  backgroundClip: ['text', 'border-area'], // 26
  backgroundImage: ['none'], // 27
  backgroundOrigin: [], // 28
  backgroundPosition: [], // 29
  backgroundPositionX: [], // 30
  backgroundPositionY: [], // 31
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
  ], // 32
  backgroundSize: ['auto', 'cover', 'contain'], // 33
  blockSize: ['auto', ...lengthSubValues], // 34
  boxDecorationBreak: ['slice', 'clone'], // 35
  boxShadow: ['none'], // 36
  boxSizing: ['content-box', 'border-box'], // 37
  breakAfter: [...breakBeforeAfterValues], // 38
  breakBefore: [...breakBeforeAfterValues], // 39
  breakInside: ['auto', 'avoid', 'avoid-page', 'avoid-column', 'avoid-region'], // 40
  // single value
  top: ['auto'], // 41
  right: ['auto'], // 42
  bottom: ['auto'], // 43
  left: ['auto'], // 44
  marginTop: ['auto'], // 45
  marginRight: ['auto'], // 46
  marginBottom: ['auto'], // 47
  marginLeft: ['auto'], // 48
  paddingTop: [], // 49
  paddingRight: [], // 50
  paddingBottom: [], // 51
  paddingLeft: [], // 52
  borderTopWidth: [...widthKeywords], // 53
  borderBottomWidth: [...widthKeywords], //48, // 54
  borderLeftWidth: [...widthKeywords], // 55
  borderRightWidth: [...widthKeywords], // 56
  borderTopStyle: ['none', ...lineStyle], // 57
  borderBottomStyle: ['none', ...lineStyle], // 58
  borderLeftStyle: ['none', ...lineStyle], // 59
  borderRightStyle: ['none', ...lineStyle], // 60
  borderBlockStyle: [...lineStyle], // 61
  borderBlockStartStyle: [...lineStyle], // 62
  borderBlockEndStyle: [...lineStyle], // 63
  borderBlockStartWidth: [...widthKeywords], // 64
  borderBlockEndWidth: [...widthKeywords], // 65
  borderInlineStyle: [...lineStyle], // 66
  borderInlineStartStyle: [...lineStyle], // 67
  borderInlineEndStyle: [...lineStyle], // 68
  borderInlineStartWidth: [...widthKeywords], // 69
  borderInlineEndWidth: [...widthKeywords], // 70
  borderCollapse: ['collapse', 'separate'], // 71
  borderImageSource: ['none'], // 72
  lineHeight: ['normal'], // 73
  letterSpacing: ['normal'], // 74
  wordSpacing: ['normal'], //69, // 75
  opacity: [], // 76
  zIndex: ['auto'], // 77
  fontSize: [...fontSizeSubValues], // 78
  fontWeight: ['normal', 'bold', 'lighter', 'bolder'], // 79

  // length value
  maxWidth: ['none', ...lengthSubValues], // 80
  maxHeight: ['none', ...lengthSubValues], // 81
  minWidth: ['auto', ...lengthSubValues], // 82
  minHeight: ['auto', ...lengthSubValues], // 83
  width: ['auto', ...lengthSubValues], // 84
  height: ['auto', ...lengthSubValues], // 85
  flexBasis: ['auto', 'content', ...lengthSubValues], // 86

  // multiple value
  gap: [], // 87
  inset: ['auto'], // 88
  margin: ['auto'], // 89
  padding: [], // 90
  border: [...widthKeywords, ...lineStyle], // 91
  borderTop: [...widthKeywords, ...lineStyle], // 92
  borderBottom: [...widthKeywords, ...lineStyle], // 93
  borderLeft: [...widthKeywords, ...lineStyle], // 94
  borderRight: [...widthKeywords, ...lineStyle], // 95
  borderBlock: [...widthKeywords, ...lineStyle], // 96
  borderBlockStart: [...widthKeywords, ...lineStyle], // 97
  borderBlockEnd: [...widthKeywords, ...lineStyle], // 98
  borderInline: [...widthKeywords, ...lineStyle], // 99
  borderInlineStart: [...widthKeywords, ...lineStyle], // 100
  borderInlineEnd: [...widthKeywords, ...lineStyle], // 101
  borderWidth: [...widthKeywords], // 102
  borderBlockWidth: [...widthKeywords], // 103
  borderInlineWidth: [...widthKeywords], // 104
  borderStyle: [...lineStyle], // 105
  borderSpacing: [], // 106
  borderEndEndRadius: [], // 107
  borderEndStartRadius: [], // 108
  borderStartEndRadius: [], // 109
  borderStartStartRadius: [], // 110
  borderTopLeftRadius: [], // 111
  borderTopRightRadius: [], // 112
  borderBottomLeftRadius: [], // 113
  borderBottomRightRadius: [], // 114
  borderImageWidth: ['auto'], // 115
  // borderRadius
  borderRadius: [], // 116

  // borderImage
  borderImage: ['none'], // 117

  // borderImageSlice
  borderImageSlice: ['fill'], // 118

  // borderImageSlice
  borderImageRepeat: [], // 119

  // borderImageOutset
  borderImageOutset: [], // 120

  // singleColor
  accentColor: ['auto'], // 121
  color: [], // 122
  borderLeftColor: [], // 123
  borderRightColor: [], // 124
  borderTopColor: [], // 125
  borderBottomColor: [], // 126
  borderBlockColor: [], // 127
  borderBlockStartColor: [], // 128
  borderBlockEndColor: [], // 129
  borderInlineColor: [], // 130
  borderInlineStartColor: [], // 131
  borderInlineEndColor: [], // 132
  backgroundColor: [], // 133
  outlineColor: [], // 134
  textDecorationColor: [], // 135
  caretColor: ['auto'], // 136
  columnRuleColor: [], // 137

  // borderColor
  borderColor: ['currentColor'], // 4 value, // 138

  // AB is done. next Alphabet C continue
  captionSide: ['top', 'bottom'], // 139
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
  ], // 140
  clipPath: ['none'], // 141
  clipRule: ['nonzero', 'evenodd'], // 142
  colorInterpolation: ['auto', 'sRGB', 'linearRGB'], // 143
  colorInterpolationFilters: ['auto', 'sRGB', 'linearRGB'], // 144
  colorScheme: ['normal', 'dark', 'light'], // 145
  columnCount: ['auto'], // 146
  columnFill: ['auto', 'balance'], // 147
  columnGap: [], // 148
  columnRule: [], // 141 // use border function, // 149
  columnRuleStyle: [...lineStyle], // 150
  columnRuleWidth: [], // 151
  columnSpan: ['none', 'all'], // 152
  columnWidth: ['auto', 'max-content', 'min-content'], // 153
  columns: [], // 154
  contain: [
    'none',
    'strict',
    'content',
    'size',
    'inline-size',
    'layout',
    'style',
    'paint',
  ], // 155
  containerType: ['size', 'inline-size', 'normal'], // 156
  content: [
    'open-quote',
    'close-quote',
    'no-open-quote',
    'no-close-quote',
    'normal',
    'none',
  ], // 157
  contentVisibility: ['visible', 'hidden', 'auto'], // 158
  counterIncrement: ['none'], // 159
  counterReset: ['none'], // 160
  counterSet: ['none'], // 161
  cursor: ['auto'], // 162

  direction: ['ltr', 'rtl'], // 163
  position: ['static', 'relative', 'absolute', 'fixed', 'sticky'], // 164
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
  ], // 165
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
  ], // 166
  emptyCells: ['show', 'hide'], // 167
  fill: ['none', 'currentColor'], // 168
  fillOpacity: [], // 169
  fillRule: ['nonzero', 'evenodd'], // 170
  filter: ['none'], // 171
  flex: ['none'], // 172
  flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'], // 173
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
  ], // 174
  flexGrow: [], // 175
  flexShrink: [], // 176
  flexWrap: ['nowrap', 'wrap', 'wrap-reverse'], // 177
  float: ['inline-start', 'inline-end', 'left', 'none', 'right'], // 178
  font: ['none'], // 179
  forcedColorAdjust: ['auto', 'none'], // 180
  fontFamily: [], // 181
  fontFeatureSettings: [], // 182
  fontKerning: ['auto', 'normal', 'none'], // 183
  fontLanguageOverride: ['normal'], // 184
  fontOpticalSizing: ['auto', 'none'], // 185
  fontPalette: ['normal', 'light', 'dark'], // 186
  fontSizeAdjust: ['none'], // 187
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
  ], // 188
  fontStyle: ['normal', 'italic', 'oblique'], // 189
  fontSynthesis: ['none', 'weight', 'style', 'small-caps', 'position'], // 190
  fontSynthesisSmallCaps: ['auto', 'none'], // 191
  fontSynthesisStyle: ['auto', 'none'], // 192
  fontSynthesisWeight: ['auto', 'none'], // 193
  fontVariant: ['normal', 'none'], // 194
  fontVariantAlternates: ['normal', 'historical-forms'], // 195
  fontVariantCaps: [
    'normal',
    'small-caps',
    'all-small-caps',
    'petite-caps',
    'all-petite-caps',
    'unicase',
    'titling-caps',
  ], // 196
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
  ], // 197
  fontVariantEmoji: ['normal', 'text', 'emoji', 'unicode'], // 198
  fontVariantLigatures: ['none', 'normal'], // 199
  fontVariantNumeric: ['normal'], // 200
  fontVariantPosition: ['normal', 'sub', 'super'], // 201
  fontVariationSettings: [
    'normal',
    '"wght"',
    '"wdth"',
    '"slnt"',
    '"ital"',
    '"opsz"',
  ], // 202
  grid: ['none'], // 203
  gridArea: ['auto'], //187, // 204
  gridAutoColumns: ['auto'], // 205
  gridAutoFlow: ['row', 'column', 'dense', 'row dense', 'column dense'], // 206
  gridAutoRows: ['auto'], // 207
  gridColumn: ['auto'], // 208
  gridColumnEnd: ['auto'], // 209
  gridColumnStart: ['auto'], // 210
  gridRow: ['auto'], // 211
  gridRowEnd: ['auto'], // 212
  gridRowStart: ['auto'], // 213
  gridTemplate: ['none'], // 214
  gridTemplateAreas: ['none'], // 215
  gridTemplateColumns: ['none'], // 216
  gridTemplateRows: ['none'], // 217

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
  ], // 218
  hyphenateCharacter: ['auto'], // 219
  hyphenateLimitChars: ['auto'], // 220
  hyphens: ['none', 'manual', 'auto'], // 221
  imageOrientation: ['none', 'from-image'], // 222
  imageRendering: [
    'auto',
    'smooth',
    'high-quality',
    'crisp-edges',
    'pixelated',
  ], // 223
  initialLetter: ['normal'], // 224
  inlineSize: ['auto', ...lengthSubValues], // 225
  insetBlock: ['auto'], // 226
  insetBlockEnd: ['auto'], // 227
  insetBlockStart: ['auto'], // 228
  insetInline: ['auto'], // 229
  insetInlineEnd: ['auto'], // 230
  insetInlineStart: ['auto'], // 231
  isolation: ['auto', 'isolate'], // 232
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
  ], // 233
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
  ], // 234
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
  ], // 235
  lineBreak: ['auto', 'loose', 'normal', 'strict', 'anywhere'], // 236
  listStyleImage: ['none'], // 237
  listStylePosition: ['inside', 'outside'], // 238
  listStyleType: ['none'], // 239
  marginBlock: ['auto'], // 240
  marginBlockEnd: ['auto'], // 241
  marginBlockStart: ['auto'], // 242
  marginInline: ['auto'], // 243
  marginInlineEnd: ['auto'], // 244
  marginInlineStart: ['auto'], // 245
  marker: ['none'], // 246
  markerEnd: ['none'], // 247
  markerMid: ['none'], // 248
  markerStart: ['none'], // 249
  mask: ['none'], // 250
  maskBorder: ['none'], // 251
  maskBorderMode: ['luminance', 'alpha'], // 252
  maskBorderOutset: [], // 253
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
  ], // 254
  maskBorderSlice: ['fill'], // 255
  maskBorderSource: ['none'], // 256
  maskBorderWidth: ['auto'], // 257
  maskClip: ['no-clip'], // 258
  maskComposite: ['add', 'subtract', 'intersect', 'exclude'], // 259
  maskImage: ['none'], // 260
  maskMode: ['alpha', 'luminance', 'match-source'], // 261
  maskOrigin: [], // 262
  maskPosition: ['top', 'bottom', 'left', 'right', 'center'], // 263
  maskRepeat: ['repeat-x', 'repeat-y', 'repeat', 'space', 'round', 'no-repeat'], // 264
  maskSize: ['cover', 'contain'], // 265
  maskType: ['luminance', 'alpha'], // 266
  mathDepth: ['auto-add'], // 267
  mathStyle: ['normal', 'compact'], // 268
  maxBlockSize: ['none', 'auto', ...lengthSubValues], // 269
  minBlockSize: ['none', 'auto', ...lengthSubValues], // 270
  maxInlineSize: ['none', 'auto', ...lengthSubValues], // 271
  minInlineSize: ['none', 'auto', ...lengthSubValues], // 272
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
  ], // 273

  objectFit: ['none', 'contain', 'cover', 'fill', 'scale-down'], // 274
  objectPosition: ['top', 'bottom', 'left', 'right', 'center'], // 275
  offset: [], // 276
  offsetAnchor: ['auto'], // 277
  offsetDistance: [], // 278
  offsetPath: [], // 279
  offsetPosition: [], // 280
  offsetRotate: ['auto', 'reverse'], // 281
  order: [], // 282
  outline: [], // 283
  // outlineColor: [], // single coloer group
  outlineOffset: [], // 284
  outlineStyle: [...lineStyle.filter((style) => style !== 'hidden')], // 285
  outlineWidth: [...widthKeywords], // 286
  overflow: [...overflowKeyword], // 287
  overflowAnchor: ['none', 'auto'], // 288
  overflowBlock: [...overflowKeyword], // 289
  overflowClipMargin: ['content-box', 'padding-box', 'border-box'], // 290
  overflowInline: [...overflowKeyword], // 291
  overflowWrap: ['normal', 'anywhere', 'break-word'], // 292
  overflowX: [...overflowKeyword], // 293
  overflowY: [...overflowKeyword], // 294
  overscrollBehavior: ['none', 'auto', 'contain'], // 295
  overscrollBehaviorBlock: ['none', 'auto', 'contain'], // 296
  overscrollBehaviorInline: ['none', 'auto', 'contain'], // 297
  overscrollBehaviorX: ['none', 'auto', 'contain'], // 298
  overscrollBehaviorY: ['none', 'auto', 'contain'], // 299
  paddingBlock: [], // 300
  paddingBlockEnd: [], // 301
  paddingBlockStart: [], // 302
  paddingInline: [], // 303
  paddingInlineEnd: [], // 304
  paddingInlineStart: [], // 305
  paintOrder: ['normal'], // 306
  perspective: ['none'], // 307
  placeContent: [], // 308
  placeItems: [], // 292, // 309
  placeSelf: [], // 310
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
  ], // 311
  printColorAdjust: ['economy', 'exact'], // 312
  quotes: ['none', 'auto', 'match-parent'], // 313
  r: [], // 314
  resize: ['none', 'both', 'horizontal', 'vertical', 'block', 'inline'], // 315
  rotate: ['none'], // 316
  rowGap: [], // 317
  rubyAlign: ['start', 'center', 'space-between', 'space-around'], // 318
  rubyPosition: [
    'over',
    'under',
    'alternate',
    'alternate over',
    'alternate under',
    'inter-character',
  ], // 319
  rx: ['auto'], // 320
  ry: ['auto'], // 321
  scale: ['none'], // 322
  scrollBehavior: ['auto', 'smooth'], // 323
  scrollMargin: [], // 324
  scrollMarginBlock: [], // 325
  scrollMarginBlockEnd: [], // 326
  scrollMarginBlockStart: [], // 327
  scrollMarginInline: [], // 328
  scrollMarginInlineEnd: [], // 329
  scrollMarginInlineStart: [], // 330
  scrollMarginTop: [], // 331
  scrollMarginRight: [], // 332
  scrollMarginBottom: [], // 333
  scrollMarginLeft: [], // 334
  scrollPadding: [], // 335
  scrollPaddingBlock: [], // 336
  scrollPaddingBlockEnd: [], // 337
  scrollPaddingBlockStart: [], // 338
  scrollPaddingInline: [], // 339
  scrollPaddingInlineEnd: [], // 340
  scrollPaddingInlineStart: [], // 341
  scrollPaddingLeft: [], // 342
  scrollPaddingRight: [], // 343
  scrollPaddingTop: [], // 344
  scrollPaddingBottom: [], // 345
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
  ], // 346
  scrollSnapStop: ['normal', 'always'], // 347
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
  ], // 348
  scrollbarColor: ['auto'], // 349
  scrollbarGutter: ['auto', 'stable', 'stable both-edges'], // 350
  scrollbarWidth: ['none', 'auto', 'thin'], // 351
  shapeImageThreshold: [], // 352
  shapeMargin: [], // 353
  shapeOutside: ['none'], // 354
  shapeRendering: ['auto', 'optimizeSpeed', 'crispEdges', 'geometricPrecision'], // 355
  stopColor: [], // 356
  stopOpacity: [], // 357
  stroke: ['context-stroke'], // 358
  strokeDasharray: ['none'], // 359
  strokeDashoffset: ['none'], // 360
  strokeLinecap: ['butt', 'round', 'square'], // 361
  strokeLinejoin: ['miter', 'round', 'bevel'], // 362
  strokeMiterlimit: [], // 363
  strokeOpacity: [], // 364
  strokeWidth: [], // 365
  tabSize: [], // 366
  tableLayout: ['auto', 'fixed'], // 367
  textAlign: [...alignKeywords], // 368
  textAlignLast: ['auto', ...alignKeywords], // 369
  textAnchor: ['start', 'middle', 'end'], // 370
  textCombineUpright: ['none', 'all'], // 371
  textDecorationLine: [
    'none',
    'underline',
    'overline',
    'line-through',
    'blink',
  ], // 372
  textDecorationSkipInk: ['none', 'auto', 'all'], // 373
  textDecorationStyle: ['solid', 'double', 'dotted', 'dashed', 'wavy'], // 374
  textDecorationThickness: ['auto', 'from-font'], // 375
  textEmphasis: [
    'none',
    'filled',
    'open',
    'dot',
    'circle',
    'double-circle',
    'triangle',
    'sesame',
  ], // 376
  textEmphasisColor: [], // 377
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
  ], // 378
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
  ], // 379
  textIndent: [], // 380
  textJustify: ['none', 'auto', 'inter-word', 'inter-character', 'distribute'], // 381
  textOrientation: [
    'mixed',
    'upright',
    'sideways',
    'sideways-right',
    'use-glyph-orientation',
  ], // 382
  textOverflow: ['clip', 'ellipsis'], // 383
  textRendering: [
    'auto',
    'optimizeSpeed',
    'optimizeLegibility',
    'geometricPrecision',
  ], // 384
  textShadow: ['none'], // 385
  textSizeAdjust: ['none', 'auto'], // 386
  textTransform: [
    'none',
    'capitalize',
    'uppercase',
    'lowercase',
    'full-width',
    'full-size-kana',
    'math-auto',
  ], // 387
  textUnderlineOffset: ['auto'], // 388
  textUnderlinePosition: [
    'auto',
    'under',
    'left',
    'right',
    'under left',
    'left under',
    'under right',
    'right under',
  ], // 389
  textWrap: [
    'auto',
    'wrap',
    'nowrap',
    'balance',
    'pretty',
    'stable',
    'avoid-orphans',
  ], // 390
  textWrapMode: ['wrap', 'nowrap'], // 391
  textWrapStyle: ['auto', 'balance', 'stable', 'pretty', 'avoid-orphans'], // 392
  touchAction: ['auto', 'none'], // 393
  transform: ['none'], // 394
  transformBox: [
    'content-box',
    'border-box',
    'fill-box',
    'stroke-box',
    'view-box',
  ], // 395
  transformOrigin: [], // 396
  transformStyle: ['flat', 'preserve-3d'], // 397
  transition: [], // 398
  transitionBehavior: ['normal', 'allow-discrete'], // 399
  transitionDelay: [], // 400
  transitionDuration: [], // 401
  transitionProperty: ['none', 'all'], // 402
  transitionTimingFunction: [...easingKeywords], // 403
  translate: ['none'], // 404
  unicodeBidi: [
    'normal',
    'embed',
    'isolate',
    'bidi-override',
    'isolate-override',
    'plaintext',
  ], // 405
  userSelect: ['none', 'auto', 'text', 'contain', 'all'], // 406
  vectorEffect: [
    'none',
    'non-scaling-stroke',
    'non-scaling-size',
    'non-rotation',
    'fixed-position',
  ], // 407
  verticalAlign: [
    'baseline',
    'sub',
    'super',
    'text-top',
    'text-bottom',
    'middle',
    'top',
    'bottom',
  ], // 408
  visibility: ['visible', 'hidden', 'collapse'], // 409
  whiteSpace: [
    'normal',
    'pre',
    'nowrap',
    'pre-wrap',
    'break-spaces',
    'pre-line',
  ], // 410
  whiteSpaceCollapse: [
    'collapse',
    'discard',
    'preserve',
    'preserve-breaks',
    'preserve-spaces',
    'break-spaces',
  ], // 411
  widows: [], // 412
  willChange: [], // 413
  wordBreak: ['normal', 'keep-all', 'break-all', 'break-word', 'auto-phrase'], // 414
  writingMode: [
    'horizontal-tb',
    'vertical-rl',
    'vertical-lr',
    'sideways-rl',
    'sideways-lr',
  ], // 415
  zoom: ['normal', 'reset'], // 416
};

export { validData };
