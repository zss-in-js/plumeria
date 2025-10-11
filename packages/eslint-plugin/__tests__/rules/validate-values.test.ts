import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { validateValues } from '../../src/rules/validate-values';

const ruleTester = new RuleTester();

ruleTester.run(
  'validate-values',
  validateValues as unknown as JSRuleDefinition,
  {
    valid: [
      // Basic keywords
      { code: "const styles = { position: 'absolute' };" },
      { code: "const styles = { display: 'flex' };" },
      { code: "const styles = { overflow: 'scroll auto' };" },
      { code: "const styles = { animationIterationCount: '1' };" },
      { code: "const styles = { width: 'fit-content(300px)' };" },
      { code: "const styles = { maxWidth: 'fit-content(200px)' };" },
      { code: "const styles = { minWidth: 'fit-content(200px)' };" },
      { code: "const styles = { height: 'fit-content(200px)' };" },
      { code: "const styles = { maxHeight: 'fit-content(200px)' };" },
      { code: "const styles = { minHeight: 'fit-content(200em)' };" },
      { code: "const styles = { blockSize: 'fit-content(100rem)' };" },
      { code: "const styles = { columnWidth: 'fit-content(150px)' };" },
      { code: "const styles = { flexBasis: 'fit-content(250px)' };" },
      { code: "const styles = { inlineSize: 'fit-content(300px)' };" },
      { code: 'const styles = { fontSize: 40 };' },

      // Length & Color
      { code: "const styles = { fontSize: '1.5em' };" },
      { code: "const styles = { color: '#f00' };" },
      { code: "const styles = { borderColor: 'red blue' };" },
      { code: "const styles = { margin: '10px 20px' };" },

      // Shorthand & Complex
      { code: "const styles = { border: '1px solid red' };" },
      { code: "const styles = { background: 'red' };" },
      { code: "const styles = { filter: 'blur(5px)' };" },
      { code: "const styles = { transition: 'width 2s ease-in-out' };" },
      { code: "const styles = { flex: '1 1 auto' };" },
      { code: "const styles = { flex: '1 2 auto' };" },
      { code: "const styles = { flex: '1 2 10px' };" },
      { code: "const styles = { flex: '2 1' };" },
      { code: "const styles = { flex: '2 1px' };" },
      { code: "const styles = { flexFlow: 'row wrap' };" },
      { code: "const styles = { animation: 'slidein 3s ease' };" },
      { code: "const styles = { grid: '1fr / 1fr' };" },
      { code: "const styles = { transform: 'translateX(10px)' };" },
      {
        code: "const styles = { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' };",
      },
      { code: "const styles = { cursor: 'url(hand.cur), auto' };" },

      // Global values & CSS Vars
      { code: "const styles = { color: 'inherit' };" },
      { code: "const styles = { color: 'var(--my-color)' };" },
      { code: "const styles = { borderStyle: 'none' };" },
      { code: "const styles = { borderRadius: '10px' };" },
      { code: "const styles = { opacity: '0.5' };" },
      { code: "const styles = { maskImage: 'none' };" },
      { code: "const styles = { borderImageSlice: 'inherit' };" },
      { code: "const styles = { borderImage: 'none' };" },
      { code: "const styles = { aspectRatio: 'auto' };" },
      { code: "const styles = { transitionDuration: '0.2s' };" },
      { code: "const styles = { animationDirection: 'normal' };" },
      { code: "const styles = { animationFillMode: 'none' };" },
      { code: "const styles = { animationPlayState: 'paused' };" },
      { code: "const styles = { animationIterationCount: 'inherit' };" },
      { code: "const styles = { animationTimingFunction: 'inherit' };" },
      { code: "const styles = { backgroundSize: 'cover' };" },
      { code: "const styles = { backgroundClip: 'initial' };" },
      { code: "const styles = { backgroundPosition: 'top' };" },
      { code: "const styles = { backgroundImage: 'none' };" },

      // isFitContentGroup for test
      { code: "const styles = { width: 'fit-content(100px)' };" },

      // isNumber for test
      { code: "const styles = { lineHeight: '1.5' };" },

      // isBorderWidth for test
      { code: "const styles = { borderWidth: 'thin' };" },
      { code: "const styles = { borderWidth: 'medium' };" },
      { code: "const styles = { borderWidth: 'thick' };" },

      // Translate valid cases
      { code: "const styles = { translate: '10px' };" },
      { code: "const styles = { translate: '10px 20px' };" },
      { code: "const styles = { translate: '10px 20px 30px' };" },
      { code: "const styles = { translate: '50%' };" },
      { code: "const styles = { translate: 'none' };" },

      // Transform valid cases
      { code: "const styles = { transform: 'rotate(45deg)' };" },
      { code: "const styles = { transform: 'scale(1.5)' };" },
      { code: "const styles = { transform: 'none' };" },

      // TransformOrigin valid cases
      { code: "const styles = { transformOrigin: 'center' };" },
      { code: "const styles = { transformOrigin: 'top left' };" },
      { code: "const styles = { transformOrigin: '50% 50%' };" },

      // TextEmphasis valid cases
      { code: "const styles = { textEmphasis: 'filled' };" },
      { code: "const styles = { textEmphasis: 'filled red' };" },
      { code: "const styles = { textEmphasis: 'dot' };" },

      // TextEmphasisStyle valid cases
      { code: "const styles = { textEmphasisStyle: 'dot' };" },
      { code: "const styles = { textEmphasisStyle: 'filled circle' };" },
      { code: 'const styles = { textEmphasisStyle: \'"x"\' };' },

      // TextEmphasisPosition valid cases
      { code: "const styles = { textEmphasisPosition: 'over' };" },
      { code: "const styles = { textEmphasisPosition: 'over right' };" },
      { code: "const styles = { textEmphasisPosition: 'under left' };" },

      // ScrollSnapType valid cases
      { code: "const styles = { scrollSnapType: 'x' };" },
      { code: "const styles = { scrollSnapType: 'y mandatory' };" },
      { code: "const styles = { scrollSnapType: 'both proximity' };" },

      // ScrollSnapAlign valid cases
      { code: "const styles = { scrollSnapAlign: 'start' };" },
      { code: "const styles = { scrollSnapAlign: 'center end' };" },

      // MaskBorderRepeat valid cases
      { code: "const styles = { maskBorderRepeat: 'stretch' };" },
      { code: "const styles = { maskBorderRepeat: 'repeat round' };" },

      // JustifyItems valid cases
      { code: "const styles = { justifyItems: 'center' };" },
      { code: "const styles = { justifyItems: 'safe center' };" },
      { code: "const styles = { justifyItems: 'legacy center' };" },

      // JustifySelf valid cases
      { code: "const styles = { justifySelf: 'auto' };" },
      { code: "const styles = { justifySelf: 'safe center' };" },

      // JustifyContent valid cases
      { code: "const styles = { justifyContent: 'space-between' };" },
      { code: "const styles = { justifyContent: 'safe center' };" },

      // HangingPunctuation valid cases
      { code: "const styles = { hangingPunctuation: 'first' };" },
      { code: "const styles = { hangingPunctuation: 'first force-end' };" },

      // FlexFlow valid cases
      { code: "const styles = { flexFlow: 'column wrap' };" },

      // BackgroundRepeat valid cases
      { code: "const styles = { backgroundRepeat: 'repeat-x' };" },
      { code: "const styles = { backgroundRepeat: 'no-repeat' };" },

      // PlaceSelf valid cases
      { code: "const styles = { placeSelf: 'center' };" },
      { code: "const styles = { placeSelf: 'start end' };" },

      // PlaceItems valid cases
      { code: "const styles = { placeItems: 'center' };" },
      { code: "const styles = { placeItems: 'start end' };" },

      // PlaceContent valid cases
      { code: "const styles = { placeContent: 'center' };" },
      { code: "const styles = { placeContent: 'space-between' };" },

      // Display multi-keyword valid cases
      { code: "const styles = { display: 'inline flex' };" },
      { code: "const styles = { display: 'list-item block' };" },

      // AlignItems valid cases
      { code: "const styles = { alignItems: 'safe center' };" },
      { code: "const styles = { alignItems: 'first baseline' };" },

      // AlignSelf valid cases
      { code: "const styles = { alignSelf: 'safe center' };" },

      // AlignContent valid cases
      { code: "const styles = { alignContent: 'safe center' };" },
      { code: "const styles = { alignContent: 'first baseline' };" },

      // TouchAction valid cases
      { code: "const styles = { touchAction: 'pan-x' };" },
      { code: "const styles = { touchAction: 'pan-y pinch-zoom' };" },

      // TextShadow valid cases
      { code: "const styles = { textShadow: '2px 2px 4px black' };" },
      { code: "const styles = { textShadow: 'red 2px 2px 4px' };" },

      // TextIndent valid cases
      { code: "const styles = { textIndent: '2em' };" },
      { code: "const styles = { textIndent: '2em hanging' };" },

      // TextDecorationLine valid cases
      { code: "const styles = { textDecorationLine: 'underline' };" },
      { code: "const styles = { textDecorationLine: 'underline overline' };" },
      { code: "const styles = { textDecorationLine: 'var(--decoration)' };" },
      {
        code: "const styles = { textDecorationLine: 'underline var(--decoration)' };",
      },

      // StrokeMiterlimit valid cases
      { code: "const styles = { strokeMiterlimit: '4' };" },

      // StrokeDasharray valid cases
      { code: "const styles = { strokeDasharray: '5, 10' };" },

      // Stroke valid cases
      { code: "const styles = { stroke: 'red' };" },
      { code: "const styles = { stroke: 'url(#gradient)' };" },

      // ShapeOutside valid cases
      { code: "const styles = { shapeOutside: 'circle(50%)' };" },
      { code: "const styles = { shapeOutside: 'margin-box' };" },

      // ShapeImageThreshold valid cases
      { code: "const styles = { shapeImageThreshold: '0.5' };" },

      // ScrollbarColor valid cases
      { code: "const styles = { scrollbarColor: 'red blue' };" },

      // ScrollPadding valid cases
      { code: "const styles = { scrollPadding: '10px' };" },
      { code: "const styles = { scrollPadding: '10px 20px' };" },

      // ScrollMargin valid cases
      { code: "const styles = { scrollMargin: '10px' };" },

      // Scale valid cases
      { code: "const styles = { scale: '1.5' };" },
      { code: "const styles = { scale: '1.5 2' };" },

      // Rotate valid cases
      { code: "const styles = { rotate: '45deg' };" },
      { code: "const styles = { rotate: 'x 45deg' };" },

      // Quotes valid cases
      { code: 'const styles = { quotes: \'"«" "»"\' };' },

      // PaintOrder valid cases
      { code: "const styles = { paintOrder: 'fill' };" },
      { code: "const styles = { paintOrder: 'stroke fill' };" },

      // OverscrollBehavior valid cases
      { code: "const styles = { overscrollBehavior: 'contain' };" },
      { code: "const styles = { overscrollBehavior: 'auto contain' };" },

      // OverflowClipMargin valid cases
      { code: "const styles = { overflowClipMargin: '10px' };" },
      { code: "const styles = { overflowClipMargin: 'border-box' };" },

      // Overflow valid cases
      { code: "const styles = { overflow: 'hidden' };" },

      // Offset valid cases
      { code: 'const styles = { offset: \'path("M 0 0 L 100 100")\' };' },

      // OffsetPath valid cases
      { code: 'const styles = { offsetPath: \'path("M 0 0 L 100 100")\' };' },

      // OffsetRotate valid cases
      { code: "const styles = { offsetRotate: 'auto' };" },
      { code: "const styles = { offsetRotate: '45deg' };" },

      // LengthPosition properties valid cases
      { code: "const styles = { objectPosition: 'center' };" },
      { code: "const styles = { objectPosition: '50% 50%' };" },

      // MathDepth valid cases
      { code: "const styles = { mathDepth: '2' };" },
      { code: "const styles = { mathDepth: 'add(1)' };" },

      // Mask valid cases
      { code: "const styles = { mask: 'url(mask.png)' };" },

      // MaskBorder valid cases
      { code: "const styles = { maskBorder: 'url(border.png)' };" },

      // MaskSize valid cases
      { code: "const styles = { maskSize: 'cover' };" },
      { code: "const styles = { maskSize: '100px 200px' };" },

      // MaskRepeat valid cases
      { code: "const styles = { maskRepeat: 'repeat' };" },

      // MaskPosition valid cases
      { code: "const styles = { maskPosition: 'center' };" },

      // MaskOrigin valid cases
      { code: "const styles = { maskOrigin: 'border-box' };" },

      // MaskMode valid cases
      { code: "const styles = { maskMode: 'alpha' };" },

      // MaskComposite valid cases
      { code: "const styles = { maskComposite: 'add' };" },

      // MaskClip valid cases
      { code: "const styles = { maskClip: 'border-box' };" },

      // MaskBorderWidth valid cases
      { code: "const styles = { maskBorderWidth: '10px' };" },

      // MaskBorderSlice valid cases
      { code: "const styles = { maskBorderSlice: '10' };" },

      // MaskBorderOutset valid cases
      { code: "const styles = { maskBorderOutset: '10px' };" },

      // Marker properties valid cases
      { code: "const styles = { marker: 'url(#marker)' };" },

      // MarginPair properties valid cases
      { code: "const styles = { marginBlock: '10px' };" },
      { code: "const styles = { marginBlock: '10px 20px' };" },

      // InsetPair properties valid cases
      { code: "const styles = { insetBlock: 'auto' };" },
      { code: "const styles = { insetBlock: '10px 20px' };" },

      // InitialLetter valid cases
      { code: "const styles = { initialLetter: '3' };" },
      { code: "const styles = { initialLetter: '3 drop' };" },

      // ImageOrientation valid cases
      { code: "const styles = { imageOrientation: 'from-image' };" },
      { code: "const styles = { imageOrientation: '90deg' };" },

      // HyphenateLimitChars valid cases
      { code: "const styles = { hyphenateLimitChars: 'auto' };" },
      { code: "const styles = { hyphenateLimitChars: '5 2 3' };" },

      // Grid valid cases
      { code: "const styles = { grid: 'auto-flow / 1fr' };" },

      // GridTemplate valid cases
      { code: "const styles = { gridTemplate: '1fr / 1fr' };" },

      // GridTemplateColumns/Rows valid cases
      { code: "const styles = { gridTemplateColumns: '1fr 2fr' };" },

      // GridTemplateAreas valid cases
      { code: 'const styles = { gridTemplateAreas: \'"header header"\' };' },

      // GridAutoColumns/Rows valid cases
      { code: "const styles = { gridAutoColumns: 'auto' };" },

      // FontFeatureSettings valid cases
      { code: 'const styles = { fontFeatureSettings: \'"liga" on\' };' },

      // FontVariant valid cases
      { code: "const styles = { fontVariant: 'small-caps' };" },

      // FontLanguageOverride valid cases
      { code: "const styles = { fontLanguageOverride: 'normal' };" },

      // FontVariationSettings valid cases
      { code: 'const styles = { fontVariationSettings: \'"wght" 700\' };' },

      // FontVariantNumeric valid cases
      { code: "const styles = { fontVariantNumeric: 'lining-nums' };" },

      // FontVariantLigatures valid cases
      { code: "const styles = { fontVariantLigatures: 'common-ligatures' };" },

      // FontVariantEastAsian valid cases
      { code: "const styles = { fontVariantEastAsian: 'jis78' };" },

      // FontVariantAlternates valid cases
      { code: "const styles = { fontVariantAlternates: 'historical-forms' };" },

      // FontSynthesis valid cases
      { code: "const styles = { fontSynthesis: 'weight' };" },

      // FontStyle valid cases
      { code: "const styles = { fontStyle: 'oblique 10deg' };" },

      // FontPalette valid cases
      { code: "const styles = { fontPalette: 'light' };" },

      // FontSizeAdjust valid cases
      { code: "const styles = { fontSizeAdjust: '0.5' };" },
      { code: "const styles = { fontSizeAdjust: 'ex-height 0.5' };" },

      // FontStretch valid cases
      { code: "const styles = { fontStretch: '50%' };" },

      // Flex valid cases
      { code: "const styles = { flex: '1' };" },
      { code: "const styles = { flex: '1 1' };" },

      // Cursor valid cases
      { code: "const styles = { cursor: 'pointer' };" },

      // Content valid cases
      { code: 'const styles = { content: \'"text"\' };' },
      { code: "const styles = { content: 'url(image.png)' };" },

      // Columns valid cases
      { code: "const styles = { columns: '100px' };" },
      { code: "const styles = { columns: '3' };" },

      // ClipPath valid cases
      { code: "const styles = { clipPath: 'circle(50%)' };" },

      // BoxShadow valid cases
      { code: "const styles = { boxShadow: '2px 2px 4px black' };" },

      // BackgroundAttachment valid cases
      { code: "const styles = { backgroundAttachment: 'fixed' };" },

      // BackgroundBlendMode valid cases
      { code: "const styles = { backgroundBlendMode: 'multiply' };" },

      // BackgroundOrigin valid cases
      { code: "const styles = { backgroundOrigin: 'border-box' };" },

      // BackgroundPosition quad valid cases
      { code: "const styles = { backgroundPosition: 'left 10px top 20px' };" },

      // BackgroundSize pair valid cases
      { code: "const styles = { backgroundPositionY: 'top, bottom' };" },

      // Filter valid cases
      { code: "const styles = { filter: 'brightness(1.5)' };" },

      // AnimationTimingFunction valid cases
      { code: "const styles = { animationTimingFunction: 'ease-in-out' };" },

      // AspectRatio valid cases
      { code: "const styles = { aspectRatio: '16 / 9' };" },

      // Border valid cases
      { code: "const styles = { border: 'var(--border-width)' };" },

      // BorderImage valid cases
      { code: "const styles = { borderImage: 'url(border.png) 30' };" },

      // BorderImageSlice valid cases
      { code: "const styles = { borderImageSlice: '30 fill' };" },

      // ImageSource properties valid cases
      { code: "const styles = { listStyleImage: 'url(bullet.png)' };" },

      // Border properties valid cases
      { code: "const styles = { borderTop: 'thin solid red' };" },

      // SingleColor properties valid cases
      { code: "const styles = { accentColor: 'blue' };" },

      // BorderColor valid cases
      { code: "const styles = { borderColor: 'red blue green yellow' };" },

      // Integer group properties valid cases
      { code: "const styles = { columnCount: '3' };" },

      // Other group properties valid cases
      { code: "const styles = { flexGrow: '2' };" },

      // LengthValue properties valid cases
      { code: "const styles = { width: '100px' };" },

      // BorderRadius valid cases
      { code: "const styles = { borderRadius: '10px / 20px' };" },

      // BorderStyle valid cases
      { code: "const styles = { borderStyle: 'solid dashed' };" },

      // MultipleValue properties valid cases
      { code: "const styles = { padding: '10px 20px 30px 40px' };" },
    ],

    invalid: [
      // Position
      {
        code: "const styles = { position: 'center' };",
        errors: [
          {
            message:
              "'position' has an invalid value 'center'. Valid values: static, relative, absolute, fixed, sticky",
          },
        ],
      },

      // ZIndex
      {
        code: "const styles = { zIndex: 'high' };",
        errors: [
          {
            message: "'zIndex' has an invalid value 'high'. Valid values: auto",
          },
        ],
      },

      // Display
      {
        code: "const styles = { display: 'foo' };",
        errors: [
          {
            message:
              "'display' has an invalid value 'foo'. Valid values: block, inline, run-in, flow, flow-root, table, flex, grid, ruby, math, table-header-group, table-footer-group, table-row, table-row-group, table-cell, table-column-group, table-column, table-caption, ruby-base, ruby-text, ruby-base-container, ruby-text-container, contents, none, inline-block, inline-table, inline-flex, inline-grid, inline-list-item",
          },
        ],
      },

      // Flex
      {
        code: "const styles = { flex: '' };",
        errors: [
          {
            message: "'flex' has an invalid value ''. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { flex: 'auto 2' };",
        errors: [
          {
            message: "'flex' has an invalid value 'auto 2'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { flex: '10px 1' };",
        errors: [
          {
            message: "'flex' has an invalid value '10px 1'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { flex: 'auto 2 10px' };",
        errors: [
          {
            message:
              "'flex' has an invalid value 'auto 2 10px'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { flex: '1 auto 10px' };",
        errors: [
          {
            message:
              "'flex' has an invalid value '1 auto 10px'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { flex: 'auto auto 10px' };",
        errors: [
          {
            message:
              "'flex' has an invalid value 'auto auto 10px'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { flex: '1 2 invalid' };",
        errors: [
          {
            message:
              "'flex' has an invalid value '1 2 invalid'. Valid values: none",
          },
        ],
      },

      // Color
      {
        code: "const styles = { color: 'invalid-color' };",
        errors: [
          {
            message:
              "'color' has an invalid value 'invalid-color'. Valid values: ",
          },
        ],
      },

      // Margin
      {
        code: "const styles = { margin: '10px 20px 30px 40px 50px' };",
        errors: [
          {
            message:
              "'margin' has an invalid value '10px 20px 30px 40px 50px'. Valid values: auto",
          },
        ],
      },

      // Border
      {
        code: "const styles = { border: '1px solid red blue' };",
        errors: [
          {
            message:
              "'border' has an invalid value '1px solid red blue'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
          },
        ],
      },
      // Check for duplicate width
      {
        code: "const styles = { border: '1px 2em solid' };",
        errors: [
          {
            message:
              "'border' has an invalid value '1px 2em solid'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
          },
        ],
      },
      // Check for duplicate styles
      {
        code: "const styles = { border: 'solid dashed 1px' };",
        errors: [
          {
            message:
              "'border' has an invalid value 'solid dashed 1px'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
          },
        ],
      },

      // Check for duplicate colors
      {
        code: "const styles = { border: 'red blue solid' };",
        errors: [
          {
            message:
              "'border' has an invalid value 'red blue solid'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
          },
        ],
      },
      {
        code: "const styles = { border: 'var(--custom) invalid-value' };",
        errors: [
          {
            message:
              "'border' has an invalid value 'var(--custom) invalid-value'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
          },
        ],
      },
      {
        code: "const styles = { border: 'invalid-value' };",
        errors: [
          {
            message:
              "'border' has an invalid value 'invalid-value'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
          },
        ],
      },

      // Background
      {
        code: "const styles = { background: 'url(/foo.png) no-repeat extra' };",
        errors: [
          {
            message:
              "'background' has an invalid value 'url(/foo.png) no-repeat extra'. Valid values: none",
          },
        ],
      },

      // Flex
      {
        code: "const styles = { flex: '1 1 auto 0' };",
        errors: [
          {
            message:
              "'flex' has an invalid value '1 1 auto 0'. Valid values: none",
          },
        ],
      },

      // Transform
      {
        code: "const styles = { transform: 'translateX(10px) wrong' };",
        errors: [
          {
            message:
              "'transform' has an invalid value 'translateX(10px) wrong'. Valid values: none",
          },
        ],
      },

      // Cursor
      {
        code: "const styles = { cursor: 'url(hand.cur), auto, pointer' };",
        errors: [
          {
            message:
              "'cursor' has an invalid value 'url(hand.cur), auto, pointer'. Valid values: auto",
          },
        ],
      },

      // BorderStyle
      {
        code: "const styles = { borderStyle: 'nones' };",
        errors: [
          {
            message:
              "'borderStyle' has an invalid value 'nones'. Valid values: none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
          },
        ],
      },

      // BorderRadius
      {
        code: "const styles = { borderRadius: 'nones' };",
        errors: [
          {
            message:
              "'borderRadius' has an invalid value 'nones'. Valid values: ",
          },
        ],
      },

      // Width
      {
        code: "const styles = { width: 'none' };",
        errors: [
          {
            message:
              "'width' has an invalid value 'none'. Valid values: auto, stretch, max-content, min-content, fit-content",
          },
        ],
      },

      // Opacity
      {
        code: "const styles = { opacity: 'none' };",
        errors: [
          { message: "'opacity' has an invalid value 'none'. Valid values: " },
        ],
      },

      // BorderColor
      {
        code: "const styles = { borderColor: 'red green white blue orange' };",
        errors: [
          {
            message:
              "'borderColor' has an invalid value 'red green white blue orange'. Valid values: ",
          },
        ],
      },

      // MaskImage
      {
        code: "const styles = { maskImage: 'nones' };",
        errors: [
          {
            message:
              "'maskImage' has an invalid value 'nones'. Valid values: none",
          },
        ],
      },

      // BorderImageSlice
      {
        code: "const styles = { borderImageSlice: 'inherits' };",
        errors: [
          {
            message:
              "'borderImageSlice' has an invalid value 'inherits'. Valid values: fill",
          },
        ],
      },

      // BorderImage
      {
        code: "const styles = { borderImage: 'nones' };",
        errors: [
          {
            message:
              "'borderImage' has an invalid value 'nones'. Valid values: none",
          },
        ],
      },

      // AspectRatio
      {
        code: "const styles = { aspectRatio: 'autos' };",
        errors: [
          {
            message:
              "'aspectRatio' has an invalid value 'autos'. Valid values: auto",
          },
        ],
      },

      // TransitionDuration
      {
        code: "const styles = { transitionDuration: 'none' };",
        errors: [
          {
            message:
              "'transitionDuration' has an invalid value 'none'. Valid values: ",
          },
        ],
      },

      // AnimationDirection
      {
        code: "const styles = { animationDirection: 'normals' };",
        errors: [
          {
            message:
              "'animationDirection' has an invalid value 'normals'. Valid values: ",
          },
        ],
      },

      // AnimationFillMode
      {
        code: "const styles = { animationFillMode: 'nones' };",
        errors: [
          {
            message:
              "'animationFillMode' has an invalid value 'nones'. Valid values: ",
          },
        ],
      },

      // AnimationPlayState
      {
        code: "const styles = { animationPlayState: 'pauseds' };",
        errors: [
          {
            message:
              "'animationPlayState' has an invalid value 'pauseds'. Valid values: ",
          },
        ],
      },

      // AnimationTimingFunction
      {
        code: "const styles = { animationTimingFunction: 'inherits' };",
        errors: [
          {
            message:
              "'animationTimingFunction' has an invalid value 'inherits'. Valid values: ",
          },
        ],
      },

      // BackgroundSize
      {
        code: "const styles = { backgroundSize: 'none' };",
        errors: [
          {
            message:
              "'backgroundSize' has an invalid value 'none'. Valid values: auto, cover, contain",
          },
        ],
      },

      // BackgroundClip
      {
        code: "const styles = { backgroundClip: 'initials' };",
        errors: [
          {
            message:
              "'backgroundClip' has an invalid value 'initials'. Valid values: text, border-area",
          },
        ],
      },

      // Filter
      {
        code: "const styles = { filter: 'nones' };",
        errors: [
          {
            message:
              "'filter' has an invalid value 'nones'. Valid values: none",
          },
        ],
      },

      // BackgroundPosition
      {
        code: "const styles = { backgroundPosition: 'tops' };",
        errors: [
          {
            message:
              "'backgroundPosition' has an invalid value 'tops'. Valid values: ",
          },
        ],
      },

      // BackgroundImage
      {
        code: "const styles = { backgroundImage: 'nones' };",
        errors: [
          {
            message:
              "'backgroundImage' has an invalid value 'nones'. Valid values: none",
          },
        ],
      },

      // BackgroundBlendMode
      {
        code: "const styles = { backgroundBlendMode: 'colors' };",
        errors: [
          {
            message:
              "'backgroundBlendMode' has an invalid value 'colors'. Valid values: ",
          },
        ],
      },

      // TouchAction
      {
        code: "const styles = { touchAction: 'invalid-action' };",
        errors: [
          {
            message:
              "'touchAction' has an invalid value 'invalid-action'. Valid values: auto, none",
          },
        ],
      },
      {
        code: "const styles = { touchAction: 'pan-x pan-x' };",
        errors: [
          {
            message:
              "'touchAction' has an invalid value 'pan-x pan-x'. Valid values: auto, none",
          },
        ],
      },

      // AlignContent
      {
        code: "const styles = { alignContent: 'invalid-align' };",
        errors: [
          {
            message:
              "'alignContent' has an invalid value 'invalid-align'. Valid values: normal, start, center, end, flex-start, flex-end, baseline, space-between, space-around, space-evenly, stretch",
          },
        ],
      },

      // AlignItems
      {
        code: "const styles = { alignItems: 'invalid-item' };",
        errors: [
          {
            message:
              "'alignItems' has an invalid value 'invalid-item'. Valid values: normal, stretch, center, start, end, flex-start, flex-end, self-start, self-end, anchor-center, baseline",
          },
        ],
      },

      // AlignSelf
      {
        code: "const styles = { alignSelf: 'invalid-self' };",
        errors: [
          {
            message:
              "'alignSelf' has an invalid value 'invalid-self'. Valid values: auto, normal, stretch, center, start, end, flex-start, flex-end, self-start, self-end, anchor-center, baseline",
          },
        ],
      },

      // Display invalid
      {
        code: "const styles = { display: 'invalid-display' };",
        errors: [
          {
            message:
              "'display' has an invalid value 'invalid-display'. Valid values: block, inline, run-in, flow, flow-root, table, flex, grid, ruby, math, table-header-group, table-footer-group, table-row, table-row-group, table-cell, table-column-group, table-column, table-caption, ruby-base, ruby-text, ruby-base-container, ruby-text-container, contents, none, inline-block, inline-table, inline-flex, inline-grid, inline-list-item",
          },
        ],
      },

      // FlexFlow
      {
        code: "const styles = { flexFlow: 'invalid-flow' };",
        errors: [
          {
            message:
              "'flexFlow' has an invalid value 'invalid-flow'. Valid values: row, row-reverse, column, column-reverse, nowrap, wrap, wrap-reverse",
          },
        ],
      },

      // HangingPunctuation
      {
        code: "const styles = { hangingPunctuation: 'invalid-punctuation' };",
        errors: [
          {
            message:
              "'hangingPunctuation' has an invalid value 'invalid-punctuation'. Valid values: none, first, last, allow-end, force-end",
          },
        ],
      },

      // JustifyContent
      {
        code: "const styles = { justifyContent: 'invalid-justify' };",
        errors: [
          {
            message:
              "'justifyContent' has an invalid value 'invalid-justify'. Valid values: normal, stretch, start, end, flex-start, flex-end, center, left, right, space-between, space-around, space-evenly, safe start, safe end, safe center, safe flex-start, safe flex-end, unsafe start, unsafe end, unsafe center, unsafe flex-start, unsafe flex-end, safe left, safe right, unsafe left, unsafe right",
          },
        ],
      },

      // JustifySelf
      {
        code: "const styles = { justifySelf: 'invalid-justify-self' };",
        errors: [
          {
            message:
              "'justifySelf' has an invalid value 'invalid-justify-self'. Valid values: auto, normal, stretch, start, end, flex-start, flex-end, center, left, right, anchor-center, baseline, first baseline, last baseline",
          },
        ],
      },

      // ScrollSnapAlign
      {
        code: "const styles = { scrollSnapAlign: 'invalid-snap' };",
        errors: [
          {
            message:
              "'scrollSnapAlign' has an invalid value 'invalid-snap'. Valid values: none, start, end, center",
          },
        ],
      },

      // Translate
      {
        code: "const styles = { translate: 'invalid-translate' };",
        errors: [
          {
            message:
              "'translate' has an invalid value 'invalid-translate'. Valid values: none",
          },
        ],
      },

      // Transform
      {
        code: "const styles = { transform: 'invalid-transform' };",
        errors: [
          {
            message:
              "'transform' has an invalid value 'invalid-transform'. Valid values: none",
          },
        ],
      },

      // TransformOrigin
      {
        code: "const styles = { transformOrigin: 'invalid-origin' };",
        errors: [
          {
            message:
              "'transformOrigin' has an invalid value 'invalid-origin'. Valid values: ",
          },
        ],
      },

      // TextEmphasis
      {
        code: "const styles = { textEmphasis: 'invalid-emphasis' };",
        errors: [
          {
            message:
              "'textEmphasis' has an invalid value 'invalid-emphasis'. Valid values: none, filled, open, dot, circle, double-circle, triangle, sesame",
          },
        ],
      },

      // TextEmphasisStyle
      {
        code: "const styles = { textEmphasisStyle: 'invalid-style' };",
        errors: [
          {
            message:
              "'textEmphasisStyle' has an invalid value 'invalid-style'. Valid values: none, filled, open, dot, circle, double-circle, triangle, sesame",
          },
        ],
      },

      // TextEmphasisPosition
      {
        code: "const styles = { textEmphasisPosition: 'invalid-position' };",
        errors: [
          {
            message:
              "'textEmphasisPosition' has an invalid value 'invalid-position'. Valid values: auto, over, under",
          },
        ],
      },

      // ScrollSnapType
      {
        code: "const styles = { scrollSnapType: 'invalid-type' };",
        errors: [
          {
            message:
              "'scrollSnapType' has an invalid value 'invalid-type'. Valid values: none, x, y, block, inline, both",
          },
        ],
      },

      // MaskBorderRepeat
      {
        code: "const styles = { maskBorderRepeat: 'invalid-repeat' };",
        errors: [
          {
            message:
              "'maskBorderRepeat' has an invalid value 'invalid-repeat'. Valid values: stretch, repeat, round, space",
          },
        ],
      },

      // JustifyItems
      {
        code: "const styles = { justifyItems: 'invalid-justify-items' };",
        errors: [
          {
            message:
              "'justifyItems' has an invalid value 'invalid-justify-items'. Valid values: normal, stretch, start, end, flex-start, flex-end, center, left, right, anchor-center, baseline",
          },
        ],
      },

      // BackgroundRepeat
      {
        code: "const styles = { backgroundRepeat: 'invalid-repeat' };",
        errors: [
          {
            message:
              "'backgroundRepeat' has an invalid value 'invalid-repeat'. Valid values: repeat, repeat-x, repeat-y, space, round, no-repeat",
          },
        ],
      },

      // PlaceSelf
      {
        code: "const styles = { placeSelf: 'invalid invalid invalid' };",
        errors: [
          {
            message:
              "'placeSelf' has an invalid value 'invalid invalid invalid'. Valid values: ",
          },
        ],
      },

      // PlaceItems
      {
        code: "const styles = { placeItems: 'invalid invalid invalid' };",
        errors: [
          {
            message:
              "'placeItems' has an invalid value 'invalid invalid invalid'. Valid values: ",
          },
        ],
      },

      // PlaceContent
      {
        code: "const styles = { placeContent: 'invalid invalid invalid' };",
        errors: [
          {
            message:
              "'placeContent' has an invalid value 'invalid invalid invalid'. Valid values: ",
          },
        ],
      },

      // TextShadow
      {
        code: "const styles = { textShadow: 'invalid' };",
        errors: [
          {
            message:
              "'textShadow' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // TextIndent
      {
        code: "const styles = { textIndent: 'invalid' };",
        errors: [
          {
            message:
              "'textIndent' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // TextDecorationLine
      {
        code: "const styles = { textDecorationLine: 'underline underline' };",
        errors: [
          {
            message:
              "'textDecorationLine' has an invalid value 'underline underline'. Valid values: none, underline, overline, line-through, blink",
          },
        ],
      },
      {
        code: "const styles = { textDecorationLine: ' underline' };",
        errors: [
          {
            message:
              "'textDecorationLine' has an invalid value ' underline'. Valid values: none, underline, overline, line-through, blink",
          },
        ],
      },
      {
        code: "const styles = { textDecorationLine: 'underline ' };",
        errors: [
          {
            message:
              "'textDecorationLine' has an invalid value 'underline '. Valid values: none, underline, overline, line-through, blink",
          },
        ],
      },

      {
        code: "const styles = { textDecorationLine: 'underline invalid' };",
        errors: [
          {
            message:
              "'textDecorationLine' has an invalid value 'underline invalid'. Valid values: none, underline, overline, line-through, blink",
          },
        ],
      },
      {
        code: "const styles = { textDecorationLine: 'xyz' };",
        errors: [
          {
            message:
              "'textDecorationLine' has an invalid value 'xyz'. Valid values: none, underline, overline, line-through, blink",
          },
        ],
      },

      // StrokeMiterlimit
      {
        code: "const styles = { strokeMiterlimit: 'invalid' };",
        errors: [
          {
            message:
              "'strokeMiterlimit' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // StrokeDasharray
      {
        code: "const styles = { strokeDasharray: 'invalid' };",
        errors: [
          {
            message:
              "'strokeDasharray' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // Stroke
      {
        code: "const styles = { stroke: 'invalid' };",
        errors: [
          {
            message:
              "'stroke' has an invalid value 'invalid'. Valid values: context-stroke",
          },
        ],
      },

      // ShapeOutside
      {
        code: "const styles = { shapeOutside: 'invalid' };",
        errors: [
          {
            message:
              "'shapeOutside' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // ShapeImageThreshold
      {
        code: "const styles = { shapeImageThreshold: 'invalid' };",
        errors: [
          {
            message:
              "'shapeImageThreshold' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // ScrollbarColor
      {
        code: "const styles = { scrollbarColor: 'invalid' };",
        errors: [
          {
            message:
              "'scrollbarColor' has an invalid value 'invalid'. Valid values: auto",
          },
        ],
      },

      // ScrollPadding
      {
        code: "const styles = { scrollPadding: 'invalid' };",
        errors: [
          {
            message:
              "'scrollPadding' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // ScrollMargin
      {
        code: "const styles = { scrollMargin: 'invalid' };",
        errors: [
          {
            message:
              "'scrollMargin' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // Scale
      {
        code: "const styles = { scale: 'invalid' };",
        errors: [
          {
            message:
              "'scale' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // Rotate
      {
        code: "const styles = { rotate: 'invalid' };",
        errors: [
          {
            message:
              "'rotate' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // Quotes
      {
        code: "const styles = { quotes: 'invalid' };",
        errors: [
          {
            message:
              "'quotes' has an invalid value 'invalid'. Valid values: none, auto, match-parent",
          },
        ],
      },

      // PaintOrder
      {
        code: "const styles = { paintOrder: 'invalid' };",
        errors: [
          {
            message:
              "'paintOrder' has an invalid value 'invalid'. Valid values: normal",
          },
        ],
      },

      // OverscrollBehavior
      {
        code: "const styles = { overscrollBehavior: 'invalid' };",
        errors: [
          {
            message:
              "'overscrollBehavior' has an invalid value 'invalid'. Valid values: none, auto, contain",
          },
        ],
      },

      // OverflowClipMargin
      {
        code: "const styles = { overflowClipMargin: 'invalid' };",
        errors: [
          {
            message:
              "'overflowClipMargin' has an invalid value 'invalid'. Valid values: content-box, padding-box, border-box",
          },
        ],
      },

      // Overflow
      {
        code: "const styles = { overflow: 'invalid' };",
        errors: [
          {
            message:
              "'overflow' has an invalid value 'invalid'. Valid values: visible, hidden, clip, scroll, auto",
          },
        ],
      },

      // Offset
      {
        code: "const styles = { offset: 'invalid' };",
        errors: [
          {
            message: "'offset' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // OffsetPath
      {
        code: "const styles = { offsetPath: 'invalid' };",
        errors: [
          {
            message:
              "'offsetPath' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // OffsetRotate
      {
        code: "const styles = { offsetRotate: 'invalid' };",
        errors: [
          {
            message:
              "'offsetRotate' has an invalid value 'invalid'. Valid values: auto, reverse",
          },
        ],
      },

      // ObjectPosition
      {
        code: "const styles = { objectPosition: 'invalid' };",
        errors: [
          {
            message:
              "'objectPosition' has an invalid value 'invalid'. Valid values: top, bottom, left, right, center",
          },
        ],
      },

      // MathDepth
      {
        code: "const styles = { mathDepth: 'invalid' };",
        errors: [
          {
            message:
              "'mathDepth' has an invalid value 'invalid'. Valid values: auto-add",
          },
        ],
      },

      // Mask
      {
        code: "const styles = { mask: 'invalid' };",
        errors: [
          {
            message:
              "'mask' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // MaskBorder
      {
        code: "const styles = { maskBorder: 'invalid' };",
        errors: [
          {
            message:
              "'maskBorder' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // MaskSize
      {
        code: "const styles = { maskSize: 'invalid' };",
        errors: [
          {
            message:
              "'maskSize' has an invalid value 'invalid'. Valid values: cover, contain",
          },
        ],
      },

      // MaskRepeat
      {
        code: "const styles = { maskRepeat: 'invalid' };",
        errors: [
          {
            message:
              "'maskRepeat' has an invalid value 'invalid'. Valid values: repeat-x, repeat-y, repeat, space, round, no-repeat",
          },
        ],
      },

      // MaskPosition
      {
        code: "const styles = { maskPosition: 'invalid' };",
        errors: [
          {
            message:
              "'maskPosition' has an invalid value 'invalid'. Valid values: top, bottom, left, right, center",
          },
        ],
      },

      // MaskOrigin
      {
        code: "const styles = { maskOrigin: 'invalid' };",
        errors: [
          {
            message:
              "'maskOrigin' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // MaskMode
      {
        code: "const styles = { maskMode: 'invalid' };",
        errors: [
          {
            message:
              "'maskMode' has an invalid value 'invalid'. Valid values: alpha, luminance, match-source",
          },
        ],
      },

      // MaskComposite
      {
        code: "const styles = { maskComposite: 'invalid' };",
        errors: [
          {
            message:
              "'maskComposite' has an invalid value 'invalid'. Valid values: add, subtract, intersect, exclude",
          },
        ],
      },

      // MaskClip
      {
        code: "const styles = { maskClip: 'invalid' };",
        errors: [
          {
            message:
              "'maskClip' has an invalid value 'invalid'. Valid values: no-clip",
          },
        ],
      },

      // MaskBorderWidth
      {
        code: "const styles = { maskBorderWidth: 'invalid' };",
        errors: [
          {
            message:
              "'maskBorderWidth' has an invalid value 'invalid'. Valid values: auto",
          },
        ],
      },

      // MaskBorderSlice
      {
        code: "const styles = { maskBorderSlice: 'invalid' };",
        errors: [
          {
            message:
              "'maskBorderSlice' has an invalid value 'invalid'. Valid values: fill",
          },
        ],
      },

      // MaskBorderOutset
      {
        code: "const styles = { maskBorderOutset: 'invalid' };",
        errors: [
          {
            message:
              "'maskBorderOutset' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // Marker
      {
        code: "const styles = { marker: 'invalid' };",
        errors: [
          {
            message:
              "'marker' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // MarginBlock
      {
        code: "const styles = { marginBlock: 'invalid' };",
        errors: [
          {
            message:
              "'marginBlock' has an invalid value 'invalid'. Valid values: auto",
          },
        ],
      },

      // InsetBlock
      {
        code: "const styles = { insetBlock: 'invalid' };",
        errors: [
          {
            message:
              "'insetBlock' has an invalid value 'invalid'. Valid values: auto",
          },
        ],
      },

      // InitialLetter
      {
        code: "const styles = { initialLetter: 'invalid' };",
        errors: [
          {
            message:
              "'initialLetter' has an invalid value 'invalid'. Valid values: normal",
          },
        ],
      },

      // ImageOrientation
      {
        code: "const styles = { imageOrientation: 'invalid' };",
        errors: [
          {
            message:
              "'imageOrientation' has an invalid value 'invalid'. Valid values: none, from-image",
          },
        ],
      },

      // HyphenateLimitChars
      {
        code: "const styles = { hyphenateLimitChars: 'invalid' };",
        errors: [
          {
            message:
              "'hyphenateLimitChars' has an invalid value 'invalid'. Valid values: auto",
          },
        ],
      },

      // Grid
      {
        code: "const styles = { grid: 'invalid invalid invalid' };",
        errors: [
          {
            message:
              "'grid' has an invalid value 'invalid invalid invalid'. Valid values: none",
          },
        ],
      },

      // GridTemplate
      {
        code: "const styles = { gridTemplate: 'invalid invalid' };",
        errors: [
          {
            message:
              "'gridTemplate' has an invalid value 'invalid invalid'. Valid values: none",
          },
        ],
      },

      // GridTemplateColumns
      {
        code: "const styles = { gridTemplateColumns: 'invalid' };",
        errors: [
          {
            message:
              "'gridTemplateColumns' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // GridTemplateAreas
      {
        code: "const styles = { gridTemplateAreas: 'invalid' };",
        errors: [
          {
            message:
              "'gridTemplateAreas' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // GridAutoColumns
      {
        code: "const styles = { gridAutoColumns: 'invalid' };",
        errors: [
          {
            message:
              "'gridAutoColumns' has an invalid value 'invalid'. Valid values: auto",
          },
        ],
      },

      // FontFeatureSettings
      {
        code: "const styles = { fontFeatureSettings: 'invalid' };",
        errors: [
          {
            message:
              "'fontFeatureSettings' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // FontVariant
      {
        code: "const styles = { fontVariant: 'invalid' };",
        errors: [
          {
            message:
              "'fontVariant' has an invalid value 'invalid'. Valid values: normal, none",
          },
        ],
      },

      // FontVariationSettings
      {
        code: "const styles = { fontVariationSettings: 'invalid' };",
        errors: [
          {
            message:
              '\'fontVariationSettings\' has an invalid value \'invalid\'. Valid values: normal, "wght", "wdth", "slnt", "ital", "opsz"',
          },
        ],
      },

      // FontVariantNumeric
      {
        code: "const styles = { fontVariantNumeric: 'invalid' };",
        errors: [
          {
            message:
              "'fontVariantNumeric' has an invalid value 'invalid'. Valid values: normal",
          },
        ],
      },

      // FontVariantLigatures
      {
        code: "const styles = { fontVariantLigatures: 'invalid' };",
        errors: [
          {
            message:
              "'fontVariantLigatures' has an invalid value 'invalid'. Valid values: none, normal",
          },
        ],
      },

      // FontVariantEastAsian
      {
        code: "const styles = { fontVariantEastAsian: 'jis78 jis83' };",
        errors: [
          {
            message:
              "'fontVariantEastAsian' has an invalid value 'jis78 jis83'. Valid values: normal, ruby, jis78, jis83, jis90, jis04, simplified, traditional, full-width, proportional-width",
          },
        ],
      },
      {
        code: "const styles = { fontVariantEastAsian: 'invalid-value' };",
        errors: [
          {
            message:
              "'fontVariantEastAsian' has an invalid value 'invalid-value'. Valid values: normal, ruby, jis78, jis83, jis90, jis04, simplified, traditional, full-width, proportional-width",
          },
        ],
      },

      // FontVariantAlternates
      {
        code: "const styles = { fontVariantAlternates: 'invalid' };",
        errors: [
          {
            message:
              "'fontVariantAlternates' has an invalid value 'invalid'. Valid values: normal, historical-forms",
          },
        ],
      },

      // FontSynthesis
      {
        code: "const styles = { fontSynthesis: 'invalid' };",
        errors: [
          {
            message:
              "'fontSynthesis' has an invalid value 'invalid'. Valid values: none, weight, style, small-caps, position",
          },
        ],
      },

      // FontStyle
      {
        code: "const styles = { fontStyle: 'invalid' };",
        errors: [
          {
            message:
              "'fontStyle' has an invalid value 'invalid'. Valid values: normal, italic, oblique",
          },
        ],
      },

      // FontPalette
      {
        code: "const styles = { fontPalette: 'invalid' };",
        errors: [
          {
            message:
              "'fontPalette' has an invalid value 'invalid'. Valid values: normal, light, dark",
          },
        ],
      },

      // FontSizeAdjust
      {
        code: "const styles = { fontSizeAdjust: 'invalid invalid invalid' };",
        errors: [
          {
            message:
              "'fontSizeAdjust' has an invalid value 'invalid invalid invalid'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { fontSizeAdjust: 'ex-height invalid' };",
        errors: [
          {
            message:
              "'fontSizeAdjust' has an invalid value 'ex-height invalid'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { fontSizeAdjust: 'invalid 0.5' };",
        errors: [
          {
            message:
              "'fontSizeAdjust' has an invalid value 'invalid 0.5'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { fontSizeAdjust: '' };",
        errors: [
          {
            message:
              "'fontSizeAdjust' has an invalid value ''. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { fontSizeAdjust: 'ex-height cap-height 0.5' };",
        errors: [
          {
            message:
              "'fontSizeAdjust' has an invalid value 'ex-height cap-height 0.5'. Valid values: none",
          },
        ],
      },

      // FontStretch
      {
        code: "const styles = { fontStretch: 'invalid' };",
        errors: [
          {
            message:
              "'fontStretch' has an invalid value 'invalid'. Valid values: normal, ultra-condensed, extra-condensed, condensed, semi-condensed, semi-expanded, expanded, extra-expanded, ultra-expanded",
          },
        ],
      },

      // Flex invalid cases
      {
        code: "const styles = { flex: 'invalid' };",
        errors: [
          {
            message:
              "'flex' has an invalid value 'invalid'. Valid values: none",
          },
        ],
      },

      // Cursor invalid cases
      {
        code: "const styles = { cursor: 'invalid' };",
        errors: [
          {
            message:
              "'cursor' has an invalid value 'invalid'. Valid values: auto",
          },
        ],
      },

      // Content
      {
        code: "const styles = { content: 'invalid' };",
        errors: [
          {
            message:
              "'content' has an invalid value 'invalid'. Valid values: open-quote, close-quote, no-open-quote, no-close-quote, normal, none",
          },
        ],
      },

      // Columns
      {
        code: "const styles = { columns: 'invalid invalid invalid' };",
        errors: [
          {
            message:
              "'columns' has an invalid value 'invalid invalid invalid'. Valid values: ",
          },
        ],
      },

      // ClipPath
      {
        code: "const styles = { clipPath: 'invalid' };",
        errors: [
          {
            message:
              "'clipPath' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // BoxShadow
      {
        code: "const styles = { boxShadow: 'invalid' };",
        errors: [
          {
            message:
              "'boxShadow' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // BackgroundAttachment
      {
        code: "const styles = { backgroundAttachment: 'invalid' };",
        errors: [
          {
            message:
              "'backgroundAttachment' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // BackgroundOrigin
      {
        code: "const styles = { backgroundOrigin: 'invalid' };",
        errors: [
          {
            message:
              "'backgroundOrigin' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // BackgroundPositionY
      {
        code: "const styles = { backgroundPositionY: 'invalid' };",
        errors: [
          {
            message:
              "'backgroundPositionY' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // ColumnCount
      {
        code: "const styles = { columnCount: 'invalid' };",
        errors: [
          {
            message:
              "'columnCount' has an invalid value 'invalid'. Valid values: auto",
          },
        ],
      },

      // FlexGrow
      {
        code: "const styles = { flexGrow: 'invalid' };",
        errors: [
          {
            message:
              "'flexGrow' has an invalid value 'invalid'. Valid values: ",
          },
        ],
      },

      // Padding too many values
      {
        code: "const styles = { padding: '10px 20px 30px 40px 50px' };",
        errors: [
          {
            message:
              "'padding' has an invalid value '10px 20px 30px 40px 50px'. Valid values: ",
          },
        ],
      },

      // FontLanguageOverride
      {
        code: "const styles = { fontLanguageOverride: 'invalid' };",
        errors: [
          {
            message:
              "'fontLanguageOverride' has an invalid value 'invalid'. Valid values: normal",
          },
        ],
      },
    ],
  },
);
