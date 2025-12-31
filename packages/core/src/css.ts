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

function props(...rules: (false | CSSProperties | null | undefined)[]): string {
  const chosen = new Map<string, number>();
  const lastIdx = rules.length - 1;

  // 1st time: Determine which key is used in which index (in reverse order)
  for (let i = lastIdx; i >= 0; i--) {
    const arg = rules[i];
    if (!arg || typeof arg === 'string') continue;
    // Avoid generating [key, value] array by directly iterating over keys
    for (const key in arg) {
      if (!chosen.has(key)) {
        chosen.set(key, i);
      }
    }
  }

  const classList: string[] = [];
  const rightmostList: string[] = []; // For the last class

  // 2nd time: Construct the result in the original order (forward order)
  for (let i = 0; i <= lastIdx; i++) {
    const arg = rules[i] as Record<string, string>;
    if (!arg) continue;

    if (typeof arg === 'string') {
      classList.push(arg);
      continue;
    }

    for (const key in arg) {
      // Only output if this argument is the final adopter of this key
      if (chosen.get(key) === i && arg[key]) {
        if (i === lastIdx) {
          rightmostList.push(arg[key]);
        } else {
          classList.push(arg[key]);
        }
      }
    }
  }

  for (const hash of rightmostList) {
    classList.push(hash);
  }

  return classList.join(' ');
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
