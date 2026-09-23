import { getStyleRecords } from '@plumeria/utils/dist/create';
import { createTheme as themeStyles, themeHashOf } from '@plumeria/utils/dist/createTheme';
import { camelToKebabCase, genBase36Hash, transpile } from 'zss-engine';
import { resolveClassStyle } from './class-style';

type StyleRule = Record<string, unknown>;

let element: HTMLStyleElement | undefined;
let inserted = new Set<string>();
let pending: Set<string> | undefined;

function styleElement(): HTMLStyleElement {
  element ??= document.head.appendChild(document.createElement('style'));
  return element;
}

export function beginStyles(): void {
  pending = new Set();
}

export function commitStyles(): void {
  if (!pending) return;
  inserted = pending;
  pending = undefined;
  styleElement().textContent = [...inserted].join('');
}

export function discardStyles(): void {
  pending = undefined;
}

function insert(sheet: string): void {
  const sheets = pending ?? inserted;
  if (!sheet || sheets.has(sheet)) return;
  sheets.add(sheet);
  if (!pending) styleElement().textContent += sheet;
}

export function create<T extends Record<string, StyleRule>>(rules: T): Record<string, unknown> {
  const result: Record<string, Record<string, string>> = {};

  for (const [name, rule] of Object.entries(rules)) {
    const entry: Record<string, string> = {};

    for (const record of getStyleRecords(rule as never)) {
      insert(record.sheet);
      entry[record.key] = record.hash;
    }

    result[name] = entry;
  }

  return result;
}

export function use(...rules: unknown[]): string {
  return resolveClassStyle(rules);
}

export function props(...rules: unknown[]): { className: string } {
  return { className: resolveClassStyle(rules) };
}

export function keyframes(rule: StyleRule): string {
  const hash = genBase36Hash(rule, 1, 8);
  const { styleSheet } = transpile({ [`@keyframes kf-${hash}`]: rule }, undefined, '--global');
  insert(styleSheet);
  return `kf-${hash}`;
}

export function createTheme(
  themeSelector: string,
  rule: Record<string, { default: string; theme: string }>,
): Record<string, string> {
  const hash = themeHashOf(themeSelector, rule);
  const { styleSheet } = transpile(themeStyles(themeSelector, rule, hash), undefined, '--global');
  insert(styleSheet);

  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(rule)) {
    const atomicHash = genBase36Hash({ _theme: hash, [key]: value }, 1, 8);
    variables[key] = `var(--${atomicHash}-${camelToKebabCase(key)})`;
  }

  return variables;
}

export function createStatic<T extends Record<string, unknown>>(rule: T): T {
  return rule;
}

function unsupported(name: string): never {
  throw new Error(`${name} is not available in the playground preview`);
}

export const viewTransition = () => unsupported('css.viewTransition');
export const global = () => unsupported('css.global');
