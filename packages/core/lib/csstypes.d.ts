type all = 'initial' | 'inherit' | 'unset';
type StableString = string & {};

type AbsoluteSize =
  | 'xx-small'
  | 'x-small'
  | 'small'
  | 'medium'
  | 'large'
  | 'x-large'
  | 'xx-large'
  | 'xxx-large';
type Attachment = 'scroll' | 'fixed' | 'local';
type BaselinePosition = 'baseline' | 'first baseline' | 'last baseline';
type BgPosition = 'left' | 'center' | 'right' | 'top' | 'bottom';
type BgSize = 'auto' | 'cover' | 'contain';
type BlendMode =
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
type Color = ColorBase | 'currentColor' | SystemColor | DeprecatedSystemColor;
type ColorBase = NamedColor | 'transparent';
type CompositingOperator = 'add' | 'subtract' | 'intersect' | 'exclude';
type ContentDistribution =
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch';
type ContentPosition = 'center' | 'start' | 'end' | 'flex-start' | 'flex-end';
type CoordBox = PaintBox | 'view-box';
type CornerShapeValue =
  | 'round'
  | 'scoop'
  | 'bevel'
  | 'notch'
  | 'square'
  | 'squircle';
type CubicBezierEasingFunction =
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out';
type DeprecatedSystemColor =
  | 'ActiveBorder'
  | 'ActiveCaption'
  | 'AppWorkspace'
  | 'Background'
  | 'ButtonHighlight'
  | 'ButtonShadow'
  | 'CaptionText'
  | 'InactiveBorder'
  | 'InactiveCaption'
  | 'InactiveCaptionText'
  | 'InfoBackground'
  | 'InfoText'
  | 'Menu'
  | 'MenuText'
  | 'Scrollbar'
  | 'ThreeDDarkShadow'
  | 'ThreeDFace'
  | 'ThreeDHighlight'
  | 'ThreeDLightShadow'
  | 'ThreeDShadow'
  | 'Window'
  | 'WindowFrame'
  | 'WindowText';
type EasingFunction =
  | 'linear'
  | CubicBezierEasingFunction
  | 'step-start'
  | 'step-end';
type EastAsianVariantValues =
  | 'jis78'
  | 'jis83'
  | 'jis90'
  | 'jis04'
  | 'simplified'
  | 'traditional';
type GenericComplete =
  | 'serif'
  | 'sans-serif'
  | 'system-ui'
  | 'cursive'
  | 'fantasy'
  | 'math'
  | 'monospace';
type GenericFamily = GenericComplete | GenericIncomplete | 'emoji' | 'fangsong';
type GenericIncomplete =
  | 'ui-serif'
  | 'ui-sans-serif'
  | 'ui-monospace'
  | 'ui-rounded';
type GeometryBox = ShapeBox | 'fill-box' | 'stroke-box' | 'view-box';
type LineStyle =
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
type LineWidth = 'thin' | 'medium' | 'thick';
type MaskingMode = 'alpha' | 'luminance' | 'match-source';
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
  | 'turquoise'
  | 'violet'
  | 'wheat'
  | 'white'
  | 'whitesmoke'
  | 'yellow'
  | 'yellowgreen';
type OutlineLineStyle =
  | 'none'
  | 'dotted'
  | 'dashed'
  | 'solid'
  | 'double'
  | 'groove'
  | 'ridge'
  | 'inset'
  | 'outset';
type Paint = 'none' | Color | 'context-fill' | 'context-stroke';
type PaintBox = VisualBox | 'fill-box' | 'stroke-box';
type Position = 'left' | 'center' | 'right' | 'top' | 'bottom';
type PositionArea =
  | 'left'
  | 'center'
  | 'right'
  | 'span-left'
  | 'span-right'
  | 'x-start'
  | 'x-end'
  | 'span-x-start'
  | 'span-x-end'
  | 'x-self-start'
  | 'x-self-end'
  | 'span-x-self-start'
  | 'span-x-self-end'
  | 'span-all'
  | 'top'
  | 'bottom'
  | 'span-top'
  | 'span-bottom'
  | 'y-start'
  | 'y-end'
  | 'span-y-start'
  | 'span-y-end'
  | 'y-self-start'
  | 'y-self-end'
  | 'span-y-self-start'
  | 'span-y-self-end'
  | 'block-start'
  | 'block-end'
  | 'span-block-start'
  | 'span-block-end'
  | 'inline-start'
  | 'inline-end'
  | 'span-inline-start'
  | 'span-inline-end'
  | 'self-block-start'
  | 'self-block-end'
  | 'span-self-block-start'
  | 'span-self-block-end'
  | 'self-inline-start'
  | 'self-inline-end'
  | 'span-self-inline-start'
  | 'span-self-inline-end'
  | 'start'
  | 'end'
  | 'span-start'
  | 'span-end'
  | 'self-start'
  | 'self-end'
  | 'span-self-start'
  | 'span-self-end';
type RepeatStyle =
  | 'repeat-x'
  | 'repeat-y'
  | 'repeat'
  | 'space'
  | 'round'
  | 'no-repeat';
type SelfPosition =
  | 'center'
  | 'start'
  | 'end'
  | 'self-start'
  | 'self-end'
  | 'flex-start'
  | 'flex-end';
type ShapeBox = VisualBox | 'margin-box';
type SingleAnimationDirection =
  | 'normal'
  | 'reverse'
  | 'alternate'
  | 'alternate-reverse';
type SingleAnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';
type SystemColor =
  | 'AccentColor'
  | 'AccentColorText'
  | 'ActiveText'
  | 'ButtonBorder'
  | 'ButtonFace'
  | 'ButtonText'
  | 'Canvas'
  | 'CanvasText'
  | 'Field'
  | 'FieldText'
  | 'GrayText'
  | 'Highlight'
  | 'HighlightText'
  | 'LinkText'
  | 'Mark'
  | 'MarkText'
  | 'SelectedItem'
  | 'SelectedItemText'
  | 'VisitedText';
type TextEdge =
  | 'text'
  | 'cap'
  | 'ex'
  | 'ideographic'
  | 'ideographic-ink'
  | `${'text' | 'cap' | 'ex' | 'ideographic' | 'ideographic-ink'} ${'text' | 'alphabetic' | 'ideographic' | 'ideographic-ink'}`;
type TimelineRangeName =
  | 'cover'
  | 'contain'
  | 'entry'
  | 'exit'
  | 'entry-crossing'
  | 'exit-crossing';
type TrackBreadth = 'min-content' | 'max-content' | 'auto';
type TrySize =
  | 'most-width'
  | 'most-height'
  | 'most-block-size'
  | 'most-inline-size';
type TryTactic = 'flip-block' | 'flip-inline' | 'flip-start';
type VisualBox = 'content-box' | 'padding-box' | 'border-box';

type accentColor = 'auto' | Color | StableString;
type alignContent =
  | 'normal'
  | BaselinePosition
  | ContentDistribution
  | ContentPosition
  | `${'unsafe' | 'safe'} ${ContentPosition}`;
type alignItems =
  | 'normal'
  | 'stretch'
  | BaselinePosition
  | SelfPosition
  | `${'unsafe' | 'safe'} ${SelfPosition}`
  | 'anchor-center';
type alignmentBaseline =
  | 'baseline'
  | 'alphabetic'
  | 'ideographic'
  | 'middle'
  | 'central'
  | 'mathematical'
  | 'text-before-edge'
  | 'text-after-edge';
type alignSelf =
  | 'auto'
  | 'normal'
  | 'stretch'
  | BaselinePosition
  | SelfPosition
  | `${'unsafe' | 'safe'} ${SelfPosition}`
  | 'anchor-center';
type alignTracks =
  | 'normal'
  | BaselinePosition
  | ContentDistribution
  | ContentPosition
  | `${'unsafe' | 'safe'} ${ContentPosition}`
  | StableString;
type anchorName = 'none' | StableString;
type anchorScope = 'none' | 'all' | StableString;
type animation =
  | 'auto'
  | EasingFunction
  | 'infinite'
  | SingleAnimationDirection
  | SingleAnimationFillMode
  | 'running'
  | 'paused'
  | 'none'
  | number
  | StableString;
type animationComposition = 'replace' | 'add' | 'accumulate' | StableString;
type animationDelay = StableString;
type animationDirection = SingleAnimationDirection | StableString;
type animationDuration = 'auto' | StableString;
type animationFillMode = SingleAnimationFillMode | StableString;
type animationIterationCount = 'infinite' | number | StableString;
type animationName = 'none' | StableString;
type animationPlayState = 'running' | 'paused' | StableString;
type animationRange = 'normal' | TimelineRangeName | number | StableString;
type animationRangeEnd = animationRange;
type animationRangeStart = animationRange;
type animationTimeline = 'auto' | 'none' | StableString;
type animationTimingFunction = EasingFunction | StableString;
type animationTrigger = 'none' | StableString;
type appearance =
  | 'none'
  | 'auto'
  | 'searchfield'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'menulist'
  | 'listbox'
  | 'meter'
  | 'progress-bar'
  | 'button'
  | 'textfield'
  | 'menulist-button';
type aspectRatio = 'auto' | number | StableString;
type backdropFilter = 'none' | StableString;
type backfaceVisibility = 'visible' | 'hidden';
type background = StableString;
type backgroundAttachment = Attachment | StableString;
type backgroundBlendMode = BlendMode | StableString;
type backgroundClip = VisualBox | 'border-area' | 'text' | StableString;
type backgroundColor = color;
type backgroundImage = 'none' | StableString;
type backgroundOrigin = VisualBox | StableString;
type backgroundPosition = BgPosition | number | StableString;
type backgroundPositionX =
  | 'center'
  | 'left'
  | 'right'
  | 'x-start'
  | 'x-end'
  | number
  | StableString;
type backgroundPositionY =
  | 'center'
  | 'top'
  | 'bottom'
  | 'y-start'
  | 'y-end'
  | number
  | StableString;
type backgroundRepeat = RepeatStyle | StableString;
type backgroundSize = BgSize | number | StableString;
type baselineShift = 'sub' | 'super' | 'baseline' | number | StableString;
type baselineSource = 'auto' | 'first' | 'last';
type blockSize =
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type border = LineWidth | LineStyle | Color | number | StableString;
type borderBlock = border;
type borderBlockColor = color;
type borderBlockEnd = border;
type borderBlockEndColor = color;
type borderBlockEndStyle = LineStyle;
type borderBlockEndWidth = borderWidth;
type borderBlockStart = border;
type borderBlockStartColor = color;
type borderBlockStartStyle = LineStyle;
type borderBlockStartWidth = borderWidth;
type borderBlockStyle = borderStyle;
type borderBlockWidth = borderWidth;
type borderBottom = border;
type borderBottomColor = color;
type borderBottomLeftRadius = borderRadius;
type borderBottomRightRadius = borderRadius;
type borderBottomStyle = LineStyle;
type borderBottomWidth = borderWidth;
type borderCollapse = 'separate' | 'collapse';
type borderColor = color;
type borderEndEndRadius = borderRadius;
type borderEndStartRadius = borderRadius;
type borderImage =
  | 'none'
  | 'stretch'
  | 'repeat'
  | 'round'
  | 'space'
  | number
  | StableString;
type borderImageOutset = number | StableString;
type borderImageRepeat =
  | 'stretch'
  | 'repeat'
  | 'round'
  | 'space'
  | StableString;
type borderImageSlice = number | StableString;
type borderImageSource = 'none' | StableString;
type borderImageWidth = 'auto' | number | StableString;
type borderInline = border;
type borderInlineColor = color;
type borderInlineEnd = border;
type borderInlineEndColor = color;
type borderInlineEndStyle = LineStyle;
type borderInlineEndWidth = borderWidth;
type borderInlineStart = border;
type borderInlineStartColor = color;
type borderInlineStartStyle = LineStyle;
type borderInlineStartWidth = borderWidth;
type borderInlineStyle = borderStyle;
type borderInlineWidth = borderWidth;
type borderLeft = border;
type borderLeftColor = color;
type borderLeftStyle = LineStyle;
type borderLeftWidth = borderWidth;
type borderRadius = number | StableString;
type borderRight = border;
type borderRightColor = color;
type borderRightStyle = LineStyle;
type borderRightWidth = borderWidth;
type borderShape = 'none' | StableString;
type borderSpacing = number | StableString;
type borderStartEndRadius = borderRadius;
type borderStartStartRadius = borderRadius;
type borderStyle = LineStyle | StableString;
type borderTop = border;
type borderTopColor = color;
type borderTopLeftRadius = borderRadius;
type borderTopRightRadius = borderRadius;
type borderTopStyle = LineStyle;
type borderTopWidth = borderWidth;
type borderWidth = LineWidth | number | StableString;
type bottom = 'auto' | number | StableString;
type boxAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type boxDecorationBreak = 'slice' | 'clone';
type boxDirection = 'normal' | 'reverse' | 'inherit';
type boxFlex = number | StableString;
type boxFlexGroup = number | StableString;
type boxLines = 'single' | 'multiple';
type boxOrdinalGroup = number | StableString;
type boxOrient =
  | 'horizontal'
  | 'vertical'
  | 'inline-axis'
  | 'block-axis'
  | 'inherit';
type boxPack = 'start' | 'center' | 'end' | 'justify';
type boxShadow = 'none' | StableString;
type boxSizing = 'content-box' | 'border-box';
type breakAfter =
  | 'auto'
  | 'avoid'
  | 'always'
  | 'all'
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
  | 'always'
  | 'all'
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
type bufferedRendering = StableString;
type captionSide = 'top' | 'bottom';
type caret =
  | 'auto'
  | Color
  | 'manual'
  | 'bar'
  | 'block'
  | 'underscore'
  | StableString;
type caretAnimation = 'auto' | 'manual';
type caretColor = 'auto' | Color | StableString;
type caretShape = 'auto' | 'bar' | 'block' | 'underscore';
type clear = 'none' | 'left' | 'right' | 'both' | 'inline-start' | 'inline-end';
type clip = 'auto' | StableString;
type clipPath = GeometryBox | 'none' | StableString;
type clipRule = 'nonzero' | 'evenodd';
type color = Color | StableString;
type colorAdjust = 'economy' | 'exact';
type colorInterpolation = 'auto' | 'sRGB' | 'linearRGB';
type colorInterpolationFilters = 'auto' | 'sRGB' | 'linearRGB';
type colorRendering = StableString;
type colorScheme = 'normal' | 'light' | 'dark' | StableString;
type columnCount = 'auto' | number | StableString;
type columnFill = 'auto' | 'balance';
type columnGap = 'normal' | number | StableString;
type columnHeight = 'auto' | number | StableString;
type columnRule = LineWidth | LineStyle | Color | number | StableString;
type columnRuleBreak = 'none' | 'normal' | 'intersection';
type columnRuleColor = color;
type columnRuleInset = 'overlap-join' | number | StableString;
type columnRuleInsetCap = 'overlap-join' | number | StableString;
type columnRuleInsetCapEnd = columnRuleInsetCap;
type columnRuleInsetCapStart = columnRuleInsetCap;
type columnRuleInsetEnd = columnRuleInset;
type columnRuleInsetJunction = 'overlap-join' | number | StableString;
type columnRuleInsetJunctionEnd = columnRuleInsetJunction;
type columnRuleInsetJunctionStart = columnRuleInsetJunction;
type columnRuleInsetStart = columnRuleInset;
type columnRuleStyle = LineStyle;
type columnRuleVisibilityItems = 'all' | 'around' | 'between' | 'normal';
type columnRuleWidth = LineWidth | number | StableString;
type columns = 'auto' | number | StableString;
type columnSpan = 'none' | 'all';
type columnWidth = 'auto' | number | StableString;
type columnWrap = 'auto' | 'nowrap' | 'wrap';
type contain =
  | 'none'
  | 'strict'
  | 'content'
  | 'size'
  | 'inline-size'
  | 'layout'
  | 'style'
  | 'paint'
  | StableString;
type container = 'none' | StableString;
type containerName = 'none' | StableString;
type containerType =
  | 'normal'
  | 'size'
  | 'inline-size'
  | 'scroll-state'
  | StableString;
type containIntrinsicBlockSize = containIntrinsicSize;
type containIntrinsicHeight = 'none' | number | StableString;
type containIntrinsicInlineSize = containIntrinsicSize;
type containIntrinsicSize = 'none' | number | StableString;
type containIntrinsicWidth = 'none' | number | StableString;
type content =
  | 'normal'
  | 'none'
  | 'open-quote'
  | 'close-quote'
  | 'no-open-quote'
  | 'no-close-quote'
  | StableString;
type contentVisibility = 'visible' | 'auto' | 'hidden';
type cornerBlockEndShape = cornerShape;
type cornerBlockStartShape = cornerShape;
type cornerBottomLeftShape = cornerShape;
type cornerBottomRightShape = cornerShape;
type cornerBottomShape = cornerShape;
type cornerEndEndShape = cornerShape;
type cornerEndStartShape = cornerShape;
type cornerInlineEndShape = cornerShape;
type cornerInlineStartShape = cornerShape;
type cornerLeftShape = cornerShape;
type cornerRightShape = cornerShape;
type cornerShape = CornerShapeValue | StableString;
type cornerStartEndShape = cornerShape;
type cornerStartStartShape = cornerShape;
type cornerTopLeftShape = cornerShape;
type cornerTopRightShape = cornerShape;
type cornerTopShape = cornerShape;
type counterIncrement = 'none' | StableString;
type counterReset = 'none' | StableString;
type counterSet = 'none' | StableString;
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
type cx = number | StableString;
type cy = number | StableString;
type d = 'none' | StableString;
type direction = 'ltr' | 'rtl';
type display =
  | 'block'
  | 'inline'
  | 'run-in'
  | 'flow'
  | 'flow-root'
  | 'table'
  | 'flex'
  | 'grid'
  | 'ruby'
  | 'list-item'
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
  | 'ruby-text-container'
  | 'contents'
  | 'none'
  | 'inline-block'
  | 'inline-list-item'
  | 'inline-table'
  | 'inline-flex'
  | 'inline-grid'
  | StableString;
type dominantBaseline =
  | 'auto'
  | 'text-bottom'
  | 'alphabetic'
  | 'ideographic'
  | 'middle'
  | 'central'
  | 'mathematical'
  | 'hanging'
  | 'text-top';
type dynamicRangeLimit = 'standard' | 'no-limit' | 'constrained' | StableString;
type emptyCells = 'show' | 'hide';
type fieldSizing = 'content' | 'fixed';
type fill = Paint | StableString;
type fillOpacity = opacity;
type fillRule = 'nonzero' | 'evenodd';
type filter = 'none' | StableString;
type flex =
  | 'none'
  | 'content'
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type flexBasis =
  | 'content'
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type flexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type flexFlow =
  | 'row'
  | 'row-reverse'
  | 'column'
  | 'column-reverse'
  | 'nowrap'
  | 'wrap'
  | 'wrap-reverse'
  | 'balance'
  | StableString;
type flexGrow = number | StableString;
type flexLineCount = number | StableString;
type flexShrink = number | StableString;
type flexWrap = 'nowrap' | 'wrap' | 'wrap-reverse' | 'balance' | StableString;
type float = 'left' | 'right' | 'none' | 'inline-start' | 'inline-end';
type floodColor = color;
type floodOpacity = opacity;
type flowTolerance = 'normal' | 'infinite' | number | StableString;
type font =
  | 'caption'
  | 'icon'
  | 'menu'
  | 'message-box'
  | 'small-caption'
  | 'status-bar'
  | StableString;
type fontFamily = GenericFamily | StableString;
type fontFeatureSettings = 'normal' | StableString;
type fontKerning = 'auto' | 'normal' | 'none';
type fontLanguageOverride = 'normal' | StableString;
type fontOpticalSizing = 'auto' | 'none';
type fontPalette = 'normal' | 'light' | 'dark' | StableString;
type fontSize =
  | AbsoluteSize
  | 'larger'
  | 'smaller'
  | 'math'
  | number
  | StableString;
type fontSizeAdjust = 'none' | 'from-font' | number | StableString;
type fontSmooth =
  | 'auto'
  | 'never'
  | 'always'
  | AbsoluteSize
  | number
  | StableString;
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
type fontStyle = 'normal' | 'italic' | 'oblique' | StableString;
type fontSynthesis =
  | 'none'
  | 'weight'
  | 'style'
  | 'small-caps'
  | 'position'
  | StableString;
type fontSynthesisPosition = 'auto' | 'none';
type fontSynthesisSmallCaps = 'auto' | 'none';
type fontSynthesisStyle = 'auto' | 'none';
type fontSynthesisWeight = 'auto' | 'none';
type fontVariant =
  | 'normal'
  | 'none'
  | 'common-ligatures'
  | 'no-common-ligatures'
  | 'discretionary-ligatures'
  | 'no-discretionary-ligatures'
  | 'historical-ligatures'
  | 'no-historical-ligatures'
  | 'contextual'
  | 'no-contextual'
  | 'historical-forms'
  | 'small-caps'
  | 'all-small-caps'
  | 'petite-caps'
  | 'all-petite-caps'
  | 'unicase'
  | 'titling-caps'
  | 'lining-nums'
  | 'oldstyle-nums'
  | 'proportional-nums'
  | 'tabular-nums'
  | 'diagonal-fractions'
  | 'stacked-fractions'
  | 'ordinal'
  | 'slashed-zero'
  | EastAsianVariantValues
  | 'full-width'
  | 'proportional-width'
  | 'ruby'
  | StableString;
type fontVariantAlternates = 'normal' | 'historical-forms' | StableString;
type fontVariantCaps =
  | 'normal'
  | 'small-caps'
  | 'all-small-caps'
  | 'petite-caps'
  | 'all-petite-caps'
  | 'unicase'
  | 'titling-caps';
type fontVariantEastAsian =
  | 'normal'
  | EastAsianVariantValues
  | 'full-width'
  | 'proportional-width'
  | 'ruby'
  | StableString;
type fontVariantEmoji = 'normal' | 'text' | 'emoji' | 'unicode';
type fontVariantLigatures =
  | 'normal'
  | 'none'
  | 'common-ligatures'
  | 'no-common-ligatures'
  | 'discretionary-ligatures'
  | 'no-discretionary-ligatures'
  | 'historical-ligatures'
  | 'no-historical-ligatures'
  | 'contextual'
  | 'no-contextual'
  | StableString;
type fontVariantNumeric =
  | 'normal'
  | 'lining-nums'
  | 'oldstyle-nums'
  | 'proportional-nums'
  | 'tabular-nums'
  | 'diagonal-fractions'
  | 'stacked-fractions'
  | 'ordinal'
  | 'slashed-zero'
  | StableString;
type fontVariantPosition = 'normal' | 'sub' | 'super';
type fontVariationSettings = 'normal' | StableString;
type fontWeight =
  | 'normal'
  | 'bold'
  | 'bolder'
  | 'lighter'
  | number
  | StableString;
type fontWidth =
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
type forcedColorAdjust = 'auto' | 'none' | 'preserve-parent-color';
type frameSizing =
  | 'auto'
  | 'content-width'
  | 'content-height'
  | 'content-block-size'
  | 'content-inline-size';
type gap = 'normal' | number | StableString;
type glyphOrientationVertical = 'auto' | '0deg' | '90deg' | '0' | '90';
type grid = 'none' | StableString;
type gridArea = 'auto' | number | StableString;
type gridAutoColumns = TrackBreadth | number | StableString;
type gridAutoFlow = 'row' | 'column' | 'dense' | StableString;
type gridAutoRows = TrackBreadth | number | StableString;
type gridColumn = 'auto' | number | StableString;
type gridColumnEnd = gridColumn;
type gridColumnGap = number | StableString;
type gridColumnStart = gridColumn;
type gridGap = number | StableString;
type gridRow = 'auto' | number | StableString;
type gridRowEnd = gridRow;
type gridRowGap = number | StableString;
type gridRowStart = gridRow;
type gridTemplate = 'none' | StableString;
type gridTemplateAreas = 'none' | StableString;
type gridTemplateColumns =
  | 'none'
  | TrackBreadth
  | 'subgrid'
  | number
  | StableString;
type gridTemplateRows =
  | 'none'
  | TrackBreadth
  | 'subgrid'
  | number
  | StableString;
type hangingPunctuation =
  | 'none'
  | 'first'
  | 'force-end'
  | 'allow-end'
  | 'last'
  | StableString;
type height =
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type hyphenateCharacter = 'auto' | StableString;
type hyphenateLimitChars = 'auto' | number | StableString;
type hyphens = 'none' | 'manual' | 'auto';
type imageOrientation = 'from-image' | 'flip' | StableString;
type imageRendering = 'auto' | 'crisp-edges' | 'pixelated' | 'smooth';
type imageResolution = 'from-image' | StableString;
type imeMode = 'auto' | 'normal' | 'active' | 'inactive' | 'disabled';
type initialLetter = 'normal' | number | StableString;
type initialLetterAlign = 'auto' | 'alphabetic' | 'hanging' | 'ideographic';
type inlineSize =
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type inset = 'auto' | number | StableString;
type insetBlock = inset;
type insetBlockEnd = inset;
type insetBlockStart = inset;
type insetInline = inset;
type insetInlineEnd = inset;
type insetInlineStart = inset;
type interactivity = 'auto' | 'inert';
type interestDelay = 'normal' | StableString;
type interestDelayEnd = interestDelay;
type interestDelayStart = interestDelay;
type interpolateSize = 'numeric-only' | 'allow-keywords';
type isolation = 'auto' | 'isolate';
type justifyContent =
  | 'normal'
  | ContentDistribution
  | ContentPosition
  | 'left'
  | 'right'
  | `${'unsafe' | 'safe'} ${ContentPosition | 'left' | 'right'}`;
type justifyItems =
  | 'normal'
  | 'stretch'
  | BaselinePosition
  | SelfPosition
  | 'left'
  | 'right'
  | `${'unsafe' | 'safe'} ${SelfPosition | 'left' | 'right'}`
  | 'legacy'
  | 'anchor-center'
  | StableString;
type justifySelf =
  | 'auto'
  | 'normal'
  | 'stretch'
  | BaselinePosition
  | SelfPosition
  | 'left'
  | 'right'
  | `${'unsafe' | 'safe'} ${SelfPosition | 'left' | 'right'}`
  | 'anchor-center';
type justifyTracks =
  | 'normal'
  | ContentDistribution
  | ContentPosition
  | 'left'
  | 'right'
  | `${'unsafe' | 'safe'} ${ContentPosition | 'left' | 'right'}`
  | StableString;
type left = 'auto' | number | StableString;
type letterSpacing = 'normal' | number | StableString;
type lightingColor = color;
type lineBreak = 'auto' | 'loose' | 'normal' | 'strict' | 'anywhere';
type lineClamp = 'none' | number | StableString;
type lineHeight = 'normal' | number | StableString;
type lineHeightStep = number | StableString;
type linkParameters = 'none' | StableString;
type listStyle = 'none' | 'inside' | 'outside' | StableString;
type listStyleImage = 'none' | StableString;
type listStylePosition = 'inside' | 'outside';
type listStyleType = 'none' | StableString;
type margin = 'auto' | number | StableString;
type marginBlock = margin;
type marginBlockEnd = margin;
type marginBlockStart = margin;
type marginBottom = margin;
type marginInline = margin;
type marginInlineEnd = margin;
type marginInlineStart = margin;
type marginLeft = margin;
type marginRight = margin;
type marginTop = margin;
type marginTrim = 'none' | 'in-flow' | 'all';
type marker = 'none' | StableString;
type markerEnd = marker;
type markerMid = 'none' | StableString;
type markerStart = marker;
type mask =
  | 'none'
  | Position
  | RepeatStyle
  | GeometryBox
  | 'no-clip'
  | CompositingOperator
  | MaskingMode
  | number
  | StableString;
type maskBorder =
  | 'none'
  | 'stretch'
  | 'repeat'
  | 'round'
  | 'space'
  | 'luminance'
  | 'alpha'
  | number
  | StableString;
type maskBorderMode = 'luminance' | 'alpha';
type maskBorderOutset = number | StableString;
type maskBorderRepeat = 'stretch' | 'repeat' | 'round' | 'space' | StableString;
type maskBorderSlice = number | StableString;
type maskBorderSource = 'none' | StableString;
type maskBorderWidth = 'auto' | number | StableString;
type maskClip = CoordBox | 'no-clip' | StableString;
type maskComposite = CompositingOperator | StableString;
type maskImage = 'none' | StableString;
type maskMode = MaskingMode | StableString;
type maskOrigin = CoordBox | StableString;
type maskPosition = Position | number | StableString;
type maskRepeat = RepeatStyle | StableString;
type maskSize = BgSize | number | StableString;
type maskType = 'luminance' | 'alpha';
type masonryAutoFlow =
  | 'pack'
  | 'next'
  | 'definite-first'
  | 'ordered'
  | StableString;
type mathDepth = 'auto-add' | number | StableString;
type mathShift = 'normal' | 'compact';
type mathStyle = 'normal' | 'compact';
type maxBlockSize =
  | 'none'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type maxHeight =
  | 'none'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type maxInlineSize =
  | 'none'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type maxLines = 'none' | number | StableString;
type maxWidth =
  | 'none'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type minBlockSize =
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type minHeight =
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type minInlineSize =
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type minWidth =
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type mixBlendMode = BlendMode | 'plus-darker' | 'plus-lighter';
type msOverflowStyle =
  | 'auto'
  | 'none'
  | 'scrollbar'
  | '-ms-autohiding-scrollbar';
type objectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
type objectPosition = Position | number | StableString;
type objectViewBox = 'none' | StableString;
type offset =
  | 'normal'
  | 'auto'
  | Position
  | 'none'
  | CoordBox
  | number
  | StableString;
type offsetAnchor = 'auto' | Position | number | StableString;
type offsetDistance = number | StableString;
type offsetPath = 'none' | CoordBox | StableString;
type offsetPosition = 'normal' | 'auto' | Position | number | StableString;
type offsetRotate = 'auto' | 'reverse' | StableString;
type opacity = number | StableString;
type order = number | StableString;
type orphans = number | StableString;
type outline =
  | LineWidth
  | 'auto'
  | OutlineLineStyle
  | Color
  | number
  | StableString;
type outlineColor = 'auto' | Color | StableString;
type outlineOffset = number | StableString;
type outlineStyle = 'auto' | OutlineLineStyle;
type outlineWidth = LineWidth | number | StableString;
type overflow =
  | 'visible'
  | 'hidden'
  | 'clip'
  | 'scroll'
  | 'auto'
  | StableString;
type overflowAnchor = 'auto' | 'none';
type overflowBlock = 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
type overflowClipBox = 'padding-box' | 'content-box';
type overflowClipMargin = VisualBox | number | StableString;
type overflowInline = 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
type overflowWrap = 'normal' | 'break-word' | 'anywhere';
type overflowX = 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
type overflowY = 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
type overlay = 'none' | 'auto';
type overscrollBehavior = 'contain' | 'none' | 'auto' | StableString;
type overscrollBehaviorBlock = 'contain' | 'none' | 'auto';
type overscrollBehaviorInline = 'contain' | 'none' | 'auto';
type overscrollBehaviorX = 'contain' | 'none' | 'auto';
type overscrollBehaviorY = 'contain' | 'none' | 'auto';
type padding = number | StableString;
type paddingBlock = padding;
type paddingBlockEnd = padding;
type paddingBlockStart = padding;
type paddingBottom = padding;
type paddingInline = padding;
type paddingInlineEnd = padding;
type paddingInlineStart = padding;
type paddingLeft = padding;
type paddingRight = padding;
type paddingTop = padding;
type page = 'auto' | StableString;
type pageBreakAfter =
  | 'auto'
  | 'always'
  | 'avoid'
  | 'left'
  | 'right'
  | 'recto'
  | 'verso';
type pageBreakBefore =
  | 'auto'
  | 'always'
  | 'avoid'
  | 'left'
  | 'right'
  | 'recto'
  | 'verso';
type pageBreakInside = 'auto' | 'avoid';
type paintOrder = 'normal' | 'fill' | 'stroke' | 'markers' | StableString;
type pathLength = 'none' | StableString;
type perspective = 'none' | number | StableString;
type perspectiveOrigin = Position | number | StableString;
type placeContent =
  | 'normal'
  | BaselinePosition
  | ContentDistribution
  | ContentPosition
  | `${'unsafe' | 'safe'} ${ContentPosition}`
  | StableString;
type placeItems =
  | 'normal'
  | 'stretch'
  | BaselinePosition
  | SelfPosition
  | `${'unsafe' | 'safe'} ${SelfPosition}`
  | 'anchor-center'
  | StableString;
type placeSelf =
  | 'auto'
  | 'normal'
  | 'stretch'
  | BaselinePosition
  | SelfPosition
  | `${'unsafe' | 'safe'} ${SelfPosition}`
  | 'anchor-center'
  | StableString;
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
  | 'all'
  | 'inherit';
type position = 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
type positionAnchor =
  | 'normal'
  | 'auto'
  | 'none'
  | 'match-parent'
  | StableString;
type positionArea = 'none' | PositionArea | StableString;
type positionTry = 'none' | TryTactic | PositionArea | StableString;
type positionTryFallbacks = 'none' | TryTactic | PositionArea | StableString;
type positionTryOrder = 'normal' | TrySize;
type positionVisibility =
  | 'always'
  | 'anchors-valid'
  | 'anchors-visible'
  | 'no-overflow'
  | StableString;
type printColorAdjust = 'economy' | 'exact';
type quotes = 'none' | 'auto' | StableString;
type r = number | StableString;
type readingFlow =
  | 'normal'
  | 'source-order'
  | 'flex-visual'
  | 'flex-flow'
  | 'grid-rows'
  | 'grid-columns'
  | 'grid-order';
type readingOrder = number | StableString;
type resize = 'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline';
type right = 'auto' | number | StableString;
type rotate = 'none' | StableString;
type rowGap = 'normal' | number | StableString;
type rowRule = LineWidth | LineStyle | Color | number | StableString;
type rowRuleBreak = 'none' | 'normal' | 'intersection';
type rowRuleColor = color;
type rowRuleInset = 'overlap-join' | number | StableString;
type rowRuleInsetCap = 'overlap-join' | number | StableString;
type rowRuleInsetCapEnd = rowRuleInsetCap;
type rowRuleInsetCapStart = rowRuleInsetCap;
type rowRuleInsetEnd = rowRuleInset;
type rowRuleInsetJunction = 'overlap-join' | number | StableString;
type rowRuleInsetJunctionEnd = rowRuleInsetJunction;
type rowRuleInsetJunctionStart = rowRuleInsetJunction;
type rowRuleInsetStart = rowRuleInset;
type rowRuleStyle = LineStyle | StableString;
type rowRuleVisibilityItems = 'all' | 'around' | 'between' | 'normal';
type rowRuleWidth = LineWidth | number | StableString;
type rubyAlign = 'start' | 'center' | 'space-between' | 'space-around';
type rubyMerge = 'separate' | 'collapse' | 'auto';
type rubyOverhang = 'auto' | 'none';
type rubyPosition =
  | 'alternate'
  | 'over'
  | 'under'
  | 'inter-character'
  | StableString;
type rule = LineWidth | LineStyle | Color | number | StableString;
type ruleBreak = 'none' | 'normal' | 'intersection';
type ruleColor = color;
type ruleInset = 'overlap-join' | number | StableString;
type ruleInsetCap = 'overlap-join' | number | StableString;
type ruleInsetEnd = ruleInset;
type ruleInsetJunction = 'overlap-join' | number | StableString;
type ruleInsetStart = ruleInset;
type ruleOverlap = 'row-over-column' | 'column-over-row';
type ruleStyle = LineStyle;
type ruleVisibilityItems = 'all' | 'around' | 'between' | 'normal';
type ruleWidth = LineWidth | number | StableString;
type rx = 'auto' | number | StableString;
type ry = 'auto' | number | StableString;
type scale = 'none' | number | StableString;
type scrollAxisLock = 'auto' | 'none';
type scrollbarColor = 'auto' | StableString;
type scrollbarGutter = 'auto' | 'stable' | StableString;
type scrollbarWidth = 'auto' | 'thin' | 'none';
type scrollBehavior = 'auto' | 'smooth';
type scrollInitialTarget = 'none' | 'nearest';
type scrollMargin = number | StableString;
type scrollMarginBlock = scrollMargin;
type scrollMarginBlockEnd = scrollMargin;
type scrollMarginBlockStart = scrollMargin;
type scrollMarginBottom = scrollMargin;
type scrollMarginInline = scrollMargin;
type scrollMarginInlineEnd = scrollMargin;
type scrollMarginInlineStart = scrollMargin;
type scrollMarginLeft = scrollMargin;
type scrollMarginRight = scrollMargin;
type scrollMarginTop = scrollMargin;
type scrollMarkerGroup = 'none' | 'before' | 'after';
type scrollPadding = 'auto' | number | StableString;
type scrollPaddingBlock = scrollPadding;
type scrollPaddingBlockEnd = scrollPadding;
type scrollPaddingBlockStart = scrollPadding;
type scrollPaddingBottom = scrollPadding;
type scrollPaddingInline = scrollPadding;
type scrollPaddingInlineEnd = scrollPadding;
type scrollPaddingInlineStart = scrollPadding;
type scrollPaddingLeft = scrollPadding;
type scrollPaddingRight = scrollPadding;
type scrollPaddingTop = scrollPadding;
type scrollSnapAlign = 'none' | 'start' | 'end' | 'center' | StableString;
type scrollSnapCoordinate = 'none' | Position | number | StableString;
type scrollSnapDestination = Position | number | StableString;
type scrollSnapPointsX = 'none' | StableString;
type scrollSnapPointsY = 'none' | StableString;
type scrollSnapStop = 'normal' | 'always';
type scrollSnapType =
  | 'none'
  | 'x'
  | 'y'
  | 'block'
  | 'inline'
  | 'both'
  | `${'x' | 'y' | 'block' | 'inline' | 'both'} ${'mandatory' | 'proximity'}`;
type scrollSnapTypeX = 'none' | 'mandatory' | 'proximity';
type scrollSnapTypeY = 'none' | 'mandatory' | 'proximity';
type scrollTargetGroup = 'none' | 'auto';
type scrollTimeline = 'none' | StableString;
type scrollTimelineAxis = 'block' | 'inline' | 'x' | 'y' | StableString;
type scrollTimelineName = 'none' | StableString;
type shapeImageThreshold = number | StableString;
type shapeMargin = number | StableString;
type shapeOutside = 'none' | ShapeBox | StableString;
type shapeRendering =
  | 'auto'
  | 'optimizeSpeed'
  | 'crispEdges'
  | 'geometricPrecision';
type speakAs =
  | 'normal'
  | 'spell-out'
  | 'digits'
  | 'literal-punctuation'
  | 'no-punctuation'
  | StableString;
type stopColor = color;
type stopOpacity = opacity;
type stroke = Paint | StableString;
type strokeColor = color;
type strokeDasharray = 'none' | number | StableString;
type strokeDashoffset = number | StableString;
type strokeLinecap = 'butt' | 'round' | 'square';
type strokeLinejoin = 'miter' | 'miter-clip' | 'round' | 'bevel' | 'arcs';
type strokeMiterlimit = number | StableString;
type strokeOpacity = opacity;
type strokeWidth = number | StableString;
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
type textAutospace =
  | 'normal'
  | 'no-autospace'
  | 'ideograph-alpha'
  | 'ideograph-numeric'
  | 'punctuation'
  | 'insert'
  | 'replace'
  | 'auto'
  | StableString;
type textBox =
  | 'normal'
  | 'none'
  | 'trim-start'
  | 'trim-end'
  | 'trim-both'
  | 'auto'
  | TextEdge
  | StableString;
type textBoxEdge = 'auto' | TextEdge;
type textBoxTrim = 'none' | 'trim-start' | 'trim-end' | 'trim-both';
type textCombineUpright = 'none' | 'all' | 'digits' | StableString;
type textDecoration =
  | 'none'
  | 'underline'
  | 'overline'
  | 'line-through'
  | 'blink'
  | 'spelling-error'
  | 'grammar-error'
  | 'solid'
  | 'double'
  | 'dotted'
  | 'dashed'
  | 'wavy'
  | Color
  | 'auto'
  | 'from-font'
  | number
  | StableString;
type textDecorationColor = color;
type textDecorationInset = 'auto' | number | StableString;
type textDecorationLine =
  | 'none'
  | 'underline'
  | 'overline'
  | 'line-through'
  | 'blink'
  | 'spelling-error'
  | 'grammar-error'
  | StableString;
type textDecorationSkip =
  | 'none'
  | 'objects'
  | 'spaces'
  | 'leading-spaces'
  | 'trailing-spaces'
  | 'edges'
  | 'box-decoration'
  | StableString;
type textDecorationSkipInk = 'auto' | 'all' | 'none';
type textDecorationSkipSpaces = 'none' | 'all' | 'start' | 'end' | StableString;
type textDecorationStyle = 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy';
type textDecorationThickness = 'auto' | 'from-font' | number | StableString;
type textEmphasis =
  | 'none'
  | 'filled'
  | 'open'
  | 'dot'
  | 'circle'
  | 'double-circle'
  | 'triangle'
  | 'sesame'
  | Color
  | StableString;
type textEmphasisColor = color;
type textEmphasisPosition = 'auto' | 'over' | 'under' | StableString;
type textEmphasisStyle =
  | 'none'
  | 'filled'
  | 'open'
  | 'dot'
  | 'circle'
  | 'double-circle'
  | 'triangle'
  | 'sesame'
  | StableString;
type textFit = 'none' | 'grow' | 'shrink' | StableString;
type textIndent = number | StableString;
type textJustify = 'auto' | 'inter-character' | 'inter-word' | 'none';
type textOrientation = 'mixed' | 'upright' | 'sideways';
type textOverflow = 'clip' | 'ellipsis' | StableString;
type textRendering =
  | 'auto'
  | 'optimizeSpeed'
  | 'optimizeLegibility'
  | 'geometricPrecision';
type textShadow = 'none' | StableString;
type textSizeAdjust = 'none' | 'auto' | StableString;
type textSpacingTrim = 'space-all' | 'normal' | 'space-first' | 'trim-start';
type textTransform =
  | 'none'
  | 'capitalize'
  | 'uppercase'
  | 'lowercase'
  | 'full-width'
  | 'full-size-kana'
  | 'math-auto'
  | StableString;
type textUnderlineOffset = 'auto' | number | StableString;
type textUnderlinePosition =
  | 'auto'
  | 'from-font'
  | 'under'
  | 'left'
  | 'right'
  | StableString;
type textWrap =
  | 'wrap'
  | 'nowrap'
  | 'auto'
  | 'balance'
  | 'stable'
  | 'pretty'
  | StableString;
type textWrapMode = 'wrap' | 'nowrap';
type textWrapStyle = 'auto' | 'balance' | 'stable' | 'pretty';
type timelineScope = 'none' | StableString;
type timelineTrigger = 'none' | StableString;
type timelineTriggerActivationRange =
  | 'normal'
  | TimelineRangeName
  | number
  | StableString;
type timelineTriggerActivationRangeEnd = timelineTriggerActivationRange;
type timelineTriggerActivationRangeStart = timelineTriggerActivationRange;
type timelineTriggerActiveRange =
  | 'auto'
  | 'normal'
  | TimelineRangeName
  | number
  | StableString;
type timelineTriggerActiveRangeEnd = timelineTriggerActiveRange;
type timelineTriggerActiveRangeStart = timelineTriggerActiveRange;
type timelineTriggerName = 'none' | StableString;
type timelineTriggerSource = 'auto' | 'none' | StableString;
type top = 'auto' | number | StableString;
type touchAction =
  | 'auto'
  | 'none'
  | 'pan-x'
  | 'pan-left'
  | 'pan-right'
  | 'pan-y'
  | 'pan-up'
  | 'pan-down'
  | 'pinch-zoom'
  | 'manipulation'
  | StableString;
type transform = 'none' | StableString;
type transformBox =
  | 'content-box'
  | 'border-box'
  | 'fill-box'
  | 'stroke-box'
  | 'view-box';
type transformOrigin =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'bottom'
  | number
  | StableString;
type transformStyle = 'flat' | 'preserve-3d';
type transition =
  | 'none'
  | 'all'
  | EasingFunction
  | 'normal'
  | 'allow-discrete'
  | StableString;
type transitionBehavior = 'normal' | 'allow-discrete' | StableString;
type transitionDelay = StableString;
type transitionDuration = StableString;
type transitionProperty = 'none' | 'all' | StableString;
type transitionTimingFunction = EasingFunction | StableString;
type translate = 'none' | number | StableString;
type triggerScope = 'none' | 'all' | StableString;
type unicodeBidi =
  | 'normal'
  | 'embed'
  | 'isolate'
  | 'bidi-override'
  | 'isolate-override'
  | 'plaintext';
type userSelect = 'auto' | 'text' | 'none' | 'all';
type vectorEffect =
  | 'none'
  | 'non-scaling-stroke'
  | 'non-scaling-size'
  | 'non-rotation'
  | 'fixed-position';
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
type viewTimeline = 'none' | StableString;
type viewTimelineAxis = 'block' | 'inline' | 'x' | 'y' | StableString;
type viewTimelineInset = 'auto' | number | StableString;
type viewTimelineName = 'none' | StableString;
type viewTransitionClass = 'none' | StableString;
type viewTransitionGroup = 'normal' | 'contain' | 'nearest' | StableString;
type viewTransitionName = 'none' | 'match-element' | StableString;
type viewTransitionScope = 'none' | 'all';
type visibility = 'visible' | 'hidden' | 'collapse';
type WebkitBackgroundClip =
  | 'border-box'
  | 'padding-box'
  | 'content-box'
  | 'text';
type WebkitBoxOrient = 'horizontal' | 'vertical' | 'inline-axis' | 'block-axis';
type WebkitFontSmoothing =
  | 'auto'
  | 'none'
  | 'antialiased'
  | 'subpixel-antialiased';
type WebkitLineClamp = lineClamp;
type WebkitMaskImage = maskImage;
type WebkitTapHighlightColor = color;
type WebkitTextFillColor = color;
type WebkitTextStrokeColor = color;
type WebkitTextStrokeWidth = number | StableString;
type whiteSpace =
  | 'normal'
  | 'pre'
  | 'pre-wrap'
  | 'pre-line'
  | 'collapse'
  | 'preserve'
  | 'preserve-breaks'
  | 'preserve-spaces'
  | 'break-spaces'
  | 'wrap'
  | 'nowrap'
  | StableString;
type whiteSpaceCollapse =
  | 'collapse'
  | 'preserve'
  | 'preserve-breaks'
  | 'preserve-spaces'
  | 'break-spaces';
type widows = number | StableString;
type width =
  | 'auto'
  | 'min-content'
  | 'max-content'
  | 'fit-content'
  | number
  | StableString;
type willChange = 'auto' | 'scroll-position' | 'contents' | StableString;
type windowDrag = 'none' | 'move';
type wordBreak =
  | 'normal'
  | 'break-all'
  | 'keep-all'
  | 'break-word'
  | 'auto-phrase';
type wordSpacing = 'normal' | number | StableString;
type wordWrap = 'normal' | 'break-word';
type writingMode =
  | 'horizontal-tb'
  | 'vertical-rl'
  | 'vertical-lr'
  | 'sideways-rl'
  | 'sideways-lr';
type x = number | StableString;
type y = number | StableString;
type zIndex = 'auto' | number | StableString;
type zoom = 'normal' | 'reset' | number | StableString;

export type CSSTypes = Readonly<{
  accentColor?: all | accentColor;
  alignContent?: all | alignContent;
  alignItems?: all | alignItems;
  alignmentBaseline?: all | alignmentBaseline;
  alignSelf?: all | alignSelf;
  alignTracks?: all | alignTracks;
  anchorName?: all | anchorName;
  anchorScope?: all | anchorScope;
  animation?: all | animation;
  animationComposition?: all | animationComposition;
  animationDelay?: all | animationDelay;
  animationDirection?: all | animationDirection;
  animationDuration?: all | animationDuration;
  animationFillMode?: all | animationFillMode;
  animationIterationCount?: all | animationIterationCount;
  animationName?: all | animationName;
  animationPlayState?: all | animationPlayState;
  animationRange?: all | animationRange;
  animationRangeEnd?: all | animationRangeEnd;
  animationRangeStart?: all | animationRangeStart;
  animationTimeline?: all | animationTimeline;
  animationTimingFunction?: all | animationTimingFunction;
  animationTrigger?: all | animationTrigger;
  appearance?: all | appearance;
  aspectRatio?: all | aspectRatio;
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
  baselineSource?: all | baselineSource;
  blockSize?: all | blockSize;
  border?: all | border;
  borderBlock?: all | borderBlock;
  borderBlockColor?: all | borderBlockColor;
  borderBlockEnd?: all | borderBlockEnd;
  borderBlockEndColor?: all | borderBlockEndColor;
  borderBlockEndStyle?: all | borderBlockEndStyle;
  borderBlockEndWidth?: all | borderBlockEndWidth;
  borderBlockStart?: all | borderBlockStart;
  borderBlockStartColor?: all | borderBlockStartColor;
  borderBlockStartStyle?: all | borderBlockStartStyle;
  borderBlockStartWidth?: all | borderBlockStartWidth;
  borderBlockStyle?: all | borderBlockStyle;
  borderBlockWidth?: all | borderBlockWidth;
  borderBottom?: all | borderBottom;
  borderBottomColor?: all | borderBottomColor;
  borderBottomLeftRadius?: all | borderBottomLeftRadius;
  borderBottomRightRadius?: all | borderBottomRightRadius;
  borderBottomStyle?: all | borderBottomStyle;
  borderBottomWidth?: all | borderBottomWidth;
  borderCollapse?: all | borderCollapse;
  borderColor?: all | borderColor;
  borderEndEndRadius?: all | borderEndEndRadius;
  borderEndStartRadius?: all | borderEndStartRadius;
  borderImage?: all | borderImage;
  borderImageOutset?: all | borderImageOutset;
  borderImageRepeat?: all | borderImageRepeat;
  borderImageSlice?: all | borderImageSlice;
  borderImageSource?: all | borderImageSource;
  borderImageWidth?: all | borderImageWidth;
  borderInline?: all | borderInline;
  borderInlineColor?: all | borderInlineColor;
  borderInlineEnd?: all | borderInlineEnd;
  borderInlineEndColor?: all | borderInlineEndColor;
  borderInlineEndStyle?: all | borderInlineEndStyle;
  borderInlineEndWidth?: all | borderInlineEndWidth;
  borderInlineStart?: all | borderInlineStart;
  borderInlineStartColor?: all | borderInlineStartColor;
  borderInlineStartStyle?: all | borderInlineStartStyle;
  borderInlineStartWidth?: all | borderInlineStartWidth;
  borderInlineStyle?: all | borderInlineStyle;
  borderInlineWidth?: all | borderInlineWidth;
  borderLeft?: all | borderLeft;
  borderLeftColor?: all | borderLeftColor;
  borderLeftStyle?: all | borderLeftStyle;
  borderLeftWidth?: all | borderLeftWidth;
  borderRadius?: all | borderRadius;
  borderRight?: all | borderRight;
  borderRightColor?: all | borderRightColor;
  borderRightStyle?: all | borderRightStyle;
  borderRightWidth?: all | borderRightWidth;
  borderShape?: all | borderShape;
  borderSpacing?: all | borderSpacing;
  borderStartEndRadius?: all | borderStartEndRadius;
  borderStartStartRadius?: all | borderStartStartRadius;
  borderStyle?: all | borderStyle;
  borderTop?: all | borderTop;
  borderTopColor?: all | borderTopColor;
  borderTopLeftRadius?: all | borderTopLeftRadius;
  borderTopRightRadius?: all | borderTopRightRadius;
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
  boxPack?: all | boxPack;
  boxShadow?: all | boxShadow;
  boxSizing?: all | boxSizing;
  breakAfter?: all | breakAfter;
  breakBefore?: all | breakBefore;
  breakInside?: all | breakInside;
  bufferedRendering?: all | bufferedRendering;
  captionSide?: all | captionSide;
  caret?: all | caret;
  caretAnimation?: all | caretAnimation;
  caretColor?: all | caretColor;
  caretShape?: all | caretShape;
  clear?: all | clear;
  clip?: all | clip;
  clipPath?: all | clipPath;
  clipRule?: all | clipRule;
  color?: all | color;
  colorAdjust?: all | colorAdjust;
  colorInterpolation?: all | colorInterpolation;
  colorInterpolationFilters?: all | colorInterpolationFilters;
  colorRendering?: all | colorRendering;
  colorScheme?: all | colorScheme;
  columnCount?: all | columnCount;
  columnFill?: all | columnFill;
  columnGap?: all | columnGap;
  columnHeight?: all | columnHeight;
  columnRule?: all | columnRule;
  columnRuleBreak?: all | columnRuleBreak;
  columnRuleColor?: all | columnRuleColor;
  columnRuleInset?: all | columnRuleInset;
  columnRuleInsetCap?: all | columnRuleInsetCap;
  columnRuleInsetCapEnd?: all | columnRuleInsetCapEnd;
  columnRuleInsetCapStart?: all | columnRuleInsetCapStart;
  columnRuleInsetEnd?: all | columnRuleInsetEnd;
  columnRuleInsetJunction?: all | columnRuleInsetJunction;
  columnRuleInsetJunctionEnd?: all | columnRuleInsetJunctionEnd;
  columnRuleInsetJunctionStart?: all | columnRuleInsetJunctionStart;
  columnRuleInsetStart?: all | columnRuleInsetStart;
  columnRuleStyle?: all | columnRuleStyle;
  columnRuleVisibilityItems?: all | columnRuleVisibilityItems;
  columnRuleWidth?: all | columnRuleWidth;
  columns?: all | columns;
  columnSpan?: all | columnSpan;
  columnWidth?: all | columnWidth;
  columnWrap?: all | columnWrap;
  contain?: all | contain;
  container?: all | container;
  containerName?: all | containerName;
  containerType?: all | containerType;
  containIntrinsicBlockSize?: all | containIntrinsicBlockSize;
  containIntrinsicHeight?: all | containIntrinsicHeight;
  containIntrinsicInlineSize?: all | containIntrinsicInlineSize;
  containIntrinsicSize?: all | containIntrinsicSize;
  containIntrinsicWidth?: all | containIntrinsicWidth;
  content?: all | content;
  contentVisibility?: all | contentVisibility;
  cornerBlockEndShape?: all | cornerBlockEndShape;
  cornerBlockStartShape?: all | cornerBlockStartShape;
  cornerBottomLeftShape?: all | cornerBottomLeftShape;
  cornerBottomRightShape?: all | cornerBottomRightShape;
  cornerBottomShape?: all | cornerBottomShape;
  cornerEndEndShape?: all | cornerEndEndShape;
  cornerEndStartShape?: all | cornerEndStartShape;
  cornerInlineEndShape?: all | cornerInlineEndShape;
  cornerInlineStartShape?: all | cornerInlineStartShape;
  cornerLeftShape?: all | cornerLeftShape;
  cornerRightShape?: all | cornerRightShape;
  cornerShape?: all | cornerShape;
  cornerStartEndShape?: all | cornerStartEndShape;
  cornerStartStartShape?: all | cornerStartStartShape;
  cornerTopLeftShape?: all | cornerTopLeftShape;
  cornerTopRightShape?: all | cornerTopRightShape;
  cornerTopShape?: all | cornerTopShape;
  counterIncrement?: all | counterIncrement;
  counterReset?: all | counterReset;
  counterSet?: all | counterSet;
  cursor?: all | cursor;
  cx?: all | cx;
  cy?: all | cy;
  d?: all | d;
  direction?: all | direction;
  display?: all | display;
  dominantBaseline?: all | dominantBaseline;
  dynamicRangeLimit?: all | dynamicRangeLimit;
  emptyCells?: all | emptyCells;
  fieldSizing?: all | fieldSizing;
  fill?: all | fill;
  fillOpacity?: all | fillOpacity;
  fillRule?: all | fillRule;
  filter?: all | filter;
  flex?: all | flex;
  flexBasis?: all | flexBasis;
  flexDirection?: all | flexDirection;
  flexFlow?: all | flexFlow;
  flexGrow?: all | flexGrow;
  flexLineCount?: all | flexLineCount;
  flexShrink?: all | flexShrink;
  flexWrap?: all | flexWrap;
  float?: all | float;
  floodColor?: all | floodColor;
  floodOpacity?: all | floodOpacity;
  flowTolerance?: all | flowTolerance;
  font?: all | font;
  fontFamily?: all | fontFamily;
  fontFeatureSettings?: all | fontFeatureSettings;
  fontKerning?: all | fontKerning;
  fontLanguageOverride?: all | fontLanguageOverride;
  fontOpticalSizing?: all | fontOpticalSizing;
  fontPalette?: all | fontPalette;
  fontSize?: all | fontSize;
  fontSizeAdjust?: all | fontSizeAdjust;
  fontSmooth?: all | fontSmooth;
  fontStretch?: all | fontStretch;
  fontStyle?: all | fontStyle;
  fontSynthesis?: all | fontSynthesis;
  fontSynthesisPosition?: all | fontSynthesisPosition;
  fontSynthesisSmallCaps?: all | fontSynthesisSmallCaps;
  fontSynthesisStyle?: all | fontSynthesisStyle;
  fontSynthesisWeight?: all | fontSynthesisWeight;
  fontVariant?: all | fontVariant;
  fontVariantAlternates?: all | fontVariantAlternates;
  fontVariantCaps?: all | fontVariantCaps;
  fontVariantEastAsian?: all | fontVariantEastAsian;
  fontVariantEmoji?: all | fontVariantEmoji;
  fontVariantLigatures?: all | fontVariantLigatures;
  fontVariantNumeric?: all | fontVariantNumeric;
  fontVariantPosition?: all | fontVariantPosition;
  fontVariationSettings?: all | fontVariationSettings;
  fontWeight?: all | fontWeight;
  fontWidth?: all | fontWidth;
  forcedColorAdjust?: all | forcedColorAdjust;
  frameSizing?: all | frameSizing;
  gap?: all | gap;
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
  height?: all | height;
  hyphenateCharacter?: all | hyphenateCharacter;
  hyphenateLimitChars?: all | hyphenateLimitChars;
  hyphens?: all | hyphens;
  imageOrientation?: all | imageOrientation;
  imageRendering?: all | imageRendering;
  imageResolution?: all | imageResolution;
  imeMode?: all | imeMode;
  initialLetter?: all | initialLetter;
  initialLetterAlign?: all | initialLetterAlign;
  inlineSize?: all | inlineSize;
  inset?: all | inset;
  insetBlock?: all | insetBlock;
  insetBlockEnd?: all | insetBlockEnd;
  insetBlockStart?: all | insetBlockStart;
  insetInline?: all | insetInline;
  insetInlineEnd?: all | insetInlineEnd;
  insetInlineStart?: all | insetInlineStart;
  interactivity?: all | interactivity;
  interestDelay?: all | interestDelay;
  interestDelayEnd?: all | interestDelayEnd;
  interestDelayStart?: all | interestDelayStart;
  interpolateSize?: all | interpolateSize;
  isolation?: all | isolation;
  justifyContent?: all | justifyContent;
  justifyItems?: all | justifyItems;
  justifySelf?: all | justifySelf;
  justifyTracks?: all | justifyTracks;
  left?: all | left;
  letterSpacing?: all | letterSpacing;
  lightingColor?: all | lightingColor;
  lineBreak?: all | lineBreak;
  lineClamp?: all | lineClamp;
  lineHeight?: all | lineHeight;
  lineHeightStep?: all | lineHeightStep;
  linkParameters?: all | linkParameters;
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
  marginTrim?: all | marginTrim;
  marker?: all | marker;
  markerEnd?: all | markerEnd;
  markerMid?: all | markerMid;
  markerStart?: all | markerStart;
  mask?: all | mask;
  maskBorder?: all | maskBorder;
  maskBorderMode?: all | maskBorderMode;
  maskBorderOutset?: all | maskBorderOutset;
  maskBorderRepeat?: all | maskBorderRepeat;
  maskBorderSlice?: all | maskBorderSlice;
  maskBorderSource?: all | maskBorderSource;
  maskBorderWidth?: all | maskBorderWidth;
  maskClip?: all | maskClip;
  maskComposite?: all | maskComposite;
  maskImage?: all | maskImage;
  maskMode?: all | maskMode;
  maskOrigin?: all | maskOrigin;
  maskPosition?: all | maskPosition;
  maskRepeat?: all | maskRepeat;
  maskSize?: all | maskSize;
  maskType?: all | maskType;
  masonryAutoFlow?: all | masonryAutoFlow;
  mathDepth?: all | mathDepth;
  mathShift?: all | mathShift;
  mathStyle?: all | mathStyle;
  maxBlockSize?: all | maxBlockSize;
  maxHeight?: all | maxHeight;
  maxInlineSize?: all | maxInlineSize;
  maxLines?: all | maxLines;
  maxWidth?: all | maxWidth;
  minBlockSize?: all | minBlockSize;
  minHeight?: all | minHeight;
  minInlineSize?: all | minInlineSize;
  minWidth?: all | minWidth;
  mixBlendMode?: all | mixBlendMode;
  msOverflowStyle?: all | msOverflowStyle;
  objectFit?: all | objectFit;
  objectPosition?: all | objectPosition;
  objectViewBox?: all | objectViewBox;
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
  overflowAnchor?: all | overflowAnchor;
  overflowBlock?: all | overflowBlock;
  overflowClipBox?: all | overflowClipBox;
  overflowClipMargin?: all | overflowClipMargin;
  overflowInline?: all | overflowInline;
  overflowWrap?: all | overflowWrap;
  overflowX?: all | overflowX;
  overflowY?: all | overflowY;
  overlay?: all | overlay;
  overscrollBehavior?: all | overscrollBehavior;
  overscrollBehaviorBlock?: all | overscrollBehaviorBlock;
  overscrollBehaviorInline?: all | overscrollBehaviorInline;
  overscrollBehaviorX?: all | overscrollBehaviorX;
  overscrollBehaviorY?: all | overscrollBehaviorY;
  padding?: all | padding;
  paddingBlock?: all | paddingBlock;
  paddingBlockEnd?: all | paddingBlockEnd;
  paddingBlockStart?: all | paddingBlockStart;
  paddingBottom?: all | paddingBottom;
  paddingInline?: all | paddingInline;
  paddingInlineEnd?: all | paddingInlineEnd;
  paddingInlineStart?: all | paddingInlineStart;
  paddingLeft?: all | paddingLeft;
  paddingRight?: all | paddingRight;
  paddingTop?: all | paddingTop;
  page?: all | page;
  pageBreakAfter?: all | pageBreakAfter;
  pageBreakBefore?: all | pageBreakBefore;
  pageBreakInside?: all | pageBreakInside;
  paintOrder?: all | paintOrder;
  pathLength?: all | pathLength;
  perspective?: all | perspective;
  perspectiveOrigin?: all | perspectiveOrigin;
  placeContent?: all | placeContent;
  placeItems?: all | placeItems;
  placeSelf?: all | placeSelf;
  pointerEvents?: all | pointerEvents;
  position?: all | position;
  positionAnchor?: all | positionAnchor;
  positionArea?: all | positionArea;
  positionTry?: all | positionTry;
  positionTryFallbacks?: all | positionTryFallbacks;
  positionTryOrder?: all | positionTryOrder;
  positionVisibility?: all | positionVisibility;
  printColorAdjust?: all | printColorAdjust;
  quotes?: all | quotes;
  r?: all | r;
  readingFlow?: all | readingFlow;
  readingOrder?: all | readingOrder;
  resize?: all | resize;
  right?: all | right;
  rotate?: all | rotate;
  rowGap?: all | rowGap;
  rowRule?: all | rowRule;
  rowRuleBreak?: all | rowRuleBreak;
  rowRuleColor?: all | rowRuleColor;
  rowRuleInset?: all | rowRuleInset;
  rowRuleInsetCap?: all | rowRuleInsetCap;
  rowRuleInsetCapEnd?: all | rowRuleInsetCapEnd;
  rowRuleInsetCapStart?: all | rowRuleInsetCapStart;
  rowRuleInsetEnd?: all | rowRuleInsetEnd;
  rowRuleInsetJunction?: all | rowRuleInsetJunction;
  rowRuleInsetJunctionEnd?: all | rowRuleInsetJunctionEnd;
  rowRuleInsetJunctionStart?: all | rowRuleInsetJunctionStart;
  rowRuleInsetStart?: all | rowRuleInsetStart;
  rowRuleStyle?: all | rowRuleStyle;
  rowRuleVisibilityItems?: all | rowRuleVisibilityItems;
  rowRuleWidth?: all | rowRuleWidth;
  rubyAlign?: all | rubyAlign;
  rubyMerge?: all | rubyMerge;
  rubyOverhang?: all | rubyOverhang;
  rubyPosition?: all | rubyPosition;
  rule?: all | rule;
  ruleBreak?: all | ruleBreak;
  ruleColor?: all | ruleColor;
  ruleInset?: all | ruleInset;
  ruleInsetCap?: all | ruleInsetCap;
  ruleInsetEnd?: all | ruleInsetEnd;
  ruleInsetJunction?: all | ruleInsetJunction;
  ruleInsetStart?: all | ruleInsetStart;
  ruleOverlap?: all | ruleOverlap;
  ruleStyle?: all | ruleStyle;
  ruleVisibilityItems?: all | ruleVisibilityItems;
  ruleWidth?: all | ruleWidth;
  rx?: all | rx;
  ry?: all | ry;
  scale?: all | scale;
  scrollAxisLock?: all | scrollAxisLock;
  scrollbarColor?: all | scrollbarColor;
  scrollbarGutter?: all | scrollbarGutter;
  scrollbarWidth?: all | scrollbarWidth;
  scrollBehavior?: all | scrollBehavior;
  scrollInitialTarget?: all | scrollInitialTarget;
  scrollMargin?: all | scrollMargin;
  scrollMarginBlock?: all | scrollMarginBlock;
  scrollMarginBlockEnd?: all | scrollMarginBlockEnd;
  scrollMarginBlockStart?: all | scrollMarginBlockStart;
  scrollMarginBottom?: all | scrollMarginBottom;
  scrollMarginInline?: all | scrollMarginInline;
  scrollMarginInlineEnd?: all | scrollMarginInlineEnd;
  scrollMarginInlineStart?: all | scrollMarginInlineStart;
  scrollMarginLeft?: all | scrollMarginLeft;
  scrollMarginRight?: all | scrollMarginRight;
  scrollMarginTop?: all | scrollMarginTop;
  scrollMarkerGroup?: all | scrollMarkerGroup;
  scrollPadding?: all | scrollPadding;
  scrollPaddingBlock?: all | scrollPaddingBlock;
  scrollPaddingBlockEnd?: all | scrollPaddingBlockEnd;
  scrollPaddingBlockStart?: all | scrollPaddingBlockStart;
  scrollPaddingBottom?: all | scrollPaddingBottom;
  scrollPaddingInline?: all | scrollPaddingInline;
  scrollPaddingInlineEnd?: all | scrollPaddingInlineEnd;
  scrollPaddingInlineStart?: all | scrollPaddingInlineStart;
  scrollPaddingLeft?: all | scrollPaddingLeft;
  scrollPaddingRight?: all | scrollPaddingRight;
  scrollPaddingTop?: all | scrollPaddingTop;
  scrollSnapAlign?: all | scrollSnapAlign;
  scrollSnapCoordinate?: all | scrollSnapCoordinate;
  scrollSnapDestination?: all | scrollSnapDestination;
  scrollSnapPointsX?: all | scrollSnapPointsX;
  scrollSnapPointsY?: all | scrollSnapPointsY;
  scrollSnapStop?: all | scrollSnapStop;
  scrollSnapType?: all | scrollSnapType;
  scrollSnapTypeX?: all | scrollSnapTypeX;
  scrollSnapTypeY?: all | scrollSnapTypeY;
  scrollTargetGroup?: all | scrollTargetGroup;
  scrollTimeline?: all | scrollTimeline;
  scrollTimelineAxis?: all | scrollTimelineAxis;
  scrollTimelineName?: all | scrollTimelineName;
  shapeImageThreshold?: all | shapeImageThreshold;
  shapeMargin?: all | shapeMargin;
  shapeOutside?: all | shapeOutside;
  shapeRendering?: all | shapeRendering;
  speakAs?: all | speakAs;
  stopColor?: all | stopColor;
  stopOpacity?: all | stopOpacity;
  stroke?: all | stroke;
  strokeColor?: all | strokeColor;
  strokeDasharray?: all | strokeDasharray;
  strokeDashoffset?: all | strokeDashoffset;
  strokeLinecap?: all | strokeLinecap;
  strokeLinejoin?: all | strokeLinejoin;
  strokeMiterlimit?: all | strokeMiterlimit;
  strokeOpacity?: all | strokeOpacity;
  strokeWidth?: all | strokeWidth;
  tableLayout?: all | tableLayout;
  tabSize?: all | tabSize;
  textAlign?: all | textAlign;
  textAlignLast?: all | textAlignLast;
  textAnchor?: all | textAnchor;
  textAutospace?: all | textAutospace;
  textBox?: all | textBox;
  textBoxEdge?: all | textBoxEdge;
  textBoxTrim?: all | textBoxTrim;
  textCombineUpright?: all | textCombineUpright;
  textDecoration?: all | textDecoration;
  textDecorationColor?: all | textDecorationColor;
  textDecorationInset?: all | textDecorationInset;
  textDecorationLine?: all | textDecorationLine;
  textDecorationSkip?: all | textDecorationSkip;
  textDecorationSkipInk?: all | textDecorationSkipInk;
  textDecorationSkipSpaces?: all | textDecorationSkipSpaces;
  textDecorationStyle?: all | textDecorationStyle;
  textDecorationThickness?: all | textDecorationThickness;
  textEmphasis?: all | textEmphasis;
  textEmphasisColor?: all | textEmphasisColor;
  textEmphasisPosition?: all | textEmphasisPosition;
  textEmphasisStyle?: all | textEmphasisStyle;
  textFit?: all | textFit;
  textIndent?: all | textIndent;
  textJustify?: all | textJustify;
  textOrientation?: all | textOrientation;
  textOverflow?: all | textOverflow;
  textRendering?: all | textRendering;
  textShadow?: all | textShadow;
  textSizeAdjust?: all | textSizeAdjust;
  textSpacingTrim?: all | textSpacingTrim;
  textTransform?: all | textTransform;
  textUnderlineOffset?: all | textUnderlineOffset;
  textUnderlinePosition?: all | textUnderlinePosition;
  textWrap?: all | textWrap;
  textWrapMode?: all | textWrapMode;
  textWrapStyle?: all | textWrapStyle;
  timelineScope?: all | timelineScope;
  timelineTrigger?: all | timelineTrigger;
  timelineTriggerActivationRange?: all | timelineTriggerActivationRange;
  timelineTriggerActivationRangeEnd?: all | timelineTriggerActivationRangeEnd;
  timelineTriggerActivationRangeStart?:
    | all
    | timelineTriggerActivationRangeStart;
  timelineTriggerActiveRange?: all | timelineTriggerActiveRange;
  timelineTriggerActiveRangeEnd?: all | timelineTriggerActiveRangeEnd;
  timelineTriggerActiveRangeStart?: all | timelineTriggerActiveRangeStart;
  timelineTriggerName?: all | timelineTriggerName;
  timelineTriggerSource?: all | timelineTriggerSource;
  top?: all | top;
  touchAction?: all | touchAction;
  transform?: all | transform;
  transformBox?: all | transformBox;
  transformOrigin?: all | transformOrigin;
  transformStyle?: all | transformStyle;
  transition?: all | transition;
  transitionBehavior?: all | transitionBehavior;
  transitionDelay?: all | transitionDelay;
  transitionDuration?: all | transitionDuration;
  transitionProperty?: all | transitionProperty;
  transitionTimingFunction?: all | transitionTimingFunction;
  translate?: all | translate;
  triggerScope?: all | triggerScope;
  unicodeBidi?: all | unicodeBidi;
  userSelect?: all | userSelect;
  vectorEffect?: all | vectorEffect;
  verticalAlign?: all | verticalAlign;
  viewTimeline?: all | viewTimeline;
  viewTimelineAxis?: all | viewTimelineAxis;
  viewTimelineInset?: all | viewTimelineInset;
  viewTimelineName?: all | viewTimelineName;
  viewTransitionClass?: all | viewTransitionClass;
  viewTransitionGroup?: all | viewTransitionGroup;
  viewTransitionName?: all | viewTransitionName;
  viewTransitionScope?: all | viewTransitionScope;
  visibility?: all | visibility;
  WebkitBackgroundClip?: all | WebkitBackgroundClip;
  WebkitBoxOrient?: all | WebkitBoxOrient;
  WebkitFontSmoothing?: all | WebkitFontSmoothing;
  WebkitLineClamp?: all | WebkitLineClamp;
  WebkitMaskImage?: all | WebkitMaskImage;
  WebkitTapHighlightColor?: all | WebkitTapHighlightColor;
  WebkitTextFillColor?: all | WebkitTextFillColor;
  WebkitTextStrokeColor?: all | WebkitTextStrokeColor;
  WebkitTextStrokeWidth?: all | WebkitTextStrokeWidth;
  whiteSpace?: all | whiteSpace;
  whiteSpaceCollapse?: all | whiteSpaceCollapse;
  widows?: all | widows;
  width?: all | width;
  willChange?: all | willChange;
  windowDrag?: all | windowDrag;
  wordBreak?: all | wordBreak;
  wordSpacing?: all | wordSpacing;
  wordWrap?: all | wordWrap;
  writingMode?: all | writingMode;
  x?: all | x;
  y?: all | y;
  zIndex?: all | zIndex;
  zoom?: all | zoom;
}>;
