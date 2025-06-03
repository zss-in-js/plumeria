import type {
  CSSProperties,
  CSSHTML,
  CreateStyle,
  CreateStyleType,
  CreateTheme,
  CreateValues,
  CreateKeyframes,
  ReturnType,
} from 'zss-engine';
import {
  transpiler,
  isServer,
  isDevAndTest,
  injectServerCSS,
  injectClientCSS,
  injectClientGlobalCSS,
  genBase36Hash,
  camelToKebabCase,
} from 'zss-engine';
import {
  initPromise_1,
  globalPromise_1,
  resolvePromise_1,
  initPromise_2,
  globalPromise_2,
  resolvePromise_2,
} from './processors/css.js';
import { media, container, pseudo, color } from 'zss-utils';

function create<const T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): ReturnType<T> {
  const base36Hash = genBase36Hash(object, 6);
  const { styleSheet } = transpiler(object, base36Hash);
  const injectCSS = isServer ? injectServerCSS : injectClientCSS;
  if (typeof globalPromise_1 === 'undefined') initPromise_1();
  resolvePromise_1(styleSheet);

  Object.keys(object).forEach((key) => {
    Object.defineProperty(object, key, {
      get: () => {
        const className = key + '_' + base36Hash;
        if (isDevAndTest) injectCSS(base36Hash, styleSheet);
        return className;
      },
    });
  });

  return Object.freeze(object as unknown as ReturnType<T>);
}

function global(object: CSSHTML): void {
  const base36Hash = genBase36Hash(object, 8);
  const { styleSheet } = transpiler(object, undefined, '--global');
  if (typeof globalPromise_2 === 'undefined') initPromise_2();
  resolvePromise_2(styleSheet);

  if (isDevAndTest)
    isServer
      ? injectServerCSS(base36Hash, styleSheet)
      : injectClientGlobalCSS(styleSheet);
}

const keyframes = (object: CreateKeyframes) => {
  const prefix = genBase36Hash(object, 8);
  global({ [`@keyframes ${prefix}`]: object });
  return prefix;
};

const defineConsts = <const T extends CreateValues>(constants: T) => {
  return constants;
};

const defineVars = <const T extends CreateValues>(object: T) => {
  const styles: Record<string, CreateValues> = {
    ':root': {},
  };

  const result = {} as {
    [K in keyof T]: `var(--${string})`;
  };

  Object.entries(object).forEach(([key, value]) => {
    const kebabKey = camelToKebabCase(key);
    (result as any)[key] = `var(--${kebabKey})`;
    styles[':root'][`--${key}`] = value;
  });

  global(styles);
  return result;
};

const defineTheme = <const T extends CreateTheme>(object: T) => {
  const styles: Record<string, Record<string, string | number | object>> = {};
  const result = {} as {
    [K in keyof T]: `var(--${string})`;
  };

  Object.entries(object).forEach(([key, value]) => {
    const kebabKey = camelToKebabCase(key);
    (result as any)[key] = `var(--${kebabKey})`;

    Object.entries(value).forEach(([subKey, subValue]) => {
      if (subKey.startsWith('@media')) {
        styles[':root'] ||= {};
        styles[':root'][subKey] ||= {};
        (styles[':root'][subKey] as Record<string, string | number>)[
          `--${key}`
        ] = subValue;
      } else {
        const themeSelector =
          subKey === 'default' ? ':root' : `:root[data-theme="${subKey}"]`;
        styles[themeSelector] ||= {};
        styles[themeSelector][`--${key}`] = subValue;
      }
    });
  });

  global(styles);
  return result;
};

class css {
  static create<const T extends Record<string, CSSProperties>>(
    object: CreateStyleType<T>,
  ): ReturnType<T> {
    return create(object);
  }

  static global(object: CSSHTML): void {
    return global(object);
  }

  static keyframes(object: CreateKeyframes): string {
    return keyframes(object);
  }

  static defineConsts<const T extends CreateValues>(object: T) {
    return defineConsts(object);
  }

  static defineVars<const T extends CreateValues>(object: T) {
    return defineVars(object);
  }

  static defineTheme<const T extends CreateTheme>(object: T) {
    return defineTheme(object);
  }

  static media = media;
  static container = container;
  static pseudo = pseudo;
  static color = color;
}

export default css;
export type { CSSProperties, CSSHTML, CreateStyle };
