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

export function areExclusive(first: string, second: string): boolean {
  const left = new Set(statesOf(first));
  const right = new Set(statesOf(second));

  for (const a of left) {
    for (const b of right) {
      if (a === b) continue;
      if (negationOf(a) === b || negationOf(b) === a) return true;
      if (EXCLUSIVE_PAIRS.includes([a, b].sort().join('\0'))) return true;
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
