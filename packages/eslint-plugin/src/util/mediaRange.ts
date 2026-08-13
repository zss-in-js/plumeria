const RANGE =
  /^@media\s*\(\s*(min|max)-(width|height)\s*:\s*([+-]?(?:\d+\.?\d*|\.\d+))([a-z%]*)\s*\)\s*$/i;

type Range = {
  bound: 'min' | 'max';
  axis: string;
  value: number;
  unit: string;
};

const parseRange = (condition: string): Range | null => {
  const match = RANGE.exec(condition.trim());
  if (!match) return null;

  return {
    bound: match[1].toLowerCase() as 'min' | 'max',
    axis: match[2].toLowerCase(),
    value: Number(match[3]),
    unit: match[4].toLowerCase(),
  };
};

/**
 * True when every viewport matching `narrow` also matches `broad`, which is the
 * only shape where one condition can be said to be the more specific of the two.
 * A query this cannot read — two features, a keyword, `@supports`, a container —
 * is left alone rather than guessed at.
 */
export const impliesCondition = (narrow: string, broad: string): boolean => {
  const a = parseRange(narrow);
  const b = parseRange(broad);
  if (!a || !b) return false;
  if (a.bound !== b.bound || a.axis !== b.axis || a.unit !== b.unit)
    return false;

  return a.bound === 'min' ? a.value > b.value : a.value < b.value;
};
