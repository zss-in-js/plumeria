/**
 * Type definitions only. No runtime implementation provided.  
 * Configure the bundler plugin to extract and implement these APIs.
 * ```ts
 * type create = <const T extends Record<string, CSSProperties>>(rule: CreateStyleType<T>)=> ReturnType<T>;
 * type props = (...rules: (false | CSSProperties | null | undefined)[])=> string;
 * type createTheme = <const T extends CreateTheme>(rule: T)=> ReturnVariableType<T>;
 * type createStatic = <const T extends CreateStatic>(rule: T)=> T;
 * type keyframes = (rule: Keyframes) => string;
 * type viewTransition = (rule: ViewTransition) => string;
 * type variants = <T extends Variants>(rule: T) => (props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
 * type marker = (id: string, pseudo: string) => Marker;
 * type extended = <I extends string, P extends string>(id: I, pseudo: P) => Extended<I, P>;
 * ```
 */
declare module '@plumeria/core' {
  import type { 
    CreateStyleType,
    CreateStatic,
    CreateTheme,
    Keyframes,
    ViewTransition,
    ReturnType,
    ReturnVariableType,
    Variants,
    Marker,
    Extended,
  } from './types';

  export type CSSProperties = import('./types').CSSProperties;
  export type CreateStyle = import('./types').CreateStyle;

  export type create = <const T extends Record<string, CSSProperties>>(rule: CreateStyleType<T>)=> ReturnType<T>;
  export type props = (...rules: (false | CSSProperties | null | undefined)[])=> string;
  export type createTheme = <const T extends CreateTheme>(rule: T)=> ReturnVariableType<T>;
  export type createStatic = <const T extends CreateStatic>(rule: T)=> T;
  export type keyframes = (rule: Keyframes) => string;
  export type viewTransition = (rule: ViewTransition) => string;
  export type variants = <T extends Variants>(rule: T) => (props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
  export type marker = (id: string, pseudo: string) => Marker;
  export type extended = <I extends string, P extends string>(id: I, pseudo: P) => Extended<I, P>;

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