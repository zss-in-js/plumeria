/**
 * @fileoverview Drive the CSS Modules migration over a tree of files
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { convertStylesheet } from './transforms/css-modules';
import type { Report } from './transforms/css-modules';
import type { ModuleMap } from './transforms/adopt-styles';

export interface Stylesheet {
  source: string;
  target: string;
  reports: Report[];
}

export interface Plan {
  stylesheets: Stylesheet[];
  modules: Record<string, ModuleMap>;
}

const IGNORED = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  '.next',
  '.git',
  'coverage',
]);

export function findStylesheets(targets: string[]): string[] {
  const found: string[] = [];

  const walk = (entry: string) => {
    const stats = fs.statSync(entry);
    if (stats.isFile()) {
      if (entry.endsWith('.module.css')) found.push(path.resolve(entry));
      return;
    }
    for (const name of fs.readdirSync(entry)) {
      if (IGNORED.has(name)) continue;
      walk(path.join(entry, name));
    }
  };

  for (const target of targets) {
    try {
      walk(target);
    } catch {
      // a path that does not exist is reported by the caller through an empty plan
    }
  }
  return found.sort();
}

export const targetPath = (stylesheet: string): string =>
  stylesheet.replace(/\.module\.css$/, '.styles.ts');

export function plan(targets: string[]): Plan {
  const stylesheets: Stylesheet[] = [];
  const modules: Record<string, ModuleMap> = {};

  for (const source of findStylesheets(targets)) {
    const converted = convertStylesheet(fs.readFileSync(source, 'utf-8'));
    const target = targetPath(source);

    if (fs.existsSync(target)) {
      stylesheets.push({
        source,
        target,
        reports: [
          ...converted.reports,
          {
            line: 0,
            column: 0,
            kind: 'target-exists',
            source: '',
            hint: `${path.basename(target)} already exists and was not overwritten.`,
          },
        ],
      });
      continue;
    }

    stylesheets.push({ source, target, reports: converted.reports });
    modules[source] = {
      source: `./${path.basename(target, '.ts')}`,
      target,
      names: converted.names,
      composes: converted.composes,
      functions: converted.functions,
    };
  }

  return { stylesheets, modules };
}

export function write(targets: string[]): Plan {
  const result = plan(targets);
  for (const sheet of result.stylesheets) {
    if (!result.modules[sheet.source]) continue;
    const converted = convertStylesheet(fs.readFileSync(sheet.source, 'utf-8'));
    fs.writeFileSync(sheet.target, converted.code, 'utf-8');
  }
  return result;
}

export function formatReports(sheets: Stylesheet[], cwd: string): string[] {
  const lines: string[] = [];
  for (const sheet of sheets) {
    if (sheet.reports.length === 0) continue;
    lines.push(path.relative(cwd, sheet.source) || sheet.source);
    for (const report of sheet.reports) {
      lines.push(
        `  ${report.line}:${report.column}  ${report.kind}${
          report.source ? `  ${report.source}` : ''
        }`,
      );
      lines.push(`        ${report.hint}`);
    }
  }
  return lines;
}
