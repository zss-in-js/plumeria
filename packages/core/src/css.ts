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

type errorForFn = typeof Error;

const errorForFn = () =>
  new Error('Runtime is not supported. Configure the bundler plugin.');

export function create<const T extends Record<string, CSSProperties>>(
  _rule: CreateStyleType<T>,
): ReturnType<T> {
  throw errorForFn();
}

export function props(
  ..._rules: (false | CSSProperties | null | undefined)[]
): string {
  throw errorForFn();
}

export function createTheme<const T extends CreateTheme>(
  _rule: T,
): ReturnVariableType<T> {
  throw errorForFn();
}

export function createStatic<const T extends CreateStatic>(_rule: T): T {
  throw errorForFn();
}

export function keyframes(_rule: Keyframes): string {
  throw errorForFn();
}

export function viewTransition(_rule: ViewTransition): string {
  throw errorForFn();
}

export function variants<T extends Variant>(_rule: T) {
  return (_props: { [K in keyof T]?: keyof T[K] }): CSSProperties => {
    throw errorForFn();
  };
}

export function marker(_id: string, _pseudo: string): CSSProperties {
  throw errorForFn();
}

export function extended(_id: string, _pseudo: string): ContainerStyleQuery {
  throw errorForFn();
}

export type { CreateStyle, CSSProperties } from './types';
