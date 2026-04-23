/**
 * Based on Meta's StyleX CSS type definitions.
 * Extended from src/types/StyleXCSSTypes.js (https://github.com/facebook/stylex)
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type all = 'initial' | 'inherit' | 'unset';
type StableString = Pick<string, keyof string>;

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
type alignTracks = number | StableString;
type anchorName = number | StableString;
type animatableFeature = 'scroll-position' | 'contents' | StableString;
type animation = number | StableString;
type animationComposition = number | StableString;
type animationDelay = time;
type animationDirection = singleAnimationDirection;
type animationDuration = time;
type animationFillMode = singleAnimationFillMode;
type animationIterationCount = singleAnimationIterationCount;
type animationName = singleAnimationName;
type animationPlayState = singleAnimationPlayState;
type animationRange = number | StableString;
type animationRangeEnd = number | StableString;
type animationRangeStart = number | StableString;
type animationTimeline = number | StableString;
type animationTimingFunction = singleTimingFunction;
type appearance = 'auto' | 'none' | 'textfield';
type aspectRatio = number | StableString;
type attachment = 'scroll' | 'fixed' | 'local';
type azimuth = number | StableString;
type backdropFilter = 'none' | StableString;
type backfaceVisibility = 'visible' | 'hidden';
type background = finalBgLayer;
type backgroundAttachment = attachment;
type backgroundBlendMode = blendMode;
type backgroundClip = box | 'text';
type backgroundColor = color;
type backgroundImage = bgImage;
type backgroundOrigin = box;
type backgroundPosition = StableString;
type backgroundPositionX = StableString;
type backgroundPositionY = StableString;
type backgroundRepeat = repeatStyle;
type backgroundSize = bgSize;
type baselineShift = 'baseline' | 'sub' | 'super' | svgLength;
type behavior = StableString;
type bgImage = 'none' | StableString;
type bgSize = 'auto' | 'cover' | 'contain' | StableString;
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
type borderImageOutset = StableString;
type borderImageRepeat = StableString;
type borderImageSlice = 'fill' | number | StableString;
type borderImageSource = 'none' | StableString;
type borderImageWidth = StableString;
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
type borderSpacing = number | StableString;
type borderStartEndRadius = borderTopRightRadius;
type borderStartStartRadius = borderTopLeftRadius;
type borderStyle = brStyle;
type borderTop = border;
type borderTopColor = color;
type borderTopLeftRadius = lengthPercentage;
type borderTopRightRadius = lengthPercentage;
type borderTopStyle = brStyle;
type borderTopWidth = borderWidth;
type borderWidth = 'thin' | 'medium' | 'thick' | number | StableString;
type bottom = number | StableString;
type box = 'border-box' | 'padding-box' | 'content-box';
type boxAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type boxDecorationBreak = 'slice' | 'clone';
type boxDirection = 'normal' | 'reverse';
type boxFlex = number | StableString;
type boxFlexGroup = number | StableString;
type boxLines = 'single' | 'multiple';
type boxOrdinalGroup = number | StableString;
type boxOrient = 'horizontal' | 'vertical' | 'inline-axis' | 'block-axis';
type boxShadow = 'none' | StableString;
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
type caret = number | StableString;
type caretColor = color;
type caretShape = number | StableString;
type clear = 'none' | 'left' | 'right' | 'both' | 'inline-start' | 'inline-end';
type clip = 'auto' | StableString;
type clipPath = 'none' | StableString;
type clipRule = 'nonzero' | 'evenodd';
type color = NamedColor | StableString;
type colorInterpolation = 'auto' | 'sRGB' | 'linearRGB';
type colorInterpolationFilters = 'auto' | 'sRGB' | 'linearRGB';
type colorScheme =
  | 'normal'
  | 'light'
  | 'dark'
  | 'light dark'
  | 'only light'
  | 'only dark';
type columnCount = 'auto' | number | StableString;
type columnFill = 'auto' | 'balance';
type columnGap = 'normal' | number | StableString;
type columnRule = columnRuleWidth | columnRuleStyle | columnRuleColor;
type columnRuleColor = color;
type columnRuleStyle = brStyle;
type columnRuleWidth = borderWidth;
type columns = columnWidth | columnCount;
type columnSpan = 'none' | 'all';
type columnWidth = 'auto' | number | StableString;
type compositeOperator = 'add' | 'subtract' | 'intersect' | 'exclude';
type contain = 'none' | 'strict' | 'content' | StableString;
type container = number | StableString;
type containerName = number | StableString;
type containerType = 'size' | 'inline-size' | 'normal';
type containIntrinsicBlockSize = number | StableString;
type containIntrinsicHeight = number | StableString;
type containIntrinsicInlineSize = number | StableString;
type containIntrinsicSize = number | StableString;
type containIntrinsicWidth = number | StableString;
type content = StableString;
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
  | 'squircle'
  | StableString;
type cornerStartEndShape = cornerTopRightShape;
type cornerStartStartShape = cornerTopLeftShape;
type cornerTopLeftShape = cornerShape;
type cornerTopRightShape = cornerShape;
type counterIncrement = 'none' | StableString;
type counterReset = 'none' | StableString;
type counterSet = number | StableString;
type cue = cueBefore | cueAfter;
type cueAfter = 'none' | number | StableString;
type cueBefore = 'none' | number | StableString;
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
  | 'grabbing'
  | StableString;
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
type end = number | StableString;
type fill = paint;
type fillOpacity = number | StableString;
type fillRule = 'nonzero' | 'evenodd';
type filter = 'none' | StableString;
type finalBgLayer = attachment | box | backgroundColor;
type flex = 'none' | number | StableString;
type flexBasis = 'content' | number | StableString;
type flexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type flexFlow = flexDirection | flexWrap;
type flexGrow = number | StableString;
type flexShrink = number | StableString;
type flexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type float =
  | 'left'
  | 'right'
  | 'none'
  | 'start'
  | 'end'
  | 'inline-start'
  | 'inline-end';
type font = number | StableString;
type fontFamily = StableString;
type fontFeatureSettings = 'normal' | StableString;
type fontKerning = 'auto' | 'normal' | 'none';
type fontLanguageOverride = 'normal' | StableString;
type fontOpticalSizing = 'auto' | 'none';
type fontPalette = 'normal' | 'light' | 'dark' | StableString;
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
  | 'ultra-expanded'
  | StableString;
type fontStyle = 'normal' | 'italic' | 'oblique';
type fontSynthesis = 'none' | StableString;
type fontSynthesisPosition = 'auto' | 'none';
type fontSynthesisSmallCaps = 'auto' | 'none';
type fontSynthesisStyle = 'auto' | 'none';
type fontSynthesisWeight = 'auto' | 'none';
type fontVariant = 'normal' | 'none' | StableString;
type fontVariantAlternates = 'normal' | StableString;
type fontVariantCaps =
  | 'normal'
  | 'small-caps'
  | 'all-small-caps'
  | 'petite-caps'
  | 'all-petite-caps'
  | 'unicase'
  | 'titling-caps';
type fontVariantEastAsian = 'normal' | StableString;
type fontVariantLigatures = 'normal' | 'none' | StableString;
type fontVariantNumeric = 'normal' | StableString;
type fontVariantPosition = 'normal' | 'sub' | 'super';
type fontVariationSettings = number | StableString;
type fontWeight =
  | 'inherit'
  | 'normal'
  | 'bold'
  | 'bolder'
  | 'lighter'
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | number
  | StableString;
type forcedColorAdjust = 'auto' | 'none';
type gap = number | StableString;
type geometryBox = shapeBox | 'fill-box' | 'stroke-box' | 'view-box';
type glyphOrientationHorizontal = number | StableString;
type glyphOrientationVertical = number | StableString;
type grid = gridTemplate;
type gridArea = gridLine;
type gridAutoColumns = trackSize;
type gridAutoFlow =
  | 'row'
  | 'column'
  | 'dense'
  | 'row dense'
  | 'column dense'
  | StableString;
type gridAutoRows = trackSize;
type gridColumn = gridLine;
type gridColumnEnd = gridLine;
type gridColumnGap = lengthPercentage;
type gridColumnStart = gridLine;
type gridGap = gridRowGap | gridColumnGap;
type gridLine = 'auto' | number | StableString;
type gridRow = gridLine;
type gridRowEnd = gridLine;
type gridRowGap = lengthPercentage;
type gridRowStart = gridLine;
type gridTemplate = 'none' | 'subgrid' | StableString;
type gridTemplateAreas = 'none' | StableString;
type gridTemplateColumns = 'none' | 'subgrid' | StableString;
type gridTemplateRows = 'none' | 'subgrid' | StableString;
type hangingPunctuation = number | StableString;
type height = number | StableString;
type hyphenateCharacter = number | StableString;
type hyphenateLimitChars = number | StableString;
type hyphens = 'none' | 'manual' | 'auto';
type imageOrientation = 'from-image' | number | StableString;
type imageRendering =
  | 'auto'
  | 'crisp-edges'
  | 'pixelated'
  | 'optimizeSpeed'
  | 'optimizeQuality'
  | StableString;
type imageResolution = 'snap' | StableString;
type imeMode = 'auto' | 'normal' | 'active' | 'inactive' | 'disabled';
type initialLetter = 'normal' | number | StableString;
type initialLetterAlign = StableString;
type inlineSize = width;
type inset = number | StableString;
type insetBlock = number | StableString;
type insetBlockEnd = number | StableString;
type insetBlockStart = number | StableString;
type insetInline = number | StableString;
type insetInlineEnd = number | StableString;
type insetInlineStart = number | StableString;
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
type justifyTracks = number | StableString;
type kerning = 'auto' | svgLength;
type left = number | StableString;
type lengthPercentage = number | StableString;
type letterSpacing = 'normal' | lengthPercentage;
type lineBreak = 'auto' | 'loose' | 'normal' | 'strict';
type lineHeight = 'normal' | number | StableString;
type lineHeightStep = number | StableString;
type listStyle = listStyleType | listStylePosition | listStyleImage;
type listStyleImage = 'none' | StableString;
type listStylePosition = 'inside' | 'outside';
type listStyleType = 'none' | StableString;
type margin = number | StableString;
type marginBlock = marginBlockEnd;
type marginBlockEnd = marginLeft;
type marginBlockStart = marginLeft;
type marginBottom = 'auto' | number | StableString;
type marginInline = marginInlineEnd;
type marginInlineEnd = marginLeft;
type marginInlineStart = marginLeft;
type marginLeft = 'auto' | number | StableString;
type marginRight = 'auto' | number | StableString;
type marginTop = 'auto' | number | StableString;
type marker = 'none' | StableString;
type markerEnd = 'none' | StableString;
type markerMid = 'none' | StableString;
type markerOffset = 'auto' | number | StableString;
type markerStart = 'none' | StableString;
type mask = maskLayer;
type maskBorder = number | StableString;
type maskBorderMode = 'alpha' | 'luminance';
type maskBorderOutset = number | StableString;
type maskBorderRepeat = 'stretch' | 'repeat' | 'round' | 'space';
type maskBorderSlice = number | StableString;
type maskBorderSource = number | StableString;
type maskBorderWidth = number | StableString;
type maskClip = StableString;
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
type maskPosition = StableString;
type maskReference = 'none' | StableString;
type maskRepeat = repeatStyle;
type maskSize = bgSize;
type maskType = 'luminance' | 'alpha';
type masonryAutoFlow = number | StableString;
type mathDepth = number | StableString;
type mathShift = 'normal' | 'compact';
type mathStyle = 'normal' | 'compact';
type maxBlockSize = maxWidth;
type maxHeight =
  | 'none'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
  | 'fill-available'
  | number
  | StableString;
type maxInlineSize = maxWidth;
type maxWidth =
  | 'none'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
  | 'fill-available'
  | number
  | StableString;
type minBlockSize = minWidth;
type minHeight =
  | 'auto'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
  | 'fill-available'
  | number
  | StableString;
type minInlineSize = minWidth;
type minWidth =
  | 'auto'
  | 'max-content'
  | 'min-content'
  | 'fit-content'
  | 'fill-available'
  | number
  | StableString;
type mixBlendMode = blendMode;
type motion = motionPath | motionOffset | motionRotation;
type motionOffset = lengthPercentage;
type motionPath = 'none' | geometryBox | StableString;
type motionRotation = number | StableString;
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
type objectPosition = StableString;
type offset = number | StableString;
type offsetAnchor = number | StableString;
type offsetDistance = number | StableString;
type offsetPath = number | StableString;
type offsetPosition = number | StableString;
type offsetRotate = number | StableString;
type opacity = number | StableString;
type order = number | StableString;
type orphans = number | StableString;
type outline = StableString;
type outlineColor = color | 'invert';
type outlineOffset = number | StableString;
type outlineStyle = 'auto' | brStyle;
type outlineWidth = borderWidth;
type overflow = 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
type overflowAnchor = 'auto' | 'none';
type overflowBlock = overflowY;
type overflowBlockX = overflowX;
type overflowClipMargin = number | StableString;
type overflowWrap = 'normal' | 'break-word' | 'anywhere';
type overflowX = overflow;
type overflowY = overflow;
type overscrollBehavior = 'none' | 'contain' | 'auto';
type overscrollBehaviorBlock = overscrollBehaviorY;
type overscrollBehaviorInline = overscrollBehaviorX;
type overscrollBehaviorX = 'none' | 'contain' | 'auto';
type overscrollBehaviorY = 'none' | 'contain' | 'auto';
type padding = number | StableString;
type paddingBlock = paddingBlockEnd;
type paddingBlockEnd = paddingLeft;
type paddingBlockStart = paddingLeft;
type paddingBottom = number | StableString;
type paddingInline = paddingBlockEnd;
type paddingInlineEnd = paddingBlockEnd;
type paddingInlineStart = paddingBlockStart;
type paddingLeft = number | StableString;
type paddingRight = number | StableString;
type paddingTop = number | StableString;
type page = number | StableString;
type pageBreakAfter = 'auto' | 'always' | 'avoid' | 'left' | 'right';
type pageBreakBefore = 'auto' | 'always' | 'avoid' | 'left' | 'right';
type pageBreakInside = 'auto' | 'avoid';
type paintOrder = 'normal' | 'stroke' | 'fill' | 'markers';
type paint = 'none' | 'currentColor' | color | StableString;
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
type perspectiveOrigin = StableString;
type placeContent = number | StableString;
type placeItems = number | StableString;
type placeSelf = number | StableString;
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
type positionAnchor = number | StableString;
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
type positionTry = number | StableString;
type positionTryFallbacks = number | StableString;
type positionTryOptions = number | StableString;
type positionVisibility = 'always' | 'anchors-visible' | 'no-overflow';
type printColorAdjust = 'economy' | 'exact';
type quotes = 'none' | StableString;
type relativeSize = 'larger' | 'smaller';
type repeatStyle =
  | 'repeat'
  | 'repeat-x'
  | 'repeat-y'
  | 'space'
  | 'round'
  | 'no-repeat'
  | StableString;
type resize = 'none' | 'both' | 'horizontal' | 'vertical';
type rest = restBefore | restAfter;
type restAfter = 'none' | 'x-weak' | 'weak' | 'medium' | 'strong' | 'x-strong';
type restBefore = 'none' | 'x-weak' | 'weak' | 'medium' | 'strong' | 'x-strong';
type right = number | StableString;
type rotate = number | StableString;
type rowGap = number | StableString;
type rubyAlign = 'start' | 'center' | 'space-between' | 'space-around';
type rubyMerge = 'separate' | 'collapse' | 'auto';
type rubyPosition = 'over' | 'under' | 'inter-character';
type scale = 'none' | number | StableString;
type scrollbarColor = color;
type scrollbarGutter = 'auto' | 'stable' | 'stable both-edges';
type scrollbarWidth = 'auto' | 'thin' | 'none';
type scrollBehavior = 'auto' | 'smooth';
type scrollMargin = number | StableString;
type scrollMarginBlock = number | StableString;
type scrollMarginBlockEnd = number | StableString;
type scrollMarginBlockStart = number | StableString;
type scrollMarginBottom = number | StableString;
type scrollMarginInline = number | StableString;
type scrollMarginInlineEnd = number | StableString;
type scrollMarginInlineStart = number | StableString;
type scrollMarginLeft = number | StableString;
type scrollMarginRight = number | StableString;
type scrollMarginTop = number | StableString;
type scrollPadding = number | StableString;
type scrollPaddingBlock = number | StableString;
type scrollPaddingBlockEnd = number | StableString;
type scrollPaddingBlockStart = number | StableString;
type scrollPaddingBottom = number | StableString;
type scrollPaddingInline = number | StableString;
type scrollPaddingInlineEnd = number | StableString;
type scrollPaddingInlineStart = number | StableString;
type scrollPaddingLeft = number | StableString;
type scrollPaddingRight = number | StableString;
type scrollPaddingTop = number | StableString;
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
type scrollTimeline = number | StableString;
type scrollTimelineAxis = 'block' | 'inline' | 'x' | 'y';
type scrollTimelineName = number | StableString;
type shapeBox = box | 'margin-box';
type shapeImageThreshold = number | StableString;
type shapeMargin = lengthPercentage;
type shapeOutside = 'none' | shapeBox | StableString;
type shapeRendering =
  | 'auto'
  | 'optimizeSpeed'
  | 'crispEdges'
  | 'geometricPrecision';
type speakAs = 'normal' | 'spell-out' | 'digits' | StableString;
type singleAnimationDirection =
  | 'normal'
  | 'reverse'
  | 'alternate'
  | 'alternate-reverse';
type singleAnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';
type singleAnimationIterationCount = number | 'infinite';
type singleAnimationName = 'none' | StableString;
type singleAnimationPlayState = 'running' | 'paused';
type singleTimingFunction = singleTransitionTimingFunction;
type singleTransition = singleTransitionTimingFunction;
type singleTransitionProperty = 'all' | StableString;
type singleTransitionTimingFunction =
  | 'ease'
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'step-start'
  | 'step-end'
  | StableString;
type src = StableString;
type start = number | StableString;
type stroke = paint;
type strokeDasharray = 'none' | svgLength;
type strokeDashoffset = svgLength;
type strokeLinecap = 'butt' | 'round' | 'square';
type strokeLinejoin = 'miter' | 'round' | 'bevel';
type strokeMiterlimit = number | StableString;
type strokeOpacity = number | StableString;
type strokeWidth = svgLength;
type svgLength = number | StableString;
type svgWritingMode = 'lr-tb' | 'rl-tb' | 'tb-rl' | 'lr' | 'rl' | 'tb';
type tableLayout = 'auto' | 'fixed';
type tabSize = number | StableString;
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
type textCombineUpright = 'none' | 'all' | StableString;
type textDecoration =
  | textDecorationLine
  | textDecorationStyle
  | textDecorationColor;
type textDecorationColor = color;
type textDecorationLine = 'none' | StableString;
type textDecorationSkip = 'none' | StableString;
type textDecorationSkipInk = 'auto' | 'none' | 'all';
type textDecorationStyle = 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy';
type textDecorationThickness = number | StableString;
type textEmphasis = textEmphasisStyle | textEmphasisColor;
type textEmphasisColor = color;
type textEmphasisPosition = StableString;
type textEmphasisStyle = 'none' | StableString;
type textIndent = lengthPercentage | 'hanging' | 'each-line';
type textOrientation = 'mixed' | 'upright' | 'sideways';
type textOverflow = StableString;
type textRendering =
  | 'auto'
  | 'optimizeSpeed'
  | 'optimizeLegibility'
  | 'geometricPrecision';
type textShadow = 'none' | StableString;
type textSizeAdjust = 'none' | 'auto' | StableString;
type textTransform =
  | 'none'
  | 'capitalize'
  | 'uppercase'
  | 'lowercase'
  | 'full-width';
type textUnderlineOffset = number | StableString;
type textUnderlinePosition = 'auto' | StableString;
type textWrap = 'wrap' | 'nowrap' | 'balance';
type time = StableString;
type timelineScope = number | StableString;
type top = number | StableString;
type touchAction = 'auto' | 'none' | 'manipulation' | StableString;
type trackBreadth = 'min-content' | 'max-content' | 'auto' | lengthPercentage;
type trackSize = trackBreadth;
type transform = 'none' | StableString;
type transformBox = 'border-box' | 'fill-box' | 'view-box';
type transformOrigin = number | StableString;
type transformStyle = 'flat' | 'preserve-3d';
type transition = singleTransition;
type transitionDelay = time;
type transitionDuration = time;
type transitionProperty = 'none' | singleTransitionProperty;
type transitionTimingFunction = singleTransitionTimingFunction;
type translate = number | StableString;
type unicodeBidi =
  | 'normal'
  | 'embed'
  | 'isolate'
  | 'bidi-override'
  | 'isolate-override'
  | 'plaintext';
type unicodeRange = StableString;
type userSelect = 'auto' | 'text' | 'none' | 'contain' | 'all';
type verticalAlign =
  | 'baseline'
  | 'sub'
  | 'super'
  | 'text-top'
  | 'text-bottom'
  | 'middle'
  | 'top'
  | 'bottom'
  | number
  | StableString;
type viewTimeline = number | StableString;
type viewTimelineAxis = 'block' | 'inline' | 'x' | 'y';
type viewTimelineInset = number | StableString;
type viewTimelineName = number | StableString;
type viewTransitionName = number | StableString;
type visibility = 'visible' | 'hidden' | 'collapse';
type voiceBalance = 'left' | 'center' | 'right' | 'leftwards' | 'rightwards';
type voiceDuration = 'auto' | StableString;
type voiceFamily = 'preserve' | StableString;
type voicePitch = 'absolute' | number | StableString;
type voiceRange = 'absolute' | number | StableString;
type voiceRate = StableString;
type voiceStress = 'normal' | 'strong' | 'moderate' | 'none' | 'reduced';
type voiceVolume = 'silent' | StableString;
type WebkitBackgroundClip =
  | 'border-box'
  | 'padding-box'
  | 'content-box'
  | 'text';
type WebkitBoxOrient = 'vertical' | 'horizontal' | 'inline-axis' | 'block-axis';
type WebkitFontSmoothing = 'antialiased';
type WebkitLineClamp = number | StableString;
type WebkitMaskImage = maskImage;
type WebkitTapHighlightColor = color;
type WebkitTextFillColor = color;
type WebkitTextStrokeColor = color;
type WebkitTextStrokeWidth = number | StableString;
type whiteSpace = 'normal' | 'pre' | 'nowrap' | 'pre-wrap' | 'pre-line';
type whiteSpaceCollapse =
  | 'collapse'
  | 'discard'
  | 'preserve'
  | 'preserve-breaks'
  | 'preserve-spaces'
  | 'break-spaces';
type widows = number | StableString;
type width =
  | 'available'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | 'auto'
  | number
  | StableString;
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
type zIndex = 'auto' | number | StableString;
type zoom = 'normal';

export type CSSTypes = Readonly<{
  WebkitFontSmoothing?: all | WebkitFontSmoothing;
  WebkitTapHighlightColor?: all | WebkitTapHighlightColor;

  WebkitMaskImage?: all | WebkitMaskImage;

  WebkitTextFillColor?: all | WebkitTextFillColor;
  WebkitTextStrokeWidth?: all | WebkitTextStrokeWidth;
  WebkitTextStrokeColor?: all | WebkitTextStrokeColor;
  WebkitBackgroundClip?: all | WebkitBackgroundClip;

  WebkitBoxOrient?: all | WebkitBoxOrient;
  WebkitLineClamp?: all | WebkitLineClamp;

  accentColor?: all | accentColor;

  aspectRatio?: all | aspectRatio;

  placeContent?: all | placeContent;
  alignContent?: all | alignContent;
  justifyContent?: all | justifyContent;
  placeItems?: all | placeItems;
  placeSelf?: all | placeSelf;
  alignItems?: all | alignItems;
  justifyItems?: all | justifyItems;
  alignSelf?: all | alignSelf;
  justifySelf?: all | justifySelf;

  alignmentBaseline?: all | alignmentBaseline;
  alignTracks?: all | alignTracks;
  justifyTracks?: all | justifyTracks;
  masonryAutoFlow?: all | masonryAutoFlow;

  anchorName?: all | anchorName;

  animation?: all | animation;
  animationComposition?: all | animationComposition;
  animationDelay?: all | animationDelay;
  animationDirection?: all | animationDirection;
  animationDuration?: all | animationDuration;
  animationFillMode?: all | animationFillMode;
  animationIterationCount?: all | animationIterationCount;
  animationName?: all | animationName;
  animationPlayState?: all | animationPlayState;
  animationTimingFunction?: all | animationTimingFunction;
  animationTimeline?: all | animationTimeline;
  animationRange?: all | animationRange;
  animationRangeStart?: all | animationRangeStart;
  animationRangeEnd?: all | animationRangeEnd;
  appearance?: all | appearance;
  azimuth?: all | azimuth;

  backdropFilter?: all | backdropFilter;
  backfaceVisibility?: all | backfaceVisibility;
  background?: all | background;
  backgroundAttachment?: all | backgroundAttachment;
  backgroundBlendMode?: all | backgroundBlendMode;
  backgroundClip?: all | backgroundClip;
  backgroundColor?: all | backgroundColor;
  backgroundImage?: all | backgroundImage;
  backgroundOrigin?: all | backgroundOrigin;
  backgroundPosition?: all | backgroundPosition;
  backgroundPositionX?: all | backgroundPositionX;
  backgroundPositionY?: all | backgroundPositionY;
  backgroundRepeat?: all | backgroundRepeat;
  backgroundSize?: all | backgroundSize;
  baselineShift?: all | baselineShift;
  behavior?: all | behavior;
  blockSize?: all | blockSize;
  border?: all | border;
  borderBlock?: all | borderBlock;
  borderBlockColor?: all | borderBlockColor;
  borderBlockStyle?: all | borderBlockStyle;
  borderBlockWidth?: all | borderBlockWidth;
  borderBlockEnd?: all | borderBlockEnd;
  borderBlockEndColor?: all | borderBlockEndColor;
  borderBlockEndStyle?: all | borderBlockEndStyle;
  borderBlockEndWidth?: all | borderBlockEndWidth;
  borderBlockStart?: all | borderBlockStart;
  borderBlockStartColor?: all | borderBlockStartColor;
  borderBlockStartStyle?: all | borderBlockStartStyle;
  borderBlockStartWidth?: all | borderBlockStartWidth;
  borderBottom?: all | borderBottom;
  borderBottomColor?: all | borderBottomColor;
  borderBottomStyle?: all | borderBottomStyle;
  borderBottomWidth?: all | borderBottomWidth;
  borderCollapse?: all | borderCollapse;
  borderColor?: all | borderColor;
  borderImage?: all | borderImage;
  borderImageOutset?: all | borderImageOutset;
  borderImageRepeat?: all | borderImageRepeat;
  borderImageSlice?: all | borderImageSlice;
  borderImageSource?: all | borderImageSource;
  borderImageWidth?: all | borderImageWidth;
  borderInline?: all | borderInline;
  borderInlineColor?: all | borderInlineColor;
  borderInlineStyle?: all | borderInlineStyle;
  borderInlineWidth?: all | borderInlineWidth;
  borderInlineEnd?: all | borderInlineEnd;
  borderInlineEndColor?: all | borderInlineEndColor;
  borderInlineEndStyle?: all | borderInlineEndStyle;
  borderInlineEndWidth?: all | borderInlineEndWidth;
  borderInlineStart?: all | borderInlineStart;
  borderInlineStartColor?: all | borderInlineStartColor;
  borderInlineStartStyle?: all | borderInlineStartStyle;
  borderInlineStartWidth?: all | borderInlineStartWidth;
  borderLeft?: all | borderLeft;
  borderLeftColor?: all | borderLeftColor;
  borderLeftStyle?: all | borderLeftStyle;
  borderLeftWidth?: all | borderLeftWidth;
  borderRight?: all | borderRight;
  borderRightColor?: all | borderRightColor;
  borderRightStyle?: all | borderRightStyle;
  borderRightWidth?: all | borderRightWidth;
  borderSpacing?: all | borderSpacing;
  borderStyle?: all | borderStyle;
  borderTop?: all | borderTop;
  borderTopColor?: all | borderTopColor;

  borderRadius?: all | borderRadius;
  borderEndStartRadius?: all | borderEndStartRadius;
  borderStartStartRadius?: all | borderStartStartRadius;
  borderStartEndRadius?: all | borderStartEndRadius;
  borderEndEndRadius?: all | borderEndEndRadius;
  borderTopLeftRadius?: all | borderTopLeftRadius;
  borderTopRightRadius?: all | borderTopRightRadius;
  borderBottomLeftRadius?: all | borderBottomLeftRadius;
  borderBottomRightRadius?: all | borderBottomRightRadius;

  cornerShape?: all | cornerShape;
  cornerStartStartShape?: all | cornerStartStartShape;
  cornerStartEndShape?: all | cornerStartEndShape;
  cornerEndStartShape?: all | cornerEndStartShape;
  cornerEndEndShape?: all | cornerEndEndShape;
  cornerTopLeftShape?: all | cornerTopLeftShape;
  cornerTopRightShape?: all | cornerTopRightShape;
  cornerBottomLeftShape?: all | cornerBottomLeftShape;
  cornerBottomRightShape?: all | cornerBottomRightShape;

  borderTopStyle?: all | borderTopStyle;
  borderTopWidth?: all | borderTopWidth;
  borderWidth?: all | borderWidth;
  bottom?: all | bottom;
  boxAlign?: all | boxAlign;
  boxDecorationBreak?: all | boxDecorationBreak;
  boxDirection?: all | boxDirection;
  boxFlex?: all | boxFlex;
  boxFlexGroup?: all | boxFlexGroup;
  boxLines?: all | boxLines;
  boxOrdinalGroup?: all | boxOrdinalGroup;
  boxOrient?: all | boxOrient;
  boxShadow?: all | boxShadow;
  boxSizing?: all | boxSizing;
  boxSuppress?: all | boxSuppress;
  breakAfter?: all | breakAfter;
  breakBefore?: all | breakBefore;
  breakInside?: all | breakInside;

  captionSide?: all | captionSide;
  caret?: all | caret;
  caretColor?: all | caretColor;
  caretShape?: all | caretShape;
  clear?: all | clear;
  clip?: all | clip;
  clipPath?: all | clipPath;
  clipRule?: all | clipRule;
  color?: all | color;
  colorInterpolation?: all | colorInterpolation;
  colorInterpolationFilters?: all | colorInterpolationFilters;

  colorScheme?: all | colorScheme;
  forcedColorAdjust?: all | forcedColorAdjust;
  printColorAdjust?: all | printColorAdjust;

  columns?: all | columns;
  columnCount?: all | columnCount;
  columnWidth?: all | columnWidth;

  columnRule?: all | columnRule;
  columnRuleColor?: all | columnRuleColor;
  columnRuleStyle?: all | columnRuleStyle;
  columnRuleWidth?: all | columnRuleWidth;

  columnFill?: all | columnFill;
  columnGap?: all | columnGap;
  columnSpan?: all | columnSpan;

  contain?: all | contain;
  containIntrinsicSize?: all | containIntrinsicSize;
  containIntrinsicBlockSize?: all | containIntrinsicBlockSize;
  containIntrinsicInlineSize?: all | containIntrinsicInlineSize;
  containIntrinsicHeight?: all | containIntrinsicHeight;
  containIntrinsicWidth?: all | containIntrinsicWidth;

  container?: all | container;
  containerName?: all | containerName;
  containerType?: all | containerType;

  contentVisibility?: all | contentVisibility;

  content?: all | content;

  counterIncrement?: all | counterIncrement;
  counterReset?: all | counterReset;
  counterSet?: all | counterSet;

  cue?: all | cue;
  cueAfter?: all | cueAfter;
  cueBefore?: all | cueBefore;
  cursor?: all | cursor;
  direction?: all | direction;
  display?: all | display;
  displayInside?: all | displayInside;
  displayList?: all | displayList;
  displayOutside?: all | displayOutside;
  dominantBaseline?: all | dominantBaseline;
  emptyCells?: all | emptyCells;
  end?: all | end;
  fill?: all | fill;
  fillOpacity?: all | fillOpacity;
  fillRule?: all | fillRule;
  filter?: all | filter;
  flex?: all | flex;
  flexBasis?: all | flexBasis;
  flexDirection?: all | flexDirection;
  flexFlow?: all | flexFlow;
  flexGrow?: all | flexGrow;
  flexShrink?: all | flexShrink;
  flexWrap?: all | flexWrap;
  float?: all | float;

  font?: all | font;
  fontFamily?: all | fontFamily;
  fontFeatureSettings?: all | fontFeatureSettings;
  fontKerning?: all | fontKerning;
  fontLanguageOverride?: all | fontLanguageOverride;
  fontSize?: all | fontSize;
  fontSizeAdjust?: all | fontSizeAdjust;
  fontStretch?: all | fontStretch;
  fontStyle?: all | fontStyle;
  fontSynthesis?: all | fontSynthesis;
  fontSynthesisWeight?: all | fontSynthesisWeight;
  fontSynthesisStyle?: all | fontSynthesisStyle;
  fontSynthesisSmallCaps?: all | fontSynthesisSmallCaps;
  fontSynthesisPosition?: all | fontSynthesisPosition;

  fontVariant?: all | fontVariant;
  fontVariantAlternates?: all | fontVariantAlternates;
  fontVariantCaps?: all | fontVariantCaps;
  fontVariantEastAsian?: all | fontVariantEastAsian;
  fontVariantLigatures?: all | fontVariantLigatures;
  fontVariantNumeric?: all | fontVariantNumeric;
  fontVariantPosition?: all | fontVariantPosition;
  fontWeight?: all | fontWeight;

  fontOpticalSizing?: all | fontOpticalSizing;
  fontPalette?: all | fontPalette;
  fontVariationSettings?: all | fontVariationSettings;

  gap?: all | gap;
  glyphOrientationHorizontal?: all | glyphOrientationHorizontal;
  glyphOrientationVertical?: all | glyphOrientationVertical;
  grid?: all | grid;
  gridArea?: all | gridArea;
  gridAutoColumns?: all | gridAutoColumns;
  gridAutoFlow?: all | gridAutoFlow;
  gridAutoRows?: all | gridAutoRows;
  gridColumn?: all | gridColumn;
  gridColumnEnd?: all | gridColumnEnd;
  gridColumnGap?: all | gridColumnGap;
  gridColumnStart?: all | gridColumnStart;
  gridGap?: all | gridGap;
  gridRow?: all | gridRow;
  gridRowEnd?: all | gridRowEnd;
  gridRowGap?: all | gridRowGap;
  gridRowStart?: all | gridRowStart;
  gridTemplate?: all | gridTemplate;
  gridTemplateAreas?: all | gridTemplateAreas;
  gridTemplateColumns?: all | gridTemplateColumns;
  gridTemplateRows?: all | gridTemplateRows;

  hangingPunctuation?: all | hangingPunctuation;
  hyphenateCharacter?: all | hyphenateCharacter;
  hyphenateLimitChars?: all | hyphenateLimitChars;
  hyphens?: all | hyphens;

  height?: all | height;

  imageOrientation?: all | imageOrientation;
  imageRendering?: all | imageRendering;
  imageResolution?: all | imageResolution;
  imeMode?: all | imeMode;

  initialLetter?: all | initialLetter;
  initialLetterAlign?: all | initialLetterAlign;
  inlineSize?: all | inlineSize;

  interpolateSize?: all | interpolateSize;

  inset?: all | inset;
  insetBlock?: all | insetBlock;
  insetBlockEnd?: all | insetBlockEnd;
  insetBlockStart?: all | insetBlockStart;
  insetInline?: all | insetInline;
  insetInlineEnd?: all | insetInlineEnd;
  insetInlineStart?: all | insetInlineStart;

  isolation?: all | isolation;
  kerning?: all | kerning;
  left?: all | left;
  letterSpacing?: all | letterSpacing;
  lineBreak?: all | lineBreak;
  lineHeight?: all | lineHeight;
  lineHeightStep?: all | lineHeightStep;
  listStyle?: all | listStyle;
  listStyleImage?: all | listStyleImage;
  listStylePosition?: all | listStylePosition;
  listStyleType?: all | listStyleType;
  margin?: all | margin;
  marginBlock?: all | marginBlock;
  marginBlockEnd?: all | marginBlockEnd;
  marginBlockStart?: all | marginBlockStart;
  marginBottom?: all | marginBottom;
  marginInline?: all | marginInline;
  marginInlineEnd?: all | marginInlineEnd;
  marginInlineStart?: all | marginInlineStart;
  marginLeft?: all | marginLeft;
  marginRight?: all | marginRight;
  marginTop?: all | marginTop;
  marginTrim?:
    | all
    | 'none'
    | 'block'
    | 'block-start'
    | 'block-end'
    | 'inline'
    | 'inline-start'
    | 'inline-end';

  marker?: all | marker;
  markerEnd?: all | markerEnd;
  markerMid?: all | markerMid;
  markerOffset?: all | markerOffset;
  markerStart?: all | markerStart;
  mask?: all | mask;
  maskClip?: all | maskClip;
  maskComposite?: all | maskComposite;
  maskImage?: all | maskImage;
  maskMode?: all | maskMode;
  maskOrigin?: all | maskOrigin;
  maskPosition?: all | maskPosition;
  maskRepeat?: all | maskRepeat;
  maskSize?: all | maskSize;
  maskType?: all | maskType;

  maskBorder?: all | maskBorder;
  maskBorderMode?: all | maskBorderMode;
  maskBorderOutset?: all | maskBorderOutset;
  maskBorderRepeat?: all | maskBorderRepeat;
  maskBorderSlice?: all | maskBorderSlice;
  maskBorderSource?: all | maskBorderSource;
  maskBorderWidth?: all | maskBorderWidth;

  maxBlockSize?: all | maxBlockSize;
  maxHeight?: all | maxHeight;
  maxInlineSize?: all | maxInlineSize;
  maxWidth?: all | maxWidth;
  minBlockSize?: all | minBlockSize;
  minHeight?: all | minHeight;
  minInlineSize?: all | minInlineSize;
  minWidth?: all | minWidth;
  mixBlendMode?: all | mixBlendMode;
  motion?: all | motion;
  motionOffset?: all | motionOffset;
  motionPath?: all | motionPath;
  motionRotation?: all | motionRotation;
  MsOverflowStyle?: all | MsOverflowStyle;
  objectFit?: all | objectFit;
  objectPosition?: all | objectPosition;

  offset?: all | offset;
  offsetAnchor?: all | offsetAnchor;
  offsetDistance?: all | offsetDistance;
  offsetPath?: all | offsetPath;
  offsetPosition?: all | offsetPosition;
  offsetRotate?: all | offsetRotate;

  opacity?: all | opacity;
  order?: all | order;
  orphans?: all | orphans;
  outline?: all | outline;
  outlineColor?: all | outlineColor;
  outlineOffset?: all | outlineOffset;
  outlineStyle?: all | outlineStyle;
  outlineWidth?: all | outlineWidth;

  overflow?: all | overflow;
  overflowBlock?: all | overflowBlock;
  overflowBlockX?: all | overflowBlockX;
  overflowX?: all | overflowX;
  overflowY?: all | overflowY;

  overflowAnchor?: all | overflowAnchor;
  overflowClipMargin?: all | overflowClipMargin;
  overflowWrap?: all | overflowWrap;

  overscrollBehavior?: all | overscrollBehavior;
  overscrollBehaviorBlock?: all | overscrollBehaviorBlock;
  overscrollBehaviorY?: all | overscrollBehaviorY;
  overscrollBehaviorInline?: all | overscrollBehaviorInline;
  overscrollBehaviorX?: all | overscrollBehaviorX;

  padding?: all | padding;
  paddingBlock?: all | paddingBlock;
  paddingBlockEnd?: all | paddingBlockEnd;
  paddingBlockStart?: all | paddingBlockStart;
  paddingInline?: all | paddingInline;
  paddingInlineEnd?: all | paddingInlineEnd;
  paddingInlineStart?: all | paddingInlineStart;
  paddingBottom?: all | paddingBottom;
  paddingLeft?: all | paddingLeft;
  paddingRight?: all | paddingRight;
  paddingTop?: all | paddingTop;

  page?: all | page;
  pageBreakAfter?: all | pageBreakAfter;
  pageBreakBefore?: all | pageBreakBefore;
  pageBreakInside?: all | pageBreakInside;
  paintOrder?: all | paintOrder;

  pause?: all | pause;
  pauseAfter?: all | pauseAfter;
  pauseBefore?: all | pauseBefore;
  perspective?: all | perspective;
  perspectiveOrigin?: all | perspectiveOrigin;
  pointerEvents?: all | pointerEvents;

  position?: all | position;
  positionAnchor?: all | positionAnchor;
  positionArea?: all | positionArea;
  positionTry?: all | positionTry;
  positionTryFallbacks?: all | positionTryFallbacks;
  positionTryOptions?: all | positionTryOptions;
  positionVisibility?: all | positionVisibility;

  quotes?: all | quotes;
  resize?: all | resize;
  rest?: all | rest;
  restAfter?: all | restAfter;
  restBefore?: all | restBefore;
  right?: all | right;
  rowGap?: all | rowGap;

  rubyAlign?: all | rubyAlign;
  rubyMerge?: all | rubyMerge;
  rubyPosition?: all | rubyPosition;

  mathDepth?: all | mathDepth;
  mathShift?: all | mathShift;
  mathStyle?: all | mathStyle;

  scrollBehavior?: all | scrollBehavior;

  scrollMargin?: all | scrollMargin;
  scrollMarginTop?: all | scrollMarginTop;
  scrollMarginRight?: all | scrollMarginRight;
  scrollMarginBottom?: all | scrollMarginBottom;
  scrollMarginLeft?: all | scrollMarginLeft;
  scrollMarginBlock?: all | scrollMarginBlock;
  scrollMarginBlockEnd?: all | scrollMarginBlockEnd;
  scrollMarginBlockStart?: all | scrollMarginBlockStart;
  scrollMarginInline?: all | scrollMarginInline;
  scrollMarginInlineEnd?: all | scrollMarginInlineEnd;
  scrollMarginInlineStart?: all | scrollMarginInlineStart;

  scrollPadding?: all | scrollPadding;
  scrollPaddingTop?: all | scrollPaddingTop;
  scrollPaddingRight?: all | scrollPaddingRight;
  scrollPaddingBottom?: all | scrollPaddingBottom;
  scrollPaddingLeft?: all | scrollPaddingLeft;
  scrollPaddingBlock?: all | scrollPaddingBlock;
  scrollPaddingBlockEnd?: all | scrollPaddingBlockEnd;
  scrollPaddingBlockStart?: all | scrollPaddingBlockStart;
  scrollPaddingInline?: all | scrollPaddingInline;
  scrollPaddingInlineEnd?: all | scrollPaddingInlineEnd;
  scrollPaddingInlineStart?: all | scrollPaddingInlineStart;

  scrollSnapAlign?: all | scrollSnapAlign;
  scrollSnapStop?: all | scrollSnapStop;
  scrollSnapType?: all | scrollSnapType;

  scrollTimeline?: all | scrollTimeline;
  scrollTimelineAxis?: all | scrollTimelineAxis;
  scrollTimelineName?: all | scrollTimelineName;

  scrollbarColor?: all | scrollbarColor;
  scrollbarGutter?: all | scrollbarGutter;
  scrollbarWidth?: all | scrollbarWidth;

  shapeImageThreshold?: all | shapeImageThreshold;
  shapeMargin?: all | shapeMargin;
  shapeOutside?: all | shapeOutside;
  shapeRendering?: all | shapeRendering;
  speakAs?: all | speakAs;
  src?: all | src;
  start?: all | start;
  stroke?: all | stroke;
  strokeDasharray?: all | strokeDasharray;
  strokeDashoffset?: all | strokeDashoffset;
  strokeLinecap?: all | strokeLinecap;
  strokeLinejoin?: all | strokeLinejoin;
  strokeMiterlimit?: all | strokeMiterlimit;
  strokeOpacity?: all | strokeOpacity;
  strokeWidth?: all | strokeWidth;
  tabSize?: all | tabSize;
  tableLayout?: all | tableLayout;
  textAlign?: all | textAlign;
  textAlignLast?: all | textAlignLast;
  textAnchor?: all | textAnchor;
  textCombineUpright?: all | textCombineUpright;

  textDecoration?: all | textDecoration;
  textDecorationColor?: all | textDecorationColor;
  textDecorationLine?: all | textDecorationLine;
  textDecorationSkip?: all | textDecorationSkip;
  textDecorationSkipInk?: all | textDecorationSkipInk;
  textDecorationStyle?: all | textDecorationStyle;
  textDecorationThickness?: all | textDecorationThickness;

  textEmphasis?: all | textEmphasis;
  textEmphasisColor?: all | textEmphasisColor;
  textEmphasisPosition?: all | textEmphasisPosition;
  textEmphasisStyle?: all | textEmphasisStyle;
  textIndent?: all | textIndent;
  textJustify?:
    | all
    | 'none'
    | 'auto'
    | 'inter-word'
    | 'inter-character'
    | 'distribute';
  textOrientation?: all | textOrientation;
  textOverflow?: all | textOverflow;
  textRendering?: all | textRendering;
  textShadow?: all | textShadow;
  textSizeAdjust?: all | textSizeAdjust;
  textTransform?: all | textTransform;
  textUnderlineOffset?: all | textUnderlineOffset;
  textUnderlinePosition?: all | textUnderlinePosition;
  textWrap?: all | textWrap;

  timelineScope?: all | timelineScope;
  top?: all | top;
  touchAction?: all | touchAction;

  transform?: all | transform;
  transformBox?: all | transformBox;
  transformOrigin?: all | transformOrigin;
  transformStyle?: all | transformStyle;
  rotate?: all | rotate;
  scale?: all | scale;
  translate?: all | translate;

  transition?: all | transition;
  transitionDelay?: all | transitionDelay;
  transitionDuration?: all | transitionDuration;
  transitionProperty?: all | transitionProperty;
  transitionTimingFunction?: all | transitionTimingFunction;
  unicodeBidi?: all | unicodeBidi;
  unicodeRange?: all | unicodeRange;
  userSelect?: all | userSelect;
  verticalAlign?: all | verticalAlign;

  viewTimeline?: all | viewTimeline;
  viewTimelineAxis?: all | viewTimelineAxis;
  viewTimelineName?: all | viewTimelineName;
  viewTimelineInset?: all | viewTimelineInset;

  viewTransitionName?: all | viewTransitionName;

  visibility?: all | visibility;
  voiceBalance?: all | voiceBalance;
  voiceDuration?: all | voiceDuration;
  voiceFamily?: all | voiceFamily;
  voicePitch?: all | voicePitch;
  voiceRange?: all | voiceRange;
  voiceRate?: all | voiceRate;
  voiceStress?: all | voiceStress;
  voiceVolume?: all | voiceVolume;
  whiteSpace?: all | whiteSpace;
  whiteSpaceCollapse?: all | whiteSpaceCollapse;

  widows?: all | widows;
  width?: all | width;
  willChange?: all | willChange;
  wordBreak?: all | wordBreak;
  wordSpacing?: all | wordSpacing;
  wordWrap?: all | wordWrap;
  writingMode?: all | writingMode;
  zIndex?: all | zIndex;

  zoom?: all | zoom;
}>;
