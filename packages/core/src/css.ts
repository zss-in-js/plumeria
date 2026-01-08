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
  Style,
  Variant,
} from './types';

type css = typeof css;

const errorFn = () => {
  throw new Error('Runtime is not supported. Configure the bundler plugin.');
};

const props = (
  ..._rules: (false | CSSProperties | null | undefined)[]
): string => errorFn();

const create = <const T extends Record<string, CSSProperties>>(
  _rule: CreateStyleType<T>,
): ReturnType<T> => errorFn();

const createTheme = <const T extends CreateTheme>(
  _rule: T,
): ReturnVariableType<T> => errorFn();

const createStatic = <const T extends CreateStatic>(_rule: T): T => errorFn();

const keyframes = (_rule: Keyframes): string => errorFn();

const viewTransition = (_rule: ViewTransition): string => errorFn();

const variants =
  <T extends Variant>(_rule: T) =>
  (_props: { [K in keyof T]?: keyof T[K] }): CSSProperties =>
    errorFn();

const x = (className: string, style: Style) => ({ className, style });

const css = {
  create,
  props,
  createTheme,
  createStatic,
  keyframes,
  viewTransition,
  variants,
};

export { css, x };
export type { CreateStyle, CSSProperties };
