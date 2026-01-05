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
} from './types';

const errorFn = () => {
  throw new Error('Runtime execution is not supported');
};

const defined = new Set<string>();

const props = (
  ...rules: (false | CSSProperties | null | undefined)[]
): string => {
  defined.clear();
  let result = '';

  for (let i = rules.length - 1; i >= 0; i--) {
    const arg = rules[i] as Record<string, string>;
    if (!arg || typeof arg !== 'object') continue;

    let chunk = '';
    for (const key in arg) {
      if (arg[key] && !defined.has(key)) {
        defined.add(key);
        chunk += chunk ? ' ' + arg[key] : arg[key];
      }
    }

    if (chunk) result = result ? chunk + ' ' + result : chunk;
  }

  return result;
};

const create = <const T extends Record<string, CSSProperties>>(
  _rule: CreateStyleType<T>,
): ReturnType<T> => errorFn();

const createTheme = <const T extends CreateTheme>(
  _rule: T,
): ReturnVariableType<T> => errorFn();

const createStatic = <const T extends CreateStatic>(_rule: T): T => errorFn();

const keyframes = (_rule: Keyframes): string => errorFn();

const viewTransition = (_rule: ViewTransition): string => errorFn();

const x = (className: string, style: Style) => ({ className, style });

const css = {
  create,
  props,
  createTheme,
  createStatic,
  keyframes,
  viewTransition,
};
type css = typeof css;

export { css, x };
export type { CreateStyle, CSSProperties };
