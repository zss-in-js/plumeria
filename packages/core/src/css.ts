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

function props(
  ...rules: (
    | false
    | CSSProperties
    | Record<string, string>
    | null
    | undefined
  )[]
): string {
  const chosen = new Map<string, { hash: string; propsIdx: number }>();
  const classList: string[] = [];
  const orderedKeys: { hash: string; propsIdx: number }[] = [];
  const rightmostKeys: { hash: string; propsIdx: number }[] = [];

  // Traverse from right to left and determine the rightmost hash for each key (property)
  for (let i = rules.length - 1; i >= 0; i--) {
    const arg = rules[i];
    if (!arg || typeof arg === 'string') continue;
    for (const [key, hash] of Object.entries(arg)) {
      if (!chosen.has(key)) {
        chosen.set(key, { hash: hash as string, propsIdx: i });
      }
    }
  }

  // Scan from left to right to determine output order
  for (let i = 0; i < rules.length; i++) {
    const arg = rules[i];
    if (!arg) continue;

    if (typeof arg === 'string') {
      // Statically resolved strings are added as is
      classList.push(arg);
      continue;
    }

    for (const [key] of Object.entries(arg)) {
      const info = chosen.get(key);
      if (info && info.propsIdx === i) {
        // Only output if this argument is the final adopter of this key
        if (i === rules.length - 1) {
          rightmostKeys.push(info);
        } else {
          orderedKeys.push(info);
        }
        chosen.delete(key);
      }
    }
  }

  // Maintain output order (normal key -> right-most property)
  for (const { hash } of orderedKeys) {
    classList.push(hash);
  }
  for (const { hash } of rightmostKeys) {
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

const x = (className: string, styles: Styles) => ({
  className,
  styles,
});

export { css, x };
export type { CreateStyle, CSSProperties };
