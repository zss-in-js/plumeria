import { getStyleRecords } from '@plumeria/utils/dist/create';
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

function unsupported(name: string): never {
  throw new Error(`${name} is not available in the playground preview`);
}

export const createTheme = () => unsupported('css.createTheme');
export const createStatic = () => unsupported('css.createStatic');
export const keyframes = () => unsupported('css.keyframes');
export const viewTransition = () => unsupported('css.viewTransition');
export const global = () => unsupported('css.global');
