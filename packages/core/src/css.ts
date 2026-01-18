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

type create = typeof create;
type props = typeof props;
type createTheme = typeof createTheme;
type createStatic = typeof createStatic;
type keyframes = typeof keyframes;
type viewTransition = typeof viewTransition;
type variants = typeof variants;
type marker = typeof marker;
type extended = typeof extended;

const errorFn = () => {
  throw new Error('Runtime is not supported. Configure the bundler plugin.');
};

const create = <const T extends Record<string, CSSProperties>>(
  _rule: CreateStyleType<T>,
): ReturnType<T> => errorFn();

const props = (
  ..._rules: (false | CSSProperties | null | undefined)[]
): string => errorFn();

const createTheme = <const T extends CreateTheme>(
  _rule: T,
): ReturnVariableType<T> => errorFn();

const createStatic = <const T extends CreateStatic>(_rule: T): T => errorFn();

const keyframes = (_rule: Keyframes): string => errorFn();

const viewTransition = (_rule: ViewTransition): string => errorFn();

const variants =
  <T extends Variant>(_rule: T) =>
  (_props: { [K in keyof T]: keyof T[K] }): CSSProperties =>
    errorFn();

const marker = (_id: string, _pseudo: string): CSSProperties => errorFn();
const extended = (_id: string, _pseudo: string): ContainerStyleQuery =>
  errorFn();

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
