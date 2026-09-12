const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };

const endOfString = (source: string, start: number): number => {
  const quote = source[start];
  for (let i = start + 1; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') {
      i++;
      continue;
    }
    if (quote === '`' && char === '$' && source[i + 1] === '{') {
      const closed = closerOf(source, i + 1);
      if (closed === -1) return source.length - 1;
      i = closed;
      continue;
    }
    if (char === quote) return i;
  }
  return source.length - 1;
};

export const closerOf = (source: string, open: number): number => {
  const opener = source[open];
  const closer = PAIRS[opener];
  if (!closer) return -1;

  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (char === '/' && source[i + 1] === '/') {
      const line = source.indexOf('\n', i);
      if (line === -1) return -1;
      i = line;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      i = endOfString(source, i);
      continue;
    }
    if (char === opener) depth++;
    else if (char === closer) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
};

const lineStartOf = (source: string, index: number): number =>
  source.lastIndexOf('\n', index) + 1;

const indentOf = (source: string, index: number): string => {
  const start = lineStartOf(source, index);
  return /^[ \t]*/.exec(source.slice(start))![0];
};

export const importsModule = (source: string, specifier: string): boolean =>
  new RegExp(
    `(from|require\\()\\s*['"]${specifier.replace(/[/@.]/g, '\\$&')}['"]`,
  ).test(source);

export const addImport = (source: string, statement: string): string => {
  const pattern =
    /^[ \t]*(?:import\b[^\n]*|(?:const|let|var)\b[^\n]*require\([^\n]*)\n/gm;
  let end = 0;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    end = match.index + match[0].length;
  }
  if (end === 0) return `${statement}\n${source}`;
  return `${source.slice(0, end)}${statement}\n${source.slice(end)}`;
};

export const appendToArray = (
  source: string,
  key: string,
  entry: string,
): string | undefined => {
  const pattern = new RegExp(`\\b${key}\\s*:\\s*\\[`);
  const match = pattern.exec(source);
  if (!match) return undefined;

  const open = match.index + match[0].length - 1;
  const close = closerOf(source, open);
  if (close === -1) return undefined;

  const body = source.slice(open + 1, close);
  if (body.trim() === '') {
    return `${source.slice(0, open + 1)}${entry}${source.slice(close)}`;
  }
  if (!body.includes('\n')) {
    const trimmed = body.replace(/,\s*$/, '');
    return `${source.slice(0, open + 1)}${trimmed}, ${entry}${source.slice(close)}`;
  }

  const base = indentOf(source, open);
  const inner = `${base}  `;
  const trimmed = body.replace(/,?\s*$/, '');
  return `${source.slice(0, open + 1)}${trimmed},\n${inner}${entry},\n${base}${source.slice(close)}`;
};

export const appendToCall = (
  source: string,
  callee: string,
  entries: readonly string[],
): string | undefined => {
  const pattern = new RegExp(`\\b${callee}\\s*\\(`);
  const match = pattern.exec(source);
  if (!match) return undefined;
  return appendInside(source, match.index + match[0].length - 1, entries);
};

export const appendInside = (
  source: string,
  open: number,
  entries: readonly string[],
): string | undefined => {
  const close = closerOf(source, open);
  if (close === -1) return undefined;

  const base = indentOf(source, open);
  const inner = `${base}  `;
  const trimmed = source.slice(open + 1, close).replace(/,?\s*$/, '');
  const head = trimmed === '' ? '' : `${trimmed},\n`;
  const added = entries
    .map((entry) =>
      entry
        .split('\n')
        .map((line) => `${inner}${line}`)
        .join('\n'),
    )
    .map((entry) => `${entry},`)
    .join('\n');
  return `${source.slice(0, open + 1)}${head}${added}\n${base}${source.slice(close)}`;
};

export interface DefaultExport {
  keyword: string;
  start: number;
  end: number;
  expression: string;
}

export const defaultExportOf = (source: string): DefaultExport | undefined => {
  const match = /^[ \t]*(export default|module\.exports\s*=)[ \t]*/m.exec(
    source,
  );
  if (!match) return undefined;

  const start = match.index + match[0].length;
  let depth = 0;
  let end = source.length;

  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === '"' || char === "'" || char === '`') {
      i = endOfString(source, i);
      continue;
    }
    if (char === '(' || char === '[' || char === '{') {
      depth++;
      continue;
    }
    if (char === ')' || char === ']' || char === '}') {
      depth--;
      continue;
    }
    if (depth === 0 && (char === ';' || char === '\n')) {
      end = i;
      break;
    }
  }

  return {
    keyword: match[1],
    start,
    end,
    expression: source.slice(start, end).trim(),
  };
};

export const wrapDefaultExport = (
  source: string,
  wrapper: string,
  extra = '',
): string | undefined => {
  const exported = defaultExportOf(source);
  if (!exported) return undefined;
  if (exported.expression.startsWith(`${wrapper}(`)) return source;

  return `${source.slice(0, exported.start)}${wrapper}(${exported.expression}${extra})${source.slice(exported.end)}`;
};

export const appendToConfigList = (
  source: string,
  entries: readonly string[],
): string | undefined => {
  const exported = defaultExportOf(source);
  if (!exported) return undefined;

  if (exported.expression.startsWith('[')) {
    return appendInside(source, source.indexOf('[', exported.start), entries);
  }

  const call = /^([A-Za-z_$][\w$]*)\s*\(/.exec(exported.expression);
  if (!call) return undefined;
  return appendToCall(source, call[1], entries);
};

export type ModuleKind = 'esm' | 'cjs';

export const moduleKindOf = (file: string, source: string): ModuleKind => {
  if (file.endsWith('.cjs')) return 'cjs';
  if (file.endsWith('.mjs') || file.endsWith('.ts') || file.endsWith('.mts'))
    return 'esm';
  if (/^[ \t]*(import\b|export\b)/m.test(source)) return 'esm';
  if (/\brequire\s*\(|\bmodule\.exports\b/.test(source)) return 'cjs';
  return 'esm';
};
