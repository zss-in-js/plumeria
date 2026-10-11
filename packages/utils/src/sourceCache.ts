import * as fs from 'fs';

// Shared by scanning and extraction: invalidating an importer need not reread it.
const sources = new Map<string, { stamp: string; source: string }>();
const LIMIT = 4096;

export function sourceStamp(file: string): string {
  const stat = fs.statSync(file);
  return `${stat.mtimeMs}:${stat.ctimeMs}:${stat.size}`;
}

export function readSource(file: string): string {
  let stamp: string;
  try {
    stamp = sourceStamp(file);
  } catch (error) {
    sources.delete(file);
    throw error;
  }
  const cached = sources.get(file);
  if (cached?.stamp === stamp) return cached.source;
  const source = fs.readFileSync(file, 'utf8');
  if (sources.size >= LIMIT) sources.delete(sources.keys().next().value!);
  sources.set(file, { stamp, source });
  return source;
}
