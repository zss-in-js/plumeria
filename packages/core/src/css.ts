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

function errorFn(fn: string) {
  throw new Error(`css.${fn} requires bundler-plugin setup`);
}

const defined = new Set<string>();

function props(...rules: (false | CSSProperties | null | undefined)[]): string {
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
}

const css = class _css {
  static create<const T extends Record<string, CSSProperties>>(
    _rule: CreateStyleType<T>,
  ): ReturnType<T> {
    throw errorFn('create');
  }
  static props = props;

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

const x = (className: string, style: Style) => ({
  className,
  style,
});

export { css, x };
export type { CreateStyle, CSSProperties };
