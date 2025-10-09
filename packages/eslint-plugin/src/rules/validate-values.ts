/**
 * @fileoverview CSS 397 Properties valid value verification
 * Compatible with eslint 8 and below or 9 and above
 */
import { validData } from '../util/validData';
import { unitData } from '../util/unitData';
import { colorValue } from '../util/colorData';
import {
  isValidPlaceContent,
  isValidPlaceItems,
  isValidPlaceSelf,
  isValidTouchAction,
} from '../util/place';

const globalValues = ['inherit', 'initial', 'revert', 'revert-layer', 'unset'];

// single length percentage or no percentage value.
const lengthValueProperties = [
  'width',
  'maxWidth',
  'minWidth',
  'height',
  'maxHeight',
  'minHeight',
  'blockSize',
  'columnWidth',
  'flexBasis',
  'inlineSize',
  'background',
  'top',
  'bottom',
  'left',
  'right',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'fontSize',
  'lineHeight',
  'insetBlockEnd',
  'insetBlockStart',
  'insetInlineEnd',
  'insetInlineStart',
  'marginBlockEnd',
  'marginBlockStart',
  'paddingBlockEnd',
  'paddingBlockStart',
  'paddingInlineEnd',
  'paddingInlineStart',
  'marginInlineEnd',
  'marginInlineStart',
  'maxBlockSize',
  'minBlockSize',
  'maxInlineSize',
  'minInlineSize',
  'offsetDistance',
  //----
  'borderTopWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'borderBlockStartWidth',
  'borderBlockEndWidth',
  'borderInlineStartWidth',
  'borderInlineEndWidth',
  'columnRuleWidth',
  'outlineOffset',
  'perspective',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  //----
  'columnGap',
  'rowGap',
  'rx',
  'ry',
  'scrollMarginBlockEnd',
  'scrollMarginBlockStart',
  'scrollMarginInlineEnd',
  'scrollMarginInlineStart',
  'scrollMarginBottom',
  'scrollMarginLeft',
  'scrollMarginRight',
  'scrollMarginTop',
  'scrollPaddingBlockEnd',
  'scrollPaddingBlockStart',
  'scrollPaddingInlineEnd',
  'scrollPaddingInlineStart',
  'scrollPaddingBottom',
  'scrollPaddingLeft',
  'scrollPaddingRight',
  'scrollPaddingTop',
  'shapeMargin',
  'strokeDashoffset',
  'strokeWidth',
  'textDecorationThickness',
  'textUnderlineOffset',
  'verticalAlign',
  'x',
  'y',
  'zoom',
];

const fitContentString = 'fit-content\\([^()]*\\)';
const minString = 'min\\([^()]*\\)';
const maxString = 'max\\([^()]*\\)';
const minmaxString = 'minmax\\([^()]*\\)';

const dashedIdentString = '--[a-zA-Z_][a-zA-Z0-9_-]*';
const varString = `var\\(${dashedIdentString}(,\\s*[^\\)]+)?\\)`;
const varRegex = new RegExp(`^(${varString})$`);
const pureNumber = `(-?\\d+(\\.\\d+)?)`;
const numberPattern = `(${pureNumber}|${varString})`;
const percentagePattern = `${pureNumber}%`;
const pureInteger = `(-?\\d+)`;
const integerPattern = `(${pureInteger}|${varString})`;
const lengthPattern = `0|${pureNumber}(?:${unitData.join('|')})`;
const pureAngle = `${pureNumber}(deg|rad|grad|turn)`;
const anglePattern = `(${pureAngle}|${varString})`;

const calcString = 'calc\\(.*?\\)';
const anchorString = 'anchor\\([^()]*\\)';
const anchorSizeString = 'anchor-size\\([^()]*\\)';
const clampString = 'clamp\\([^()]*\\)';
const gradientString =
  '(?:repeating-)?(?:linear|radial|conic)-gradient\\(.*\\)';
const urlString = 'url\\([^\\)]+\\)';
const imageSetString = 'image-set\\([^\\)]+\\)';
const attrString = 'attr\\([^\\)]+\\)';
const addString = `add\\(${integerPattern}\\)`;
const counterString = 'counter\\([^\\)]+\\)';
const countersString = 'counters\\([^\\)]+\\)';
const doubleQuoteString = '"[^"]*"';
const singleQuoteString = "'[^']*'";
const stringString = `(?:${doubleQuoteString}|${singleQuoteString})`;
const repeatString = 'repeat\\([^\\)]+\\)';
const colorSpaces =
  'srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|lab|oklab|xyz|xyz-d50|xyz-d65|hsl|hwb|lch|oklch';
const hueModifiers = '(?:\\s+(?:shorter|longer|increasing|decreasing)\\s+hue)?';

const colorSpacePattern = `in\\s+(?:${colorSpaces})${hueModifiers}`;

function buildPaletteMixPattern() {
  const lastArgPattern = `(?:(${dashedIdentString}|${varString}))(?:\\s+(${percentagePattern}|${varString}))?`;

  return `palette-mix\\(${colorSpacePattern},\\s*${lastArgPattern},\\s*${lastArgPattern}\\)`;
}

const paletteMixString = buildPaletteMixPattern();

function buildColorMixPattern() {
  const lastArgPattern = `(${colorValue}|${varString})(?:\\s+(${percentagePattern}|${varString}))?`;

  return `color-mix\\(${colorSpacePattern},\\s*${lastArgPattern},\\s*${lastArgPattern}\\)`;
}

const colorMixString = buildColorMixPattern();
const lightDarkValue = `${colorValue}|${colorMixString}|${varString}`;
const lightDarkString = `light-dark\\((?:${lightDarkValue}),\\s*(?:${lightDarkValue})\\)`;

const colorRegex = new RegExp(
  `^(${colorValue}|${colorMixString}|${lightDarkString}|${varString})$`,
);
const colorSource = colorRegex.source.slice(1, -1);

const imageRegex = new RegExp(`^(${gradientString}|${urlString})$`);
const urlRegex = new RegExp(`^(${urlString})$`);

const sliceValuePattern =
  '^(?:-?\\d+(?:\\.\\d+)?%?|fill)(?:\\s+(?:-?\\d+(?:\\.\\d+)?%?|fill)){0,3}$';
const sliceRegex = new RegExp(`^(${sliceValuePattern})$`);

const otherGroupProperties = [
  'fontWeight',
  'opacity',
  'stopOpacity',
  'strokeOpacity',
  'flexGrow',
  'flexShrink',
];
const integerGroupProperties = [
  'columnCount',
  'zIndex',
  'order',
  'orphans',
  'widows',
];

const multipleValueProperties = [
  'borderSpacing',
  'borderEndEndRadius',
  'borderEndStartRadius',
  'borderStartEndRadius',
  'borderStartStartRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBlockWidth',
  'borderInlineWidth',
  'gap',
  'scale',
  'inset',
  'padding',
  'margin',
  'borderWidth',
  'borderImageWidth',
  'borderImageOutset',
];

const valueCountMap: { [key: string]: number } = {
  inset: 4,
  gap: 2,
  padding: 4,
  margin: 4,
  borderSpacing: 2,
  borderWidth: 4,
  borderStartStartRadius: 2,
  borderStartEndRadius: 2,
  borderEndStartRadius: 2,
  borderEndEndRadius: 2,
  borderTopLeftRadius: 2,
  borderTopRightRadius: 2,
  borderBottomRightRadius: 2,
  borderBottomLeftRadius: 2,
  borderImageWidth: 4,
  borderImageOutset: 4,
  borderBlockWidth: 2,
  borderInlineWidth: 2,
};

const singleColorProperties = [
  'accentColor',
  'color',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
  'borderBlockColor',
  'borderBlockStartColor',
  'borderBlockEndColor',
  'borderInlineColor',
  'borderInlineStartColor',
  'borderInlineEndColor',
  'backgroundColor',
  'outlineColor',
  'textDecorationColor',
  'caretColor',
  'columnRuleColor',
  'sropColor',
  'textEmphasisColor',
];
const borderColorProperties = ['borderColor'];
const borderImageProperties = ['borderImage'];

const borderWidthProperties = [
  'borderWidth',
  'borderBlockWidth',
  'borderInlineWidth',
  'columnRuleWidth',
  'outlineWidth',
];
const ImageSourceProperties = [
  'borderImageSource',
  'listStyleImage',
  'maskBorderSource',
  'maskImage',
];
const borderProperties = [
  'border',
  'outline', // same as border
  'columnRule', // same as border
  'borderTop',
  'borderBottom',
  'borderLeft',
  'borderRight',
  'borderBlock',
  'borderBlockStart',
  'borderBlockEnd',
  'borderInline',
  'borderInlineStart',
  'borderInlineEnd',
];

const borderRadiusProperties = ['borderRadius'];
const borderStyleProperties = ['borderStyle'];
const borderImageSlice = ['borderImageSlice'];

const stylisticString = 'stylistic\\([^\\)]+\\)';
const stylesetString = 'styleset\\([^\\)]+\\)';
const characterVariantString = 'character-variant\\([^\\)]+\\)';
const swashString = 'swash\\([^\\)]+\\)';
const ornamentsString = 'ornaments\\([^\\)]+\\)';
const annotationString = 'annotation\\([^\\)]+\\)';
const notationFuncs = [
  stylisticString,
  stylesetString,
  characterVariantString,
  swashString,
  ornamentsString,
  annotationString,
  varString,
].join('|');

function isValidMultipleColorValues(value: string) {
  const colors = splitColorValues(value);

  if (colors.length > 4) return false;

  return colors.every(isValidColorValue);
}

function isValidColorValue(value: string) {
  return colorRegex.test(value);
}

function splitColorValues(value: string) {
  const colors = [];
  const remaining = value.trim();
  let inParentheses = false;
  let currentColor = '';

  for (let i = 0; i < remaining.length; i++) {
    const char = remaining[i];

    if (char === '(') {
      inParentheses = true;
    } else if (char === ')') {
      inParentheses = false;
    }

    if (char === ' ' && !inParentheses && currentColor.length > 0) {
      colors.push(currentColor.trim());
      currentColor = '';
    } else {
      currentColor += char;
    }
  }

  if (currentColor.length > 0) {
    colors.push(currentColor.trim());
  }

  return colors;
}

const lineWidth = ['thin', 'medium', 'thick'].join('|');
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
  varString,
].join('|');

const cursorValue = [
  'auto',
  'default',
  'none',
  'context-menu',
  'help',
  'pointer',
  'progress',
  'wait',
  'cell',
  'crosshair',
  'text',
  'vertical-text',
  'alias',
  'copy',
  'move',
  'no-drop',
  'not-allowed',
  'grab',
  'grabbing',
  'e-resize',
  'n-resize',
  'ne-resize',
  'nw-resize',
  's-resize',
  'se-resize',
  'sw-resize',
  'w-resize',
  'ew-resize',
  'ns-resize',
  'nesw-resize',
  'nwse-resize',
  'col-resize',
  'row-resize',
  'all-scroll',
  'zoom-in',
  'zoom-out',
  varString,
].join('|');

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

export const validateValues = createRule({
  name: 'validate-values',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Validate camelCase CSS property values in JS objects or JSX',
    },

    messages: {
      validateValue:
        "'{{key}}' has an invalid value '{{value}}'. Valid values: {{validValues}}",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ObjectExpression(node) {
        node.properties.forEach((property) => {
          if (
            property.type === 'Property' &&
            property.key &&
            property.value &&
            property.key.type === 'Identifier' &&
            typeof property.key.name === 'string' &&
            property.value.type === 'Literal' &&
            typeof property.value.value === 'string'
          ) {
            const key = property.key.name;
            const value = property.value.value;

            if (validData[key]) {
              const createReport = (
                property: TSESTree.Property,
                key: string,
                value: string,
              ) => {
                return () => {
                  context.report({
                    node: property.value,
                    messageId: 'validateValue',
                    data: {
                      key,
                      value,
                      validValues: validData[key].join(', '),
                    },
                  });
                };
              };
              const report = createReport(property, key, value);

              const globalValue =
                !validData[key].includes(value) &&
                !globalValues.includes(value) &&
                !varRegex.test(value);

              const isBorderWidth = borderWidthProperties.includes(key);
              const multiAutoProperties = [
                'borderImageWidth',
                'margin',
                'inset',
                'backgroundSize',
                'marginBlock', // auto
                'marginInline', // auto
                'scrollPaddingBlock', // auto
                'scrollPaddingInline', // auto
              ];
              const isAuto = multiAutoProperties.includes(key);
              const numberAndLengthValues = [
                'borderImageWidth',
                'borderImageOutset',
                'lineHeight',
                'strokeDashoffset',
                'strokeWidth',
                'tabSize',
                'zoom',
              ];
              const isNumber = numberAndLengthValues.includes(key);
              const isBackgroundSize = 'backgroundSize'.includes(key);
              const isBackgroundPositionY = 'backgroundPositionY'.includes(key);
              const isBackgroundPositionX = 'backgroundPositionY'.includes(key);
              const isBackgroundPosition = 'backgroundPosition'.includes(key);

              const integerValueRegex = RegExp(`^${integerPattern}$`);
              const percentageValueRegex = RegExp(`^${percentagePattern}$`);

              const lengthPercentage = [
                'width',
                'maxWidth',
                'minWidth',
                'height',
                'maxHeight',
                'minHeight',
                'flexBasis',
                'block-size',
                'columnWidth',
                'inline-size',
                'fontSize',
                'lineHeight',
                'top',
                'bottom',
                'left',
                'right',
                'marginTop',
                'marginBottom',
                'marginLeft',
                'marginRight',
                'paddingTop',
                'paddingBottom',
                'paddingLeft',
                'paddingRight',
                'inset-block',
                'maskBorderWidth',
                'maskPosition',
                'maskSize',
                'maxBlockSize',
                'minBlockSize',
                'maxInlineSize',
                'minInlineSize',
                'offsetDistance',
                'offset',
                'paddingBlock',
                'paddingBlockEnd',
                'paddingBlockStart',
                'paddingInline',
                'paddingInlineEnd',
                'paddingInlineStart',
                'columnGap',
                'rowGap',
                'rx',
                'ry',
                'scrollPadding',
                'scrollPaddingBlock',
                'scrollPaddingBlockEnd',
                'scrollPaddingBlockStart',
                'scrollPaddingInline',
                'scrollPaddingInlineEnd',
                'scrollPaddingInlineStart',
                'scrollPaddingBottom',
                'scrollPaddingLeft',
                'scrollPaddingRight',
                'scrollPaddingTop',
                'shapeMargin',
                'x',
                'y',
                'zoom',
                // multiple %
                'gap',
                'inset',
                'padding',
                'margin',
                'borderRadius',
                'borderEndEndRadius',
                'borderEndStartRadius',
                'borderStartEndRadius',
                'borderStartStartRadius',
                'borderTopLeftRadius',
                'borderTopRightRadius',
                'borderBottomLeftRadius',
                'borderBottomRightRadius',
                'backgroundPosition',
                'backgroundPositionX',
                'backgroundPositionY',
                'background',
                'backgroundSize',
                'strokeDasharray',
                'strokeDashoffset',
                'strokeWidth',
                'textDecorationThickness',
                'textUnderlineOffset',
                'transformOrigin',
                'verticalAlign',
              ];

              const isFitContentGroup = [
                'width',
                'maxWidth',
                'minWidth',
                'height',
                'maxHeight',
                'minHeight',
                'blockSize',
                'columnWidth',
                'flexBasis',
                'inlineSize',
              ];

              const isLengthPercentage = lengthPercentage.includes(key);
              const lengthValuePattern =
                `${lengthPattern}` +
                (isLengthPercentage ? `|${percentagePattern}` : '') +
                (isFitContentGroup ? `|${fitContentString}` : '') +
                (isNumber ? `|${numberPattern}` : '') +
                (isAuto ? `|auto` : '') +
                (isBorderWidth ? '|thin|medium|thick' : '') +
                (isBackgroundPositionY ? '|top|center|bottom' : '') +
                (isBackgroundPositionX ? '|left|center|right' : '') +
                (isBackgroundPosition ? '|top|bottom|center|left|right' : '') +
                (isBackgroundSize ? '|cover|contain' : '') +
                `|${calcString}|${clampString}|${anchorString}|${anchorSizeString}|${minString}|${maxString}|${varString}`;
              const lengthValueRegex = new RegExp(`^(${lengthValuePattern})$`);

              const isOtherGroups = [
                'opacity',
                'stopOpacity',
                'strokeOpacity',
              ].includes(key);
              const otherSingleValue =
                `${numberPattern}` + (isOtherGroups ? '%?' : '') + `|0`;
              const otherSingleValueRegex = new RegExp(
                `^(${otherSingleValue})$`,
              );

              const multipleValueRegex = new RegExp(
                `^(${lengthValuePattern})( (?!\\s)(${lengthValuePattern})){0,${valueCountMap[key] - 1}}$`,
              );

              const backgroundPairRegex = new RegExp(
                `^(${lengthValuePattern})(\\s+(${lengthValuePattern}))?(\\s*,\\s*(${lengthValuePattern})(\\s+(${lengthValuePattern}))?)*$`,
              );
              const backgroundPairProperties = [
                'backgroundSize',
                'backgroundPositionY',
                'backgroundPositionX',
              ];

              const backgroundQuadRegex = new RegExp(
                `^(${lengthValuePattern})(\\s+(${lengthValuePattern}))?(\\s+(${lengthValuePattern}))?(\\s+(${lengthValuePattern}))?(\\s*,\\s*(${lengthValuePattern})(\\s+(${lengthValuePattern}))?(\\s+(${lengthValuePattern}))?(\\s+(${lengthValuePattern}))?)*$`,
              );

              const backgroundQuadProperties = ['backgroundPosition'];

              const visualBox =
                'border-box|padding-box|content-box|' + varString;
              const backgroundOriginRegex = new RegExp(
                `^(${visualBox})(\\s*,\\s*(${visualBox}))*$`,
              );
              const backgroundOriginProperties = [
                'backgroundOrigin',
                'backgroundClip',
              ];

              const blendMode = [
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
                varString,
              ].join('|');

              const backgroundBlendModeRegex = new RegExp(
                `^(${blendMode})(\\s*,\\s*(${blendMode}))*$`,
              );
              const backgroundBlendModeProperties = ['backgroundBlendMode'];

              const attachment = `scroll|fixed|local|${varString}`;
              const backgroundAttachmentProperties = ['backgroundAttachment'];
              const backgroundAttachmentRegex = new RegExp(
                `^(${attachment})(\\s*,\\s*(${attachment}))*$`,
              );

              const backgroundImageRegex = new RegExp(
                `^(${gradientString}|${urlString}|${varString}|none)(\\s*,\\s*(${gradientString}|${urlString}|${varString}|none))*$`,
              );
              const backgroundImageProperties = ['backgroundImage'];

              const repeatKeyword = 'repeat|space|round|no-repeat';
              const backgroundRepeatRegex = new RegExp(
                `^(((?:${repeatKeyword}|${varString})(\\s+(?:${repeatKeyword}|${varString})))?|(repeatX|repeatY))$`,
              );
              const backgroundRepeatProperties = ['backgroundRepeat'];

              const backgroundRepeatSource = backgroundRepeatRegex.source.slice(
                1,
                -1,
              );

              const positionKeyword = `top|bottom|center|left|right|${varString}`;
              const sizeKeyword = 'cover|contain';

              const urlPattern = `(?:${urlString}|${gradientString}|${varString}\\s*)?`;
              const positionPattern = `(?:${positionKeyword})(?:\\s+${positionKeyword})?`;
              const singleValuePattern = `(${lengthValuePattern})( (?!\\s)(${lengthValuePattern})){0,2}?`;
              const sizePattern = `(?:\\s*/\\s*(?:${sizeKeyword}|${singleValuePattern}))?`;
              const repeatPattern = `(?:(?:${backgroundRepeatSource})\\s+)?`;
              const attachmentPattern = `(?:${attachment}\\s+)?`;
              const visualBoxPattern = `(?:${visualBox}\\s+)?`;
              const colorValuePattern = `(?:\\s*${colorSource})?`;

              const positionAndSizePattern = `(?:${positionPattern}${sizePattern})?`;

              const flexibleLayerWithoutColor = [
                positionAndSizePattern,
                urlPattern,
                repeatPattern,
                attachmentPattern,
                visualBoxPattern,
              ].join('|');

              const flexibleLayerWithColor = `(?:${flexibleLayerWithoutColor}\\s*)*${colorValuePattern}`;

              const backgroundRegex = new RegExp(
                `^(?!\\s)(?=\\S)${flexibleLayerWithColor}(?:\\s*,\\s*${flexibleLayerWithColor})*$`,
              );

              const backgroundProperties = ['background'];

              const boxShadowRegex = new RegExp(
                `^(?:(?:inset\\s+)?(${lengthValuePattern})\\s+(${lengthValuePattern})(?:\\s+(${lengthValuePattern}))?(?:\\s+(${lengthValuePattern}))?\\s+(${colorSource}))(?:\\s*,\\s*(?:(?:inset\\s+)?(${lengthValuePattern})\\s+(${lengthValuePattern})(?:\\s+(${lengthValuePattern}))?(?:\\s+(${lengthValuePattern}))?\\s+(${colorSource})))*$`,
              );
              const boxShadowProperties = ['boxShadow'];

              const borderRadiusRegex = new RegExp(
                `^(${lengthValuePattern})( (?!\\s)(${lengthValuePattern})){0,3}(\\s*/\\s*(${lengthValuePattern})( (?!\\s)(${lengthValuePattern})){0,3})?$`,
              );

              const borderStyleRegex = new RegExp(
                `^(${lineStyle})( (?!\\s)(${lineStyle})){0,3}$`,
              );

              function createBorderImageRegex() {
                const varString = `var\\(${dashedIdentString}(,\\s*[^\\)]+)?\\)?`;
                const valueOrVar = `(${varString}|${lengthValuePattern})`;

                const imageSource = `${imageRegex.source.slice(1, -1)}|${varString}`; // Image source or var()
                const slicePart = `(?:\\s+fill|${valueOrVar}(?:\\s+fill|${valueOrVar}){0,3})?`; // Optional slice part
                const widthPart = `(?:\\s*\\/\\s*auto|${valueOrVar}(?:\\s+auto|${valueOrVar}){0,3})?`; // Optional width part
                const outsetPart = `(?:\\s*\\/\\s*${valueOrVar}(?:\\s+${valueOrVar}){0,3})?`; // Optional outset part
                const repeatPart = `(?:\\s+(${varString}|stretch|repeat|round|space)){0,2}?`; // Optional repeat part

                return new RegExp(
                  `^${imageSource}` +
                    `${slicePart}` +
                    `${widthPart}` +
                    `${outsetPart}` +
                    `${repeatPart}$`,
                );
              }
              const borderImageRegex = createBorderImageRegex();

              const aspectRatioRegex = new RegExp(
                `^(auto\\s+)?(${varString}|${numberPattern}(\\s*\\/\\s*${numberPattern})?|auto)(\\s+auto)?$`,
              );
              const aspectRatioProperties = ['aspectRatio'];

              const timeUnit = '(s|ms)';
              const animationTimeRegex = new RegExp(
                `^-?(${pureNumber}${timeUnit}|${varString})(,\\s-?(${pureNumber}${timeUnit}|${varString}))*$`,
              );

              const animationTimeProperties = [
                'animationDelay',
                'animationDuration',
                'transitionDelay',
                'transitionDuration',
              ];

              const animationDirection = [
                'normal',
                'reverse',
                'alternate',
                'alternate-reverse',
                varString,
              ].join('|');
              const animationDirectionRegex = new RegExp(
                `^(${animationDirection})(,\\s*(${animationDirection}))*$`,
              );
              const animationDirectionProperties = ['animationDirection'];

              const animationFillMode = [
                'none',
                'forwards',
                'backwards',
                'both',
                varString,
              ].join('|');
              const animationFillModeRegex = new RegExp(
                `^(${animationFillMode})(,\\s*(${animationFillMode}))*$`,
              );
              const animationFillModeProperties = ['animationFillMode'];

              const animationPlayState = ['paused', 'running', varString].join(
                '|',
              );
              const animationPlayStateRegex = new RegExp(
                `^(${animationPlayState})(,\\s*(${animationPlayState}))*$`,
              );
              const animationPlayStateProperties = ['animationPlayState'];

              const animationIterationCountRegex = new RegExp(
                `^${numberPattern}|infinite(,\\s*${numberPattern}|infinite)*$`,
              );
              const animationIterationCountProperties = [
                'animationIterationCount',
              ];

              const stringNameRegex = new RegExp('^.*$');
              const stringNameProperties = [
                'animationName',
                'counterIncrement',
                'counterReset',
                'counterSet',
                'font',
                'fontFamily',
                'gridArea',
                'gridColumn',
                'gridColumnEnd',
                'gridColumnStart',
                'gridRow',
                'gridRowEnd',
                'gridRowStart',
                'listStyleType',
                'listStyle',
                'transitionProperty',
                'transition',
                'viewTransitionName',
                'willChange',
              ];

              const easing = [
                'ease',
                'ease-in',
                'ease-out',
                'ease-in-out',
                'linear',
                'step-start',
                'step-end',
              ];
              const easingPattern = easing.join('|');

              const zeroToOne = '(0(\\.\\d+)?|1(\\.0+)?|0?\\.\\d+)';

              const cubicBezierPattern = `cubic-bezier\\(\\s*${zeroToOne}\\s*,\\s*(-?\\d+(\\.\\d+)?)\\s*,\\s*${zeroToOne}\\s*,\\s*(-?\\d+(\\.\\d+)?)\\s*\\)`;

              const numberPercentage = `${zeroToOne}(\\s+\\d+(\\.\\d+)?%){0,2}`; // number %? %?

              const linearPattern = `linear\\(\\s*(${numberPercentage}(\\s*,\\s*${numberPercentage})*)+\\s*\\)`;

              const stepPositions = [
                'jump-start',
                'jump-end',
                'jump-none',
                'jump-both',
                'start',
                'end',
              ];
              const stepPositionPattern = stepPositions.join('|');
              const stepPattern = `steps\\(\\s*(\\d+)\\s*,\\s*(${stepPositionPattern})\\s*\\)`;

              const singleTimingFunctionPattern = `(${easingPattern}|${cubicBezierPattern}|${linearPattern}|${stepPattern}|${varString})`;

              const animationTimingFunctionRegex = new RegExp(
                `^${singleTimingFunctionPattern}(\\s*,\\s*${singleTimingFunctionPattern})*$`,
              );

              const animationTimingFunctionProperties = [
                'animationTimingFunction',
                'transitionTimingFunction',
              ];

              const filterNumFunction = [
                'brightness',
                'contrast',
                'grayscale',
                'invert',
                'opacity',
                'sepia',
                'saturate',
              ].join('|');
              const filterNumFunctionPattern = `(${filterNumFunction})\\(\\s*${numberPattern}%?\\s*\\)`;
              const blurFunctionPattern = `blur\\(\\s*(${lengthPattern}|${calcString}|${clampString}|${minString}|${maxString})\\s*\\)`;
              const angleFunctionPattern = `hue-rotate\\(\\s*${anglePattern}\\s*\\)`;
              const dropShadowPattern = `^drop-shadow\\(\\s*(?:${colorSource}|${lengthValuePattern})(?:\\s+(?:${colorSource}|${lengthValuePattern})){2,3}\\s*\\)$`;
              const filterAllPattern = `${filterNumFunctionPattern}|${blurFunctionPattern}|${angleFunctionPattern}|${dropShadowPattern}|${urlPattern}`;
              const filterPattern = `^(${filterAllPattern}\\s*)+$`;
              const filterRegex = new RegExp(filterPattern);

              function isBorderValue(value: string) {
                const parts = splitColorValues(value);
                if (parts.length > 3) return false;

                let hasWidth = false;
                let hasStyle = false;
                let hasColor = false;

                for (const part of parts) {
                  if (varRegex.test(part)) {
                    continue;
                  }

                  if (lineWidth.includes(part) || lengthValueRegex.test(part)) {
                    if (hasWidth) return false;
                    hasWidth = true;
                  } else if (lineStyle.includes(part)) {
                    if (hasStyle) return false;
                    hasStyle = true;
                  } else if (isValidColorValue(part)) {
                    if (hasColor) return false;
                    hasColor = true;
                  } else {
                    return false;
                  }
                }

                return (
                  hasStyle ||
                  hasWidth ||
                  hasColor ||
                  parts.some((part) => varRegex.test(part))
                );
              }

              const matrixString = 'matrix\\([^\\)]+\\)';
              const matrix3dString = 'matrix3d\\([^\\)]+\\)';
              const perspectiveString = 'perspective\\([^\\)]+\\)';
              const rotateString = 'rotate\\([^\\)]+\\)';
              const rotate3dString = 'rotate3d\\([^\\)]+\\)';
              const rotateXString = 'rotateX\\([^\\)]+\\)';
              const rotateYString = 'rotateY\\([^\\)]+\\)';
              const rotateZString = 'rotateZ\\([^\\)]+\\)';
              const scaleString = 'scale\\([^\\)]+\\)';
              const scale3dString = 'scale3d\\([^\\)]+\\)';
              const scaleXString = 'scaleX\\([^\\)]+\\)';
              const scaleYString = 'scaleY\\([^\\)]+\\)';
              const scaleZString = 'scaleZ\\([^\\)]+\\)';
              const skewString = 'skew\\([^\\)]+\\)';
              const skewXString = 'skewX\\([^\\)]+\\)';
              const skewYString = 'skewY\\([^\\)]+\\)';
              const translateString = 'translate\\([^\\)]+\\)';
              const translate3dString = 'translate3d\\([^\\)]+\\)';
              const translateXString = 'translateX\\([^\\)]+\\)';
              const translateYString = 'translateY\\([^\\)]+\\)';
              const translateZString = 'translateZ\\([^\\)]+\\)';

              const transformFunctions = [
                matrixString,
                matrix3dString,
                perspectiveString,
                rotateString,
                rotate3dString,
                rotateXString,
                rotateYString,
                rotateZString,
                scaleString,
                scale3dString,
                scaleXString,
                scaleYString,
                scaleZString,
                skewString,
                skewXString,
                skewYString,
                translateString,
                translate3dString,
                translateXString,
                translateYString,
                translateZString,
              ].join('|');

              const filterProperties = ['backdropFilter', 'filter'];

              const geometryBaseSet =
                'content-box|padding-box|border-box|fill-box|stroke-box|view-box';
              const geometryBox = geometryBaseSet + '|margin-box';

              const insetString = 'inset\\([^\\)]+\\)';
              const circleString = 'circle\\([^\\)]+\\)';
              const ellipseString = 'ellipse\\([^\\)]+\\)';
              const polygonString = 'polygon\\([^\\)]+\\)';
              const pathString = `path\\(${stringString}\\)`;
              const rectString = 'rect\\([^\\)]+\\)';
              const xywhString = 'xywh\\([^\\)]+\\)';

              const basicShapeWithoutVar = `(${varString}|${insetString}|${circleString}|${ellipseString}|${polygonString}|${pathString}|${rectString}|${xywhString})`;
              const basicShapeString = `(${varString}\\s+${varString}|${varString}|${basicShapeWithoutVar})`;
              const geometryBoxWithVar = `(${geometryBox}|${varString})`;

              const clipPathRegex = new RegExp(
                `^(${basicShapeString}|${geometryBoxWithVar}|${geometryBoxWithVar}\\s+${basicShapeString}|${basicShapeString}\\s+${geometryBoxWithVar})$`,
              );

              const clipPathProperties = ['clipPath'];

              const columnsRegex = new RegExp(
                `^(?:auto\\s*(?:auto|${lengthValuePattern}|${numberPattern})?|${numberPattern}\\s*(?:auto|${lengthValuePattern}|${numberPattern})?|${lengthValuePattern}\\s*(?:auto|${lengthValuePattern}|${numberPattern})?)$`,
              );
              const columnsProperties = ['columns'];

              const contentValueRegex = new RegExp(
                `^(${urlString}|${gradientString}|${imageSetString}|${attrString}|${counterString}|${countersString}|${stringString})$`,
              );

              const contentProperty = ['content'];

              function isValidCursor(value: string) {
                const urlWithHotspotRegex = `(${urlString}|${varString})(\\s+(${numberPattern})(\\s+(${numberPattern}))?)?`;
                const urlPart = `(${urlWithHotspotRegex})`;
                const standalonePattern = new RegExp(`^(${cursorValue})$`);
                const urlListPattern = new RegExp(
                  `^${urlPart}(\\s*,\\s*${urlPart})*\\s*,\\s*(${cursorValue})$`,
                );

                if (standalonePattern.test(value)) {
                  return true;
                }

                if (!urlListPattern.test(value)) {
                  return false;
                }

                const parts = value.split(/\s*,\s*/);

                const lastPart = parts[parts.length - 1];
                const isFallbackCursor = standalonePattern.test(lastPart);

                if (!isFallbackCursor) return false;

                const urlParts = parts.slice(0, -1);

                return urlParts.every((part) => {
                  const urlRegex = new RegExp(`^${urlWithHotspotRegex}$`);
                  return urlRegex.test(part);
                });
              }
              const cursorProperty = ['cursor'];

              function isValidFlexValue(value: string) {
                // Remove all whitespace
                const cleanValue = value.replace(/\s+/g, ' ').trim();

                // If empty string, invalid
                if (!cleanValue) {
                  return false;
                }

                // Split the value by spaces and check maximum length
                const parts = cleanValue.split(' ');
                if (parts.length > 3) {
                  return false;
                }

                // Handle single value case
                if (parts.length === 1) {
                  // Single value can be either a number or a length
                  return (
                    new RegExp(`^${numberPattern}$`).test(parts[0]) ||
                    new RegExp(lengthValuePattern).test(parts[0])
                  );
                }

                // Handle two values case
                if (parts.length === 2) {
                  // First value must be a number
                  if (!new RegExp(`^${numberPattern}$`).test(parts[0])) {
                    return false;
                  }

                  // Second value can be either a number or a length
                  return (
                    new RegExp(`^${numberPattern}$`).test(parts[1]) ||
                    new RegExp(lengthValuePattern).test(parts[1])
                  );
                }

                // Handle three values case
                if (parts.length === 3) {
                  // First two values must be numbers
                  if (
                    !new RegExp(`^${numberPattern}$`).test(parts[0]) ||
                    !new RegExp(`^${numberPattern}$`).test(parts[1])
                  ) {
                    return false;
                  }

                  // Third value must be a length or auto
                  return new RegExp(`^(${lengthValuePattern}|auto)$`).test(
                    parts[2],
                  );
                }

                return false;
              }
              const flexProperty = ['flex'];
              const tagA_E = [
                'aalt',
                'abvf',
                'abvm',
                'abvs',
                'afrc',
                'akhn',
                'apkn',
                'blwf',
                'blwm',
                'blws',
                'calt',
                'case',
                'ccmp',
                'cfar',
                'chws',
                'cjct',
                'clig',
                'cpct',
                'cpsp',
                'cswh',
                'curs',
                'cv(0[1-9]|[1-9][0-9])',
                'c2pc',
                'c2sc',
                'dist',
                'dlig',
                'dnom',
                'dtls',
                'expt',
              ]
                .map((tag) => `'${tag}'|"${tag}"`)
                .join('|');

              const tagF_J = [
                'falt',
                'fin2',
                'fin3',
                'fina',
                'flac',
                'frac',
                'fwid',
                'half',
                'haln',
                'hist',
                'hkna',
                'hlig',
                'hojo',
                'hwid',
                'init',
                'isol',
                'ital',
                'jalt',
                'jp78',
                'jp83',
                'jp90',
                'jp04',
              ]
                .map((tag) => `'${tag}'|"${tag}"`)
                .join('|');

              const tagsK_O = [
                'kern',
                'lfbd',
                'liga',
                'ljmo',
                'lnum',
                'locl',
                'ltra',
                'ltrm',
                'mark',
                'med2',
                'medi',
                'mgrk',
                'mkmk',
                'mset',
                'nalt',
                'nlck',
                'nukt',
                'numr',
                'onum',
                'ordn',
                'ornm',
              ]
                .map((tag) => `'${tag}'|"${tag}"`)
                .join('|');

              const tagsP_T = [
                'palt',
                'pcap',
                'pkna',
                'pnum',
                'pref',
                'pres',
                'pstf',
                'psts',
                'pwid',
                'qwid',
                'rand',
                'rclt',
                'rkrf',
                'rlig',
                'rphf',
                'rtbd',
                'rtla',
                'rtlm',
                'ruby',
                'rvrn',
                'salt',
                'sinf',
                'size',
                'smcp',
                'smpl',
                'ss(0[1-9]|1[0-9]|20)',
                'ssty',
                'stch',
                'subs',
                'sups',
                'swsh',
                'titl',
                'tjmo',
                'tnam',
                'tnum',
                'trad',
                'twid',
              ]
                .map((tag) => `'${tag}'|"${tag}"`)
                .join('|');

              const tagsU_Z = [
                'unic',
                'valt',
                'vapk',
                'vatu',
                'vchw',
                'vert',
                'vhal',
                'vjmo',
                'vkna',
                'vkrn',
                'vpal',
                'vrt2',
                'vrtr',
                'zero',
              ]
                .map((tag) => `'${tag}'|"${tag}"`)
                .join('|');

              const featureTag = [
                tagA_E,
                tagF_J,
                tagsK_O,
                tagsP_T,
                tagsU_Z,
              ].join('|');
              const singlePair = `(${featureTag}|${varString})(\\s+(-?\\d+|on|off|${varString}))?`;

              const fontFeatureSettingsRegex = new RegExp(
                `^${singlePair}(\\s*,\\s*${singlePair})*$`,
              );
              const fontFeatureSettingsProperties = ['fontFeatureSettings'];

              const stringValueRegex = RegExp(`^${stringString}$`);
              const stringStringProperties = [
                'fontLanguageOverride',
                'hyphenateCharacter',
              ];

              const fontPaletteRegex = new RegExp(
                `^(${dashedIdentString}|${paletteMixString})$`,
              );
              const fontPaletteProperties = 'fontPalette';

              const fontMetric = `ex-height|cap-height|ch-width|ic-width|ic-height|${varString}`;

              function isValidFontSizeAdjust(value: string) {
                const cleanValue = value.replace(/\s+/g, ' ').trim();
                if (!cleanValue) {
                  return false;
                }

                const parts = cleanValue.split(' ');
                if (parts.length > 2) {
                  return false;
                }

                if (parts.length === 1) {
                  return new RegExp(`^(${numberPattern})$`).test(parts[0]);
                }

                if (parts.length === 2) {
                  const isValidFirstPart = new RegExp(`^(${fontMetric})$`).test(
                    parts[0],
                  );
                  if (!isValidFirstPart) {
                    return false;
                  }

                  return new RegExp(`^(${numberPattern})$`).test(parts[1]);
                }

                return false;
              }
              const fontSizeAdjustProperties = ['fontSizeAdjust'];

              const fontStretchProperties = ['fontStretch'];

              const fontStyleRegex = new RegExp(
                `^(oblique|${anglePattern})(\\s+(oblique|${anglePattern}))?$`,
              );
              const fontStyleProperties = ['fontStyle'];

              const fontSynthesisRegex = new RegExp(
                `^(?:(weight|style|small-caps|position|${varString})(?:\\s+(?!\\1)(weight|style|small-caps|position|${varString}))*)?$`,
                'i',
              );
              const fontSynthesisProperties = ['fontSynthesis'];

              const fontVariantAlternatesRegex = new RegExp(
                `^(?:` +
                  `(?:(?:${notationFuncs})(?:\\s+(?:${notationFuncs})){0,5})` +
                  `|(?:` +
                  `(?:(?:${notationFuncs})\\s+){0,6}(historical-forms|${varString})` +
                  `(?:\\s+(?:${notationFuncs})){0,6})` +
                  `)$`,
                'i',
              );

              const fontVariantAlternatesProperties = ['fontVariantAlternates'];

              const fontVariantEastAsianRegex = new RegExp(
                '^' +
                  `(?:jis78|jis83|jis90|jis04|simplified|traditional|full-width|proportional-width|ruby|${varString})` +
                  `(?:\\s+(?:jis78|jis83|jis90|jis04|simplified|traditional|full-width|proportional-width|ruby|${varString})){0,2}` +
                  '$',
                'i',
              );

              function isValidFontVariantEastAsian(value: string) {
                if (!fontVariantEastAsianRegex.test(value)) {
                  return false;
                }

                const values = value.toLowerCase().split(/\s+/);

                const jisCount = values.filter((value) =>
                  [
                    'jis78',
                    'jis83',
                    'jis90',
                    'jis04',
                    'simplified',
                    'traditional',
                  ].includes(value),
                ).length;

                const widthCount = values.filter((v) =>
                  ['full-width', 'proportional-width'].includes(v),
                ).length;

                const rubyCount = values.filter((v) => v === 'ruby').length;

                return jisCount <= 1 && widthCount <= 1 && rubyCount <= 1;
              }
              const fontVariantEastAsianProperties = ['fontVariantEastAsian'];

              const commonLig =
                'common-ligatures|no-common-ligatures' + `|${varString}`;
              const discretionaryLig =
                'discretionary-ligatures|no-discretionary-ligatures' +
                `|${varString}`;
              const historicalLig =
                'historical-ligatures|no-historical-ligatures' +
                `|${varString}`;
              const contextualAlt =
                'contextual|no-contextual' + `|${varString}`;
              const fontVariantLigaturesRegex = new RegExp(
                `^(?:(?:(${commonLig})|)(?: (${discretionaryLig})|)(?: (${historicalLig})|)(?: (${contextualAlt})|)){1,4}$`,
              );
              const fontVariantLigaturesProperties = ['fontVariantLigatures'];

              const alternatesValues = `(?:${notationFuncs}|historical-forms)`;
              const numericFigureValues = 'lining-nums|oldstyle-nums';
              const numericSpacingValues = 'proportional-nums|tabular-nums';
              const numericFractionValues =
                'diagonal-fractions|stacked-fractions';
              const numericOtherValues = 'normal|ordinal|slashed-zero';
              const eastAsianVariantValues =
                'jis78|jis83|jis90|jis04|simplified|traditional';
              const eastAsianWidthValues = 'full-width|proportional-width';
              const eastAsianRuby = 'ruby';
              const capsValues =
                'small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps';
              const emojiValues = 'text|emoji|unicode';
              const positionValues = 'sub|super';

              const figureSpacingFractionValues = [
                numericFigureValues,
                numericSpacingValues,
                numericFractionValues,
                numericOtherValues,
                varString,
              ].join('|');

              const fontVariantNumericRegex = new RegExp(
                `^(?:(${figureSpacingFractionValues})(?:\\s+(?!\\1)(${figureSpacingFractionValues}))*)?$`,
                'i',
              );
              const fontVariantNumericProperties = ['fontVariantNumeric'];

              const fontVariantRegex = new RegExp(
                `^(?:normal|none|` +
                  // Main pattern with optional groups
                  `(?:` +
                  // Ligatures group
                  `(?:(?:${commonLig}|${discretionaryLig}|${historicalLig}|${contextualAlt})` +
                  `(?:\\s+(?:${commonLig}|${discretionaryLig}|${historicalLig}|${contextualAlt})){0,3})|` +
                  // Caps group
                  `(?:${capsValues})|` +
                  // Alternates group (including historical-forms)
                  `(?:${alternatesValues}(?:\\s+${alternatesValues})*)|` +
                  // Numeric group
                  `(?:(?:${numericFigureValues}|${numericSpacingValues}|${numericFractionValues}|${numericOtherValues})` +
                  `(?:\\s+(?:${numericFigureValues}|${numericSpacingValues}|${numericFractionValues}|${numericOtherValues})){0,3})|` +
                  // East Asian group
                  `(?:(?:${eastAsianVariantValues}|${eastAsianWidthValues}|${eastAsianRuby})` +
                  `(?:\\s+(?:${eastAsianVariantValues}|${eastAsianWidthValues}|${eastAsianRuby})){0,2})|` +
                  // Position group
                  `(?:${positionValues})|` +
                  // Emoji group
                  `(?:${emojiValues})` +
                  `)` +
                  // Allow multiple groups in any order
                  `(?:\\s+` +
                  `(?:` +
                  `(?:(?:${commonLig}|${discretionaryLig}|${historicalLig}|${contextualAlt})` +
                  `(?:\\s+(?:${commonLig}|${discretionaryLig}|${historicalLig}|${contextualAlt})){0,3})|` +
                  `(?:${capsValues})|` +
                  `(?:${alternatesValues}(?:\\s+${alternatesValues})*)|` +
                  `(?:(?:${numericFigureValues}|${numericSpacingValues}|${numericFractionValues}|${numericOtherValues})` +
                  `(?:\\s+(?:${numericFigureValues}|${numericSpacingValues}|${numericFractionValues}|${numericOtherValues})){0,3})|` +
                  `(?:(?:${eastAsianVariantValues}|${eastAsianWidthValues}|${eastAsianRuby})` +
                  `(?:\\s+(?:${eastAsianVariantValues}|${eastAsianWidthValues}|${eastAsianRuby})){0,2})|` +
                  `(?:${positionValues})|` +
                  `(?:${emojiValues})` +
                  `)` +
                  `)*` +
                  `)$`,
                'i',
              );

              const fontVariantProperties = ['fontVariant'];

              const axisTagDouble = '"wght"|"wdth"|"slnt"|"ital"|"opsz"';
              const axisTagSingle = "'wght'|'wdth'|'slnt'|'ital'|'opsz'";
              const fontVariationSettingsRegex = new RegExp(
                `^(${axisTagDouble}|${axisTagSingle}|${varString})\\s+(${numberPattern})$`,
              );
              const fontVariationSettingsProperties = ['fontVariationSettings'];

              const frPattern = `${numberPattern}fr`;

              const inArrayPattern = '[a-zA-Z][a-zA-Z0-9-_]*';
              const lineNamesString = `\\[\\s*${inArrayPattern}(?:\\s+${inArrayPattern})*\\s*\\]`;
              const lineNamesPattern = `(${lineNamesString}|${varString})`;
              const trackSizeKeywords =
                'auto|min-content|max-content|subgrid|masonry|row|column|row dense|column dense';
              const autoFlowPattern = `(?:auto-flow(?:\\s+dense)?|${varString})?`;

              const gridTrackListPattern = [
                trackSizeKeywords,
                lengthValuePattern,
                frPattern,
                percentagePattern,
                minmaxString,
                fitContentString,
                repeatString,
                varString,
              ].join('|');

              const gridAutoColumnsRegex = new RegExp(
                `^(?:${gridTrackListPattern})(?:\\s+(?:${gridTrackListPattern}))*$`,
              );

              const gridAutoColumnsRowsProperties = [
                'gridAutoColumns',
                'gridAutoRows',
              ];

              const quoteRegex = new RegExp(`${stringString}`);
              const gridTemplateAreasProperties = ['gridTemplateAreas'];

              const gridAreaRowPattern =
                `(?:${lineNamesPattern}\\s+)?` +
                `(?:${stringString}|${varString})?` +
                `(?:\\s+(?:${gridTrackListPattern}))?` +
                `(?:\\s+${lineNamesPattern})?`;

              const explicitTrackPattern =
                `(?:${lineNamesPattern}(?:\\s+|\\s*))?` +
                `(?:${gridTrackListPattern})` +
                `(?:\\s+${lineNamesPattern})?`;

              const gridRegex = new RegExp(
                '^(?:' +
                  // Option 1: Areas with rows and optional columns
                  `(?:${gridAreaRowPattern}|${autoFlowPattern}\\s*)+?` +
                  `(?:\\s*\\/\\s*(?:${explicitTrackPattern}|${autoFlowPattern}(?:\\s+${explicitTrackPattern}|${autoFlowPattern})*)+)?|` +
                  // Option 2: Rows and/or columns
                  `(?:${explicitTrackPattern}|${autoFlowPattern}(?:\\s+${explicitTrackPattern}|${autoFlowPattern})*)+` +
                  `(?:\\s*\\/\\s*(?:${explicitTrackPattern}|${autoFlowPattern}(?:\\s+${explicitTrackPattern}|${autoFlowPattern})*)+)?|` +
                  // Option 3: Columns only (starting with a slash)
                  `\\s*\\/\\s*(?:${explicitTrackPattern}|${autoFlowPattern}(?:\\s+${explicitTrackPattern}|${autoFlowPattern})*)+` +
                  ')$',
              );

              const gridProperties = ['grid'];

              const isTemplateColumns = 'gridTemplateColumns'.includes(key);
              const templateTrackListPattern = [
                trackSizeKeywords,
                lineNamesPattern,
                lengthValuePattern,
                frPattern,
                percentagePattern,
                minmaxString,
                varString,
                ...(isTemplateColumns ? [fitContentString] : []),
              ].join('|');
              const gridTemplateTrackListRegex = new RegExp(
                `^(?:${templateTrackListPattern})(?:\\s+(?:${templateTrackListPattern}))*$`,
              );
              const gridTemplateTrackListProperties = [
                'gridTemplateColumns',
                'gridTemplateRows',
              ];

              const isValidateGridTemplate = (value: string) => {
                if (typeof value !== 'string') return false;

                const gridAreaRowPattern =
                  `(?:${lineNamesPattern}\\s+)?` +
                  `(?:${stringString}|${varString})` +
                  `(?:\\s+(?:${templateTrackListPattern}))?` +
                  `(?:\\s+${lineNamesPattern})?`;

                const explicitTrackPattern =
                  `(?:${lineNamesPattern}(?:\\s+|\\s*))?` +
                  `(?:${templateTrackListPattern}|${repeatString})` +
                  `(?:\\s+${lineNamesPattern})?`;

                return new RegExp(
                  '^(?:' +
                    // Option 1: Areas with rows and optional columns
                    `(?:${gridAreaRowPattern}\\s*)+?` +
                    `(?:\\s*\\/\\s*(?:${explicitTrackPattern}(?:\\s+${explicitTrackPattern})*)+)?|` +
                    // Option 2: Rows and/or columns
                    `(?:${explicitTrackPattern}(?:\\s+${explicitTrackPattern})*)+` +
                    `(?:\\s*\\/\\s*(?:${explicitTrackPattern}(?:\\s+${explicitTrackPattern})*)+)?|` +
                    // Option 3: Columns only (starting with a slash)
                    `\\s*\\/\\s*(?:${explicitTrackPattern}(?:\\s+${explicitTrackPattern})*)+` +
                    ')$',
                ).test(value);
              };

              const gridTemplateProperties = ['gridTemplate'];

              const hyphenateLimitCharsRegex = new RegExp(
                `^(${numberPattern}|auto)( (?!\\s)(${numberPattern}|auto)){0,2}$`,
              );
              const hyphenateLimitCharsProperties = ['hyphenateLimitChars'];

              const imageOrientationRegex = new RegExp(
                `^(${anglePattern})( (?!\\s)(flip|${varString})){0,1}$`,
              );
              const imageOrientationProperties = ['imageOrientation'];

              const initialLetterRegex = new RegExp(
                `^(${numberPattern})( (?!\\s)(${integerPattern}|drop|raise)){0,1}$`,
              );
              const initialLetterProperties = ['initialLetter'];

              const insetPairRegex = new RegExp(
                `^(${lengthValuePattern}|auto)(\\s+(${lengthValuePattern}))?$`,
              );
              const insetPairProperties = ['insetBlock', 'insetInline'];

              const marginPairRegex = new RegExp(
                `^(${lengthValuePattern})(\\s+(${lengthValuePattern}))?$`,
              );
              const marginPairProperties = [
                'marginBlock', //
                'marginInline', //
                'scrollPaddingBlock', // auto
                'scrollPaddingInline', // auto
                'paddingBlock', // not auto
                'paddingInline', // not auto
                'scrollMarginBlock', // not auto
                'scrollMarginInline', // not auto
              ];

              const markerProperties = [
                'marker',
                'markerEnd',
                'markerMid',
                'markerStart',
              ];

              const maskBorderOutsetRegex = new RegExp(
                `^(${lengthValuePattern}|${numberPattern})( (?!\\s)(${lengthValuePattern}|${numberPattern})){0,3}$`,
              );
              const maskBorderOutsetProperties = ['maskBorderOutset'];

              const maskBorderSliceRegex = new RegExp(
                `^(${percentagePattern}|${numberPattern}|fill)( (?!\\s)(${percentagePattern}|${numberPattern}|fill)){0,3}$`,
              );
              const maskBorderSliceProperties = ['maskBorderSlice'];
              const maskBorderWidthRegex = new RegExp(
                `^(${lengthValuePattern}|${numberPattern}|auto)( (?!\\s)(${lengthValuePattern}|${numberPattern}|auto)){0,3}$`,
              );
              const maskBorderWidthProperties = ['maskBorderWidth'];

              const modeKeyword = `luminance|alpha|${varString}`;

              const repeatFullSet = `(${repeatKeyword}|${backgroundRepeatRegex.source.slice(1, -1)})`;

              const maskBorderOutsetSource = maskBorderOutsetRegex.source.slice(
                1,
                -1,
              );
              const maskBorderSliceSource = maskBorderSliceRegex.source.slice(
                1,
                -1,
              );
              const maskBorderWidthSource = maskBorderWidthRegex.source.slice(
                1,
                -1,
              );

              const maskBorderRegex = new RegExp(
                `^(?:${gradientString}|${urlString})` +
                  `(?:\\s+${maskBorderSliceSource})?` +
                  `(?:\\s?/\\s?${maskBorderWidthSource})?` +
                  `(?:\\s?/\\s?${maskBorderOutsetSource})?` +
                  `(?:\\s+(?:${repeatFullSet}))?` +
                  `(?:\\s+(?:${modeKeyword}))?$`,
              );
              const maskBorderProperties = ['maskBorder'];

              const maskClipKeyword =
                geometryBaseSet +
                `|no-clip|border|padding|content|text|${varString}`;
              const maskClipRegex = new RegExp(
                `^(${maskClipKeyword})(,\\s*(${maskClipKeyword}))*$`,
              );
              const maskClipProperties = ['maskClip'];

              const compositeKeyword = `add|subtract|intersect|exclude|${varString}`;
              const maskCompositeRegex = new RegExp(
                `^(${compositeKeyword})(,\\s*(${compositeKeyword}))*$`,
              );
              const maskCompositeProperties = ['maskComposite'];

              const maskModeKeyword = `alpha|luminance|match-source|${varString}`;
              const maskModeRegex = new RegExp(
                `^(${maskModeKeyword})(,\\s*(${maskModeKeyword}))*$`,
              );
              const maksModeProperties = ['maskMode'];

              const maskOriginKeyword =
                geometryBaseSet + `|content|padding|border|${varString}`;
              const maskOriginRegex = new RegExp(
                `^(${maskOriginKeyword})(,\\s*(${maskOriginKeyword}))*$`,
              );
              const maskOriginProperties = ['maskOrigin'];

              const maskPositionRegex = new RegExp(
                `^(?:(${lengthValuePattern}|${positionKeyword})( (?!\\s)(${lengthValuePattern}|${positionKeyword})){0,3})(?:,\\s*(${lengthValuePattern}|${positionKeyword})( (?!\\s)(${lengthValuePattern}|${positionKeyword})){0,3})*$`,
              );
              const maskPositionProperties = ['maskPosition'];

              const maskRepeatRegex = new RegExp(
                `^(${backgroundRepeatSource})(,\\s*(${backgroundRepeatSource}))*$`,
              );
              const maskRepeatProperties = ['maskRepeat'];

              const maskRepeatKeyword = 'stretch|repeat|round|space';
              const maskBorderRepeatRegex = new RegExp(
                `^((?:${maskRepeatKeyword}|${varString})(?:\\s+(?:${maskRepeatKeyword}|${varString}))?)$`,
              );
              const maskBorderRepeatProperties = [
                'maskBorderRepeat',
                'borderImageRepeat',
              ];

              const maskSizeRegex = new RegExp(
                `^(${lengthValuePattern}|cover|contain|auto)(\\s+(${lengthValuePattern}|cover|contain|auto))?(,\\s*(${lengthValuePattern}|cover|contain|auto)(\\s+(${lengthValuePattern}|cover|contain|auto))?)*$`,
              );
              const maskSizeProperties = ['maskSize'];

              const position = `${positionKeyword}|${lengthValuePattern}`;
              const bgSize = `${lengthValuePattern}|cover|contain|auto`;
              const positionPair = `(${position})( (?!\\s)(${position})){0,1}?`;
              const bgSizePair = `(${bgSize})( (?!\\s)(${bgSize})){0,1}?`;

              const maskLayerRegex =
                `(?:${gradientString}|${urlString})` +
                `(?:\\s+${positionPair})?` +
                `(?:\\s?/\\s?${bgSizePair})?` +
                `(?:\\s+${backgroundRepeatSource})?` +
                `(?:\\s+${maskOriginKeyword})?` +
                `(?:\\s+${maskClipKeyword})?` +
                `(?:\\s+${compositeKeyword})?` +
                `(?:\\s+${maskModeKeyword})?`;
              const maskRegex = new RegExp(
                `^${maskLayerRegex}(?:,(?:\\s+${maskLayerRegex}))*$`,
              );
              const maskProperties = ['mask'];

              const mathDepthRegex = new RegExp(
                `^(${addString}|${integerPattern})$`,
              );
              const mathDepthProperties = ['mathDepth'];

              const lengthPositionRegex = new RegExp(
                `^(${lengthValuePattern}|${positionKeyword})( (?!\\s)(${lengthValuePattern}|${positionKeyword})){0,3}$`,
              );

              const lengthPositionProperties = [
                'objectPosition',
                'offsetAnchor',
                'offsetPosition',
                'perspectiveOrigin',
              ];

              const rayString = 'ray\\([^\\)]+\\)';
              const offsetPathRegex = new RegExp(
                `^(${rayString}|${urlString}|${basicShapeString}|${geometryBaseSet})$`,
              );
              const offsetPathProperties = ['offsetPath'];

              const offsetRotateRegex = new RegExp(
                `^(${anglePattern}|auto|reverse)( (?!\\s)(${anglePattern})){0,1}$`,
              );
              const offsetRotateProperties = ['offsetRotate'];

              const offsetPositionSource = lengthPositionRegex.source.slice(
                1,
                -1,
              );
              const offsetRotateSource = offsetRotateRegex.source.slice(1, -1);
              // distance at use lengthValuePattern
              const offsetPathSource = offsetPathRegex.source.slice(1, -1);

              const offsetRegex = new RegExp(
                `^(?!\\s)(?=\\S)(${offsetPositionSource})?\\s*(${offsetPathSource}(\\s(${lengthValuePattern}(\\s+${offsetRotateSource})?|${offsetRotateSource}))?)?\\s*(\\/\\s*${offsetPositionSource})?(?<!\\s)$`,
              );
              const offsetProperties = ['offset'];

              const oveflowKeyword = `visible|hidden|clip|scroll|auto|${varString}`;
              const oveflowRegex = new RegExp(
                `^(${oveflowKeyword})(\\s+(${oveflowKeyword}))?$`,
              );
              const oveflowProperties = ['overflow'];

              const overflowClipMarginRegex = new RegExp(
                `^(?:${lengthValuePattern}$|${visualBox}$|${lengthValuePattern}\\s+${visualBox}$|${visualBox}\\s+${lengthValuePattern}$)`,
              );
              const overflowClipMarginProperties = ['overflowClipMargin'];

              const overscrollBehaviorRegex = new RegExp(
                `^(auto|contain|${varString})( (?!\\s)(auto|contain|${varString})){0,1}$`,
              );
              const overscrollBehaviorProperties = ['overscrollBehavior'];

              const fill = `(fill|${varString})`;
              const stroke = `(stroke|${varString})`;
              const markers = `(markers|${varString})`;

              const paintOrderPattern =
                `(?:(${fill})(\\s+(${stroke}))?(\\s+(${markers}))?)?` +
                `(?:(${fill})(\\s+(${markers}))?(\\s+(${stroke}))?)?` +
                `(?:(${stroke})(\\s+(${fill}))?(\\s+(${markers}))?)?` +
                `(?:(${stroke})(\\s+(${markers}))?(\\s+(${fill}))?)?` +
                `(?:(${markers})(\\s+(${fill}))?(\\s+(${stroke}))?)?` +
                `(?:(${markers})(\\s+(${stroke}))?(\\s+(${fill}))?)?`;
              const paintOrderRegex = new RegExp(`^(${paintOrderPattern})$`);
              const paintOrderProperties = ['paintOrder'];

              const quotesRegex = new RegExp(
                `^(${stringString}|${varString})(\\s(${stringString}|${varString}))*$`,
              );
              const quotesProperties = ['quotes'];

              const rotatePattern =
                `(?:(x|y|z|${varString})\\s+${anglePattern})?` +
                `(?:${numberPattern}\\s+${numberPattern}\\s+${numberPattern}\\s+${anglePattern})?` +
                `(?:${anglePattern})?`;
              const rotateRegex = new RegExp(`^(${rotatePattern})$`);
              const rotateProperties = ['rotate'];

              const numberAndPercentagePattern = `${numberPattern}|${percentagePattern}`;
              const scaleRegex = new RegExp(
                `^(${numberAndPercentagePattern})( (?!\\s)(${numberAndPercentagePattern})){0,2}$`,
              );
              const scaleProperties = ['scale'];

              const scrollMarginRegex = new RegExp(
                `^(${lengthValuePattern})( (?!\\s)(${lengthValuePattern})){0,3}$`,
              );
              const scrollMarginProperties = ['scrollMargin'];

              const scrollPaddingRegex = new RegExp(
                `^(${lengthValuePattern}|auto)( (?!\\s)(${lengthValuePattern}|auto)){0,3}$`,
              );
              const scrollPaddingProperties = ['scrollPadding'];

              const scrollbarColorRegex = new RegExp(
                `^(${colorSource}(\\s${colorSource})?)$`,
              );
              const scrollbarColorProperties = ['scrollbarColor'];

              const shapeImageThresholdRegex = new RegExp(
                `^(${numberAndPercentagePattern})$`,
              );
              const shapeImageThresholdProperties = ['shapeImageThreshold'];

              const outsideShape = `(${insetString}|${circleString}|${ellipseString}|${polygonString}|${varString})`;

              const shapeVisualBox = 'margin-box|' + visualBox;
              const shapeOutsideRegex = new RegExp(
                `^(?:` +
                  `(?:${outsideShape}(?:\\s+${shapeVisualBox})?)|` +
                  `(?:${shapeVisualBox}(?:\\s+${outsideShape})?)|` +
                  `${gradientString}|${urlString}|${varString}` +
                  `)$`,
              );
              const shapeOutsideProperties = ['shapeOutside'];

              const strokeRegex = new RegExp(
                `^${gradientString}|${urlString}|${colorSource}$`,
              );
              const strokeProperties = ['stroke'];

              const strokeDasharrayRegex = new RegExp(
                `^(${numberPattern}|${lengthValuePattern})(,\\s(${numberPattern}|${lengthValuePattern}))*$`,
              );
              const strokeDasharrayProperties = ['strokeDasharray'];

              const strokeMiterlimitRegex = new RegExp(`^(${numberPattern})$`);
              const strokeMiterlimitProperties = ['strokeMiterlimit'];

              const isValidTextDecorationLine = (value: string) => {
                const decorationValues = [
                  'underline',
                  'overline',
                  'line-through',
                  'blink',
                ];
                const usedValues = new Set();

                const trimmedValue = value.trim();
                if (value !== trimmedValue) {
                  return false;
                }

                const tokens = value.trim().split(/\s+/);

                return tokens.every((token) => {
                  if (token.startsWith('var(') && varRegex.test(token)) {
                    return true;
                  }

                  if (
                    decorationValues.includes(token) ||
                    varString.includes(token)
                  ) {
                    return !usedValues.has(token) && usedValues.add(token);
                  }

                  return false;
                });
              };
              const textDecorationProperties = ['textDecorationLine'];

              const textIndentRegex = new RegExp(
                `^(${lengthValuePattern})(\\s(hanging|${varString})?)?(\\s(each-line|${varString})?)?$`,
              );
              const textIndentProperties = ['textIndent'];

              const textShadowRegex = new RegExp(
                `^(?:(?:(${colorSource})\\s+)?(${lengthValuePattern})\\s+(${lengthValuePattern})(?:\\s+(${lengthValuePattern}))?(?:\\s+(${colorSource}))?(?:\\s*,\\s*(?:(${colorSource})\\s+)?(${lengthValuePattern})\\s+(${lengthValuePattern})(?:\\s+(${lengthValuePattern}))?(?:\\s+(${colorSource}))?)*|none)$`,
              );
              const textShadowProperties = ['textShadow'];

              const alignKeyword = `start|end|center|flex-start|flex-end|${varString}`;
              const firstLast = `first|last|${varString}`;
              const baseline = `baseline|${varString}`;
              const touchActionProperties = ['touchAction'];
              const alignContentRegex = new RegExp(
                `^(((safe|unsafe|${varString})\\s+(${alignKeyword}))|(${firstLast})\\s+(${baseline}))$`,
              );
              const alignContentProperties = ['alignContent'];

              const itemsSelfKeyword = `self-start|self-end|anchor-center|start|end|center|flex-start|flex-end|${varString}`;
              const alignItemsSelfRegex = new RegExp(
                `^(((safe|unsafe|${varString})\\s+(${itemsSelfKeyword}))|(${firstLast})\\s+(${baseline}))$`,
              );
              const alignItemsSelfProperties = ['alignItems', 'alignSelf'];

              const leftGroup = `block|inline|${varString}`;
              const rightGroup = `flex|flow|flow-root|table|grid|ruby|math|run-in|${varString}`;
              const listItem = `list-item|${varString}`;
              const listItemRightGroup = `block|inline|flow|flow-root|run-in|${varString}`;
              const displayRegex = new RegExp(
                `^(((${leftGroup})\\s+(${rightGroup}))|(${listItem})\\s+(${listItemRightGroup}))$`,
              );
              const displayProperties = ['display'];

              const direction = 'row|row-reverse|column|column-reverse';
              const wrap = 'nowrap|wrap|wrap-reverse';
              const flexFlowRegex = new RegExp(
                `^((${direction}|${varString})(\\s+(${wrap}|${varString})))$`,
              );
              const flexFlowProperties = ['flexFlow'];

              const first = `(first|${varString})`;
              const last = `(last|${varString})`;
              const forceAllow = `(force-end|allow-end|${varString})`;

              const hangingPunctuationPattern =
                `(?:${first}(?:\\s+${forceAllow})?)?` +
                `(?:${last}(?:\\s+${forceAllow})?)?` +
                `(?:${first}\\s+${forceAllow}\\s+${last})?` +
                `(?:${first}\\s+${last})?`;

              const hangingPunctuationRegex = new RegExp(
                `^(${hangingPunctuationPattern})$`,
              );
              const hangingPunctuationProperties = ['hangingPunctuation'];

              const justifyContentKeyword = `left|right|stretch|start|end|center|flex-start|flex-end|${varString}`;
              const justifyContentRegex = new RegExp(
                `^(((safe|unsafe|${varString})\\s+(${justifyContentKeyword}))|(${firstLast})\\s+(${baseline}))$`,
              );
              const justifyContentProperties = ['justifyContent'];

              const justifyItemsSelfKeyword = `left|right|anchor-center|stretch|self-start|self-end|start|end|center|flex-start|flex-end|${varString}`;
              const justifySelfRegex = new RegExp(
                `^(((safe|unsafe|${varString})\\s+(${justifyItemsSelfKeyword}))|(${firstLast})\\s+(${baseline}))$`,
              );
              const justifySelfProperties = ['justifySelf'];

              const legacyValues = `(legacy|${varString})\\s+(left|right|center|${varString})`;
              const justifyItemsRegex = new RegExp(
                `^(((safe|unsafe|${varString})\\s+(${justifyItemsSelfKeyword}))|(${firstLast})\\s+(${baseline})|(${legacyValues}))$`,
              );
              const justifyItemsProperties = ['justifyItems'];

              const scrollSnapAlignKeyword = 'start|end|center';
              const scrollSnapAlignRegex = new RegExp(
                `^((?:${scrollSnapAlignKeyword}|${varString})(?:\\s+(?:${scrollSnapAlignKeyword}|${varString}))?)$`,
              );
              const scrollSnapAlignProperties = ['scrollSnapAlign'];

              const scrollSnapTypeKeyword = 'x|y|block|inline|both';
              const snapStrictKeyowrd = 'mandatory|proximity';
              const scrollSnapTypeRegex = new RegExp(
                `^((?:${scrollSnapTypeKeyword}|${varString})(?:\\s+(?:${snapStrictKeyowrd}|${varString}))?)$`,
              );
              const scrollSnapTypeProperties = ['scrollSnapType'];

              const leftRight = `left|right|${varString}`;
              const overUnder = `over|under|${varString}`;

              const textEmphasisPositionRegex = new RegExp(
                `^(((?:${overUnder})(?:\\s+(?:${leftRight}))|(?:${leftRight})(?:\\s+(?:${overUnder})))?)$`,
              );
              const textEmphasisPositionProperties = ['textEmphasisPosition'];

              const filledOpen = `filled|open|${varString}`;
              const emphasisStyleKeyword = `dot|circle|double-circle|triangle|sesame|${varString}`;
              const textEmphasisStyleRegex = new RegExp(
                `^(((?:${filledOpen})(?:\\s+(?:${emphasisStyleKeyword})))?|${stringString}?)$`,
              );
              const textEmphasisStyleProperties = ['textEmphasisStyle'];

              const textEmphasisStyleSource =
                textEmphasisStyleRegex.source.slice(1, -1);
              const textEmphasisRegex = new RegExp(
                `^(${textEmphasisStyleSource})(\\s(${colorSource}))?$`,
              );
              const textEmphasisProperties = ['textEmphasis'];

              const transformValue = `(${lengthValuePattern}|left|center|right|top|bottom)`;
              const transformOriginRegex = new RegExp(
                `^(${transformValue})(\\s(${transformValue}))?(\\s(${transformValue}))?$`,
              );
              const transformOriginProperties = ['transformOrigin'];

              const transformRegex = new RegExp(
                `^((${transformFunctions})(\\s+(${transformFunctions}))*)?$`,
              );
              const transformProperties = ['transform'];

              const translateRegex = new RegExp(
                `^(${lengthValuePattern}|${percentagePattern})(\\s(${lengthValuePattern}|${percentagePattern}))?(\\s(${lengthValuePattern}))?$`,
              );
              const translateProperties = ['translate'];

              const placeContentProperties = ['placeContent'];
              const placeItemsProperties = ['placeItems'];
              const placeSelfProperties = ['placeSelf'];

              if (translateProperties.includes(key)) {
                if (!translateRegex.test(value) && globalValue) {
                  report();
                }
              } else if (transformProperties.includes(key)) {
                if (!transformRegex.test(value) && globalValue) {
                  report();
                }
              } else if (transformOriginProperties.includes(key)) {
                if (!transformOriginRegex.test(value) && globalValue) {
                  report();
                }
              } else if (textEmphasisProperties.includes(key)) {
                if (!textEmphasisRegex.test(value) && globalValue) {
                  report();
                }
              } else if (textEmphasisStyleProperties.includes(key)) {
                if (!textEmphasisStyleRegex.test(value) && globalValue) {
                  report();
                }
              } else if (textEmphasisPositionProperties.includes(key)) {
                if (!textEmphasisPositionRegex.test(value) && globalValue) {
                  report();
                }
              } else if (scrollSnapTypeProperties.includes(key)) {
                if (!scrollSnapTypeRegex.test(value) && globalValue) {
                  report();
                }
              } else if (scrollSnapAlignProperties.includes(key)) {
                if (!scrollSnapAlignRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskBorderRepeatProperties.includes(key)) {
                if (!maskBorderRepeatRegex.test(value) && globalValue) {
                  report();
                }
              } else if (justifyItemsProperties.includes(key)) {
                if (!justifyItemsRegex.test(value) && globalValue) {
                  report();
                }
              } else if (justifySelfProperties.includes(key)) {
                if (!justifySelfRegex.test(value) && globalValue) {
                  report();
                }
              } else if (justifyContentProperties.includes(key)) {
                if (!justifyContentRegex.test(value) && globalValue) {
                  report();
                }
              } else if (hangingPunctuationProperties.includes(key)) {
                if (!hangingPunctuationRegex.test(value) && globalValue) {
                  report();
                }
              } else if (flexFlowProperties.includes(key)) {
                if (!flexFlowRegex.test(value) && globalValue) {
                  report();
                }
              } else if (backgroundRepeatProperties.includes(key)) {
                if (!backgroundRepeatRegex.test(value) && globalValue) {
                  report();
                }
              } else if (placeSelfProperties.includes(key)) {
                if (!isValidPlaceSelf(value) && globalValue) {
                  report();
                }
              } else if (placeItemsProperties.includes(key)) {
                if (!isValidPlaceItems(value) && globalValue) {
                  report();
                }
              } else if (placeContentProperties.includes(key)) {
                if (!isValidPlaceContent(value) && globalValue) {
                  report();
                }
              } else if (displayProperties.includes(key)) {
                if (!displayRegex.test(value) && globalValue) {
                  report();
                }
              } else if (alignItemsSelfProperties.includes(key)) {
                if (!alignItemsSelfRegex.test(value) && globalValue) {
                  report();
                }
              } else if (alignContentProperties.includes(key)) {
                if (!alignContentRegex.test(value) && globalValue) {
                  report();
                }
              } else if (touchActionProperties.includes(key)) {
                if (!isValidTouchAction(value) && globalValue) {
                  report();
                }
              } else if (textShadowProperties.includes(key)) {
                if (!textShadowRegex.test(value) && globalValue) {
                  report();
                }
              } else if (textIndentProperties.includes(key)) {
                if (!textIndentRegex.test(value) && globalValue) {
                  report();
                }
              } else if (textDecorationProperties.includes(key)) {
                if (!isValidTextDecorationLine(value) && globalValue) {
                  report();
                }
              } else if (strokeMiterlimitProperties.includes(key)) {
                if (!strokeMiterlimitRegex.test(value) && globalValue) {
                  report();
                }
              } else if (strokeDasharrayProperties.includes(key)) {
                if (!strokeDasharrayRegex.test(value) && globalValue) {
                  report();
                }
              } else if (strokeProperties.includes(key)) {
                if (!strokeRegex.test(value) && globalValue) {
                  report();
                }
              } else if (shapeOutsideProperties.includes(key)) {
                if (!shapeOutsideRegex.test(value) && globalValue) {
                  report();
                }
              } else if (shapeImageThresholdProperties.includes(key)) {
                if (!shapeImageThresholdRegex.test(value) && globalValue) {
                  report();
                }
              } else if (scrollbarColorProperties.includes(key)) {
                if (!scrollbarColorRegex.test(value) && globalValue) {
                  report();
                }
              } else if (scrollPaddingProperties.includes(key)) {
                if (!scrollPaddingRegex.test(value) && globalValue) {
                  report();
                }
              } else if (scrollMarginProperties.includes(key)) {
                if (!scrollMarginRegex.test(value) && globalValue) {
                  report();
                }
              } else if (scaleProperties.includes(key)) {
                if (!scaleRegex.test(value) && globalValue) {
                  report();
                }
              } else if (rotateProperties.includes(key)) {
                if (!rotateRegex.test(value) && globalValue) {
                  report();
                }
              } else if (quotesProperties.includes(key)) {
                if (!quotesRegex.test(value) && globalValue) {
                  report();
                }
              } else if (paintOrderProperties.includes(key)) {
                if (!paintOrderRegex.test(value) && globalValue) {
                  report();
                }
              } else if (overscrollBehaviorProperties.includes(key)) {
                if (!overscrollBehaviorRegex.test(value) && globalValue) {
                  report();
                }
              } else if (overflowClipMarginProperties.includes(key)) {
                if (!overflowClipMarginRegex.test(value) && globalValue) {
                  report();
                }
              } else if (oveflowProperties.includes(key)) {
                if (!oveflowRegex.test(value) && globalValue) {
                  report();
                }
              } else if (offsetProperties.includes(key)) {
                if (!offsetRegex.test(value) && globalValue) {
                  report();
                }
              } else if (offsetPathProperties.includes(key)) {
                if (!offsetPathRegex.test(value) && globalValue) {
                  report();
                }
              } else if (offsetRotateProperties.includes(key)) {
                if (!offsetRotateRegex.test(value) && globalValue) {
                  report();
                }
              } else if (lengthPositionProperties.includes(key)) {
                if (!lengthPositionRegex.test(value)) {
                  report();
                }
              } else if (mathDepthProperties.includes(key)) {
                if (!mathDepthRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskProperties.includes(key)) {
                if (!maskRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskBorderProperties.includes(key)) {
                if (!maskBorderRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskSizeProperties.includes(key)) {
                if (!maskSizeRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskRepeatProperties.includes(key)) {
                if (!maskRepeatRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskPositionProperties.includes(key)) {
                if (!maskPositionRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskOriginProperties.includes(key)) {
                if (!maskOriginRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maksModeProperties.includes(key)) {
                if (!maskModeRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskCompositeProperties.includes(key)) {
                if (!maskCompositeRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskClipProperties.includes(key)) {
                if (!maskClipRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskBorderWidthProperties.includes(key)) {
                if (!maskBorderWidthRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskBorderSliceProperties.includes(key)) {
                if (!maskBorderSliceRegex.test(value) && globalValue) {
                  report();
                }
              } else if (maskBorderOutsetProperties.includes(key)) {
                if (!maskBorderOutsetRegex.test(value) && globalValue) {
                  report();
                }
              } else if (markerProperties.includes(key)) {
                if (!urlRegex.test(value) && globalValue) {
                  report();
                }
              } else if (marginPairProperties.includes(key)) {
                if (!marginPairRegex.test(value) && globalValue) {
                  report();
                }
              } else if (insetPairProperties.includes(key)) {
                if (!insetPairRegex.test(value) && globalValue) {
                  report();
                }
              } else if (initialLetterProperties.includes(key)) {
                if (!initialLetterRegex.test(value) && globalValue) {
                  report();
                }
              } else if (imageOrientationProperties.includes(key)) {
                if (!imageOrientationRegex.test(value) && globalValue) {
                  report();
                }
              } else if (hyphenateLimitCharsProperties.includes(key)) {
                if (!hyphenateLimitCharsRegex.test(value) && globalValue) {
                  report();
                }
              } else if (gridProperties.includes(key)) {
                if (!gridRegex.test(value)) {
                  report();
                }
              } else if (gridTemplateProperties.includes(key)) {
                if (!isValidateGridTemplate(value) && globalValue) {
                  report();
                }
              } else if (gridTemplateTrackListProperties.includes(key)) {
                if (!gridTemplateTrackListRegex.test(value) && globalValue) {
                  report();
                }
              } else if (gridTemplateAreasProperties.includes(key)) {
                if (!quoteRegex.test(value) && globalValue) {
                  report();
                }
              } else if (gridAutoColumnsRowsProperties.includes(key)) {
                if (!gridAutoColumnsRegex.test(value) && globalValue) {
                  report();
                }
              } else if (stringNameProperties.includes(key)) {
                if (!stringNameRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontFeatureSettingsProperties.includes(key)) {
                if (!fontFeatureSettingsRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontVariantProperties.includes(key)) {
                if (!fontVariantRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontVariationSettingsProperties.includes(key)) {
                if (!fontVariationSettingsRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontVariantNumericProperties.includes(key)) {
                if (!fontVariantNumericRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontVariantLigaturesProperties.includes(key)) {
                if (!fontVariantLigaturesRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontVariantEastAsianProperties.includes(key)) {
                if (!isValidFontVariantEastAsian(value) && globalValue) {
                  report();
                }
              } else if (fontVariantAlternatesProperties.includes(key)) {
                if (!fontVariantAlternatesRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontSynthesisProperties.includes(key)) {
                if (!fontSynthesisRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontStyleProperties.includes(key)) {
                if (!fontStyleRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontPaletteProperties.includes(key)) {
                if (!fontPaletteRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontSizeAdjustProperties.includes(key)) {
                if (!isValidFontSizeAdjust(value) && globalValue) {
                  report();
                }
              } else if (stringStringProperties.includes(key)) {
                if (!stringValueRegex.test(value) && globalValue) {
                  report();
                }
              } else if (fontStretchProperties.includes(key)) {
                if (!percentageValueRegex.test(value) && globalValue) {
                  report();
                }
              } else if (flexProperty.includes(key)) {
                if (!isValidFlexValue(value) && globalValue) {
                  report();
                }
              } else if (cursorProperty.includes(key)) {
                if (!isValidCursor(value) && globalValue) {
                  report();
                }
              } else if (contentProperty.includes(key)) {
                if (!contentValueRegex.test(value) && globalValue) {
                  report();
                }
              } else if (columnsProperties.includes(key)) {
                if (!columnsRegex.test(value) && globalValue) {
                  report();
                }
              } else if (clipPathProperties.includes(key)) {
                if (!clipPathRegex.test(value) && globalValue) {
                  report();
                }
              } else if (boxShadowProperties.includes(key)) {
                if (!boxShadowRegex.test(value) && globalValue) {
                  report();
                }
              } else if (backgroundProperties.includes(key)) {
                if (!backgroundRegex.test(value) && globalValue) {
                  report();
                }
              } else if (backgroundAttachmentProperties.includes(key)) {
                if (!backgroundAttachmentRegex.test(value) && globalValue) {
                  report();
                }
              } else if (backgroundBlendModeProperties.includes(key)) {
                if (!backgroundBlendModeRegex.test(value) && globalValue) {
                  report();
                }
              } else if (backgroundImageProperties.includes(key)) {
                if (!backgroundImageRegex.test(value) && globalValue) {
                  report();
                }
              } else if (backgroundOriginProperties.includes(key)) {
                if (!backgroundOriginRegex.test(value) && globalValue) {
                  report();
                }
              } else if (backgroundQuadProperties.includes(key)) {
                if (!backgroundQuadRegex.test(value) && globalValue) {
                  report();
                }
              } else if (backgroundPairProperties.includes(key)) {
                if (!backgroundPairRegex.test(value) && globalValue) {
                  report();
                }
              } else if (filterProperties.includes(key)) {
                if (!filterRegex.test(value) && globalValue) {
                  report();
                }
              } else if (animationTimingFunctionProperties.includes(key)) {
                if (!animationTimingFunctionRegex.test(value) && globalValue) {
                  report();
                }
              } else if (animationIterationCountProperties.includes(key)) {
                if (!animationIterationCountRegex.test(value) && globalValue) {
                  report();
                }
              } else if (animationPlayStateProperties.includes(key)) {
                if (!animationPlayStateRegex.test(value) && globalValue) {
                  report();
                }
              } else if (animationFillModeProperties.includes(key)) {
                if (!animationFillModeRegex.test(value) && globalValue) {
                  report();
                }
              } else if (animationDirectionProperties.includes(key)) {
                if (!animationDirectionRegex.test(value) && globalValue) {
                  report();
                }
              } else if (animationTimeProperties.includes(key)) {
                if (!animationTimeRegex.test(value) && globalValue) {
                  report();
                }
              } else if (aspectRatioProperties.includes(key)) {
                if (!aspectRatioRegex.test(value) && globalValue) {
                  report();
                }
              } else if (borderImageProperties.includes(key)) {
                if (!borderImageRegex.test(value) && globalValue) {
                  report();
                }
              } else if (borderImageSlice.includes(key)) {
                if (!sliceRegex.test(value) && globalValue) {
                  report();
                }
              } else if (ImageSourceProperties.includes(key)) {
                if (!imageRegex.test(value) && globalValue) {
                  report();
                }
              } else if (borderProperties.includes(key)) {
                if (!isBorderValue(value) && globalValue) {
                  report();
                }
              } else if (singleColorProperties.includes(key)) {
                if (!colorRegex.test(value) && globalValue) {
                  report();
                }
              } else if (borderColorProperties.includes(key)) {
                if (!isValidMultipleColorValues(value) && globalValue) {
                  report();
                }
              } else if (integerGroupProperties.includes(key)) {
                if (!integerValueRegex.test(value) && globalValue) {
                  report();
                }
              } else if (otherGroupProperties.includes(key)) {
                if (!otherSingleValueRegex.test(value) && globalValue) {
                  report();
                }
              } else if (lengthValueProperties.includes(key)) {
                if (!lengthValueRegex.test(value) && globalValue) {
                  report();
                }
              } else if (borderRadiusProperties.includes(key)) {
                if (!borderRadiusRegex.test(value) && globalValue) {
                  report();
                }
              } else if (borderStyleProperties.includes(key)) {
                if (!borderStyleRegex.test(value) && globalValue) {
                  report();
                }
              } else if (multipleValueProperties.includes(key)) {
                if (!multipleValueRegex.test(value) && globalValue) {
                  report();
                }
              } else {
                if (globalValue) {
                  report();
                }
              }
            }
          }
        });
      },
    };
  },
});
