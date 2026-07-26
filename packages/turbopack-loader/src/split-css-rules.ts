export function splitCssRules(css: string): string[] {
  const rules: string[] = [];
  let currentRule = '';
  let depth = 0;
  let inComment = false;
  let inString: string | null = null;
  let hasContent = false;

  const flush = () => {
    const trimmed = currentRule.trim();
    if (trimmed) rules.push(trimmed);
    currentRule = '';
    hasContent = false;
  };

  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    const nextChar = css[i + 1];

    if (inComment) {
      currentRule += char;
      if (char === '*' && nextChar === '/') {
        currentRule += '/';
        i++;
        inComment = false;
        // A top-level comment with no rule attached to it is its own chunk.
        // Gluing it onto whichever rule happens to follow would make that rule's
        // text differ from the freshly generated one, so the rule could never be
        // matched again and would be appended a second time.
        if (depth === 0 && !hasContent) flush();
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
      hasContent = true;
      continue;
    }

    currentRule += char;
    if (char.trim()) hasContent = true;

    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;

      if (depth === 0) flush();
    } else if (char === ';' && depth === 0) {
      flush();
    }
  }

  const trimmed = currentRule.trim();
  if (trimmed && depth === 0) {
    rules.push(trimmed);
  }

  return rules;
}
