/**
 * @fileoverview Drive a Plumeria to CSS Modules migration over source files
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '@typescript-eslint/parser';
import {
  convertPlumeriaModule,
  extractPlumeriaAnimations,
  extractPlumeriaThemes,
} from './transforms/from-plumeria';
import type { PlumeriaReport } from './transforms/from-plumeria';
import type { ReleaseModule } from './transforms/release-styles';

export interface ReleasedStylesheet {
  source: string;
  target: string;
  css: string;
  reports: PlumeriaReport[];
}

export interface ReleasePlan {
  stylesheets: ReleasedStylesheet[];
  modules: Record<string, ReleaseModule>;
  themes: Record<string, string[]>;
  animations: Record<string, string[]>;
  global?: { target: string; css: string };
}

const EXTENSION = /\.(?:[cm]?[jt]sx?)$/;
const IGNORED = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  '.next',
  '.git',
  'coverage',
]);

const findSources = (targets: string[]): string[] => {
  const found: string[] = [];
  const walk = (entry: string) => {
    const stats = fs.statSync(entry);
    if (stats.isFile()) {
      if (EXTENSION.test(entry)) found.push(path.resolve(entry));
      return;
    }
    for (const name of fs.readdirSync(entry)) {
      if (!IGNORED.has(name)) walk(path.join(entry, name));
    }
  };
  for (const target of targets) {
    try {
      walk(target);
    } catch {
      // Missing paths produce an empty plan, matching the forward migration.
    }
  }
  return found.sort();
};

export const releasedPath = (source: string): string =>
  source.replace(/\.[^.]+$/, '.module.css');

const globalPath = (targets: string[]): string => {
  const first = path.resolve(targets[0]);
  const root =
    fs.existsSync(first) && fs.statSync(first).isDirectory()
      ? first
      : path.dirname(first);
  const candidates = [
    path.join(root, 'src', 'styles', 'global.css'),
    path.join(root, 'styles', 'global.css'),
  ];
  return (
    candidates.find((candidate) => fs.existsSync(candidate)) ??
    (fs.existsSync(path.join(root, 'src')) ? candidates[0] : candidates[1])
  );
};

export function planRelease(targets: string[]): ReleasePlan {
  const stylesheets: ReleasedStylesheet[] = [];
  const modules: Record<string, ReleaseModule> = {};
  const themes: Record<string, string[]> = {};
  const animations: Record<string, string[]> = {};
  const globalRules: string[] = [];
  const sources = findSources(targets);
  const sourceText = new Map(
    sources.map((source) => [source, fs.readFileSync(source, 'utf8')]),
  );
  const themeValues = new Map<string, Record<string, Record<string, string>>>();
  const animationValues = new Map<string, Record<string, string>>();

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaThemes(sourceText.get(source) as string);
      if (Object.keys(extracted.bindings).length === 0) continue;
      themeValues.set(source, extracted.bindings);
      themes[source] = Object.keys(extracted.bindings);
      globalRules.push(extracted.globalCss.trim());
    } catch {
      // The converter reports parse failures through the source rewrite pass.
    }
  }

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaAnimations(
        sourceText.get(source) as string,
        {
          ...(themeValues.get(source) ?? {}),
        },
      );
      if (Object.keys(extracted.bindings).length > 0)
        animationValues.set(source, extracted.bindings);
    } catch {
      // A later pass reports definitions that cannot be resolved.
    }
  }

  const sourceForImport = (
    owner: string,
    specifier: string,
    candidates: Iterable<string>,
  ) => {
    const resolved = path.resolve(path.dirname(owner), specifier);
    const stem = resolved.replace(/\.[^.]+$/, '');
    return [...candidates].find(
      (candidate) => candidate.replace(/\.[^.]+$/, '') === stem,
    );
  };

  const importedValues = (
    source: string,
    availableBySource: Map<string, Record<string, any>>,
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    const ast = parse(sourceText.get(source) as string, {
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    }) as any;
    for (const node of ast.body) {
      if (
        node.type !== 'ImportDeclaration' ||
        typeof node.source.value !== 'string' ||
        !node.source.value.startsWith('.')
      )
        continue;
      const target = sourceForImport(
        source,
        node.source.value,
        availableBySource.keys(),
      );
      if (!target) continue;
      const available = availableBySource.get(target) as Record<string, any>;
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
          const imported = specifier.imported.name ?? specifier.imported.value;
          if (available[imported])
            result[specifier.local.name] = available[imported];
        } else if (specifier.type === 'ImportNamespaceSpecifier') {
          result[specifier.local.name] = available;
        }
      }
    }
    return result;
  };

  const importedThemes = (source: string) =>
    importedValues(source, themeValues);
  const importedAnimations = (source: string) =>
    importedValues(source, animationValues);
  const importedPlumeriaValues = (source: string): Record<string, unknown> => {
    const merged: Record<string, unknown> = { ...importedThemes(source) };
    for (const [key, value] of Object.entries(importedAnimations(source))) {
      const previous = merged[key];
      merged[key] =
        previous &&
        typeof previous === 'object' &&
        value &&
        typeof value === 'object'
          ? { ...previous, ...value }
          : value;
    }
    return merged;
  };

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaAnimations(
        sourceText.get(source) as string,
        {
          ...importedPlumeriaValues(source),
          ...(themeValues.get(source) ?? {}),
        },
      );
      if (Object.keys(extracted.bindings).length === 0) continue;
      animationValues.set(source, extracted.bindings);
      animations[source] = [
        ...extracted.keyframes,
        ...extracted.viewTransitions,
      ];
      globalRules.push(extracted.globalCss.trim());
    } catch {
      // The converter reports parse failures through the source rewrite pass.
    }
  }

  for (const source of sources) {
    let converted;
    try {
      converted = convertPlumeriaModule(
        sourceText.get(source) as string,
        importedPlumeriaValues(source),
      );
    } catch {
      continue;
    }
    if (!converted) continue;
    const target = releasedPath(source);
    const specifier = `./${path.basename(target)}`;
    const reports = [...converted.reports];
    if (fs.existsSync(target)) {
      reports.push({
        line: 0,
        column: 0,
        kind: 'target-exists',
        hint: `${path.basename(target)} already exists and was not overwritten.`,
      });
    }
    stylesheets.push({
      source,
      target,
      css: converted.css,
      reports,
    });
    if (reports.length === 0) {
      modules[source] = {
        source: specifier,
        binding: converted.binding,
        ...(Object.keys(converted.functions).length > 0
          ? { functions: converted.functions }
          : {}),
      };
    }
  }

  return {
    stylesheets,
    modules,
    themes,
    animations,
    global:
      globalRules.length > 0
        ? {
            target: globalPath(targets),
            css: `/* Generated from css.createTheme, css.keyframes, and css.viewTransition by @plumeria/codemod */\n${globalRules.join('\n\n')}\n`,
          }
        : undefined,
  };
}

export function writeRelease(plan: ReleasePlan): void {
  for (const sheet of plan.stylesheets) {
    if (sheet.reports.length > 0) continue;
    fs.writeFileSync(sheet.target, sheet.css, 'utf8');
  }
  if (plan.global) {
    fs.mkdirSync(path.dirname(plan.global.target), { recursive: true });
    const previous = fs.existsSync(plan.global.target)
      ? fs.readFileSync(plan.global.target, 'utf8')
      : '';
    const separator =
      previous.length > 0 && !previous.endsWith('\n') ? '\n\n' : '';
    fs.writeFileSync(
      plan.global.target,
      `${previous}${separator}${plan.global.css}`,
      'utf8',
    );
  }
}

export function formatReleaseReports(
  sheets: ReleasedStylesheet[],
  cwd: string,
): string[] {
  const lines: string[] = [];
  for (const sheet of sheets) {
    if (sheet.reports.length === 0) continue;
    lines.push(path.relative(cwd, sheet.source) || sheet.source);
    for (const report of sheet.reports) {
      lines.push(`  ${report.line}:${report.column}  ${report.kind}`);
      lines.push(`        ${report.hint}`);
    }
  }
  return lines;
}
