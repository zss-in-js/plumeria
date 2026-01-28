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

type runtimeNotSupported = typeof Error;
const runtimeNotSupported = () =>
  new Error('Runtime is not supported. Configure the bundler plugin.');

export type create = typeof create;
export type props = typeof props;
export type createTheme = typeof createTheme;
export type createStatic = typeof createStatic;
export type keyframes = typeof keyframes;
export type viewTransition = typeof viewTransition;
export type variants = typeof variants;
export type marker = typeof marker;
export type extended = typeof extended;

export function create<const T extends Record<string, CSSProperties>>(
  _rule: CreateStyleType<T>,
): ReturnType<T> {
  throw runtimeNotSupported();
}

export function props(
  ..._rules: (false | CSSProperties | null | undefined)[]
): string {
  throw runtimeNotSupported();
}

export function createTheme<const T extends CreateTheme>(
  _rule: T,
): ReturnVariableType<T> {
  throw runtimeNotSupported();
}

export function createStatic<const T extends CreateStatic>(_rule: T): T {
  throw runtimeNotSupported();
}

export function keyframes(_rule: Keyframes): string {
  throw runtimeNotSupported();
}

export function viewTransition(_rule: ViewTransition): string {
  throw runtimeNotSupported();
}

export function variants<T extends Variant>(_rule: T) {
  return (_props: { [K in keyof T]?: keyof T[K] }): CSSProperties => {
    throw runtimeNotSupported();
  };
}

export function marker(_id: string, _pseudo: string): CSSProperties {
  throw runtimeNotSupported();
}

export function extended(_id: string, _pseudo: string): ContainerStyleQuery {
  throw runtimeNotSupported();
}

export type { CreateStyle, CSSProperties } from './types';
