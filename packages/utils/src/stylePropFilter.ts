const CORE = '@plumeria/core';

const isIdentifierStart = (c: number) =>
  (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 || c === 36;

const isNameChar = (c: number) =>
  isIdentifierStart(c) || (c >= 48 && c <= 57) || c === 46 || c === 45;

const isSpace = (c: number) => c === 32 || c === 9 || c === 10 || c === 13;

const EXPRESSION_BEFORE = new Set(
  Array.from('(,=:[!&|?{};+-*%<>~^', (c) => c.charCodeAt(0)),
);

const EXPRESSION_WORDS = new Set([
  'return',
  'yield',
  'default',
  'else',
  'case',
  'await',
  'do',
  'typeof',
  'void',
  'in',
  'of',
  'new',
  'delete',
  'throw',
]);

const MODE_CODE = 0;
const MODE_TAG = 1;
const MODE_CHILDREN = 2;

const attributeAt = (source: string, index: number, name: string) => {
  if (index > 0 && isNameChar(source.charCodeAt(index - 1))) return false;
  let i = index + name.length;
  while (i < source.length && isSpace(source.charCodeAt(i))) i++;
  if (source.charCodeAt(i) !== 61) return false;
  i++;
  while (i < source.length && isSpace(source.charCodeAt(i))) i++;
  return source.charCodeAt(i) === 123;
};

const hasAttributeCandidate = (source: string, name: string) => {
  for (
    let i = source.indexOf(name);
    i !== -1;
    i = source.indexOf(name, i + 1)
  ) {
    if (attributeAt(source, i, name)) return true;
  }
  return false;
};

const wordBefore = (source: string, end: number) => {
  let start = end;
  while (start > 0 && isNameChar(source.charCodeAt(start - 1))) start--;
  return source.slice(start, end);
};

const closingQuote = (
  source: string,
  start: number,
  quote: number,
  multiline: boolean,
) => {
  for (let i = start + 1; i < source.length; i++) {
    const c = source.charCodeAt(i);
    if (c === 92) {
      i++;
      continue;
    }
    if (c === quote) return i;
    if (c === 10 && !multiline) return -1;
  }
  return -1;
};

const writesAttribute = (source: string, name: string): boolean => {
  const first = name.charCodeAt(0);
  const stack: string[] = [];
  let mode = MODE_CODE;
  let previous = 0;
  let previousEnd = 0;

  const leaveElement = () => {
    mode = stack[stack.length - 1] === 'element' ? MODE_CHILDREN : MODE_CODE;
    previous = 41;
  };

  const templateEnd = (from: number) => {
    for (let i = from; i < source.length; i++) {
      const c = source.charCodeAt(i);
      if (c === 92) {
        i++;
        continue;
      }
      if (c === 96) return i;
      if (c === 36 && source.charCodeAt(i + 1) === 123) {
        stack.push('template');
        return i + 1;
      }
    }
    return -1;
  };

  for (let i = 0; i < source.length; i++) {
    const c = source.charCodeAt(i);
    if (
      c === first &&
      source.startsWith(name, i) &&
      attributeAt(source, i, name)
    )
      return true;

    if (mode === MODE_TAG) {
      if (c === 47 && source.charCodeAt(i + 1) === 62) {
        i++;
        leaveElement();
      } else if (c === 62) {
        stack.push('element');
        mode = MODE_CHILDREN;
      } else if (c === 123) {
        stack.push('attribute');
        mode = MODE_CODE;
        previous = 123;
      } else if (c === 34 || c === 39) {
        const end = closingQuote(source, i, c, true);
        if (end === -1) return true;
        i = end;
      }
      continue;
    }

    if (mode === MODE_CHILDREN) {
      if (c === 123) {
        stack.push('child');
        mode = MODE_CODE;
        previous = 123;
      } else if (c === 60) {
        if (source.charCodeAt(i + 1) === 47) {
          const end = source.indexOf('>', i);
          if (end === -1) return true;
          i = end;
          stack.pop();
          leaveElement();
        } else {
          mode = MODE_TAG;
        }
      }
      continue;
    }

    if (isSpace(c)) continue;

    if (c === 47 && source.charCodeAt(i + 1) === 47) {
      const end = source.indexOf('\n', i);
      if (end === -1) return false;
      i = end;
      continue;
    }
    if (c === 47 && source.charCodeAt(i + 1) === 42) {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) return true;
      i = end + 1;
      continue;
    }
    if (c === 39 || c === 34) {
      const end = closingQuote(source, i, c, false);
      if (end === -1) return true;
      i = end;
      previous = c;
      continue;
    }
    if (c === 96) {
      const end = templateEnd(i + 1);
      if (end === -1) return true;
      i = end;
      previous = 96;
      continue;
    }
    if (c === 123) {
      stack.push('brace');
      previous = c;
      continue;
    }
    if (c === 125) {
      const kind = stack.pop();
      if (kind === 'template') {
        const end = templateEnd(i + 1);
        if (end === -1) return true;
        i = end;
        previous = 96;
        continue;
      }
      if (kind === 'attribute') {
        mode = MODE_TAG;
        continue;
      }
      if (kind === 'child') {
        mode = MODE_CHILDREN;
        continue;
      }
      if (kind !== 'brace') return true;
      previous = c;
      continue;
    }

    const afterUpdate =
      (previous === 43 || previous === 45) &&
      source.charCodeAt(previousEnd - 2) === previous;
    const expressionStart =
      previous === 0 ||
      (EXPRESSION_BEFORE.has(previous) && !afterUpdate) ||
      (isNameChar(previous) &&
        EXPRESSION_WORDS.has(wordBefore(source, previousEnd)));

    if (c === 47 && expressionStart) {
      let end = i + 1;
      let inClass = false;
      for (; end < source.length; end++) {
        const d = source.charCodeAt(end);
        if (d === 92) {
          end++;
          continue;
        }
        if (d === 10) break;
        if (d === 91) inClass = true;
        else if (d === 93) inClass = false;
        else if (d === 47 && !inClass) break;
      }
      if (source.charCodeAt(end) === 47) {
        i = end;
        previous = 41;
        continue;
      }
    }

    if (c === 60 && expressionStart) {
      const next = source.charCodeAt(i + 1);
      if (isIdentifierStart(next) || next === 62) {
        mode = MODE_TAG;
        continue;
      }
    }

    previous = c;
    previousEnd = i + 1;
  }
  return false;
};

export const usesStyleProp = (
  source: string,
  styleProp: string,
  filePath: string,
): boolean => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.mts')) return false;
  if (!styleProp || !hasAttributeCandidate(source, styleProp)) return false;
  return writesAttribute(source, styleProp);
};

export const needsCompile = (
  source: string,
  styleProp: string,
  filePath: string,
): boolean =>
  source.includes(CORE) || usesStyleProp(source, styleProp, filePath);
