import { getPseudoElement } from 'zss-engine';

const LEGACY_PSEUDO_ELEMENTS = new Set([
  'before',
  'after',
  'first-line',
  'first-letter',
]);

const EXCLUSIVE_PAIRS = [
  [':link', ':visited'],
  [':enabled', ':disabled'],
  [':read-only', ':read-write'],
  [':valid', ':invalid'],
  [':in-range', ':out-of-range'],
  [':required', ':optional'],
  [':user-valid', ':user-invalid'],
  [':playing', ':paused'],
  [':dir(ltr)', ':dir(rtl)'],
  [':nth-child(odd)', ':nth-child(even)'],
  [':nth-last-child(odd)', ':nth-last-child(even)'],
  [':nth-of-type(odd)', ':nth-of-type(even)'],
  [':nth-last-of-type(odd)', ':nth-last-of-type(even)'],
].map((pair) => pair.slice().sort().join('\0'));

const isNameChar = (char: string) => /[\w-]/.test(char);

const skipName = (selector: string, from: number): number => {
  let index = from;
  while (index < selector.length) {
    if (selector[index] === '\\') {
      index += 2;
      continue;
    }
    if (!isNameChar(selector[index])) break;
    index += 1;
  }
  return index;
};

const findClose = (selector: string, open: number): number => {
  let depth = 0;
  for (let index = open; index < selector.length; index++) {
    const char = selector[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      index += 1;
      while (index < selector.length && selector[index] !== char) {
        if (selector[index] === '\\') index += 1;
        index += 1;
      }
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return selector.length;
};

const skipBracket = (selector: string, open: number): number => {
  for (let index = open + 1; index < selector.length; index++) {
    const char = selector[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      index += 1;
      while (index < selector.length && selector[index] !== char) {
        if (selector[index] === '\\') index += 1;
        index += 1;
      }
      continue;
    }
    if (char === ']') return index + 1;
  }
  return selector.length;
};

interface Token {
  text: string;
  isPseudoElement: boolean;
}

export function tokenize(selector: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < selector.length) {
    const char = selector[index];
    const start = index;

    if (char === '#' || char === '.') {
      index = skipName(selector, index + 1);
      tokens.push({
        text: selector.slice(start, index),
        isPseudoElement: false,
      });
      continue;
    }

    if (char === '[') {
      index = skipBracket(selector, index);
      tokens.push({
        text: selector.slice(start, index),
        isPseudoElement: false,
      });
      continue;
    }

    if (char === ':') {
      const doubleColon = selector[index + 1] === ':';
      const nameStart = index + (doubleColon ? 2 : 1);
      const nameEnd = skipName(selector, nameStart);
      const name = selector.slice(nameStart, nameEnd).toLowerCase();
      index = nameEnd;

      let inner = '';
      if (selector[index] === '(') {
        const close = findClose(selector, index);
        inner = selector.slice(index + 1, close);
        index = close + 1;
      }

      const text = selector.slice(start, index);
      const argument = inner ? `(${inner})` : '';

      if (doubleColon || LEGACY_PSEUDO_ELEMENTS.has(name)) {
        tokens.push({
          text: `::${name}${argument}`,
          isPseudoElement: true,
        });
        continue;
      }

      tokens.push({ text, isPseudoElement: false });
      continue;
    }

    if (isNameChar(char) || char === '\\') {
      index = skipName(selector, index);
      tokens.push({
        text: selector.slice(start, index),
        isPseudoElement: false,
      });
      continue;
    }

    index += 1;
  }

  return tokens;
}

export function isStateSelector(selector: string): boolean {
  const tokens = tokenize(selector);
  return (
    tokens.length > 0 &&
    tokens.every(
      (token) =>
        token.isPseudoElement ||
        token.text.startsWith(':') ||
        token.text.startsWith('['),
    )
  );
}

const negationOf = (state: string): string | null => {
  if (!state.startsWith(':not(') || !state.endsWith(')')) return null;
  return state.slice(5, -1).trim();
};

const exactAttributeOf = (state: string) => {
  const match =
    /^\[\s*([\w-]+)\s*=\s*(?:"([^"\\]*)"|'([^'\\]*)'|([\w-]+))\s*([is])?\s*\]$/i.exec(
      state,
    );
  if (!match) return null;
  return {
    name: match[1].toLowerCase(),
    value: match[2] ?? match[3] ?? match[4],
    insensitive: match[5]?.toLowerCase() === 'i',
  };
};

const attributeNameOf = (state: string) =>
  /^\[\s*([\w-]+)/.exec(state)?.[1].toLowerCase() ?? null;

const absentAttribute = (negated: string | null, other: string) =>
  negated !== null &&
  /^\[\s*[\w-]+\s*\]$/.test(negated) &&
  attributeNameOf(negated) === attributeNameOf(other);

const differentAttributeValues = (first: string, second: string) => {
  const a = exactAttributeOf(first);
  const b = exactAttributeOf(second);
  if (!a || !b || a.name !== b.name) return false;
  if (a.insensitive || b.insensitive) {
    return a.value.toLowerCase() !== b.value.toLowerCase();
  }
  return a.value !== b.value;
};

export function areExclusive(first: string, second: string): boolean {
  const left = new Set(statesOf(first));
  const right = new Set(statesOf(second));

  for (const a of left) {
    for (const b of right) {
      if (a === b) continue;
      if (negationOf(a) === b || negationOf(b) === a) return true;
      if (EXCLUSIVE_PAIRS.includes([a, b].sort().join('\0'))) return true;
      if (differentAttributeValues(a, b)) return true;
      if (
        absentAttribute(negationOf(a), b) ||
        absentAttribute(negationOf(b), a)
      )
        return true;
    }
  }
  return false;
}

export function statesOf(selector: string): string[] {
  return tokenize(selector)
    .filter((token) => !token.isPseudoElement)
    .map((token) => token.text);
}

export function compoundOf(first: string, second: string): string {
  const states = [...new Set([...statesOf(first), ...statesOf(second)])];
  states.sort((a, b) => Number(b.startsWith('[')) - Number(a.startsWith('[')));
  return states.join('') + getPseudoElement(first);
}

export function covers(
  compound: string,
  first: string,
  second: string,
): boolean {
  const declared = new Set(statesOf(compound));
  if (getPseudoElement(compound) !== getPseudoElement(first)) return false;
  return [...statesOf(first), ...statesOf(second)].every((state) =>
    declared.has(state),
  );
}
