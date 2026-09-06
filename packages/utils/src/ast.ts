export function getLeadingCommentLength(source: string): number {
  let i = source.charCodeAt(0) === 0xfeff ? 1 : 0;
  const len = source.length;

  if (source.startsWith('#!', i)) {
    while (i < len && source[i] !== '\n') i++;
  }

  while (i < len) {
    const c = source[i];
    if (c === ' ' || c === '\n' || c === '\r' || c === '\t') {
      i++;
      continue;
    }
    if (c === '/' && i + 1 < len) {
      const nextC = source[i + 1];
      if (nextC === '/') {
        i += 2;
        while (i < len && source[i] !== '\n') i++;
        continue;
      }
      if (nextC === '*') {
        i += 2;
        while (i + 1 < len) {
          if (source[i] === '*' && source[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }
    }
    break;
  }
  return i;
}
