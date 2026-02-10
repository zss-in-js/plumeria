/**
 * Type definitions only. No runtime implementation provided.  
 * Configure the bundler plugin to extract and implement these APIs.
 * ```ts
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

  type CSSProperties = import('./types').CSSProperties;
  type CreateStyle = import('./types').CreateStyle;

  type create = <const T extends Record<string, CSSProperties>>(_rule: CreateStyleType<T>)=> ReturnType<T>;
  type props = (..._rules: (false | CSSProperties | null | undefined)[])=> string;
  type createTheme = <const T extends CreateTheme>(_rule: T)=> ReturnVariableType<T>;
  type createStatic = <const T extends CreateStatic>(_rule: T)=> T;
  type keyframes = (_rule: Keyframes) => string;
  type viewTransition = (_rule: ViewTransition) => string;
  type variants = <T extends Variants>(_rule: T) => (_props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
  type marker = (_id: string, _pseudo: string) => Marker;
  type extended = <I extends string, P extends string>(_id: I, _pseudo: P) => Extended<I, P>;

  const create: create;
  const props: props;
  const createTheme: createTheme;
  const createStatic: createStatic;
  const keyframes: keyframes;
  const viewTransition: viewTransition;
  const variants: variants;
  const marker: marker;
  const extended: extended;
}