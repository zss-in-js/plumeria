export const BORDER_BUNDLES = [
  'border',
  'border-block',
  'border-inline',
  'border-top',
  'border-bottom',
  'border-left',
  'border-right',
  'border-block-start',
  'border-block-end',
  'border-inline-start',
  'border-inline-end',
];

const STYLES = new Set([
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
]);

const WIDTH_KEYWORDS = new Set(['thin', 'medium', 'thick']);
const LENGTH = /^[+-]?(\d+\.?\d*|\.\d+)([a-z%]+)?$/i;
const INITIAL = { width: 'medium', style: 'none', color: 'currentcolor' };

const tokenize = (value: string): string[] | null => {
  const tokens: string[] = [];
  let depth = 0;
  let current = '';

  for (const character of value.trim()) {
    if (character === '(') depth++;
    if (character === ')') depth--;
    if (depth === 0 && /\s/.test(character)) {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  if (current) tokens.push(current);

  return depth === 0 && tokens.length > 0 && tokens.length <= 3 ? tokens : null;
};

const isWidth = (token: string): boolean =>
  WIDTH_KEYWORDS.has(token) || LENGTH.test(token) || /^calc\(/i.test(token);

const isColor = (token: string): boolean =>
  /^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color\(|light-dark\()/i.test(token) ||
  /^[a-z-]+$/i.test(token);

/**
 * A shorthand resets whatever it omits to that component's initial value, so an
 * expansion that only writes what the author wrote would change the element.
 * Every component is returned, or nothing is.
 */
export const splitBorderValue = (
  value: string,
): { width: string; style: string; color: string } | null => {
  const tokens = tokenize(value);
  if (!tokens) return null;
  if (
    tokens.some((token) =>
      /\bvar\(|^inherit$|^initial$|^unset$|^revert/i.test(token),
    )
  )
    return null;

  const parts: Partial<Record<'width' | 'style' | 'color', string>> = {};

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (!parts.style && STYLES.has(lower)) {
      parts.style = token;
      continue;
    }
    if (!parts.width && isWidth(lower)) {
      parts.width = token;
      continue;
    }
    if (!parts.color && isColor(token)) {
      parts.color = token;
      continue;
    }
    return null;
  }

  return {
    width: parts.width ?? INITIAL.width,
    style: parts.style ?? INITIAL.style,
    color: parts.color ?? INITIAL.color,
  };
};
