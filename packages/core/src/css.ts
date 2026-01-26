/**
 * Compile-time only module.
 * Exists for types and static extraction. Never executed at runtime.
 */

import type {
  CSSProperties,
  CreateStyle,
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

type runtimeNotSupported = typeof runtimeNotSupported;
type create = typeof create;
type props = typeof props;
type createTheme = typeof createTheme;
type createStatic = typeof createStatic;
type keyframes = typeof keyframes;
type viewTransition = typeof viewTransition;
type variants = typeof variants;
type marker = typeof marker;
type extended = typeof extended;

const runtimeNotSupported = (): never => {
  throw new Error('Runtime is not supported. Configure the bundler plugin.');
};

const create = <const T extends Record<string, CSSProperties>>(
  _rule: CreateStyleType<T>,
): ReturnType<T> => runtimeNotSupported();

const props = (
  ..._rules: (false | CSSProperties | null | undefined)[]
): string => runtimeNotSupported();

const createTheme = <const T extends CreateTheme>(
  _rule: T,
): ReturnVariableType<T> => runtimeNotSupported();

const createStatic = <const T extends CreateStatic>(_rule: T): T =>
  runtimeNotSupported();

const keyframes = (_rule: Keyframes): string => runtimeNotSupported();

const viewTransition = (_rule: ViewTransition): string => runtimeNotSupported();

const variants =
  <T extends Variant>(_rule: T) =>
  (_props: { [K in keyof T]: keyof T[K] }): CSSProperties =>
    runtimeNotSupported();

const marker = (_id: string, _pseudo: string): CSSProperties =>
  runtimeNotSupported();
const extended = (_id: string, _pseudo: string): ContainerStyleQuery =>
  runtimeNotSupported();

export {
  create,
  props,
  createTheme,
  createStatic,
  keyframes,
  viewTransition,
  variants,
  marker,
  extended,
};

export type { CreateStyle, CSSProperties };
