// reference: [https://github.com/stormwarning/stylelint-config-recess-order/blob/main/groups.js]
interface Group {
  properties: string[];
}

export const propertyGroups: Group[] = [
  {
    properties: ['composes'],
  },
  // Cascade and inheritance.
  {
    properties: ['all'],
  },
  // Positioned layout.
  {
    properties: [
      'position',
      'inset',
      'insetBlock',
      'insetBlockStart',
      'insetBlockEnd',
      'insetInline',
      'insetInlineStart',
      'insetInlineEnd',
      'top',
      'right',
      'bottom',
      'left',
      'zIndex',
      'float',
      'clear',
    ],
  },
  // Display.
  {
    properties: ['boxSizing', 'display', 'visibility'],
  },
  // Flexible box layout.
  {
    properties: [
      'flex',
      'flexGrow',
      'flexShrink',
      'flexBasis',
      'flexFlow',
      'flexDirection',
      'flexWrap',
      'WebkitBoxOrient',
    ],
  },
  // Grid layout.
  {
    properties: [
      'grid',
      'gridArea',
      'gridTemplate',
      'gridTemplateAreas',
      'gridTemplateRows',
      'gridTemplateColumns',
      'gridRow',
      'gridRowStart',
      'gridRowEnd',
      'gridColumn',
      'gridColumnStart',
      'gridColumnEnd',
      'gridAutoRows',
      'gridAutoColumns',
      'gridAutoFlow',
      'gridGap',
      'gridRowGap',
      'gridColumnGap',
    ],
  },
  // Box alignment.  Relates to both Flexbox and Grid layout.
  {
    properties: [
      'gap',
      'rowGap',
      'columnGap',
      'placeContent',
      'placeItems',
      'placeSelf',
      'alignContent',
      'alignItems',
      'alignSelf',
      'justifyContent',
      'justifyItems',
      'justifySelf',
    ],
  },
  // Order.
  {
    properties: ['order'],
  },
  // Box sizing.
  {
    properties: [
      'inlineSize',
      'minInlineSize',
      'maxInlineSize',
      'width',
      'minWidth',
      'maxWidth',
      'blockSize',
      'minBlockSize',
      'maxBlockSize',
      'height',
      'minHeight',
      'maxHeight',
      'aspectRatio',
    ],
  },
  // Box model.
  {
    properties: [
      'padding',
      'paddingBlock',
      'paddingBlockStart',
      'paddingBlockEnd',
      'paddingInline',
      'paddingInlineStart',
      'paddingInlineEnd',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'margin',
      'marginBlock',
      'marginBlockStart',
      'marginBlockEnd',
      'marginInline',
      'marginInlineStart',
      'marginInlineEnd',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
    ],
  },
  // Overflow.
  {
    properties: [
      'overflow',
      'overflowInline',
      'overflowBlock',
      'overflowX',
      'overflowY',
      'scrollbarGutter',
      'WebkitOverflowScrolling',
      'msOverflowX',
      'msOverflowY',
      'msOverflowStyle',
      'textOverflow',
      'WebkitLineClamp',
      'lineClamp',
      'scrollBehaviour',
    ],
  },
  // Overscroll behavior.
  {
    properties: [
      'overscrollBehavior',
      'overscrollBehaviorInline',
      'overscrollBehaviorBlock',
      'overscrollBehaviorX',
      'overscrollBehaviorY',
    ],
  },
  // Fonts.
  {
    properties: [
      'font',
      'fontFamily',
      'fontSize',
      'fontSizeAdjust',
      'fontVariationSettings',
      'fontStyle',
      'fontWeight',
      'fontOpticalSizing',
      'fontStretch',
      'fontFeatureSettings',
      'fontKerning',
      'fontVariant',
      'fontVariantLigatures',
      'fontVariantCaps',
      'fontVariantAlternates',
      'fontVariantNumeric',
      'fontVariantEastAsian',
      'fontVariantPosition',
      'WebkitFontSmoothing',
      'MozOsxFontSmoothing',
      'fontSmooth',
    ],
  },
  // Inline layout.
  {
    properties: [
      'lineHeight',
      'verticalAlign',
      'alignmentBaseline',
      'baselineShift',
      'dominantBaseline',
    ],
  },
  // Colors.
  {
    properties: [
      'color',
      'WebkitTextFillColor',
      'WebkitTextStroke',
      'WebkitTextStrokeWidth',
      'WebkitTextStrokeColor',
    ],
  },
  // Text.
  {
    properties: [
      'textAlign',
      'textAlignLast',
      'textJustify',
      'textIndent',
      'textTransform',
      'wordSpacing',
      'letterSpacing',
      'hyphens',
      'wordBreak',
      'textWrap',
      'wordWrap',
      'overflowWrap',
      'tabSize',
      'whiteSpace',
    ],
  },
  // Text decoration.
  {
    properties: [
      'textEmphasis',
      'textEmphasisColor',
      'textEmphasisStyle',
      'textEmphasisPosition',
      'textDecoration',
      'textDecorationLine',
      'textDecorationThickness',
      'textDecorationStyle',
      'textDecorationColor',
      'textUnderlinePosition',
      'textUnderlineOffset',
      'textShadow',
    ],
  },
  // Font loading.
  {
    properties: [
      'src',
      'fontDisplay',
      'unicodeRange',
      'sizeAdjust',
      'ascentOverride',
      'descentOverride',
      'lineGapOverride',
    ],
  },
  // Basic user interface.
  {
    properties: [
      'appearance',
      'accentColor',
      'pointerEvents',
      'msTouchAction',
      'touchAction',
      'cursor',
      'caretColor',
      'zoom',
      'resize',
      'userSelect',
      'WebkitUserSelect',
      'navIndex',
      'navUp',
      'navRight',
      'navDown',
      'navLeft',
      'outline',
      'outlineWidth',
      'outlineStyle',
      'outlineColor',
      'outlineOffset',
    ],
  },
  // Color adjustment.
  {
    properties: ['colorScheme'],
  },
  // Table.
  {
    properties: [
      'tableLayout',
      'emptyCells',
      'captionSide',
      'borderSpacing',
      'borderCollapse',
    ],
  },
  // Generated content.
  {
    properties: ['content', 'quotes'],
  },
  // Lists and counters.
  {
    properties: [
      'listStyle',
      'listStylePosition',
      'listStyleType',
      'listStyleImage',
      'counterReset',
      'counterSet',
      'counterIncrement',
    ],
  },
  // Scroll snap.
  {
    properties: [
      'scrollSnapType',
      'scrollSnapAlign',
      'scrollSnapStop',
      'scrollPadding',
      'scrollPaddingBlock',
      'scrollPaddingBlockStart',
      'scrollPaddingBlockEnd',
      'scrollPaddingInline',
      'scrollPaddingInlineStart',
      'scrollPaddingInlineEnd',
      'scrollPaddingTop',
      'scrollPaddingRight',
      'scrollPaddingBottom',
      'scrollPaddingLeft',
      'scrollMargin',
      'scrollMarginBlock',
      'scrollMarginBlockStart',
      'scrollMarginBlockEnd',
      'scrollMarginInline',
      'scrollMarginInlineStart',
      'scrollMarginInlineEnd',
      'scrollMarginTop',
      'scrollMarginRight',
      'scrollMarginBottom',
      'scrollMarginLeft',
    ],
  },
  // Scrollbars styling.
  {
    properties: ['scrollbarColor', 'scrollbarWidth'],
  },

  // Images.
  {
    properties: [
      'objectFit',
      'objectPosition',
      'msInterpolationMode',
      'imageOrientation',
      'imageRendering',
      'imageResolution',
    ],
  },
  // Backgrounds and borders.
  {
    properties: [
      'background',
      'backgroundColor',
      'backgroundImage',
      'backgroundRepeat',
      'backgroundAttachment',
      'backgroundPosition',
      'backgroundPositionX',
      'backgroundPositionY',
      'backgroundClip',
      'backgroundOrigin',
      'backgroundSize',
      'border',
      'borderColor',
      'borderStyle',
      'borderWidth',
      'borderBlock',
      'borderBlockStart',
      'borderBlockStartColor',
      'borderBlockStartStyle',
      'borderBlockStartWidth',
      'borderBlockEnd',
      'borderBlockEndColor',
      'borderBlockEndStyle',
      'borderBlockEndWidth',
      'borderInline',
      'borderInlineStart',
      'borderInlineStartColor',
      'borderInlineStartStyle',
      'borderInlineStartWidth',
      'borderInlineEnd',
      'borderInlineEndColor',
      'borderInlineEndStyle',
      'borderInlineEndWidth',
      'borderTop',
      'borderTopColor',
      'borderTopStyle',
      'borderTopWidth',
      'borderRight',
      'borderRightColor',
      'borderRightStyle',
      'borderRightWidth',
      'borderBottom',
      'borderBottomColor',
      'borderBottomStyle',
      'borderBottomWidth',
      'borderLeft',
      'borderLeftColor',
      'borderLeftStyle',
      'borderLeftWidth',
      'borderRadius',
      'borderStartStartRadius',
      'borderStartEndRadius',
      'borderEndStartRadius',
      'borderEndEndRadius',
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomRightRadius',
      'borderBottomLeftRadius',
      'borderImage',
      'borderImageSource',
      'borderImageSlice',
      'borderImageWidth',
      'borderImageOutset',
      'borderImageRepeat',
      'boxShadow',
    ],
  },

  // Compositing and blending.
  {
    properties: ['backgroundBlendMode', 'isolation', 'mixBlendMode'],
  },

  // Filter effects.
  {
    properties: ['filter', 'backdropFilter'],
  },

  // Masking.
  {
    properties: [
      'clip',
      'clipPath',
      'maskBorder',
      'maskBorderSource',
      'maskBorderSlice',
      'maskBorderWidth',
      'maskBorderOutset',
      'maskBorderRepeat',
      'maskBorderMode',
      'mask',
      'maskImage',
      'maskMode',
      'maskRepeat',
      'maskPosition',
      'maskClip',
      'maskOrigin',
      'maskSize',
      'maskComposite',
    ],
  },
  // Writing modes.
  {
    properties: ['writingMode'],
  },

  // SVG presentation attributes.
  {
    properties: [
      'textAnchor',
      'fill',
      'fillRule',
      'fillOpacity',
      'stroke',
      'strokeOpacity',
      'strokeWidth',
      'strokeLinecap',
      'strokeLinejoin',
      'strokeMiterlimit',
      'strokeDasharray',
      'strokeDashoffset',
      'colorInterpolation',
      'colorInterpolationFilters',
      'floodColor',
      'floodOpacity',
      'lightingColor',
      'markerStart',
      'markerMid',
      'markerEnd',
      'stopColor',
      'stopOpacity',
      'shapeRendering',
    ],
  },
  // Transforms.
  {
    properties: [
      'transform',
      'transformOrigin',
      'rotate',
      'scale',
      'translate',
      'perspective',
      'perspectiveOrigin',
    ],
  },
  // Transitions.
  {
    properties: [
      'transition',
      'transitionDelay',
      'transitionTimingFunction',
      'transitionDuration',
      'transitionProperty',
    ],
  },

  // Animations.
  {
    properties: [
      'animation',
      'animationName',
      'animationDuration',
      'animationTimingFunction',
      'animationDelay',
      'animationIterationCount',
      'animationDirection',
      'animationPlayState',
    ],
  },
  // Will change.
  {
    properties: ['willChange'],
  },

  // Fragmentation.
  {
    properties: [
      'breakBefore',
      'breakAfter',
      'breakInside',
      'widows',
      'orphans',
    ],
  },
];
