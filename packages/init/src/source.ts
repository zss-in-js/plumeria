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
  return appendAtArray(source, match.index + match[0].length - 1, entry);
};

export const appendAtArray = (
  source: string,
  open: number,
  entry: string,
): string | undefined => {
  if (source[open] !== '[') return undefined;
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

export const directProperty = (
  source: string,
  open: number,
  key: string,
): number | undefined => {
  if (source[open] !== '{') return undefined;
  const close = closerOf(source, open);
  if (close === -1) return undefined;

  const pattern = new RegExp(`^${key}\\s*:\\s*`);

  for (let i = open + 1; i < close; i++) {
    const char = source[i];
    if (char === '/' && source[i + 1] === '/') {
      const line = source.indexOf('\n', i);
      i = line;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end + 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      i = endOfString(source, i);
      continue;
    }
    if (char === '(' || char === '[' || char === '{') {
      const inner = closerOf(source, i);
      if (inner === -1) return undefined;
      i = inner;
      continue;
    }
    if (/[A-Za-z0-9_$]/.test(source[i - 1])) continue;

    const match = pattern.exec(source.slice(i, close));
    if (match) return i + match[0].length;
  }
  return undefined;
};

export const configObjects = (source: string): number[] => {
  const found: number[] = [];
  const exported = defaultExportOf(source);
  if (exported && source[exported.start] === '{') found.push(exported.start);

  const pattern = /(?:\(|=>)\s*\(?\s*\{/g;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    const at = match.index + match[0].length - 1;
    found.push(at);
  }
  return found;
};

export const pluginsArrayOf = (source: string): number | undefined => {
  const objects = configObjects(source);

  for (const open of objects) {
    const at = directProperty(source, open, 'plugins');
    if (at !== undefined && source[at] === '[') return at;
  }
  for (const open of objects) {
    const vite = directProperty(source, open, 'vite');
    if (vite === undefined || source[vite] !== '{') continue;
    const at = directProperty(source, vite, 'plugins');
    if (at !== undefined && source[at] === '[') return at;
  }
  return undefined;
};

export interface Imported {
  names: string[];
  rest: string;
}

const REGEX_AFTER = new Set([
  'return',
  'typeof',
  'case',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'do',
  'else',
  'yield',
  'await',
]);

export const codeMask = (source: string): string => {
  const masked = source.split('');
  const blank = (start: number, end: number) => {
    for (let i = start; i < end; i++) {
      if (source[i] !== '\n' && source[i] !== '\r') masked[i] = ' ';
    }
  };
  const regexCanStartAfter = (index: number): boolean => {
    for (let i = index - 1; i >= 0; i--) {
      if (/\s/.test(source[i])) continue;
      if (/[([{,:;=!?&|+\-*%^~<>]/.test(source[i])) return true;
      if (!/[A-Za-z0-9_$]/.test(source[i])) return false;
      const word = /[A-Za-z0-9_$]+$/.exec(source.slice(0, i + 1))![0];
      return REGEX_AFTER.has(word);
    }
    return true;
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (char === '/' && source[i + 1] === '/') {
      const end = source.indexOf('\n', i + 2);
      const close = end === -1 ? source.length : end;
      blank(i, close);
      i = close - 1;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      const close = end === -1 ? source.length : end + 2;
      blank(i, close);
      i = close - 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      const close = endOfString(source, i);
      blank(i, close + 1);
      i = close;
      continue;
    }
    if (char === '/' && regexCanStartAfter(i)) {
      let close = i + 1;
      let inClass = false;
      for (; close < source.length; close++) {
        if (source[close] === '\\') {
          close++;
          continue;
        }
        if (source[close] === '[') inClass = true;
        else if (source[close] === ']') inClass = false;
        else if (source[close] === '/' && !inClass) {
          close++;
          while (/[A-Za-z]/.test(source[close] ?? '')) close++;
          break;
        } else if (source[close] === '\n' || source[close] === '\r') {
          break;
        }
      }
      blank(i, close);
      i = close - 1;
    }
  }
  return masked.join('');
};

const bindingNames = (binding: string): string[] => {
  const names: string[] = [];
  const braced = /\{([^}]*)\}/.exec(binding);

  for (const part of binding.replace(/\{[^}]*\}/g, ' ').split(',')) {
    const name = /([A-Za-z_$][\w$]*)/.exec(
      part.replace(/^\s*\*\s*as\s+/, '').replace(/^\s*type\s+/, ''),
    );
    if (name) names.push(name[1]);
  }
  if (braced) {
    for (const part of braced[1].split(',')) {
      const pieces = part.trim().split(/\s+as\s+/);
      const name = /([A-Za-z_$][\w$]*)/.exec(pieces[pieces.length - 1]);
      if (name) names.push(name[1]);
    }
  }
  return names;
};

export const importedFrom = (source: string, specifier: string): Imported => {
  const escaped = specifier.replace(/[/@.]/g, '\\$&');
  const quoted = `['"]${escaped}['"]`;

  const patterns = [
    new RegExp(`\\bimport\\s+([^;'"]*?)\\s+from\\s*${quoted}`, 'g'),
    new RegExp(
      `\\b(?:const|let|var)\\s+([^;'"=]*?)\\s*=\\s*require\\(\\s*${quoted}`,
      'g',
    ),
    new RegExp(`\\bimport\\s*()${quoted}`, 'g'),
  ];

  const names: string[] = [];
  const cuts: [number, number][] = [];
  const code = codeMask(source);

  for (const pattern of patterns) {
    for (
      let match = pattern.exec(source);
      match;
      match = pattern.exec(source)
    ) {
      const keyword = /\b(?:import|const|let|var|require)\b/.exec(match[0]);
      if (!keyword || code[match.index + keyword.index] === ' ') continue;
      cuts.push([match.index, match.index + match[0].length]);
      names.push(...bindingNames(match[1]));
    }
  }

  let rest = source;
  for (const [start, end] of cuts.sort((a, b) => b[0] - a[0])) {
    rest = `${rest.slice(0, start)}${rest.slice(end)}`;
  }
  return { names: [...new Set(names)], rest };
};

export const callsMethod = (source: string, name: string): boolean =>
  new RegExp(`\\b${name}\\s*\\.\\s*[A-Za-z_$][\\w$]*\\s*\\(`).test(
    codeMask(source),
  );

export const callsFunction = (source: string, name: string): boolean =>
  new RegExp(`\\b${name}\\s*\\(`).test(codeMask(source));

export const readsMember = (
  source: string,
  name: string,
  member: string,
): boolean =>
  new RegExp(`\\b${name}\\s*\\.\\s*${member}\\b`).test(codeMask(source));
