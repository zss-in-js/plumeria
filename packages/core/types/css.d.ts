/**
 * Type definitions only. Configure the bundler plugin for extraction.
 *```ts
 * type create = <const T extends Record<string, CSSProperties>>(_rule: CreateStyleType<T>)=> ReturnType<T>;
 * type props = (..._rules: (false | CSSProperties | null | undefined)[])=> string;
 * type createTheme = <const T extends CreateTheme>(_rule: T)=> ReturnVariableType<T>;
 * type createStatic = <const T extends CreateStatic>(_rule: T)=> T;
 * type keyframes = (_rule: Keyframes) => string;
 * type viewTransition = (_rule: ViewTransition) => string;
 * type variants = <T extends Variants>(_rule: T) => (_props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
 * type marker = (_id: string, _pseudo: string) => CSSProperties;
 * type extended = (_id: string, _pseudo: string) => ContainerStyleQuery;
 * ```
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
  export type create = <const T extends Record<string, CSSProperties>>(_rule: CreateStyleType<T>)=> ReturnType<T>;
  export type props = (..._rules: (false | CSSProperties | null | undefined)[])=> string;
  export type createTheme = <const T extends CreateTheme>(_rule: T)=> ReturnVariableType<T>;
  export type createStatic = <const T extends CreateStatic>(_rule: T)=> T;
  export type keyframes = (_rule: Keyframes) => string;
  export type viewTransition = (_rule: ViewTransition) => string;
  export type variants = <T extends Variants>(_rule: T) => (_props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
  export type marker = (_id: string, _pseudo: string) => CSSProperties;
  export type extended = (_id: string, _pseudo: string) => ContainerStyleQuery;
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
