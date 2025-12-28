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
  Styles,
} from './types';

function errorFn(fn: string) {
  throw new Error(
    'Using the "css.' +
      fn +
      '" is runtime not supported. Make sure you have setup bundler-plugin correctly.',
  );
}

function create<const T extends Record<string, CSSProperties>>(
  _rule: CreateStyleType<T>,
): ReturnType<T> {
  throw errorFn('create');
}

function props(...rules: (false | CSSProperties | null | undefined)[]): string {
  return rules.filter(Boolean).join(' ');
}

function createStatic<const T extends CreateStatic>(_rule: T): T {
  throw errorFn('createStatic');
}

function createTheme<const T extends CreateTheme>(
  _rule: T,
): ReturnVariableType<T> {
  throw errorFn('createTheme');
}

function keyframes(_rule: Keyframes): string {
  throw errorFn('keyframes');
}

function viewTransition(_rule: ViewTransition): string {
  throw errorFn('viewTransition');
}

class _css {
  static create<const T extends Record<string, CSSProperties>>(
    rule: CreateStyleType<T>,
  ): ReturnType<T> {
    return create(rule);
  }

  static props(
    ...rules: (false | Readonly<CSSProperties> | null | undefined)[]
  ): string {
    return props(...rules);
  }

  static createTheme<const T extends CreateTheme>(
    rule: T,
  ): ReturnVariableType<T> {
    return createTheme(rule);
  }

  static createStatic<const T extends CreateStatic>(rule: T): T {
    return createStatic(rule);
  }

  static keyframes(rule: Keyframes): string {
    return keyframes(rule);
  }

  static viewTransition(rule: ViewTransition): string {
    return viewTransition(rule);
  }
}

const x = (className: string, styles: Styles) => ({
  className,
  styles,
});

const css = _css;

export { css, x };
export type { CreateStyle, CSSProperties };
