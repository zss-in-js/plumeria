/**
 * Type types only. Configure the bundler plugin for extraction.
 *```ts
 * type create = <const T extends Record<string, CSSProperties>>(_rule: CreateStyleType<T>)=> ReturnType<T>;
 * type props = (..._rules: (false | CSSProperties | null | undefined)[])=> string;
 * type createTheme = <const T extends CreateTheme>(_rule: T)=> ReturnVariableType<T>;
 * type createStatic = <const T extends CreateStatic>(_rule: T)=> T;
 * type keyframes = (_rule: Keyframes) => string;
 * type viewTransition = (_rule: ViewTransition) => string;
 * type variants = <T extends Variants>(_rule: T) => (_props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
 * type marker = (_id: string, _pseudo: string) => Marker;
 * type extended = <I extends string, P extends string>(_id: I, _pseudo: P) => Extended<I, P>;
 * ```
 */
declare module '@plumeria/core' {
  export type CSSProperties = import('./types').CSSProperties;
  export type CreateStyle = import('./types').CreateStyle;
  export type CreateStyleType<T> = import('./types').CreateStyleType<T>;
  export type CreateStatic = import('./types').CreateStatic;
  export type CreateTheme = import('./types').CreateTheme;
  export type Keyframes = import('./types').Keyframes;
  export type ViewTransition = import('./types').ViewTransition;
  export type ReturnType<T> = import('./types').ReturnType<T>;
  export type ReturnVariableType<T> = import('./types').ReturnVariableType<T>;
  export type Variants = import('./types').Variants;
  export type Marker = import('./types').Marker;
  export type Extended<I extends string, P extends string> = import('./types').Extended<I, P>;
  export type create = <const T extends Record<string, CSSProperties>>(_rule: CreateStyleType<T>)=> ReturnType<T>;
  export type props = (..._rules: (false | CSSProperties | null | undefined)[])=> string;
  export type createTheme = <const T extends CreateTheme>(_rule: T)=> ReturnVariableType<T>;
  export type createStatic = <const T extends CreateStatic>(_rule: T)=> T;
  export type keyframes = (_rule: Keyframes) => string;
  export type viewTransition = (_rule: ViewTransition) => string;
  export type variants = <T extends Variants>(_rule: T) => (_props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
  export type marker = (_id: string, _pseudo: string) => Marker;
  export type extended = <I extends string, P extends string>(_id: I, _pseudo: P) => Extended<I, P>;
  export const create: create;
  export const props: props;
  export const createTheme: createTheme;
  export const createStatic: createStatic;
  export const keyframes: keyframes;
  export const viewTransition: viewTransition;
  export const variants: variants;
  export const marker: marker;
  export const extended: extended;
}
