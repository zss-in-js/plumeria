export function splitCssRules(css: string): string[] {
  const rules: string[] = [];
  let currentRule = '';
  let depth = 0;
  let inComment = false;
  let inString: string | null = null;

  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    const nextChar = css[i + 1];

    if (inComment) {
      currentRule += char;
      if (char === '*' && nextChar === '/') {
        currentRule += '/';
        i++;
        inComment = false;
      }
      continue;
    }

    if (char === '/' && nextChar === '*') {
      currentRule += '/*';
      i++;
      inComment = true;
      continue;
    }

    if (inString) {
      currentRule += char;

      if (char === '\\') {
        if (nextChar) {
          currentRule += nextChar;
          i++;
        }
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      currentRule += char;
      inString = char;
      continue;
    }

    currentRule += char;

    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;

      if (depth === 0) {
        const trimmed = currentRule.trim();
        if (trimmed) rules.push(trimmed);
        currentRule = '';
      }
    } else if (char === ';' && depth === 0) {
      const trimmed = currentRule.trim();
      if (trimmed) rules.push(trimmed);
      currentRule = '';
    }
  }

  const trimmed = currentRule.trim();
  if (trimmed && depth === 0) {
    rules.push(trimmed);
  }

  return rules;
}
