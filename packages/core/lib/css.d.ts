/**
 * Type definitions only. No runtime implementation provided.
 * Configure the bundler plugin to extract and implement these APIs.
 * ```ts
 * type create = <const T extends Record<string, CreateStyleValue>>(rule: T)=> CreateReturnType<T>;
 * type createTheme = <const T extends CreateTheme>(rule: T)=> ReturnVariableType<T>;
 * type createStatic = <const T extends CreateStatic>(rule: T)=> T;
 * type keyframes = <const T extends Keyframes>(rule: T) => string;
 * type viewTransition = <const T extends ViewTransition>(rule: T) => string;
 * type variants = <T extends Variants>(rule: T) => (props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
 * type marker = (id: string, pseudo: string) => Marker;
 * type extended = <I extends string, P extends string>(id: I, pseudo: P) => Extended<I, P>;
 * type use = (...rules: (false | CSSProperties | null | undefined)[])=> string;
 * ```
 */
declare module '@plumeria/core' {
  import type {
    StyleName,
    CSSProperties,
    CreateStyleValue,
    CreateReturnType,
    CreateStatic,
    CreateTheme,
    Keyframes,
    ViewTransition,
    ReturnVariableType,
    Variants,
    Marker,
    Extended,
  } from '#types';

  global {
    namespace React {
      interface HTMLAttributes<T> {
        styleName?: StyleName;
      }
    }
  }

  export type { StyleName };

  export const create: create;
  export type create = <const T extends Record<string, CreateStyleValue>>(
    rule: T,
  ) => CreateReturnType<T>;

  export const createTheme: createTheme;
  export type createTheme = <const T extends CreateTheme>(
    rule: T,
  ) => ReturnVariableType<T>;

  export const createStatic: createStatic;
  export type createStatic = <const T extends CreateStatic>(rule: T) => T;

  export const keyframes: keyframes;
  export type keyframes = <const T extends Keyframes>(rule: T) => string;

  export const viewTransition: viewTransition;
  export type viewTransition = <const T extends ViewTransition>(
    rule: T,
  ) => string;

  export const variants: variants;
  export type variants = <T extends Variants>(
    rule: T,
  ) => (props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;

  export const marker: marker;
  export type marker = (id: string, pseudo: string) => Marker;

  export const extended: extended;
  export type extended = <I extends string, P extends string>(
    id: I,
    pseudo: P,
  ) => Extended<I, P>;

  export const use: use;
  export type use = (
    ...rules: (false | CSSProperties | null | undefined)[]
  ) => string;
}
