declare module '@plumeria/compiler-wasm32-wasi' {
  import type { CSSProperties } from 'zss-engine';

  export interface StyleRecord {
    key: string;
    hash: string;
    sheet: string;
  }
  export function getStyleRecords(styleRule: Record<string, unknown>, weights?: Record<string, number>): StyleRecord[];
  export function themeHashOf(themeSelector: string, rule: Record<string, unknown>): string;
  export function createTheme(
    themeSelector: string,
    rule: Record<string, unknown>,
    themeHash: string,
  ): Record<string, CSSProperties>;
}
