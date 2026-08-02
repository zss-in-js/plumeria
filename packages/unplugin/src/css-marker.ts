import * as fs from 'fs';
import * as path from 'path';

const COMMENT = /\/\*[\s\S]*?\*\//g;

export function stripCssMarkers(css: string): string {
  return css
    .replace(COMMENT, (comment) =>
      comment.includes('.zero.css') ? '' : comment,
    )
    .replace(/^\s*\n/, '')
    .replace(/\n{3,}/g, '\n\n');
}

function collectCssFiles(target: string, found: string[]): void {
  let stat: fs.Stats | undefined;
  try {
    stat = fs.statSync(target);
  } catch {
    return;
  }

  if (stat.isFile()) {
    if (target.endsWith('.css')) found.push(target);
    return;
  }

  if (!stat.isDirectory()) return;

  for (const entry of fs.readdirSync(target)) {
    collectCssFiles(path.join(target, entry), found);
  }
}

export function stripCssMarkersIn(targets: Iterable<string>): void {
  const found: string[] = [];
  for (const target of targets) {
    if (!target) continue;
    collectCssFiles(path.resolve(target), found);
  }

  for (const file of new Set(found)) {
    let css: string;
    try {
      css = fs.readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    if (!css.includes('.zero.css')) continue;
    const stripped = stripCssMarkers(css);
    if (stripped !== css) fs.writeFileSync(file, stripped, 'utf-8');
  }
}
