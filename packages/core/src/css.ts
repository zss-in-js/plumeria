/**
 * Compile-time only module.
 * Exists for types and static extraction. Never executed at runtime.
 */

import type {
  CSSProperties,
  CreateStyleType,
  CreateStatic,
  CreateTheme,
  Keyframes,
  ViewTransition,
  ReturnType,
  ReturnVariableType,
  Variant,
  ContainerStyleQuery,
} from './types';

export type create = typeof create;
export type props = typeof props;
export type createTheme = typeof createTheme;
export type createStatic = typeof createStatic;
export type keyframes = typeof keyframes;
export type viewTransition = typeof viewTransition;
export type variants = typeof variants;
export type marker = typeof marker;
export type extended = typeof extended;

type runtimeNotSupported = typeof Error;

const runtimeNotSupported = (): never => {
  throw new Error('Runtime is not supported. Configure the bundler plugin.');
};

export const create = <const T extends Record<string, CSSProperties>>(
  _rule: CreateStyleType<T>,
): ReturnType<T> => runtimeNotSupported();

export const props = (
  ..._rules: (false | CSSProperties | null | undefined)[]
): string => runtimeNotSupported();

export const createTheme = <const T extends CreateTheme>(
  _rule: T,
): ReturnVariableType<T> => runtimeNotSupported();

export const createStatic = <const T extends CreateStatic>(_rule: T): T =>
  runtimeNotSupported();

export const keyframes = (_rule: Keyframes): string => runtimeNotSupported();

export const viewTransition = (_rule: ViewTransition): string =>
  runtimeNotSupported();

export const variants =
  <T extends Variant>(_rule: T) =>
  (_props: { [K in keyof T]?: keyof T[K] }): CSSProperties =>
    runtimeNotSupported();

export const marker = (_id: string, _pseudo: string): CSSProperties =>
  runtimeNotSupported();

export const extended = (_id: string, _pseudo: string): ContainerStyleQuery =>
  runtimeNotSupported();

export type { CreateStyle, CSSProperties } from './types';
