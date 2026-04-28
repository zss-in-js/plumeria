import { RuleTester } from 'eslint';
import { validateValues } from '../../src/rules/validate-values';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
  },
});

ruleTester.run('validate-values', validateValues, {
  valid: [
    // Basic keywords
    {
      code: `import { create } from '@plumeria/core'; const styles = create({ s: { color: 'red' } });`,
    },
    {
      code: `import { keyframes } from '@plumeria/core'; const anim = keyframes({ s: { color: 'red' } });`,
    },
    {
      code: `import { viewTransition } from '@plumeria/core'; const vt = viewTransition({ s: { color: 'red' } });`,
    },
    {
      code: `import plumeria from '@plumeria/core'; const styles = plumeria.create({ s: { color: 'red' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { 'color': 'red' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { color: myVar } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { color: /abc/ } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { position: 'absolute' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { display: 'flex' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overflow: 'scroll auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationIterationCount: '1' } });`,
    },

    // Length & Color
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSize: '1.5em' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { color: '#f00' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderColor: 'red blue' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { margin: '10px 20px' } });`,
    },

    // Shorthand & Complex
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { border: '1px solid red' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { background: 'red' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { filter: 'blur(5px)' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transition: 'width 2s ease-in-out' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '1 1 auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '1 2 auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '1 2 10px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '2 1' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '2 1px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flexFlow: 'row wrap' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animation: 'slidein 3s ease' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { grid: '1fr / 1fr' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transform: 'translateX(10px)' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { cursor: 'url(hand.cur), auto' } });`,
    },

    // Global values & CSS Vars
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { color: 'inherit' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { color: 'var(--my-color)' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderStyle: 'none' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderRadius: '10px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { opacity: '0.5' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskImage: 'none' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderImageSlice: 'inherit' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderImage: 'none' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { aspectRatio: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transitionDuration: '0.2s' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationDirection: 'normal' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationFillMode: 'none' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationPlayState: 'paused' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationIterationCount: 'inherit' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationTimingFunction: 'inherit' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundSize: 'cover' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundClip: 'initial' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundPosition: 'top' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundImage: 'none' } });`,
    },

    // isFitContentGroup for test
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { width: 'fit-content(100px)' } });`,
    },

    // isNumber for test
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { lineHeight: '1.5' } });`,
    },

    // isBorderWidth for test
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderWidth: 'thin' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderWidth: 'medium' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderWidth: 'thick' } });`,
    },

    // Translate valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { translate: '10px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { translate: '10px 20px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { translate: '10px 20px 30px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { translate: '50%' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { translate: 'none' } });`,
    },

    // Transform valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transform: 'rotate(45deg)' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transform: 'scale(1.5)' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transform: 'none' } });`,
    },

    // TransformOrigin valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transformOrigin: 'center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transformOrigin: 'top left' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transformOrigin: '50% 50%' } });`,
    },

    // TextEmphasis valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasis: 'filled' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasis: 'filled red' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasis: 'dot' } });`,
    },

    // TextEmphasisStyle valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasisStyle: 'dot' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasisStyle: 'filled circle' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasisStyle: '"x"' } });`,
    },

    // TextEmphasisPosition valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasisPosition: 'over' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasisPosition: 'over right' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasisPosition: 'under left' } });`,
    },

    // ScrollSnapType valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollSnapType: 'x' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollSnapType: 'y mandatory' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollSnapType: 'both proximity' } });`,
    },

    // ScrollSnapAlign valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollSnapAlign: 'start' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollSnapAlign: 'center end' } });`,
    },

    // MaskBorderRepeat valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderRepeat: 'stretch' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderRepeat: 'repeat round' } });`,
    },

    // JustifyItems valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifyItems: 'center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifyItems: 'safe center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifyItems: 'legacy center' } });`,
    },

    // JustifySelf valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifySelf: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifySelf: 'safe center' } });`,
    },

    // JustifyContent valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifyContent: 'space-between' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifyContent: 'safe center' } });`,
    },

    // HangingPunctuation valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { hangingPunctuation: 'first' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { hangingPunctuation: 'first force-end' } });`,
    },

    // FlexFlow valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flexFlow: 'column wrap' } });`,
    },

    // BackgroundRepeat valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundRepeat: 'repeat-x' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundRepeat: 'no-repeat' } });`,
    },

    // PlaceSelf valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeSelf: 'center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeSelf: 'start end' } });`,
    },

    // PlaceItems valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeItems: 'center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeItems: 'start end' } });`,
    },

    // PlaceContent valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeContent: 'center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeContent: 'space-between' } });`,
    },

    // Display multi-keyword valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { display: 'inline flex' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { display: 'list-item block' } });`,
    },

    // AlignItems valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignItems: 'safe center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignItems: 'first baseline' } });`,
    },

    // AlignSelf valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignSelf: 'safe center' } });`,
    },

    // AlignContent valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignContent: 'safe center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignContent: 'first baseline' } });`,
    },

    // TouchAction valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { touchAction: 'pan-x' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { touchAction: 'pan-y pinch-zoom' } });`,
    },

    // TextShadow valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textShadow: '2px 2px 4px black' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textShadow: 'red 2px 2px 4px' } });`,
    },

    // TextIndent valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textIndent: '2em' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textIndent: '2em hanging' } });`,
    },

    // TextDecorationLine valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: 'underline' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: 'underline overline' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: 'var(--decoration)' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: 'underline var(--decoration)' } });`,
    },

    // StrokeMiterlimit valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { strokeMiterlimit: '4' } });`,
    },

    // StrokeDasharray valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { strokeDasharray: '5, 10' } });`,
    },

    // Stroke valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { stroke: 'red' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { stroke: 'url(#gradient)' } });`,
    },

    // ShapeOutside valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { shapeOutside: 'circle(50%)' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { shapeOutside: 'margin-box' } });`,
    },

    // ShapeImageThreshold valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { shapeImageThreshold: '0.5' } });`,
    },

    // ScrollbarColor valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollbarColor: 'red blue' } });`,
    },

    // ScrollPadding valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollPadding: '10px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollPadding: '10px 20px' } });`,
    },

    // ScrollMargin valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollMargin: '10px' } });`,
    },

    // Scale valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scale: '1.5' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scale: '1.5 2' } });`,
    },

    // Rotate valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { rotate: '45deg' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { rotate: 'x 45deg' } });`,
    },

    // Quotes valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { quotes: '"«" "»"' } });`,
    },

    // PaintOrder valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { paintOrder: 'fill' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { paintOrder: 'stroke fill' } });`,
    },

    // OverscrollBehavior valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overscrollBehavior: 'contain' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overscrollBehavior: 'auto contain' } });`,
    },

    // OverflowClipMargin valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overflowClipMargin: '10px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overflowClipMargin: 'border-box' } });`,
    },

    // Overflow valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overflow: 'hidden' } });`,
    },

    // Offset valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { offset: 'path("M 0 0 L 100 100")' } });`,
    },

    // OffsetPath valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { offsetPath: 'path("M 0 0 L 100 100")' } });`,
    },

    // OffsetRotate valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { offsetRotate: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { offsetRotate: '45deg' } });`,
    },

    // LengthPosition properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { objectPosition: 'center' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { objectPosition: '50% 50%' } });`,
    },

    // MathDepth valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { mathDepth: '2' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { mathDepth: 'add(1)' } });`,
    },

    // Mask valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { mask: 'url(mask.png)' } });`,
    },

    // MaskBorder valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorder: 'url(border.png)' } });`,
    },

    // MaskSize valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskSize: 'cover' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskSize: '100px 200px' } });`,
    },

    // MaskRepeat valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskRepeat: 'repeat' } });`,
    },

    // MaskPosition valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskPosition: 'center' } });`,
    },

    // MaskOrigin valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskOrigin: 'border-box' } });`,
    },

    // MaskMode valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskMode: 'alpha' } });`,
    },

    // MaskComposite valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskComposite: 'add' } });`,
    },

    // MaskClip valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskClip: 'border-box' } });`,
    },

    // MaskBorderWidth valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderWidth: '10px' } });`,
    },

    // MaskBorderSlice valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderSlice: '10' } });`,
    },

    // MaskBorderOutset valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderOutset: '10px' } });`,
    },

    // Marker properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { marker: 'url(#marker)' } });`,
    },

    // MarginPair properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { marginBlock: '10px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { marginBlock: '10px 20px' } });`,
    },

    // InsetPair properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { insetBlock: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { insetBlock: '10px 20px' } });`,
    },

    // InitialLetter valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { initialLetter: '3' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { initialLetter: '3 drop' } });`,
    },

    // ImageOrientation valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { imageOrientation: 'from-image' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { imageOrientation: '90deg' } });`,
    },

    // HyphenateLimitChars valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { hyphenateLimitChars: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { hyphenateLimitChars: '5 2 3' } });`,
    },

    // Grid valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { grid: 'auto-flow / 1fr' } });`,
    },

    // GridTemplate valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { gridTemplate: '1fr / 1fr' } });`,
    },

    // GridTemplateColumns/Rows valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { gridTemplateColumns: '1fr 2fr' } });`,
    },

    // GridTemplateAreas valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { gridTemplateAreas: '"header header"' } });`,
    },

    // GridAutoColumns/Rows valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { gridAutoColumns: 'auto' } });`,
    },

    // FontFeatureSettings valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontFeatureSettings: '"liga" on' } });`,
    },

    // FontVariant valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariant: 'small-caps' } });`,
    },

    // FontLanguageOverride valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontLanguageOverride: 'normal' } });`,
    },

    // FontVariationSettings valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariationSettings: '"wght" 700' } });`,
    },

    // FontVariantNumeric valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantNumeric: 'lining-nums' } });`,
    },

    // FontVariantLigatures valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantLigatures: 'common-ligatures' } });`,
    },

    // FontVariantEastAsian valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantEastAsian: 'jis78' } });`,
    },

    // FontVariantAlternates valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantAlternates: 'historical-forms' } });`,
    },

    // FontSynthesis valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSynthesis: 'weight' } });`,
    },

    // FontStyle valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontStyle: 'oblique 10deg' } });`,
    },

    // FontPalette valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontPalette: 'light' } });`,
    },

    // FontSizeAdjust valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSizeAdjust: '0.5' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSizeAdjust: 'ex-height 0.5' } });`,
    },

    // FontStretch valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontStretch: '50%' } });`,
    },

    // Flex valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '1' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '1 1' } });`,
    },

    // Cursor valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { cursor: 'pointer' } });`,
    },

    // Content valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { content: '"text"' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { content: 'url(image.png)' } });`,
    },

    // Columns valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { columns: '100px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { columns: '3' } });`,
    },

    // ClipPath valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { clipPath: 'circle(50%)' } });`,
    },

    // BoxShadow valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { boxShadow: '2px 2px 4px black' } });`,
    },

    // BackgroundAttachment valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundAttachment: 'fixed' } });`,
    },

    // BackgroundBlendMode valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundBlendMode: 'multiply' } });`,
    },

    // BackgroundOrigin valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundOrigin: 'border-box' } });`,
    },

    // BackgroundPosition quad valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundPosition: 'left 10px top 20px' } });`,
    },

    // BackgroundSize pair valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundPositionY: 'top, bottom' } });`,
    },

    // Filter valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { filter: 'brightness(1.5)' } });`,
    },

    // AnimationTimingFunction valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationTimingFunction: 'ease-in-out' } });`,
    },

    // AspectRatio valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { aspectRatio: '16 / 9' } });`,
    },

    // Border valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { border: 'var(--border-width)' } });`,
    },

    // BorderImage valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderImage: 'url(border.png) 30' } });`,
    },

    // BorderImageSlice valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderImageSlice: '30 fill' } });`,
    },

    // ImageSource properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { listStyleImage: 'url(bullet.png)' } });`,
    },

    // Border properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderTop: 'thin solid red' } });`,
    },

    // SingleColor properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { accentColor: 'blue' } });`,
    },

    // BorderColor valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderColor: 'red blue green yellow' } });`,
    },

    // Integer group properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { columnCount: '3' } });`,
    },

    // Other group properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flexGrow: '2' } });`,
    },

    // LengthValue properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { width: '100px' } });`,
    },

    // BorderRadius valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderRadius: '10px / 20px' } });`,
    },

    // BorderStyle valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderStyle: 'solid dashed' } });`,
    },

    // MultipleValue properties valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { padding: '10px 20px 30px 40px' } });`,
    },

    // ============================================
    // New Property Valid Tests
    // ============================================

    // Fill valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fill: 'none' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fill: 'currentColor' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fill: 'red' } });`,
    },

    // FillOpacity valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fillOpacity: '0.5' } });`,
    },

    // FillRule valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fillRule: 'nonzero' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fillRule: 'evenodd' } });`,
    },

    // AlignmentBaseline valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignmentBaseline: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignmentBaseline: 'middle' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignmentBaseline: 'mathematical' } });`,
    },

    // DominantBaseline valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { dominantBaseline: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { dominantBaseline: 'central' } });`,
    },

    // BaselineShift valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { baselineShift: 'baseline' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { baselineShift: 'sub' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { baselineShift: '10px' } });`,
    },

    // ShapeMargin valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { shapeMargin: '10px' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { shapeMargin: '50%' } });`,
    },

    // ContainerType valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { containerType: 'size' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { containerType: 'inline-size' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { containerType: 'normal' } });`,
    },

    // ContentVisibility valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { contentVisibility: 'visible' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { contentVisibility: 'hidden' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { contentVisibility: 'auto' } });`,
    },

    // Direction valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { direction: 'ltr' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { direction: 'rtl' } });`,
    },

    // ForcedColorAdjust valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { forcedColorAdjust: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { forcedColorAdjust: 'none' } });`,
    },

    // Contain valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { contain: 'none' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { contain: 'strict' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { contain: 'content' } });`,
    },

    // TextSizeAdjust valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textSizeAdjust: 'none' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textSizeAdjust: 'auto' } });`,
    },

    // ColorInterpolation valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { colorInterpolation: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { colorInterpolation: 'sRGB' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { colorInterpolation: 'linearRGB' } });`,
    },

    // ColorInterpolationFilters valid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { colorInterpolationFilters: 'auto' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { colorInterpolationFilters: 'sRGB' } });`,
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { colorInterpolationFilters: 'linearRGB' } });`,
    },

    // Number value accepted for length property (not rejected)
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { zIndex: 10 } });`,
    },
    {
      // Computed member access
      code: 'import * as css from "@plumeria/core"; css["create"]({ s: { color: "red" } });',
    },
    {
      // String literal import
      code: 'import { "create" as c } from "@plumeria/core"; c({ s: { color: "red" } });',
    },
    {
      // Non-Identifier object in MemberExpression
      code: 'import * as css from "@plumeria/core"; (function(){ return css; })().create({ s: { color: "red" } });',
    },
    {
      // Non-Identifier callee
      code: 'import * as css from "@plumeria/core"; (function(){})()',
    },
    {
      // Non-ObjectExpression argument
      code: 'import { create } from "@plumeria/core"; create(arg);',
    },
    {
      // Non-Plumeria import
      code: 'import * as other from "other"; other.create({ s: { color: "red" } });',
    },
    {
      // Another non-Plumeria import specifier
      code: 'import { create } from "other"; create({ s: { color: "red" } });',
    },
    {
      // Non-CSS member access
      code: 'import * as css from "@plumeria/core"; css.somethingElse();',
    },
    {
      // Empty color value to hit splitColorValues edge case
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ s: { borderColor: " " } });',
    },
    {
      // No arguments
      code: 'import { create } from "@plumeria/core"; create();',
    },
    {
      // Multiple arguments
      code: 'import { create } from "@plumeria/core"; create({}, {});',
    },
    {
      // Non-Identifier object in MemberExpression
      code: 'import * as css from "@plumeria/core"; (css).create({});',
    },
    {
      // No imports at all
      code: 'const x = someFunc();',
    },
    {
      // Spread element in style object
      code: 'import { create } from "@plumeria/core"; create({ s: { ...spread } });',
    },
    // Coverage for !isCssProperties (no import)
    { code: `create({ s: { color: 'red' } });` },
    // Coverage for prop.value.type !== 'ObjectExpression' in create call
    { code: `import { create } from '@plumeria/core'; create({ s: 1 });` },
    // Coverage for stringNameProperties branch
    {
      code: `import { create } from '@plumeria/core'; create({ s: { animationName: 'myAnim', fontFamily: 'Arial' } });`,
    },
    // Coverage for compted property branch
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { ['color']: {} } });`,
    },
    {
      code: `
    import * as css from '@plumeria/core';
    css.create({
      testClass: {
        border: 'var(--my-border-width) var(--my-border-style)',
        outline: 'var(--outline-w) var(--outline-s) var(--outline-c)',
        borderTop: 'var(--bw, 1px) var(--bs, solid)',
      }
    });
  `,
    },
  ],

  invalid: [
    // Inline object at second level
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { wrapper: { color: { valueOf() { return 'hello'; } } } } });`,
      errors: [
        {
          message:
            "'color' cannot be assigned a object value (object). CSS properties require string or number values.",
        },
      ],
    },

    // Position
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { position: 'center' } });`,
      errors: [
        {
          message:
            "'position' has an invalid value 'center'. Valid values: static, relative, absolute, fixed, sticky",
        },
      ],
    },

    // ZIndex
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { zIndex: 'high' } });`,
      errors: [
        {
          message: "'zIndex' has an invalid value 'high'. Valid values: auto",
        },
      ],
    },

    // Display
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { display: 'foo' } });`,
      errors: [
        {
          message:
            "'display' has an invalid value 'foo'. Valid values: block, inline, run-in, flow, flow-root, table, flex, grid, ruby, math, table-header-group, table-footer-group, table-row, table-row-group, table-cell, table-column-group, table-column, table-caption, ruby-base, ruby-text, ruby-base-container, ruby-text-container, contents, none, inline-block, inline-table, inline-flex, inline-grid, inline-list-item",
        },
      ],
    },

    // Flex
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '' } });`,
      errors: [
        {
          message: "'flex' has an invalid value ''. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: 'auto 2' } });`,
      errors: [
        {
          message: "'flex' has an invalid value 'auto 2'. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '10px 1' } });`,
      errors: [
        {
          message: "'flex' has an invalid value '10px 1'. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: 'auto 2 10px' } });`,
      errors: [
        {
          message:
            "'flex' has an invalid value 'auto 2 10px'. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '1 auto 10px' } });`,
      errors: [
        {
          message:
            "'flex' has an invalid value '1 auto 10px'. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: 'auto auto 10px' } });`,
      errors: [
        {
          message:
            "'flex' has an invalid value 'auto auto 10px'. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '1 2 invalid' } });`,
      errors: [
        {
          message:
            "'flex' has an invalid value '1 2 invalid'. Valid values: none",
        },
      ],
    },

    // Color
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { color: 'invalid-color' } });`,
      errors: [
        {
          message:
            "'color' has an invalid value 'invalid-color'. Valid values: ",
        },
      ],
    },

    // Margin
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { margin: '10px 20px 30px 40px 50px' } });`,
      errors: [
        {
          message:
            "'margin' has an invalid value '10px 20px 30px 40px 50px'. Valid values: auto",
        },
      ],
    },

    // Border
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { border: '1px solid red blue' } });`,
      errors: [
        {
          message:
            "'border' has an invalid value '1px solid red blue'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
        },
      ],
    },
    // Check for duplicate width
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { border: '1px 2em solid' } });`,
      errors: [
        {
          message:
            "'border' has an invalid value '1px 2em solid'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
        },
      ],
    },
    // Check for duplicate styles
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { border: 'solid dashed 1px' } });`,
      errors: [
        {
          message:
            "'border' has an invalid value 'solid dashed 1px'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
        },
      ],
    },

    // Check for duplicate colors
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { border: 'red blue solid' } });`,
      errors: [
        {
          message:
            "'border' has an invalid value 'red blue solid'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { border: 'var(--custom) invalid-value' } });`,
      errors: [
        {
          message:
            "'border' has an invalid value 'var(--custom) invalid-value'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { border: 'invalid-value' } });`,
      errors: [
        {
          message:
            "'border' has an invalid value 'invalid-value'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
        },
      ],
    },

    // Background
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { background: 'url(/foo.png) no-repeat extra' } });`,
      errors: [
        {
          message:
            "'background' has an invalid value 'url(/foo.png) no-repeat extra'. Valid values: none",
        },
      ],
    },

    // Flex
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: '1 1 auto 0' } });`,
      errors: [
        {
          message:
            "'flex' has an invalid value '1 1 auto 0'. Valid values: none",
        },
      ],
    },

    // animationIterationCount invalid case
    {
      code: `import { create } from '@plumeria/core'; create({ s: { animationIterationCount: 'invalid' } });`,
      errors: [
        {
          message:
            "'animationIterationCount' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // animationName invalid case (empty string)
    {
      code: `import { create } from '@plumeria/core'; create({ s: { animationName: '' } });`,
      errors: [
        {
          message:
            "'animationName' has an invalid value ''. Valid values: none, slide, bounce",
        },
      ],
    },

    // Transform
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transform: 'translateX(10px) wrong' } });`,
      errors: [
        {
          message:
            "'transform' has an invalid value 'translateX(10px) wrong'. Valid values: none",
        },
      ],
    },

    // Cursor
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { cursor: 'url(hand.cur), auto, pointer' } });`,
      errors: [
        {
          message:
            "'cursor' has an invalid value 'url(hand.cur), auto, pointer'. Valid values: auto",
        },
      ],
    },

    // BorderStyle
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderStyle: 'nones' } });`,
      errors: [
        {
          message:
            "'borderStyle' has an invalid value 'nones'. Valid values: none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
        },
      ],
    },

    // BorderRadius
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderRadius: 'nones' } });`,
      errors: [
        {
          message:
            "'borderRadius' has an invalid value 'nones'. Valid values: ",
        },
      ],
    },

    // Width
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { width: 'none' } });`,
      errors: [
        {
          message:
            "'width' has an invalid value 'none'. Valid values: auto, stretch, max-content, min-content, fit-content",
        },
      ],
    },

    // Opacity
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { opacity: 'none' } });`,
      errors: [
        { message: "'opacity' has an invalid value 'none'. Valid values: " },
      ],
    },

    // BorderColor
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderColor: 'red green white blue orange' } });`,
      errors: [
        {
          message:
            "'borderColor' has an invalid value 'red green white blue orange'. Valid values: ",
        },
      ],
    },

    // MaskImage
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskImage: 'nones' } });`,
      errors: [
        {
          message:
            "'maskImage' has an invalid value 'nones'. Valid values: none",
        },
      ],
    },

    // BorderImageSlice
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderImageSlice: 'inherits' } });`,
      errors: [
        {
          message:
            "'borderImageSlice' has an invalid value 'inherits'. Valid values: fill",
        },
      ],
    },

    // BorderImage
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { borderImage: 'nones' } });`,
      errors: [
        {
          message:
            "'borderImage' has an invalid value 'nones'. Valid values: none",
        },
      ],
    },

    // AspectRatio
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { aspectRatio: 'autos' } });`,
      errors: [
        {
          message:
            "'aspectRatio' has an invalid value 'autos'. Valid values: auto",
        },
      ],
    },

    // TransitionDuration
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transitionDuration: 'none' } });`,
      errors: [
        {
          message:
            "'transitionDuration' has an invalid value 'none'. Valid values: ",
        },
      ],
    },

    // AnimationDirection
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationDirection: 'normals' } });`,
      errors: [
        {
          message:
            "'animationDirection' has an invalid value 'normals'. Valid values: ",
        },
      ],
    },

    // AnimationFillMode
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationFillMode: 'nones' } });`,
      errors: [
        {
          message:
            "'animationFillMode' has an invalid value 'nones'. Valid values: ",
        },
      ],
    },

    // AnimationPlayState
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationPlayState: 'pauseds' } });`,
      errors: [
        {
          message:
            "'animationPlayState' has an invalid value 'pauseds'. Valid values: ",
        },
      ],
    },

    // AnimationTimingFunction
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { animationTimingFunction: 'inherits' } });`,
      errors: [
        {
          message:
            "'animationTimingFunction' has an invalid value 'inherits'. Valid values: ",
        },
      ],
    },

    // BackgroundSize
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundSize: 'none' } });`,
      errors: [
        {
          message:
            "'backgroundSize' has an invalid value 'none'. Valid values: auto, cover, contain",
        },
      ],
    },

    // BackgroundClip
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundClip: 'initials' } });`,
      errors: [
        {
          message:
            "'backgroundClip' has an invalid value 'initials'. Valid values: text, border-area",
        },
      ],
    },

    // Filter
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { filter: 'nones' } });`,
      errors: [
        {
          message: "'filter' has an invalid value 'nones'. Valid values: none",
        },
      ],
    },

    // BackgroundPosition
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundPosition: 'tops' } });`,
      errors: [
        {
          message:
            "'backgroundPosition' has an invalid value 'tops'. Valid values: ",
        },
      ],
    },

    // BackgroundImage
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundImage: 'nones' } });`,
      errors: [
        {
          message:
            "'backgroundImage' has an invalid value 'nones'. Valid values: none",
        },
      ],
    },

    // BackgroundBlendMode
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundBlendMode: 'colors' } });`,
      errors: [
        {
          message:
            "'backgroundBlendMode' has an invalid value 'colors'. Valid values: ",
        },
      ],
    },

    // TouchAction
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { touchAction: 'invalid-action' } });`,
      errors: [
        {
          message:
            "'touchAction' has an invalid value 'invalid-action'. Valid values: auto, none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { touchAction: 'pan-x pan-x' } });`,
      errors: [
        {
          message:
            "'touchAction' has an invalid value 'pan-x pan-x'. Valid values: auto, none",
        },
      ],
    },

    // AlignContent
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignContent: 'invalid-align' } });`,
      errors: [
        {
          message:
            "'alignContent' has an invalid value 'invalid-align'. Valid values: normal, start, center, end, flex-start, flex-end, baseline, space-between, space-around, space-evenly, stretch",
        },
      ],
    },

    // AlignItems
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignItems: 'invalid-item' } });`,
      errors: [
        {
          message:
            "'alignItems' has an invalid value 'invalid-item'. Valid values: normal, stretch, center, start, end, flex-start, flex-end, self-start, self-end, anchor-center, baseline",
        },
      ],
    },

    // AlignSelf
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignSelf: 'invalid-self' } });`,
      errors: [
        {
          message:
            "'alignSelf' has an invalid value 'invalid-self'. Valid values: auto, normal, stretch, center, start, end, flex-start, flex-end, self-start, self-end, anchor-center, baseline",
        },
      ],
    },

    // Display invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { display: 'invalid-display' } });`,
      errors: [
        {
          message:
            "'display' has an invalid value 'invalid-display'. Valid values: block, inline, run-in, flow, flow-root, table, flex, grid, ruby, math, table-header-group, table-footer-group, table-row, table-row-group, table-cell, table-column-group, table-column, table-caption, ruby-base, ruby-text, ruby-base-container, ruby-text-container, contents, none, inline-block, inline-table, inline-flex, inline-grid, inline-list-item",
        },
      ],
    },

    // FlexFlow
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flexFlow: 'invalid-flow' } });`,
      errors: [
        {
          message:
            "'flexFlow' has an invalid value 'invalid-flow'. Valid values: row, row-reverse, column, column-reverse, nowrap, wrap, wrap-reverse",
        },
      ],
    },

    // HangingPunctuation
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { hangingPunctuation: 'invalid-punctuation' } });`,
      errors: [
        {
          message:
            "'hangingPunctuation' has an invalid value 'invalid-punctuation'. Valid values: none, first, last, allow-end, force-end",
        },
      ],
    },

    // JustifyContent
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifyContent: 'invalid-justify' } });`,
      errors: [
        {
          message:
            "'justifyContent' has an invalid value 'invalid-justify'. Valid values: normal, stretch, start, end, flex-start, flex-end, center, left, right, space-between, space-around, space-evenly, safe start, safe end, safe center, safe flex-start, safe flex-end, unsafe start, unsafe end, unsafe center, unsafe flex-start, unsafe flex-end, safe left, safe right, unsafe left, unsafe right",
        },
      ],
    },

    // JustifySelf
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifySelf: 'invalid-justify-self' } });`,
      errors: [
        {
          message:
            "'justifySelf' has an invalid value 'invalid-justify-self'. Valid values: auto, normal, stretch, start, end, flex-start, flex-end, center, left, right, anchor-center, baseline, first baseline, last baseline",
        },
      ],
    },

    // ScrollSnapAlign
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollSnapAlign: 'invalid-snap' } });`,
      errors: [
        {
          message:
            "'scrollSnapAlign' has an invalid value 'invalid-snap'. Valid values: none, start, end, center",
        },
      ],
    },

    // Translate
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { translate: 'invalid-translate' } });`,
      errors: [
        {
          message:
            "'translate' has an invalid value 'invalid-translate'. Valid values: none",
        },
      ],
    },

    // Transform
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transform: 'invalid-transform' } });`,
      errors: [
        {
          message:
            "'transform' has an invalid value 'invalid-transform'. Valid values: none",
        },
      ],
    },

    // TransformOrigin
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { transformOrigin: 'invalid-origin' } });`,
      errors: [
        {
          message:
            "'transformOrigin' has an invalid value 'invalid-origin'. Valid values: ",
        },
      ],
    },

    // TextEmphasis
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasis: 'invalid-emphasis' } });`,
      errors: [
        {
          message:
            "'textEmphasis' has an invalid value 'invalid-emphasis'. Valid values: none, filled, open, dot, circle, double-circle, triangle, sesame",
        },
      ],
    },

    // TextEmphasisStyle
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasisStyle: 'invalid-style' } });`,
      errors: [
        {
          message:
            "'textEmphasisStyle' has an invalid value 'invalid-style'. Valid values: none, filled, open, dot, circle, double-circle, triangle, sesame",
        },
      ],
    },

    // TextEmphasisPosition
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textEmphasisPosition: 'invalid-position' } });`,
      errors: [
        {
          message:
            "'textEmphasisPosition' has an invalid value 'invalid-position'. Valid values: auto, over, under",
        },
      ],
    },

    // ScrollSnapType
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollSnapType: 'invalid-type' } });`,
      errors: [
        {
          message:
            "'scrollSnapType' has an invalid value 'invalid-type'. Valid values: none, x, y, block, inline, both",
        },
      ],
    },

    // MaskBorderRepeat
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderRepeat: 'invalid-repeat' } });`,
      errors: [
        {
          message:
            "'maskBorderRepeat' has an invalid value 'invalid-repeat'. Valid values: stretch, repeat, round, space",
        },
      ],
    },

    // JustifyItems
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { justifyItems: 'invalid-justify-items' } });`,
      errors: [
        {
          message:
            "'justifyItems' has an invalid value 'invalid-justify-items'. Valid values: normal, stretch, start, end, flex-start, flex-end, center, left, right, anchor-center, baseline",
        },
      ],
    },

    // BackgroundRepeat
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundRepeat: 'invalid-repeat' } });`,
      errors: [
        {
          message:
            "'backgroundRepeat' has an invalid value 'invalid-repeat'. Valid values: repeat, repeat-x, repeat-y, space, round, no-repeat",
        },
      ],
    },

    // PlaceSelf
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeSelf: 'invalid invalid invalid' } });`,
      errors: [
        {
          message:
            "'placeSelf' has an invalid value 'invalid invalid invalid'. Valid values: ",
        },
      ],
    },

    // PlaceItems
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeItems: 'invalid invalid invalid' } });`,
      errors: [
        {
          message:
            "'placeItems' has an invalid value 'invalid invalid invalid'. Valid values: ",
        },
      ],
    },

    // PlaceContent
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { placeContent: 'invalid invalid invalid' } });`,
      errors: [
        {
          message:
            "'placeContent' has an invalid value 'invalid invalid invalid'. Valid values: ",
        },
      ],
    },

    // TextShadow
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textShadow: 'invalid' } });`,
      errors: [
        {
          message:
            "'textShadow' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // TextIndent
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textIndent: 'invalid' } });`,
      errors: [
        {
          message:
            "'textIndent' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // TextDecorationLine
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: 'underline underline' } });`,
      errors: [
        {
          message:
            "'textDecorationLine' has an invalid value 'underline underline'. Valid values: none, underline, overline, line-through, blink",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: ' underline' } });`,
      errors: [
        {
          message:
            "'textDecorationLine' has an invalid value ' underline'. Valid values: none, underline, overline, line-through, blink",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: 'underline ' } });`,
      errors: [
        {
          message:
            "'textDecorationLine' has an invalid value 'underline '. Valid values: none, underline, overline, line-through, blink",
        },
      ],
    },

    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: 'underline invalid' } });`,
      errors: [
        {
          message:
            "'textDecorationLine' has an invalid value 'underline invalid'. Valid values: none, underline, overline, line-through, blink",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textDecorationLine: 'xyz' } });`,
      errors: [
        {
          message:
            "'textDecorationLine' has an invalid value 'xyz'. Valid values: none, underline, overline, line-through, blink",
        },
      ],
    },

    // StrokeMiterlimit
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { strokeMiterlimit: 'invalid' } });`,
      errors: [
        {
          message:
            "'strokeMiterlimit' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // StrokeDasharray
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { strokeDasharray: 'invalid' } });`,
      errors: [
        {
          message:
            "'strokeDasharray' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // Stroke
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { stroke: 'invalid' } });`,
      errors: [
        {
          message:
            "'stroke' has an invalid value 'invalid'. Valid values: context-stroke",
        },
      ],
    },

    // ShapeOutside
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { shapeOutside: 'invalid' } });`,
      errors: [
        {
          message:
            "'shapeOutside' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // ShapeImageThreshold
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { shapeImageThreshold: 'invalid' } });`,
      errors: [
        {
          message:
            "'shapeImageThreshold' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // ScrollbarColor
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollbarColor: 'invalid' } });`,
      errors: [
        {
          message:
            "'scrollbarColor' has an invalid value 'invalid'. Valid values: auto",
        },
      ],
    },

    // ScrollPadding
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollPadding: 'invalid' } });`,
      errors: [
        {
          message:
            "'scrollPadding' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // ScrollMargin
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scrollMargin: 'invalid' } });`,
      errors: [
        {
          message:
            "'scrollMargin' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // Scale
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { scale: 'invalid' } });`,
      errors: [
        {
          message: "'scale' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // Rotate
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { rotate: 'invalid' } });`,
      errors: [
        {
          message:
            "'rotate' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // Quotes
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { quotes: 'invalid' } });`,
      errors: [
        {
          message:
            "'quotes' has an invalid value 'invalid'. Valid values: none, auto, match-parent",
        },
      ],
    },

    // PaintOrder
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { paintOrder: 'invalid' } });`,
      errors: [
        {
          message:
            "'paintOrder' has an invalid value 'invalid'. Valid values: normal",
        },
      ],
    },

    // OverscrollBehavior
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overscrollBehavior: 'invalid' } });`,
      errors: [
        {
          message:
            "'overscrollBehavior' has an invalid value 'invalid'. Valid values: none, auto, contain",
        },
      ],
    },

    // OverflowClipMargin
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overflowClipMargin: 'invalid' } });`,
      errors: [
        {
          message:
            "'overflowClipMargin' has an invalid value 'invalid'. Valid values: content-box, padding-box, border-box",
        },
      ],
    },

    // Overflow
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { overflow: 'invalid' } });`,
      errors: [
        {
          message:
            "'overflow' has an invalid value 'invalid'. Valid values: visible, hidden, clip, scroll, auto",
        },
      ],
    },

    // Offset
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { offset: 'invalid' } });`,
      errors: [
        {
          message: "'offset' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // OffsetPath
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { offsetPath: 'invalid' } });`,
      errors: [
        {
          message:
            "'offsetPath' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // OffsetRotate
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { offsetRotate: 'invalid' } });`,
      errors: [
        {
          message:
            "'offsetRotate' has an invalid value 'invalid'. Valid values: auto, reverse",
        },
      ],
    },

    // ObjectPosition
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { objectPosition: 'invalid' } });`,
      errors: [
        {
          message:
            "'objectPosition' has an invalid value 'invalid'. Valid values: top, bottom, left, right, center",
        },
      ],
    },

    // MathDepth
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { mathDepth: 'invalid' } });`,
      errors: [
        {
          message:
            "'mathDepth' has an invalid value 'invalid'. Valid values: auto-add",
        },
      ],
    },

    // Mask
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { mask: 'invalid' } });`,
      errors: [
        {
          message: "'mask' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // MaskBorder
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorder: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskBorder' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // MaskSize
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskSize: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskSize' has an invalid value 'invalid'. Valid values: cover, contain",
        },
      ],
    },

    // MaskRepeat
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskRepeat: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskRepeat' has an invalid value 'invalid'. Valid values: repeat-x, repeat-y, repeat, space, round, no-repeat",
        },
      ],
    },

    // MaskPosition
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskPosition: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskPosition' has an invalid value 'invalid'. Valid values: top, bottom, left, right, center",
        },
      ],
    },

    // MaskOrigin
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskOrigin: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskOrigin' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // MaskMode
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskMode: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskMode' has an invalid value 'invalid'. Valid values: alpha, luminance, match-source",
        },
      ],
    },

    // MaskComposite
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskComposite: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskComposite' has an invalid value 'invalid'. Valid values: add, subtract, intersect, exclude",
        },
      ],
    },

    // MaskClip
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskClip: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskClip' has an invalid value 'invalid'. Valid values: no-clip",
        },
      ],
    },

    // MaskBorderWidth
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderWidth: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskBorderWidth' has an invalid value 'invalid'. Valid values: auto",
        },
      ],
    },

    // MaskBorderSlice
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderSlice: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskBorderSlice' has an invalid value 'invalid'. Valid values: fill",
        },
      ],
    },

    // MaskBorderOutset
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { maskBorderOutset: 'invalid' } });`,
      errors: [
        {
          message:
            "'maskBorderOutset' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // Marker
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { marker: 'invalid' } });`,
      errors: [
        {
          message:
            "'marker' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // MarginBlock
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { marginBlock: 'invalid' } });`,
      errors: [
        {
          message:
            "'marginBlock' has an invalid value 'invalid'. Valid values: auto",
        },
      ],
    },

    // InsetBlock
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { insetBlock: 'invalid' } });`,
      errors: [
        {
          message:
            "'insetBlock' has an invalid value 'invalid'. Valid values: auto",
        },
      ],
    },

    // InitialLetter
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { initialLetter: 'invalid' } });`,
      errors: [
        {
          message:
            "'initialLetter' has an invalid value 'invalid'. Valid values: normal",
        },
      ],
    },

    // ImageOrientation
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { imageOrientation: 'invalid' } });`,
      errors: [
        {
          message:
            "'imageOrientation' has an invalid value 'invalid'. Valid values: none, from-image",
        },
      ],
    },

    // HyphenateLimitChars
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { hyphenateLimitChars: 'invalid' } });`,
      errors: [
        {
          message:
            "'hyphenateLimitChars' has an invalid value 'invalid'. Valid values: auto",
        },
      ],
    },

    // Grid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { grid: 'invalid invalid invalid' } });`,
      errors: [
        {
          message:
            "'grid' has an invalid value 'invalid invalid invalid'. Valid values: none",
        },
      ],
    },

    // GridTemplate
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { gridTemplate: 'invalid invalid' } });`,
      errors: [
        {
          message:
            "'gridTemplate' has an invalid value 'invalid invalid'. Valid values: none",
        },
      ],
    },

    // GridTemplateColumns
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { gridTemplateColumns: 'invalid' } });`,
      errors: [
        {
          message:
            "'gridTemplateColumns' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // GridTemplateAreas
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { gridTemplateAreas: 'invalid' } });`,
      errors: [
        {
          message:
            "'gridTemplateAreas' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // GridAutoColumns
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { gridAutoColumns: 'invalid' } });`,
      errors: [
        {
          message:
            "'gridAutoColumns' has an invalid value 'invalid'. Valid values: auto",
        },
      ],
    },

    // FontFeatureSettings
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontFeatureSettings: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontFeatureSettings' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // FontVariant
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariant: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontVariant' has an invalid value 'invalid'. Valid values: normal, none",
        },
      ],
    },

    // FontVariationSettings
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariationSettings: 'invalid' } });`,
      errors: [
        {
          message:
            '\'fontVariationSettings\' has an invalid value \'invalid\'. Valid values: normal, "wght", "wdth", "slnt", "ital", "opsz"',
        },
      ],
    },

    // FontVariantNumeric
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantNumeric: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontVariantNumeric' has an invalid value 'invalid'. Valid values: normal",
        },
      ],
    },

    // FontVariantLigatures
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantLigatures: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontVariantLigatures' has an invalid value 'invalid'. Valid values: none, normal",
        },
      ],
    },

    // FontVariantEastAsian
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantEastAsian: 'jis78 jis83' } });`,
      errors: [
        {
          message:
            "'fontVariantEastAsian' has an invalid value 'jis78 jis83'. Valid values: normal, ruby, jis78, jis83, jis90, jis04, simplified, traditional, full-width, proportional-width",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantEastAsian: 'invalid-value' } });`,
      errors: [
        {
          message:
            "'fontVariantEastAsian' has an invalid value 'invalid-value'. Valid values: normal, ruby, jis78, jis83, jis90, jis04, simplified, traditional, full-width, proportional-width",
        },
      ],
    },

    // FontVariantAlternates
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontVariantAlternates: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontVariantAlternates' has an invalid value 'invalid'. Valid values: normal, historical-forms",
        },
      ],
    },

    // FontSynthesis
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSynthesis: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontSynthesis' has an invalid value 'invalid'. Valid values: none, weight, style, small-caps, position",
        },
      ],
    },

    // FontStyle
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontStyle: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontStyle' has an invalid value 'invalid'. Valid values: normal, italic, oblique",
        },
      ],
    },

    // FontPalette
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontPalette: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontPalette' has an invalid value 'invalid'. Valid values: normal, light, dark",
        },
      ],
    },

    // FontSizeAdjust
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSizeAdjust: 'invalid invalid invalid' } });`,
      errors: [
        {
          message:
            "'fontSizeAdjust' has an invalid value 'invalid invalid invalid'. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSizeAdjust: 'ex-height invalid' } });`,
      errors: [
        {
          message:
            "'fontSizeAdjust' has an invalid value 'ex-height invalid'. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSizeAdjust: 'invalid 0.5' } });`,
      errors: [
        {
          message:
            "'fontSizeAdjust' has an invalid value 'invalid 0.5'. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSizeAdjust: '' } });`,
      errors: [
        {
          message:
            "'fontSizeAdjust' has an invalid value ''. Valid values: none",
        },
      ],
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontSizeAdjust: 'ex-height cap-height 0.5' } });`,
      errors: [
        {
          message:
            "'fontSizeAdjust' has an invalid value 'ex-height cap-height 0.5'. Valid values: none",
        },
      ],
    },

    // FontStretch
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontStretch: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontStretch' has an invalid value 'invalid'. Valid values: normal, ultra-condensed, extra-condensed, condensed, semi-condensed, semi-expanded, expanded, extra-expanded, ultra-expanded",
        },
      ],
    },

    // Flex invalid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flex: 'invalid' } });`,
      errors: [
        {
          message: "'flex' has an invalid value 'invalid'. Valid values: none",
        },
      ],
    },

    // Cursor invalid cases
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { cursor: 'invalid' } });`,
      errors: [
        {
          message:
            "'cursor' has an invalid value 'invalid'. Valid values: auto",
        },
      ],
    },

    // Content
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { content: 'invalid' } });`,
      errors: [
        {
          message:
            "'content' has an invalid value 'invalid'. Valid values: open-quote, close-quote, no-open-quote, no-close-quote, normal, none",
        },
      ],
    },

    // Columns
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { columns: 'invalid invalid invalid' } });`,
      errors: [
        {
          message:
            "'columns' has an invalid value 'invalid invalid invalid'. Valid values: ",
        },
      ],
    },

    // ClipPath
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { clipPath: 'invalid' } });`,
      errors: [
        {
          message: "'clipPath' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // BoxShadow
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { boxShadow: 'invalid' } });`,
      errors: [
        {
          message: "'boxShadow' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // BackgroundAttachment
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundAttachment: 'invalid' } });`,
      errors: [
        {
          message:
            "'backgroundAttachment' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // BackgroundOrigin
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundOrigin: 'invalid' } });`,
      errors: [
        {
          message:
            "'backgroundOrigin' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // BackgroundPositionY
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { backgroundPositionY: 'invalid' } });`,
      errors: [
        {
          message:
            "'backgroundPositionY' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // ColumnCount
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { columnCount: 'invalid' } });`,
      errors: [
        {
          message:
            "'columnCount' has an invalid value 'invalid'. Valid values: auto",
        },
      ],
    },

    // FlexGrow
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { flexGrow: 'invalid' } });`,
      errors: [
        {
          message: "'flexGrow' has an invalid value 'invalid'. Valid values: ",
        },
      ],
    },

    // Padding too many values
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { padding: '10px 20px 30px 40px 50px' } });`,
      errors: [
        {
          message:
            "'padding' has an invalid value '10px 20px 30px 40px 50px'. Valid values: ",
        },
      ],
    },

    // FontLanguageOverride
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fontLanguageOverride: 'invalid' } });`,
      errors: [
        {
          message:
            "'fontLanguageOverride' has an invalid value 'invalid'. Valid values: normal",
        },
      ],
    },

    // ============================================
    // New Property Tests
    // ============================================

    // AlignmentBaseline invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { alignmentBaseline: 'invalid' } });`,
      errors: [
        {
          message:
            "'alignmentBaseline' has an invalid value 'invalid'. Valid values: auto, baseline, before-edge, text-before-edge, middle, central, after-edge, text-after-edge, ideographic, alphabetic, hanging, mathematical",
        },
      ],
    },

    // DominantBaseline invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { dominantBaseline: 'invalid' } });`,
      errors: [
        {
          message:
            "'dominantBaseline' has an invalid value 'invalid'. Valid values: auto, use-script, no-change, reset-size, ideographic, alphabetic, hanging, mathematical, central, middle, text-after-edge, text-before-edge",
        },
      ],
    },

    // FillRule invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fillRule: 'invalid' } });`,
      errors: [
        {
          message:
            "'fillRule' has an invalid value 'invalid'. Valid values: nonzero, evenodd",
        },
      ],
    },

    // ContainerType invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { containerType: 'invalid' } });`,
      errors: [
        {
          message:
            "'containerType' has an invalid value 'invalid'. Valid values: size, inline-size, normal",
        },
      ],
    },

    // ContentVisibility invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { contentVisibility: 'invalid' } });`,
      errors: [
        {
          message:
            "'contentVisibility' has an invalid value 'invalid'. Valid values: visible, hidden, auto",
        },
      ],
    },

    // Direction invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { direction: 'invalid' } });`,
      errors: [
        {
          message:
            "'direction' has an invalid value 'invalid'. Valid values: ltr, rtl",
        },
      ],
    },

    // ForcedColorAdjust invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { forcedColorAdjust: 'invalid' } });`,
      errors: [
        {
          message:
            "'forcedColorAdjust' has an invalid value 'invalid'. Valid values: auto, none",
        },
      ],
    },

    // Contain invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { contain: 'invalid' } });`,
      errors: [
        {
          message:
            "'contain' has an invalid value 'invalid'. Valid values: none, strict, content",
        },
      ],
    },

    // TextSizeAdjust invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { textSizeAdjust: 'invalid' } });`,
      errors: [
        {
          message:
            "'textSizeAdjust' has an invalid value 'invalid'. Valid values: none, auto",
        },
      ],
    },

    // ColorInterpolation invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { colorInterpolation: 'invalid' } });`,
      errors: [
        {
          message:
            "'colorInterpolation' has an invalid value 'invalid'. Valid values: auto, sRGB, linearRGB",
        },
      ],
    },

    // ColorInterpolationFilters invalid
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { colorInterpolationFilters: 'invalid' } });`,
      errors: [
        {
          message:
            "'colorInterpolationFilters' has an invalid value 'invalid'. Valid values: auto, sRGB, linearRGB",
        },
      ],
    },

    // ============================================
    // Primitive Value Tests
    // ============================================

    // Boolean true rejected
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { display: true } });`,
      errors: [
        {
          message:
            "'display' cannot be assigned a boolean value (true). CSS properties require string or number values.",
        },
      ],
    },

    // Boolean false rejected
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { color: false } });`,
      errors: [
        {
          message:
            "'color' cannot be assigned a boolean value (false). CSS properties require string or number values.",
        },
      ],
    },

    // Null rejected
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { margin: null } });`,
      errors: [
        {
          message:
            "'margin' cannot be assigned a null value (null). CSS properties require string or number values.",
        },
      ],
    },

    // Number rejected for string-only property
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { display: 123 } });`,
      errors: [
        {
          message:
            "'display' does not accept numeric values. Expected a string value.",
        },
      ],
    },

    // Number rejected for fillRule (keyword-only)
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { fillRule: 1 } });`,
      errors: [
        {
          message:
            "'fillRule' does not accept numeric values. Expected a string value.",
        },
      ],
    },

    // Number rejected for direction (keyword-only)
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({ s: { direction: 0 } });`,
      errors: [
        {
          message:
            "'direction' does not accept numeric values. Expected a string value.",
        },
      ],
    },
  ],
});
