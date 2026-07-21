/**
 * Type definitions. Without runtime implementation.\
 * Bundler plugin required.
 * ```ts
 * type create = <const T extends Record<string, CreateStyleValue>>(rule: T)=> CreateReturnType<T>;
 * type createTheme = <const T extends CreateTheme>(themeSelector: CreateThemeSelector, rule: T) => CreateThemeReturnType<T>;
 * type createStatic = <const T extends CreateStatic>(rule: T)=> T;
 * type keyframes = <const T extends Keyframes>(rule: T) => string;
 * type viewTransition = <const T extends ViewTransition>(rule: T) => string;
 * type marker = (id: string, pseudo: string) => Marker;
 * type extended = <I extends string, P extends string>(id: I, pseudo: P) => Extended<I, P>;
 * type use = (...rules: StyleName[]) => string;
 * ```
 */
declare module '@plumeria/core' {
  import type {
    AtomicClassNameFor,
    StyleName,
    CSSProperties,
    CreateStyleValue,
    CreateReturnType,
    CreateTheme,
    CreateThemeSelector,
    CreateThemeReturnType,
    CreateStatic,
    Keyframes,
    ViewTransition,
    Marker,
    Extended,
  } from '#types';

  global {
    namespace React {
      interface HTMLAttributes<T> {
        styleName?: StyleName;
      }
      interface SVGAttributes<T> {
        styleName?: StyleName;
      }
    }
  }

  export type { AtomicClassNameFor, StyleName, CSSProperties };

  export const create: create;
  export type create = <const T extends Record<string, CreateStyleValue>>(
    rule: T,
  ) => CreateReturnType<T>;

  export const createTheme: createTheme;
  export type createTheme = <const T extends CreateTheme>(
    themeSelector: CreateThemeSelector,
    rule: T,
  ) => CreateThemeReturnType<T>;

  export const createStatic: createStatic;
  export type createStatic = <const T extends CreateStatic>(rule: T) => T;

  export const keyframes: keyframes;
  export type keyframes = <const T extends Keyframes>(rule: T) => string;

  export const viewTransition: viewTransition;
  export type viewTransition = <const T extends ViewTransition>(
    rule: T,
  ) => string;

  export const marker: marker;
  export type marker = (id: string, pseudo: string) => Marker;

  export const extended: extended;
  export type extended = <I extends string, P extends string>(
    id: I,
    pseudo: P,
  ) => Extended<I, P>;

  export const use: use;
  export type use = (...rules: StyleName) => string;
}
