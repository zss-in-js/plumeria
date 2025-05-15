const colorNames = [
  'currentColor',
  'transparent',
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
].join('|')

// Numeric patterns (including negative numbers, decimals, and percentages)
const numberPattern = '-?\\d+(?:\\.\\d+)?%?'

// Percentage value pattern
const percentagePattern = `${numberPattern}%`

// Pattern containing angle units
const angleUnit = '(?:deg|grad|rad|turn)?'
const anglePattern = `${numberPattern}${angleUnit}`

// Alpha value (transparency) pattern
const alphaPattern = `(?:\\s/\\s${numberPattern}%?)?`

// Pattern for separating values (comma or space)
const separator = '(?:\\s?,\\s?|\\s{1})'

// Hex color code pattern
const hexPattern = '#(?:[0-9a-fA-F]{3,8})'

// RGB function pattern
const rgbFunctionName = 'rgb(?:a)?'
const rgbCommaParameters = `\\(\\s*${numberPattern}(?:\\s*,\\s*${numberPattern}){2}(?:\\s*,\\s*${numberPattern}%?)?\\s*\\)`
const rgbSpaceParameters = `\\(\\s*${numberPattern}(?:\\s+${numberPattern}){2}${alphaPattern}\\s*\\)`
const rgbPattern = `${rgbFunctionName}(?:${rgbCommaParameters}|${rgbSpaceParameters})`

// HSL function pattern
const hslFunctionName = 'hsl(?:a)?'
const hslCommaParameters = `\\(\\s*${anglePattern}(?:\\s*,\\s*${percentagePattern}){2}(?:\\s*,\\s*${numberPattern}%?)?\\s*\\)`
const hslSpaceParameters = `\\(\\s*${anglePattern}(?:\\s+${percentagePattern}){2}${alphaPattern}\\s*\\)`
const hslPattern = `${hslFunctionName}(?:${hslCommaParameters}|${hslSpaceParameters})`

// HWB function pattern
const hwbFunctionName = 'hwb'
const hwbCommaParameters = `\\(\\s*${anglePattern}(?:\\s*,\\s*${percentagePattern}){2}(?:\\s*,\\s*${numberPattern}%?)?\\s*\\)`
const hwbSpaceParameters = `\\(\\s*${anglePattern}(?:\\s+${percentagePattern}){2}${alphaPattern}\\s*\\)`
const hwbPattern = `${hwbFunctionName}(?:${hwbCommaParameters}|${hwbSpaceParameters})`

// LAB/OKLAB function pattern
const labFunctionName = '(?:lab|oklab)'
const labParameters = `\\(\\s*${percentagePattern}(?:\\s+${numberPattern}){2}${alphaPattern}\\s*\\)`
const labPattern = `${labFunctionName}${labParameters}`

// LCH/OKLCH function pattern
const lchFunctionName = '(?:lch|oklch)'
const lchParameters = `\\(\\s*${percentagePattern}(?:\\s+${numberPattern}){2}${alphaPattern}\\s*\\)`
const lchPattern = `${lchFunctionName}${lchParameters}`

// color function pattern
const colorFunctionName = 'color'
const colorSpaces =
  '(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|rec2100-pq|rec2100-hlg|rec2100-linear|jzazbz|ictcp|xyz|xyz-d50|xyz-d65)'
const colorParameters = `\\(\\s*${colorSpaces}(?:${separator}${numberPattern}){3}${alphaPattern}\\s*\\)`
const colorFunctionPattern = `${colorFunctionName}${colorParameters}`

// overall pattern of color values
const colorValue = `(?:${hexPattern}|${rgbPattern}|${hslPattern}|${hwbPattern}|${labPattern}|${lchPattern}|${colorFunctionPattern}|${colorNames})`

module.exports = { colorValue }
