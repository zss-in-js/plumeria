/**
 * ```ts
 *   function create<const T extends Record<string, CSSProperties>>(_rule: CreateStyleType<T>): ReturnType<T>;
 *   function props(..._rules: (false | CSSProperties | null | undefined)[]): string;
 *   function createTheme<const T extends CreateTheme>(_rule: T): ReturnVariableType<T>;
 *   function createStatic<const T extends CreateStatic>(_rule: T): T;
 *   function keyframes(_rule: Keyframes): string;
 *   function viewTransition(_rule: ViewTransition): string;
 *   function variants<T extends Variant>(_rule: T): (_props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
 *   function marker(_id: string, _pseudo: string): CSSProperties;
 *   function extended(_id: string, _pseudo: string): ContainerStyleQuery;
 * ```
 * Type definitions only. Configure the bundler plugin for extraction.
 */
declare module '@plumeria/core' {
  export type CSSProperties = import('./definition').CSSProperties;
  export type CreateStyle = import('./definition').CreateStyle;
  export type CreateStyleType<T> = import('./definition').CreateStyleType<T>;
  export type CreateStatic = import('./definition').CreateStatic;
  export type CreateTheme = import('./definition').CreateTheme;
  export type Keyframes = import('./definition').Keyframes;
  export type ViewTransition = import('./definition').ViewTransition;
  export type ReturnType<T> = import('./definition').ReturnType<T>;
  export type ReturnVariableType<T> = import('./definition').ReturnVariableType<T>;
  export type Variants = import('./definition').Variants;
  export type ContainerStyleQuery = import('./definition').ContainerStyleQuery;
  export function create<const T extends Record<string, CSSProperties>>(_rule: CreateStyleType<T>): ReturnType<T>;
  export function props(..._rules: (false | CSSProperties | null | undefined)[]): string;
  export function createTheme<const T extends CreateTheme>(_rule: T): ReturnVariableType<T>;
  export function createStatic<const T extends CreateStatic>(_rule: T): T;
  export function keyframes(_rule: Keyframes): string;
  export function viewTransition(_rule: ViewTransition): string;
  export function variants<T extends Variants>(_rule: T): (_props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
  export function marker(_id: string, _pseudo: string): CSSProperties;
  export function extended(_id: string, _pseudo: string): ContainerStyleQuery;
}
