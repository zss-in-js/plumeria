/**
 * Based on Meta's StyleX CSS type definitions.
 * Extended from src/types/StyleXCSSTypes.js (https://github.com/facebook/stylex)
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type absoluteSize =
  | 'xx-small'
  | 'x-small'
  | 'small'
  | 'medium'
  | 'large'
  | 'x-large'
  | 'xx-large';
type accentColor = color;
type alignContent =
  | 'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'normal'
  | 'baseline'
  | 'first baseline'
  | 'last baseline'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch'
  | 'safe center'
  | 'unsafe center';
type alignItems =
  | 'normal'
  | 'stretch'
  | 'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'self-start'
  | 'self-end'
  | 'baseline'
  | 'first baseline'
  | 'last baseline'
  | 'safe center'
  | 'unsafe center';
type alignmentBaseline =
  | 'auto'
  | 'baseline'
  | 'before-edge'
  | 'text-before-edge'
  | 'middle'
  | 'central'
  | 'after-edge'
  | 'text-after-edge'
  | 'ideographic'
  | 'alphabetic'
  | 'hanging'
  | 'mathematical';
type alignSelf =
  | 'auto'
  | 'normal'
  | 'center'
  | 'start'
  | 'end'
  | 'self-start'
  | 'self-end'
  | 'flex-start'
  | 'flex-end'
  | 'baseline'
  | 'first baseline'
  | 'last baseline'
  | 'stretch'
  | 'safe center'
  | 'unsafe center';
type alignTracks = never;
type all = never;
type anchorName = never;
type animatableFeature = 'scroll-position' | 'contents';
type animation = never;
type animationComposition = never;
type animationDelay = time;
type animationDirection = singleAnimationDirection;
type animationDuration = time;
type animationFillMode = singleAnimationFillMode;
type animationIterationCount = singleAnimationIterationCount;
type animationName = singleAnimationName;
type animationPlayState = singleAnimationPlayState;
type animationRange = never;
type animationRangeEnd = never;
type animationRangeStart = never;
type animationTimeline = never;
type animationTimingFunction = singleTimingFunction;
type appearance = 'auto' | 'none' | 'textfield';
type aspectRatio = never;
type attachment = 'scroll' | 'fixed' | 'local';
type azimuth = never;
type backdropFilter = 'none';
type backfaceVisibility = 'visible' | 'hidden';
type background = finalBgLayer;
type backgroundAttachment = attachment;
type backgroundBlendMode = blendMode;
type backgroundClip = box | 'text';
type backgroundColor = color;
type backgroundImage = bgImage;
type backgroundOrigin = box;
type backgroundPosition = never;
type backgroundPositionX = never;
type backgroundPositionY = never;
type backgroundRepeat = repeatStyle;
type backgroundSize = bgSize;
type baselineShift = 'baseline' | 'sub' | 'super' | svgLength;
type behavior = never;
type bgImage = 'none';
type bgSize = 'cover' | 'contain';
type blendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';
type blockSize = width;
type border = borderWidth | brStyle | color;
type borderBlock = borderBlockEnd;
type borderBlockColor = borderBlockEndColor;
type borderBlockEnd = borderWidth | borderStyle | color;
type borderBlockEndColor = color;
type borderBlockEndStyle = borderStyle;
type borderBlockEndWidth = borderWidth;
type borderBlockStart = borderWidth | borderStyle | color;
type borderBlockStartColor = color;
type borderBlockStartStyle = borderStyle;
type borderBlockStartWidth = borderWidth;
type borderBlockStyle = borderBlockEndStyle;
type borderBlockWidth = borderBlockEndWidth;
type borderBottom = border;
type borderBottomColor = color;
type borderBottomLeftRadius = lengthPercentage;
type borderBottomRightRadius = lengthPercentage;
type borderBottomStyle = brStyle;
type borderBottomWidth = borderWidth;
type borderCollapse = 'collapse' | 'separate';
type borderColor = color;
type borderEndEndRadius = borderBottomRightRadius;
type borderEndStartRadius = borderBottomLeftRadius;
type borderImage = borderImageSource | borderImageSlice | borderImageRepeat;
type borderImageOutset = never;
type borderImageRepeat = never;
type borderImageSlice = 'fill';
type borderImageSource = 'none';
type borderImageWidth = never;
type borderInline = borderInlineEnd;
type borderInlineColor = borderInlineEndColor;
type borderInlineEnd = borderWidth | borderStyle | color;
type borderInlineEndColor = color;
type borderInlineEndStyle = borderStyle;
type borderInlineEndWidth = borderWidth;
type borderInlineStart = borderWidth | borderStyle | color;
type borderInlineStartColor = color;
type borderInlineStartStyle = borderStyle;
type borderInlineStartWidth = borderWidth;
type borderInlineStyle = borderInlineEndStyle;
type borderInlineWidth = borderInlineEndWidth;
type borderLeft = border;
type borderLeftColor = color;
type borderLeftStyle = brStyle;
type borderLeftWidth = borderWidth;
type borderRadius = lengthPercentage;
type borderRight = border;
type borderRightColor = color;
type borderRightStyle = brStyle;
type borderRightWidth = borderWidth;
type borderSpacing = never;
type borderStartEndRadius = borderTopRightRadius;
type borderStartStartRadius = borderTopLeftRadius;
type borderStyle = brStyle;
type borderTop = border;
type borderTopColor = color;
type borderTopLeftRadius = lengthPercentage;
type borderTopRightRadius = lengthPercentage;
type borderTopStyle = brStyle;
type borderTopWidth = borderWidth;
type borderWidth = 'thin' | 'medium' | 'thick';
type bottom = never;
type box = 'border-box' | 'padding-box' | 'content-box';
type boxAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type boxDecorationBreak = 'slice' | 'clone';
type boxDirection = 'normal' | 'reverse';
type boxFlex = never;
type boxFlexGroup = never;
type boxLines = 'single' | 'multiple';
type boxOrdinalGroup = never;
type boxOrient = 'horizontal' | 'vertical' | 'inline-axis' | 'block-axis';
type boxShadow = 'none';
type boxSizing = 'content-box' | 'border-box';
type boxSuppress = 'show' | 'discard' | 'hide';
type breakAfter =
  | 'auto'
  | 'avoid'
  | 'avoid-page'
  | 'page'
  | 'left'
  | 'right'
  | 'recto'
  | 'verso'
  | 'avoid-column'
  | 'column'
  | 'avoid-region'
  | 'region';
type breakBefore =
  | 'auto'
  | 'avoid'
  | 'avoid-page'
  | 'page'
  | 'left'
  | 'right'
  | 'recto'
  | 'verso'
  | 'avoid-column'
  | 'column'
  | 'avoid-region'
  | 'region';
type breakInside =
  | 'auto'
  | 'avoid'
  | 'avoid-page'
  | 'avoid-column'
  | 'avoid-region';
type brStyle =
  | 'none'
  | 'hidden'
  | 'dotted'
  | 'dashed'
  | 'solid'
  | 'double'
  | 'groove'
  | 'ridge'
  | 'inset'
  | 'outset';
type captionSide =
  | 'top'
  | 'bottom'
  | 'block-start'
  | 'block-end'
  | 'inline-start'
  | 'inline-end';
type caret = never;
type caretColor = color;
type caretShape = never;
type clear = 'none' | 'left' | 'right' | 'both' | 'inline-start' | 'inline-end';
type clip = 'auto';
type clipPath = 'none';
type clipRule = 'nonzero' | 'evenodd';
type color = NamedColor;
type colorScheme =
  | 'normal'
  | 'light'
  | 'dark'
  | 'light dark'
  | 'only light'
  | 'only dark';
type columnCount = 'auto';
type columnFill = 'auto' | 'balance';
type columnGap = 'normal';
type columnRule = columnRuleWidth | columnRuleStyle | columnRuleColor;
type columnRuleColor = color;
type columnRuleStyle = brStyle;
type columnRuleWidth = borderWidth;
type columns = columnWidth | columnCount;
type columnSpan = 'none' | 'all';
type columnWidth = 'auto';
type compositeOperator = 'add' | 'subtract' | 'intersect' | 'exclude';
type contain = 'none' | 'strict' | 'content';
type container = never;
type containerName = never;
type containerType = 'size' | 'inline-size' | 'normal';
type containIntrinsicBlockSize = never;
type containIntrinsicHeight = never;
type containIntrinsicInlineSize = never;
type containIntrinsicSize = never;
type containIntrinsicWidth = never;
type content = never;
type contentVisibility = 'visible' | 'hidden' | 'auto';
type cornerBottomLeftShape = cornerShape;
type cornerBottomRightShape = cornerShape;
type cornerEndEndShape = cornerBottomRightShape;
type cornerEndStartShape = cornerBottomLeftShape;
type cornerShape =
  | 'round'
  | 'scoop'
  | 'bevel'
  | 'notch'
  | 'square'
  | 'squircle';
type cornerStartEndShape = cornerTopRightShape;
type cornerStartStartShape = cornerTopLeftShape;
type cornerTopLeftShape = cornerShape;
type cornerTopRightShape = cornerShape;
type counterIncrement = 'none';
type counterReset = 'none';
type counterSet = never;
type cue = cueBefore | cueAfter;
type cueAfter = 'none';
type cueBefore = 'none';
type cursor =
  | 'auto'
  | 'default'
  | 'none'
  | 'context-menu'
  | 'help'
  | 'pointer'
  | 'progress'
  | 'wait'
  | 'cell'
  | 'crosshair'
  | 'text'
  | 'vertical-text'
  | 'alias'
  | 'copy'
  | 'move'
  | 'no-drop'
  | 'not-allowed'
  | 'e-resize'
  | 'n-resize'
  | 'ne-resize'
  | 'nw-resize'
  | 's-resize'
  | 'se-resize'
  | 'sw-resize'
  | 'w-resize'
  | 'ew-resize'
  | 'ns-resize'
  | 'nesw-resize'
  | 'nwse-resize'
  | 'col-resize'
  | 'row-resize'
  | 'all-scroll'
  | 'zoom-in'
  | 'zoom-out'
  | 'grab'
  | 'grabbing';
type direction = 'ltr' | 'rtl';
type display =
  | 'none'
  | 'inline'
  | 'block'
  | 'flow-root'
  | 'list-item'
  | 'inline-list-item'
  | 'inline-block'
  | 'inline-table'
  | 'table'
  | 'table-cell'
  | 'table-column'
  | 'table-column-group'
  | 'table-footer-group'
  | 'table-header-group'
  | 'table-row'
  | 'table-row-group'
  | 'flex'
  | 'inline-flex'
  | 'grid'
  | 'inline-grid'
  | 'run-in'
  | 'ruby'
  | 'ruby-base'
  | 'ruby-text'
  | 'ruby-base-container'
  | 'ruby-text-container'
  | 'contents';
type displayInside = 'auto' | 'block' | 'table' | 'flex' | 'grid' | 'ruby';
type displayList = 'none' | 'list-item';
type displayOutside =
  | 'block-level'
  | 'inline-level'
  | 'run-in'
  | 'contents'
  | 'none'
  | 'table-row-group'
  | 'table-header-group'
  | 'table-footer-group'
  | 'table-row'
  | 'table-cell'
  | 'table-column-group'
  | 'table-column'
  | 'table-caption'
  | 'ruby-base'
  | 'ruby-text'
  | 'ruby-base-container'
  | 'ruby-text-container';
type dominantBaseline =
  | 'auto'
  | 'use-script'
  | 'no-change'
  | 'reset-size'
  | 'ideographic'
  | 'alphabetic'
  | 'hanging'
  | 'mathematical'
  | 'central'
  | 'middle'
  | 'text-after-edge'
  | 'text-before-edge';
type emptyCells = 'show' | 'hide';
type end = never;
type fill = paint;
type fillOpacity = never;
type fillRule = 'nonzero' | 'evenodd';
type filter = 'none';
type finalBgLayer = attachment | box | backgroundColor;
type flex = 'none';
type flexBasis = 'content';
type flexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type flexFlow = flexDirection | flexWrap;
type flexGrow = never;
type flexShrink = never;
type flexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type float =
  | 'left'
  | 'right'
  | 'none'
  | 'start'
  | 'end'
  | 'inline-start'
  | 'inline-end';
type font = never;
type fontFamily = never;
type fontFeatureSettings = 'normal';
type fontKerning = 'auto' | 'normal' | 'none';
type fontLanguageOverride = 'normal';
type fontOpticalSizing = 'auto' | 'none';
type fontPalette = 'light' | 'dark';
type fontSize = absoluteSize | relativeSize | lengthPercentage;
type fontSizeAdjust = 'none';
type fontStretch =
  | 'normal'
  | 'ultra-condensed'
  | 'extra-condensed'
  | 'condensed'
  | 'semi-condensed'
  | 'semi-expanded'
  | 'expanded'
  | 'extra-expanded'
  | 'ultra-expanded';
type fontStyle = 'normal' | 'italic' | 'oblique';
type fontSynthesis = 'none';
type fontSynthesisPosition = 'auto' | 'none';
type fontSynthesisSmallCaps = 'auto' | 'none';
type fontSynthesisStyle = 'auto' | 'none';
type fontSynthesisWeight = 'auto' | 'none';
type fontVariant = 'normal' | 'none';
type fontVariantAlternates = 'normal';
type fontVariantCaps =
  | 'normal'
  | 'small-caps'
  | 'all-small-caps'
  | 'petite-caps'
  | 'all-petite-caps'
  | 'unicase'
  | 'titling-caps';
type fontVariantEastAsian = 'normal';
type fontVariantLigatures = 'normal' | 'none';
type fontVariantNumeric = 'normal';
type fontVariantPosition = 'normal' | 'sub' | 'super';
type fontVariationSettings = never;
type fontWeight =
  | 'normal'
  | 'bold'
  | 'bolder'
  | 'lighter'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';
type forcedColorAdjust = 'auto' | 'none';
type gap = never;
type geometryBox = shapeBox | 'fill-box' | 'stroke-box' | 'view-box';
type glyphOrientationHorizontal = never;
type glyphOrientationVertical = never;
type grid = gridTemplate;
type gridArea = gridLine;
type gridAutoColumns = trackSize;
type gridAutoFlow = 'dense';
type gridAutoRows = trackSize;
type gridColumn = gridLine;
type gridColumnEnd = gridLine;
type gridColumnGap = lengthPercentage;
type gridColumnStart = gridLine;
type gridGap = gridRowGap | gridColumnGap;
type gridLine = 'auto';
type gridRow = gridLine;
type gridRowEnd = gridLine;
type gridRowGap = lengthPercentage;
type gridRowStart = gridLine;
type gridTemplate = 'none' | 'subgrid';
type gridTemplateAreas = 'none';
type gridTemplateColumns = 'none' | 'subgrid';
type gridTemplateRows = 'none' | 'subgrid';
type hangingPunctuation = never;
type height = never;
type hyphenateCharacter = never;
type hyphenateLimitChars = never;
type hyphens = 'none' | 'manual' | 'auto';
type imageOrientation = 'from-image';
type imageRendering =
  | 'auto'
  | 'crisp-edges'
  | 'pixelated'
  | 'optimizeSpeed'
  | 'optimizeQuality';
type imageResolution = 'snap';
type imeMode = 'auto' | 'normal' | 'active' | 'inactive' | 'disabled';
type initialLetter = 'normal';
type initialLetterAlign = never;
type inlineSize = width;
type inset = never;
type insetBlock = never;
type insetBlockEnd = never;
type insetBlockStart = never;
type insetInline = never;
type insetInlineEnd = never;
type insetInlineStart = never;
type interpolateSize = 'allow-keywords' | 'numeric-only';
type isolation = 'auto' | 'isolate';
type justifyContent =
  | 'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'left'
  | 'right'
  | 'normal'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch'
  | 'safe center'
  | 'unsafe center';
type justifyItems =
  | 'normal'
  | 'stretch'
  | 'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'self-start'
  | 'self-end'
  | 'left'
  | 'right'
  | 'baseline'
  | 'first baseline'
  | 'last baseline'
  | 'safe center'
  | 'unsafe center'
  | 'legacy right'
  | 'legacy left'
  | 'legacy center';
type justifySelf =
  | 'auto'
  | 'normal'
  | 'stretch'
  | 'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'self-start'
  | 'self-end'
  | 'left'
  | 'right'
  | 'baseline'
  | 'first baseline'
  | 'last baseline'
  | 'safe center'
  | 'unsafe center';
type justifyTracks = never;
type kerning = 'auto' | svgLength;
type left = never;
type lengthPercentage = never;
type letterSpacing = 'normal' | lengthPercentage;
type lineBreak = 'auto' | 'loose' | 'normal' | 'strict';
type lineHeight = never;
type lineHeightStep = never;
type listStyle = listStyleType | listStylePosition | listStyleImage;
type listStyleImage = 'none';
type listStylePosition = 'inside' | 'outside';
type listStyleType = 'none';
type margin = never;
type marginBlock = marginBlockEnd;
type marginBlockEnd = marginLeft;
type marginBlockStart = marginLeft;
type marginBottom = 'auto';
type marginInline = marginInlineEnd;
type marginInlineEnd = marginLeft;
type marginInlineStart = marginLeft;
type marginLeft = 'auto';
type marginRight = 'auto';
type marginTop = 'auto';
type marker = 'none';
type markerEnd = 'none';
type markerMid = 'none';
type markerOffset = 'auto';
type markerStart = 'none';
type mask = maskLayer;
type maskBorder = never;
type maskBorderMode = 'alpha' | 'luminance';
type maskBorderOutset = never;
type maskBorderRepeat = 'stretch' | 'repeat' | 'round' | 'space';
type maskBorderSlice = never;
type maskBorderSource = never;
type maskBorderWidth = never;
type maskClip = never;
type maskComposite = compositeOperator;
type maskImage = maskReference;
type maskingMode = 'alpha' | 'luminance' | 'match-source';
type maskLayer =
  | maskReference
  | maskingMode
  | repeatStyle
  | geometryBox
  | compositeOperator;
type maskMode = maskingMode;
type maskOrigin = geometryBox;
type maskPosition = never;
type maskReference = 'none';
type maskRepeat = repeatStyle;
type maskSize = bgSize;
type maskType = 'luminance' | 'alpha';
type masonryAutoFlow = never;
type mathDepth = never;
type mathShift = 'normal' | 'compact';
type mathStyle = 'normal' | 'compact';
type maxBlockSize = maxWidth;
type maxHeight =
  | 'none'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
  | 'fill-available';
type maxInlineSize = maxWidth;
type maxWidth =
  | 'none'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
  | 'fill-available';
type minBlockSize = minWidth;
type minHeight =
  | 'auto'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
  | 'fill-available';
type minInlineSize = minWidth;
type minWidth =
  | 'auto'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
  | 'fill-available';
type mixBlendMode = blendMode;
type motion = motionPath | motionOffset | motionRotation;
type motionOffset = lengthPercentage;
type motionPath = geometryBox | 'none';
type motionRotation = never;
type MsOverflowStyle = 'auto' | 'none' | 'scrollbar';
type NamedColor =
  | 'aliceblue'
  | 'antiquewhite'
  | 'aqua'
  | 'aquamarine'
  | 'azure'
  | 'beige'
  | 'bisque'
  | 'black'
  | 'blanchedalmond'
  | 'blue'
  | 'blueviolet'
  | 'brown'
  | 'burlywood'
  | 'cadetblue'
  | 'chartreuse'
  | 'chocolate'
  | 'coral'
  | 'cornflowerblue'
  | 'cornsilk'
  | 'crimson'
  | 'cyan'
  | 'darkblue'
  | 'darkcyan'
  | 'darkgoldenrod'
  | 'darkgray'
  | 'darkgreen'
  | 'darkgrey'
  | 'darkkhaki'
  | 'darkmagenta'
  | 'darkolivegreen'
  | 'darkorange'
  | 'darkorchid'
  | 'darkred'
  | 'darksalmon'
  | 'darkseagreen'
  | 'darkslateblue'
  | 'darkslategray'
  | 'darkslategrey'
  | 'darkturquoise'
  | 'darkviolet'
  | 'deeppink'
  | 'deepskyblue'
  | 'dimgray'
  | 'dimgrey'
  | 'dodgerblue'
  | 'firebrick'
  | 'floralwhite'
  | 'forestgreen'
  | 'fuchsia'
  | 'gainsboro'
  | 'ghostwhite'
  | 'gold'
  | 'goldenrod'
  | 'gray'
  | 'green'
  | 'greenyellow'
  | 'grey'
  | 'honeydew'
  | 'hotpink'
  | 'indianred'
  | 'indigo'
  | 'ivory'
  | 'khaki'
  | 'lavender'
  | 'lavenderblush'
  | 'lawngreen'
  | 'lemonchiffon'
  | 'lightblue'
  | 'lightcoral'
  | 'lightcyan'
  | 'lightgoldenrodyellow'
  | 'lightgray'
  | 'lightgreen'
  | 'lightgrey'
  | 'lightpink'
  | 'lightsalmon'
  | 'lightseagreen'
  | 'lightskyblue'
  | 'lightslategray'
  | 'lightslategrey'
  | 'lightsteelblue'
  | 'lightyellow'
  | 'lime'
  | 'limegreen'
  | 'linen'
  | 'magenta'
  | 'maroon'
  | 'mediumaquamarine'
  | 'mediumblue'
  | 'mediumorchid'
  | 'mediumpurple'
  | 'mediumseagreen'
  | 'mediumslateblue'
  | 'mediumspringgreen'
  | 'mediumturquoise'
  | 'mediumvioletred'
  | 'midnightblue'
  | 'mintcream'
  | 'mistyrose'
  | 'moccasin'
  | 'navajowhite'
  | 'navy'
  | 'oldlace'
  | 'olive'
  | 'olivedrab'
  | 'orange'
  | 'orangered'
  | 'orchid'
  | 'palegoldenrod'
  | 'palegreen'
  | 'paleturquoise'
  | 'palevioletred'
  | 'papayawhip'
  | 'peachpuff'
  | 'peru'
  | 'pink'
  | 'plum'
  | 'powderblue'
  | 'purple'
  | 'rebeccapurple'
  | 'red'
  | 'rosybrown'
  | 'royalblue'
  | 'saddlebrown'
  | 'salmon'
  | 'sandybrown'
  | 'seagreen'
  | 'seashell'
  | 'sienna'
  | 'silver'
  | 'skyblue'
  | 'slateblue'
  | 'slategray'
  | 'slategrey'
  | 'snow'
  | 'springgreen'
  | 'steelblue'
  | 'tan'
  | 'teal'
  | 'thistle'
  | 'tomato'
  | 'transparent'
  | 'turquoise'
  | 'violet'
  | 'wheat'
  | 'white'
  | 'whitesmoke'
  | 'yellow'
  | 'yellowgreen';
type nonStandardWordBreak = 'break-word';
type objectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
type objectPosition = never;
type offset = never;
type offsetAnchor = never;
type offsetDistance = never;
type offsetPath = never;
type offsetPosition = never;
type offsetRotate = never;
type opacity = never;
type order = never;
type orphans = never;
type outline = never;
type outlineColor = color | 'invert';
type outlineOffset = never;
type outlineStyle = 'auto' | brStyle;
type outlineWidth = borderWidth;
type overflow = 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
type overflowAnchor = 'auto' | 'none';
type overflowBlock = overflowY;
type overflowBlockX = overflowX;
type overflowClipMargin = never;
type overflowWrap = 'normal' | 'break-word' | 'anywhere';
type overflowX = overflow;
type overflowY = overflow;
type overscrollBehavior = 'none' | 'contain' | 'auto';
type overscrollBehaviorBlock = overscrollBehaviorY;
type overscrollBehaviorInline = overscrollBehaviorX;
type overscrollBehaviorX = 'none' | 'contain' | 'auto';
type overscrollBehaviorY = 'none' | 'contain' | 'auto';
type padding = never;
type paddingBlock = paddingBlockEnd;
type paddingBlockEnd = paddingLeft;
type paddingBlockStart = paddingLeft;
type paddingBottom = never;
type paddingInline = paddingBlockEnd;
type paddingInlineEnd = paddingBlockEnd;
type paddingInlineStart = paddingBlockStart;
type paddingLeft = never;
type paddingRight = never;
type paddingTop = never;
type page = never;
type pageBreakAfter = 'auto' | 'always' | 'avoid' | 'left' | 'right';
type pageBreakBefore = 'auto' | 'always' | 'avoid' | 'left' | 'right';
type pageBreakInside = 'auto' | 'avoid';
type paintOrder = 'normal' | 'stroke' | 'fill' | 'markers';
type paint = 'none' | 'currentColor' | color;
type pause = pauseBefore | pauseAfter;
type pauseAfter = 'none' | 'x-weak' | 'weak' | 'medium' | 'strong' | 'x-strong';
type pauseBefore =
  | 'none'
  | 'x-weak'
  | 'weak'
  | 'medium'
  | 'strong'
  | 'x-strong';
type perspective = 'none';
type perspectiveOrigin = never;
type placeContent = never;
type placeItems = never;
type placeSelf = never;
type pointerEvents =
  | 'auto'
  | 'none'
  | 'visiblePainted'
  | 'visibleFill'
  | 'visibleStroke'
  | 'visible'
  | 'painted'
  | 'fill'
  | 'stroke'
  | 'all';
type position = 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
type positionAnchor = never;
type positionArea =
  | 'top'
  | 'left'
  | 'bottom'
  | 'right'
  | 'center'
  | 'block-start'
  | 'block-end'
  | 'inline-start'
  | 'inline-end'
  | 'span-inline-start'
  | 'span-inline-end'
  | 'span-block-start'
  | 'span-block-end';
type positionTry = never;
type positionTryFallbacks = never;
type positionTryOptions = never;
type positionVisibility = 'always' | 'anchors-visible' | 'no-overflow';
type printColorAdjust = 'economy' | 'exact';
type quotes = 'none';
type relativeSize = 'larger' | 'smaller';
type repeatStyle = 'repeat-x' | 'repeat-y';
type resize = 'none' | 'both' | 'horizontal' | 'vertical';
type rest = restBefore | restAfter;
type restAfter = 'none' | 'x-weak' | 'weak' | 'medium' | 'strong' | 'x-strong';
type restBefore = 'none' | 'x-weak' | 'weak' | 'medium' | 'strong' | 'x-strong';
type right = never;
type rotate = never;
type rowGap = never;
type rubyAlign = 'start' | 'center' | 'space-between' | 'space-around';
type rubyMerge = 'separate' | 'collapse' | 'auto';
type rubyPosition = 'over' | 'under' | 'inter-character';
type scale = never;
type scrollbarColor = color;
type scrollbarGutter = 'auto' | 'stable' | 'stable both-edges';
type scrollbarWidth = 'auto' | 'thin' | 'none';
type scrollBehavior = 'auto' | 'smooth';
type scrollMargin = never;
type scrollMarginBlock = never;
type scrollMarginBlockEnd = never;
type scrollMarginBlockStart = never;
type scrollMarginBottom = never;
type scrollMarginInline = never;
type scrollMarginInlineEnd = never;
type scrollMarginInlineStart = never;
type scrollMarginLeft = never;
type scrollMarginRight = never;
type scrollMarginTop = never;
type scrollPadding = never;
type scrollPaddingBlock = never;
type scrollPaddingBlockEnd = never;
type scrollPaddingBlockStart = never;
type scrollPaddingBottom = never;
type scrollPaddingInline = never;
type scrollPaddingInlineEnd = never;
type scrollPaddingInlineStart = never;
type scrollPaddingLeft = never;
type scrollPaddingRight = never;
type scrollPaddingTop = never;
type scrollSnapAlign = 'none' | 'start' | 'end' | 'center';
type scrollSnapStop = 'normal' | 'always';
type scrollSnapType =
  | 'none'
  | 'block mandatory'
  | 'block proximity'
  | 'block'
  | 'both mandatory'
  | 'both proximity'
  | 'both'
  | 'inline mandatory'
  | 'inline proximity'
  | 'inline'
  | 'x'
  | 'x mandatory'
  | 'x proximity'
  | 'y'
  | 'y mandatory'
  | 'y proximity';
type scrollTimeline = never;
type scrollTimelineAxis = 'block' | 'inline' | 'x' | 'y';
type scrollTimelineName = never;
type shapeBox = box | 'margin-box';
type shapeImageThreshold = never;
type shapeMargin = lengthPercentage;
type shapeOutside = 'none' | shapeBox;
type shapeRendering =
  | 'auto'
  | 'optimizeSpeed'
  | 'crispEdges'
  | 'geometricPrecision';
type speakAs = never;
type singleAnimationDirection =
  | 'normal'
  | 'reverse'
  | 'alternate'
  | 'alternate-reverse';
type singleAnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';
type singleAnimationIterationCount = 'infinite';
type singleAnimationName = 'none';
type singleAnimationPlayState = 'running' | 'paused';
type singleTimingFunction = singleTransitionTimingFunction;
type singleTransition = singleTransitionTimingFunction;
type singleTransitionProperty = 'all';
type singleTransitionTimingFunction =
  | 'ease'
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'step-start'
  | 'step-end';
type src = never;
type start = never;
type stroke = paint;
type strokeDasharray = 'none';
type strokeDashoffset = svgLength;
type strokeLinecap = 'butt' | 'round' | 'square';
type strokeLinejoin = 'miter' | 'round' | 'bevel';
type strokeMiterlimit = never;
type strokeOpacity = never;
type strokeWidth = svgLength;
type svgLength = never;
type svgWritingMode = 'lr-tb' | 'rl-tb' | 'tb-rl' | 'lr' | 'rl' | 'tb';
type tableLayout = 'auto' | 'fixed';
type tabSize = never;
type textAlign =
  | 'start'
  | 'end'
  | 'left'
  | 'right'
  | 'center'
  | 'justify'
  | 'match-parent';
type textAlignLast =
  | 'auto'
  | 'start'
  | 'end'
  | 'left'
  | 'right'
  | 'center'
  | 'justify';
type textAnchor = 'start' | 'middle' | 'end';
type textCombineUpright = 'none' | 'all';
type textDecoration =
  | textDecorationLine
  | textDecorationStyle
  | textDecorationColor;
type textDecorationColor = color;
type textDecorationLine = 'none';
type textDecorationSkip = 'none';
type textDecorationSkipInk = 'auto' | 'none' | 'all';
type textDecorationStyle = 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy';
type textDecorationThickness = never;
type textEmphasis = textEmphasisStyle | textEmphasisColor;
type textEmphasisColor = color;
type textEmphasisPosition = never;
type textEmphasisStyle = 'none';
type textIndent = lengthPercentage | 'hanging' | 'each-line';
type textOrientation = 'mixed' | 'upright' | 'sideways';
type textOverflow = never;
type textRendering =
  | 'auto'
  | 'optimizeSpeed'
  | 'optimizeLegibility'
  | 'geometricPrecision';
type textShadow = 'none';
type textSizeAdjust = 'none' | 'auto';
type textTransform =
  | 'none'
  | 'capitalize'
  | 'uppercase'
  | 'lowercase'
  | 'full-width';
type textUnderlineOffset = never;
type textUnderlinePosition = 'auto';
type textWrap = 'wrap' | 'nowrap' | 'balance';
type time = never;
type timelineScope = never;
type top = never;
type touchAction = 'auto' | 'none' | 'manipulation';
type trackBreadth = lengthPercentage | 'min-content' | 'max-content' | 'auto';
type trackSize = trackBreadth;
type transform = 'none';
type transformBox = 'border-box' | 'fill-box' | 'view-box';
type transformOrigin = never;
type transformStyle = 'flat' | 'preserve-3d';
type transition = singleTransition;
type transitionDelay = time;
type transitionDuration = time;
type transitionProperty = 'none' | singleTransitionProperty;
type transitionTimingFunction = singleTransitionTimingFunction;
type translate = never;
type unicodeBidi =
  | 'normal'
  | 'embed'
  | 'isolate'
  | 'bidi-override'
  | 'isolate-override'
  | 'plaintext';
type unicodeRange = never;
type userSelect = 'auto' | 'text' | 'none' | 'contain' | 'all';
type verticalAlign =
  | 'baseline'
  | 'sub'
  | 'super'
  | 'text-top'
  | 'text-bottom'
  | 'middle'
  | 'top'
  | 'bottom';
type viewTimeline = never;
type viewTimelineAxis = 'block' | 'inline' | 'x' | 'y';
type viewTimelineInset = never;
type viewTimelineName = never;
type viewTransitionName = never;
type visibility = 'visible' | 'hidden' | 'collapse';
type voiceBalance = 'left' | 'center' | 'right' | 'leftwards' | 'rightwards';
type voiceDuration = 'auto' | time;
type voiceFamily = 'preserve';
type voicePitch = 'absolute';
type voiceRange = 'absolute';
type voiceRate = never;
type voiceStress = 'normal' | 'strong' | 'moderate' | 'none' | 'reduced';
type voiceVolume = 'silent';
type WebkitBackgroundClip =
  | 'border-box'
  | 'padding-box'
  | 'content-box'
  | 'text';
type WebkitBoxOrient = 'vertical' | 'horizontal' | 'inline-axis' | 'block-axis';
type WebkitFontSmoothing = 'antialiased';
type WebkitLineClamp = never;
type WebkitMaskImage = maskImage;
type WebkitTapHighlightColor = color;
type WebkitTextFillColor = color;
type WebkitTextStrokeColor = color;
type WebkitTextStrokeWidth = never;
type whiteSpace = 'normal' | 'pre' | 'nowrap' | 'pre-wrap' | 'pre-line';
type whiteSpaceCollapse =
  | 'collapse'
  | 'discard'
  | 'preserve'
  | 'preserve-breaks'
  | 'preserve-spaces'
  | 'break-spaces';
type widows = never;
type width =
  | 'available'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | 'auto';
type willChange = 'auto' | animatableFeature;
type wordBreak = 'normal' | 'break-all' | 'keep-all' | nonStandardWordBreak;
type wordSpacing = 'normal' | lengthPercentage;
type wordWrap = 'normal' | 'break-word';
type writingMode =
  | 'horizontal-tb'
  | 'vertical-rl'
  | 'vertical-lr'
  | 'sideways-rl'
  | 'sideways-lr'
  | svgWritingMode;
type zIndex = 'auto';
type zoom = 'normal';

export type CSSTypes = Readonly<{
  WebkitFontSmoothing?: WebkitFontSmoothing;
  WebkitTapHighlightColor?: WebkitTapHighlightColor;

  WebkitMaskImage?: WebkitMaskImage;

  WebkitTextFillColor?: WebkitTextFillColor;
  WebkitTextStrokeWidth?: WebkitTextStrokeWidth;
  WebkitTextStrokeColor?: WebkitTextStrokeColor;
  WebkitBackgroundClip?: WebkitBackgroundClip;

  WebkitBoxOrient?: WebkitBoxOrient;
  WebkitLineClamp?: WebkitLineClamp;

  accentColor?: accentColor;

  aspectRatio?: aspectRatio;

  placeContent?: placeContent;
  alignContent?: alignContent;
  justifyContent?: justifyContent;
  placeItems?: placeItems;
  placeSelf?: placeSelf;
  alignItems?: alignItems;
  justifyItems?: justifyItems;
  alignSelf?: alignSelf;
  justifySelf?: justifySelf;

  alignmentBaseline?: alignmentBaseline;
  alignTracks?: alignTracks;
  justifyTracks?: justifyTracks;
  masonryAutoFlow?: masonryAutoFlow;

  anchorName?: anchorName;

  animation?: animation;
  animationComposition?: animationComposition;
  animationDelay?: animationDelay;
  animationDirection?: animationDirection;
  animationDuration?: animationDuration;
  animationFillMode?: animationFillMode;
  animationIterationCount?: animationIterationCount;
  animationName?: animationName;
  animationPlayState?: animationPlayState;
  animationTimingFunction?: animationTimingFunction;
  animationTimeline?: animationTimeline;
  animationRange?: animationRange;
  animationRangeStart?: animationRangeStart;
  animationRangeEnd?: animationRangeEnd;
  appearance?: appearance;
  azimuth?: azimuth;

  backdropFilter?: backdropFilter;
  backfaceVisibility?: backfaceVisibility;
  background?: background;
  backgroundAttachment?: backgroundAttachment;
  backgroundBlendMode?: backgroundBlendMode;
  backgroundClip?: backgroundClip;
  backgroundColor?: backgroundColor;
  backgroundImage?: backgroundImage;
  backgroundOrigin?: backgroundOrigin;
  backgroundPosition?: backgroundPosition;
  backgroundPositionX?: backgroundPositionX;
  backgroundPositionY?: backgroundPositionY;
  backgroundRepeat?: backgroundRepeat;
  backgroundSize?: backgroundSize;
  baselineShift?: baselineShift;
  behavior?: behavior;
  blockSize?: blockSize;
  border?: border;
  borderBlock?: borderBlock;
  borderBlockColor?: borderBlockColor;
  borderBlockStyle?: borderBlockStyle;
  borderBlockWidth?: borderBlockWidth;
  borderBlockEnd?: borderBlockEnd;
  borderBlockEndColor?: borderBlockEndColor;
  borderBlockEndStyle?: borderBlockEndStyle;
  borderBlockEndWidth?: borderBlockEndWidth;
  borderBlockStart?: borderBlockStart;
  borderBlockStartColor?: borderBlockStartColor;
  borderBlockStartStyle?: borderBlockStartStyle;
  borderBlockStartWidth?: borderBlockStartWidth;
  borderBottom?: borderBottom;
  borderBottomColor?: borderBottomColor;
  borderBottomStyle?: borderBottomStyle;
  borderBottomWidth?: borderBottomWidth;
  borderCollapse?: borderCollapse;
  borderColor?: borderColor;
  borderImage?: borderImage;
  borderImageOutset?: borderImageOutset;
  borderImageRepeat?: borderImageRepeat;
  borderImageSlice?: borderImageSlice;
  borderImageSource?: borderImageSource;
  borderImageWidth?: borderImageWidth;
  borderInline?: borderInline;
  borderInlineColor?: borderInlineColor;
  borderInlineStyle?: borderInlineStyle;
  borderInlineWidth?: borderInlineWidth;
  borderInlineEnd?: borderInlineEnd;
  borderInlineEndColor?: borderInlineEndColor;
  borderInlineEndStyle?: borderInlineEndStyle;
  borderInlineEndWidth?: borderInlineEndWidth;
  borderInlineStart?: borderInlineStart;
  borderInlineStartColor?: borderInlineStartColor;
  borderInlineStartStyle?: borderInlineStartStyle;
  borderInlineStartWidth?: borderInlineStartWidth;
  borderLeft?: borderLeft;
  borderLeftColor?: borderLeftColor;
  borderLeftStyle?: borderLeftStyle;
  borderLeftWidth?: borderLeftWidth;
  borderRight?: borderRight;
  borderRightColor?: borderRightColor;
  borderRightStyle?: borderRightStyle;
  borderRightWidth?: borderRightWidth;
  borderSpacing?: borderSpacing;
  borderStyle?: borderStyle;
  borderTop?: borderTop;
  borderTopColor?: borderTopColor;

  borderRadius?: borderRadius;
  borderEndStartRadius?: borderEndStartRadius;
  borderStartStartRadius?: borderStartStartRadius;
  borderStartEndRadius?: borderStartEndRadius;
  borderEndEndRadius?: borderEndEndRadius;
  borderTopLeftRadius?: borderTopLeftRadius;
  borderTopRightRadius?: borderTopRightRadius;
  borderBottomLeftRadius?: borderBottomLeftRadius;
  borderBottomRightRadius?: borderBottomRightRadius;

  cornerShape?: cornerShape;
  cornerStartStartShape?: cornerStartStartShape;
  cornerStartEndShape?: cornerStartEndShape;
  cornerEndStartShape?: cornerEndStartShape;
  cornerEndEndShape?: cornerEndEndShape;
  cornerTopLeftShape?: cornerTopLeftShape;
  cornerTopRightShape?: cornerTopRightShape;
  cornerBottomLeftShape?: cornerBottomLeftShape;
  cornerBottomRightShape?: cornerBottomRightShape;

  borderTopStyle?: borderTopStyle;
  borderTopWidth?: borderTopWidth;
  borderWidth?: borderWidth;
  bottom?: bottom;
  boxAlign?: boxAlign;
  boxDecorationBreak?: boxDecorationBreak;
  boxDirection?: boxDirection;
  boxFlex?: boxFlex;
  boxFlexGroup?: boxFlexGroup;
  boxLines?: boxLines;
  boxOrdinalGroup?: boxOrdinalGroup;
  boxOrient?: boxOrient;
  boxShadow?: boxShadow;
  boxSizing?: boxSizing;
  boxSuppress?: boxSuppress;
  breakAfter?: breakAfter;
  breakBefore?: breakBefore;
  breakInside?: breakInside;

  captionSide?: captionSide;
  caret?: caret;
  caretColor?: caretColor;
  caretShape?: caretShape;
  clear?: clear;
  clip?: clip;
  clipPath?: clipPath;
  clipRule?: clipRule;
  color?: color;

  colorScheme?: colorScheme;
  forcedColorAdjust?: forcedColorAdjust;
  printColorAdjust?: printColorAdjust;

  columns?: columns;
  columnCount?: columnCount;
  columnWidth?: columnWidth;

  columnRule?: columnRule;
  columnRuleColor?: columnRuleColor;
  columnRuleStyle?: columnRuleStyle;
  columnRuleWidth?: columnRuleWidth;

  columnFill?: columnFill;
  columnGap?: columnGap;
  columnSpan?: columnSpan;

  contain?: contain;
  containIntrinsicSize?: containIntrinsicSize;
  containIntrinsicBlockSize?: containIntrinsicBlockSize;
  containIntrinsicInlineSize?: containIntrinsicInlineSize;
  containIntrinsicHeight?: containIntrinsicHeight;
  containIntrinsicWidth?: containIntrinsicWidth;

  container?: container;
  containerName?: containerName;
  containerType?: containerType;

  contentVisibility?: contentVisibility;

  content?: content;

  counterIncrement?: counterIncrement;
  counterReset?: counterReset;
  counterSet?: counterSet;

  cue?: cue;
  cueAfter?: cueAfter;
  cueBefore?: cueBefore;
  cursor?: cursor;
  direction?: direction;
  display?: display;
  displayInside?: displayInside;
  displayList?: displayList;
  displayOutside?: displayOutside;
  dominantBaseline?: dominantBaseline;
  emptyCells?: emptyCells;
  end?: end;
  fill?: fill;
  fillOpacity?: fillOpacity;
  fillRule?: fillRule;
  filter?: filter;
  flex?: flex;
  flexBasis?: flexBasis;
  flexDirection?: flexDirection;
  flexFlow?: flexFlow;
  flexGrow?: flexGrow;
  flexShrink?: flexShrink;
  flexWrap?: flexWrap;
  float?: float;

  font?: font;
  fontFamily?: fontFamily;
  fontFeatureSettings?: fontFeatureSettings;
  fontKerning?: fontKerning;
  fontLanguageOverride?: fontLanguageOverride;
  fontSize?: fontSize;
  fontSizeAdjust?: fontSizeAdjust;
  fontStretch?: fontStretch;
  fontStyle?: fontStyle;
  fontSynthesis?: fontSynthesis;
  fontSynthesisWeight?: fontSynthesisWeight;
  fontSynthesisStyle?: fontSynthesisStyle;
  fontSynthesisSmallCaps?: fontSynthesisSmallCaps;
  fontSynthesisPosition?: fontSynthesisPosition;

  fontVariant?: fontVariant;
  fontVariantAlternates?: fontVariantAlternates;
  fontVariantCaps?: fontVariantCaps;
  fontVariantEastAsian?: fontVariantEastAsian;
  fontVariantLigatures?: fontVariantLigatures;
  fontVariantNumeric?: fontVariantNumeric;
  fontVariantPosition?: fontVariantPosition;
  fontWeight?: fontWeight;

  fontOpticalSizing?: fontOpticalSizing;
  fontPalette?: fontPalette;
  fontVariationSettings?: fontVariationSettings;

  gap?: gap;
  glyphOrientationHorizontal?: glyphOrientationHorizontal;
  glyphOrientationVertical?: glyphOrientationVertical;
  grid?: grid;
  gridArea?: gridArea;
  gridAutoColumns?: gridAutoColumns;
  gridAutoFlow?: gridAutoFlow;
  gridAutoRows?: gridAutoRows;
  gridColumn?: gridColumn;
  gridColumnEnd?: gridColumnEnd;
  gridColumnGap?: gridColumnGap;
  gridColumnStart?: gridColumnStart;
  gridGap?: gridGap;
  gridRow?: gridRow;
  gridRowEnd?: gridRowEnd;
  gridRowGap?: gridRowGap;
  gridRowStart?: gridRowStart;
  gridTemplate?: gridTemplate;
  gridTemplateAreas?: gridTemplateAreas;
  gridTemplateColumns?: gridTemplateColumns;
  gridTemplateRows?: gridTemplateRows;

  hangingPunctuation?: hangingPunctuation;
  hyphenateCharacter?: hyphenateCharacter;
  hyphenateLimitChars?: hyphenateLimitChars;
  hyphens?: hyphens;

  height?: height;

  imageOrientation?: imageOrientation;
  imageRendering?: imageRendering;
  imageResolution?: imageResolution;
  imeMode?: imeMode;

  initialLetter?: initialLetter;
  initialLetterAlign?: initialLetterAlign;
  inlineSize?: inlineSize;

  interpolateSize?: interpolateSize;

  inset?: inset;
  insetBlock?: insetBlock;
  insetBlockEnd?: insetBlockEnd;
  insetBlockStart?: insetBlockStart;
  insetInline?: insetInline;
  insetInlineEnd?: insetInlineEnd;
  insetInlineStart?: insetInlineStart;

  isolation?: isolation;
  kerning?: kerning;
  left?: left;
  letterSpacing?: letterSpacing;
  lineBreak?: lineBreak;
  lineHeight?: lineHeight;
  lineHeightStep?: lineHeightStep;
  listStyle?: listStyle;
  listStyleImage?: listStyleImage;
  listStylePosition?: listStylePosition;
  listStyleType?: listStyleType;
  margin?: margin;
  marginBlock?: marginBlock;
  marginBlockEnd?: marginBlockEnd;
  marginBlockStart?: marginBlockStart;
  marginBottom?: marginBottom;
  marginInline?: marginInline;
  marginInlineEnd?: marginInlineEnd;
  marginInlineStart?: marginInlineStart;
  marginLeft?: marginLeft;
  marginRight?: marginRight;
  marginTop?: marginTop;
  marginTrim?:
    | 'none'
    | 'block'
    | 'block-start'
    | 'block-end'
    | 'inline'
    | 'inline-start'
    | 'inline-end';

  marker?: marker;
  markerEnd?: markerEnd;
  markerMid?: markerMid;
  markerOffset?: markerOffset;
  markerStart?: markerStart;
  mask?: mask;
  maskClip?: maskClip;
  maskComposite?: maskComposite;
  maskImage?: maskImage;
  maskMode?: maskMode;
  maskOrigin?: maskOrigin;
  maskPosition?: maskPosition;
  maskRepeat?: maskRepeat;
  maskSize?: maskSize;
  maskType?: maskType;

  maskBorder?: maskBorder;
  maskBorderMode?: maskBorderMode;
  maskBorderOutset?: maskBorderOutset;
  maskBorderRepeat?: maskBorderRepeat;
  maskBorderSlice?: maskBorderSlice;
  maskBorderSource?: maskBorderSource;
  maskBorderWidth?: maskBorderWidth;

  maxBlockSize?: maxBlockSize;
  maxHeight?: maxHeight;
  maxInlineSize?: maxInlineSize;
  maxWidth?: maxWidth;
  minBlockSize?: minBlockSize;
  minHeight?: minHeight;
  minInlineSize?: minInlineSize;
  minWidth?: minWidth;
  mixBlendMode?: mixBlendMode;
  motion?: motion;
  motionOffset?: motionOffset;
  motionPath?: motionPath;
  motionRotation?: motionRotation;
  MsOverflowStyle?: MsOverflowStyle;
  objectFit?: objectFit;
  objectPosition?: objectPosition;

  offset?: offset;
  offsetAnchor?: offsetAnchor;
  offsetDistance?: offsetDistance;
  offsetPath?: offsetPath;
  offsetPosition?: offsetPosition;
  offsetRotate?: offsetRotate;

  opacity?: opacity;
  order?: order;
  orphans?: orphans;
  outline?: outline;
  outlineColor?: outlineColor;
  outlineOffset?: outlineOffset;
  outlineStyle?: outlineStyle;
  outlineWidth?: outlineWidth;

  overflow?: overflow;
  overflowBlock?: overflowBlock;
  overflowBlockX?: overflowBlockX;
  overflowX?: overflowX;
  overflowY?: overflowY;

  overflowAnchor?: overflowAnchor;
  overflowClipMargin?: overflowClipMargin;
  overflowWrap?: overflowWrap;

  overscrollBehavior?: overscrollBehavior;
  overscrollBehaviorBlock?: overscrollBehaviorBlock;
  overscrollBehaviorY?: overscrollBehaviorY;
  overscrollBehaviorInline?: overscrollBehaviorInline;
  overscrollBehaviorX?: overscrollBehaviorX;

  padding?: padding;
  paddingBlock?: paddingBlock;
  paddingBlockEnd?: paddingBlockEnd;
  paddingBlockStart?: paddingBlockStart;
  paddingInline?: paddingInline;
  paddingInlineEnd?: paddingInlineEnd;
  paddingInlineStart?: paddingInlineStart;
  paddingBottom?: paddingBottom;
  paddingLeft?: paddingLeft;
  paddingRight?: paddingRight;
  paddingTop?: paddingTop;

  page?: page;
  pageBreakAfter?: pageBreakAfter;
  pageBreakBefore?: pageBreakBefore;
  pageBreakInside?: pageBreakInside;
  paintOrder?: paintOrder;

  pause?: pause;
  pauseAfter?: pauseAfter;
  pauseBefore?: pauseBefore;
  perspective?: perspective;
  perspectiveOrigin?: perspectiveOrigin;
  pointerEvents?: pointerEvents;

  position?: position;
  positionAnchor?: positionAnchor;
  positionArea?: positionArea;
  positionTry?: positionTry;
  positionTryFallbacks?: positionTryFallbacks;
  positionTryOptions?: positionTryOptions;
  positionVisibility?: positionVisibility;

  quotes?: quotes;
  resize?: resize;
  rest?: rest;
  restAfter?: restAfter;
  restBefore?: restBefore;
  right?: right;
  rowGap?: rowGap;

  rubyAlign?: rubyAlign;
  rubyMerge?: rubyMerge;
  rubyPosition?: rubyPosition;

  mathDepth?: mathDepth;
  mathShift?: mathShift;
  mathStyle?: mathStyle;

  scrollBehavior?: scrollBehavior;

  scrollMargin?: scrollMargin;
  scrollMarginTop?: scrollMarginTop;
  scrollMarginRight?: scrollMarginRight;
  scrollMarginBottom?: scrollMarginBottom;
  scrollMarginLeft?: scrollMarginLeft;
  scrollMarginBlock?: scrollMarginBlock;
  scrollMarginBlockEnd?: scrollMarginBlockEnd;
  scrollMarginBlockStart?: scrollMarginBlockStart;
  scrollMarginInline?: scrollMarginInline;
  scrollMarginInlineEnd?: scrollMarginInlineEnd;
  scrollMarginInlineStart?: scrollMarginInlineStart;

  scrollPadding?: scrollPadding;
  scrollPaddingTop?: scrollPaddingTop;
  scrollPaddingRight?: scrollPaddingRight;
  scrollPaddingBottom?: scrollPaddingBottom;
  scrollPaddingLeft?: scrollPaddingLeft;
  scrollPaddingBlock?: scrollPaddingBlock;
  scrollPaddingBlockEnd?: scrollPaddingBlockEnd;
  scrollPaddingBlockStart?: scrollPaddingBlockStart;
  scrollPaddingInline?: scrollPaddingInline;
  scrollPaddingInlineEnd?: scrollPaddingInlineEnd;
  scrollPaddingInlineStart?: scrollPaddingInlineStart;

  scrollSnapAlign?: scrollSnapAlign;
  scrollSnapStop?: scrollSnapStop;
  scrollSnapType?: scrollSnapType;

  scrollTimeline?: scrollTimeline;
  scrollTimelineAxis?: scrollTimelineAxis;
  scrollTimelineName?: scrollTimelineName;

  scrollbarColor?: scrollbarColor;
  scrollbarGutter?: scrollbarGutter;
  scrollbarWidth?: scrollbarWidth;

  shapeImageThreshold?: shapeImageThreshold;
  shapeMargin?: shapeMargin;
  shapeOutside?: shapeOutside;
  shapeRendering?: shapeRendering;
  speakAs?: speakAs;
  src?: src;
  start?: start;
  stroke?: stroke;
  strokeDasharray?: strokeDasharray;
  strokeDashoffset?: strokeDashoffset;
  strokeLinecap?: strokeLinecap;
  strokeLinejoin?: strokeLinejoin;
  strokeMiterlimit?: strokeMiterlimit;
  strokeOpacity?: strokeOpacity;
  strokeWidth?: strokeWidth;
  tabSize?: tabSize;
  tableLayout?: tableLayout;
  textAlign?: textAlign;
  textAlignLast?: textAlignLast;
  textAnchor?: textAnchor;
  textCombineUpright?: textCombineUpright;

  textDecoration?: textDecoration;
  textDecorationColor?: textDecorationColor;
  textDecorationLine?: textDecorationLine;
  textDecorationSkip?: textDecorationSkip;
  textDecorationSkipInk?: textDecorationSkipInk;
  textDecorationStyle?: textDecorationStyle;
  textDecorationThickness?: textDecorationThickness;

  textEmphasis?: textEmphasis;
  textEmphasisColor?: textEmphasisColor;
  textEmphasisPosition?: textEmphasisPosition;
  textEmphasisStyle?: textEmphasisStyle;
  textIndent?: textIndent;
  textJustify?:
    | 'none'
    | 'auto'
    | 'inter-word'
    | 'inter-character'
    | 'distribute';
  textOrientation?: textOrientation;
  textOverflow?: textOverflow;
  textRendering?: textRendering;
  textShadow?: textShadow;
  textSizeAdjust?: textSizeAdjust;
  textTransform?: textTransform;
  textUnderlineOffset?: textUnderlineOffset;
  textUnderlinePosition?: textUnderlinePosition;
  textWrap?: textWrap;

  timelineScope?: timelineScope;
  top?: top;
  touchAction?: touchAction;

  transform?: transform;
  transformBox?: transformBox;
  transformOrigin?: transformOrigin;
  transformStyle?: transformStyle;
  rotate?: rotate;
  scale?: scale;
  translate?: translate;

  transition?: transition;
  transitionDelay?: transitionDelay;
  transitionDuration?: transitionDuration;
  transitionProperty?: transitionProperty;
  transitionTimingFunction?: transitionTimingFunction;
  unicodeBidi?: unicodeBidi;
  unicodeRange?: unicodeRange;
  userSelect?: userSelect;
  verticalAlign?: verticalAlign;

  viewTimeline?: viewTimeline;
  viewTimelineAxis?: viewTimelineAxis;
  viewTimelineName?: viewTimelineName;
  viewTimelineInset?: viewTimelineInset;

  viewTransitionName?: viewTransitionName;

  visibility?: visibility;
  voiceBalance?: voiceBalance;
  voiceDuration?: voiceDuration;
  voiceFamily?: voiceFamily;
  voicePitch?: voicePitch;
  voiceRange?: voiceRange;
  voiceRate?: voiceRate;
  voiceStress?: voiceStress;
  voiceVolume?: voiceVolume;
  whiteSpace?: whiteSpace;
  whiteSpaceCollapse?: whiteSpaceCollapse;

  widows?: widows;
  width?: width;
  willChange?: willChange;
  wordBreak?: wordBreak;
  wordSpacing?: wordSpacing;
  wordWrap?: wordWrap;
  writingMode?: writingMode;
  zIndex?: zIndex;

  zoom?: zoom;
}>;
