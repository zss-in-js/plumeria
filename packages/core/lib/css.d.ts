/**
 * Type definitions only. No runtime implementation provided.  
 * Configure the bundler plugin to extract and implement these APIs.
 * ```ts
 * type create = <const T extends Record<string, CreateStyleValue>>(rule: CreateStyleType<T>)=> CreateReturnType<T>;
 * type createTheme = <const T extends CreateTheme>(rule: T)=> ReturnVariableType<T>;
 * type createStatic = <const T extends CreateStatic>(rule: T)=> T;
 * type keyframes = (rule: Keyframes) => string;
 * type viewTransition = (rule: ViewTransition) => string;
 * type variants = <T extends Variants>(rule: T) => (props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
 * type marker = (id: string, pseudo: string) => Marker;
 * type extended = <I extends string, P extends string>(id: I, pseudo: P) => Extended<I, P>;
 * type use = (...rules: (false | CSSProperties | null | undefined)[])=> string;
 * ```
 */
declare module '@plumeria/core' {
  import type { 
    CreateStyleValue,
    CreateStyleType,
    CreateReturnType,
    CreateStatic,
    CreateTheme,
    Keyframes,
    ViewTransition,
    ReturnVariableType,
    Variants,
    Marker,
    Extended,
  } from './types';

  export type CSSProperties = import('./types').CSSProperties;
  export type CreateStyle = import('./types').CreateStyle;

  export type create = <const T extends Record<string, CreateStyleValue>>(rule: CreateStyleType<T>)=> CreateReturnType<T>; 
  export type createTheme = <const T extends CreateTheme>(rule: T)=> ReturnVariableType<T>;
  export type createStatic = <const T extends CreateStatic>(rule: T)=> T;
  export type keyframes = (rule: Keyframes) => string;
  export type viewTransition = (rule: ViewTransition) => string;
  export type variants = <T extends Variants>(rule: T) => (props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
  export type marker = (id: string, pseudo: string) => Marker;
  export type extended = <I extends string, P extends string>(id: I, pseudo: P) => Extended<I, P>;
  export type use = (...rules: (false | CSSProperties | null | undefined)[])=> string;

  export const create: create; 
  export const createTheme: createTheme;
  export const createStatic: createStatic;
  export const keyframes: keyframes;
  export const viewTransition: viewTransition;
  export const variants: variants;
  export const marker: marker;
  export const extended: extended;
  export const use: use;

  declare global {
      namespace React {
      import type { StyleName } from './types';
      interface HTMLAttributes<T> {
        styleName?: StyleName;
      }
    }
  }
}
