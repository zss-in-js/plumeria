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
  throw new Error(`css.${fn} requires bundler-plugin setup`);
}
const css = class _css {
  static create<const T extends Record<string, CSSProperties>>(
    _rule: CreateStyleType<T>,
  ): ReturnType<T> {
    throw errorFn('create');
  }
  static props(...rules: (false | CSSProperties | null | undefined)[]): string {
    return rules.filter(Boolean).join(' ');
  }
  static createTheme<const T extends CreateTheme>(
    _rule: T,
  ): ReturnVariableType<T> {
    throw errorFn('createTheme');
  }

  static createStatic<const T extends CreateStatic>(_rule: T): T {
    throw errorFn('createStatic');
  }

  static keyframes(_rule: Keyframes): string {
    throw errorFn('keyframes');
  }

  static viewTransition(_rule: ViewTransition): string {
    throw errorFn('viewTransition');
  }
};

const x = (className: string, styles: Styles) => ({
  className,
  styles,
});

export { css, x };
export type { CreateStyle, CSSProperties };
