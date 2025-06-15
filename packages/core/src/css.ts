import type {
  CSSProperties,
  CSSHTML,
  CreateStyle,
  CreateStyleType,
  CreateTheme,
  CreateValues,
  CreateKeyframes,
  ReturnType,
  Join,
  ReturnVariableType,
  RxVariableSet,
  ReturnRx,
} from 'zss-engine';
import {
  transpiler,
  isServer,
  isTestingDevelopment,
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
} from './processors/css';

import { media, container, color, ps } from 'zss-utils';

const objectToKeyHashMap = new WeakMap<CSSProperties, string>();

function create<const T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): ReturnType<T> {
  const base36Hash = genBase36Hash(object, 6);
  const { styleSheet } = transpiler(object, base36Hash);
  const injectCSS = isServer ? injectServerCSS : injectClientCSS;
  if (typeof globalPromise_1 === 'undefined') initPromise_1();
  resolvePromise_1(styleSheet);

  Object.keys(object).forEach((key) => {
    const cssProperties = object[key];
    const hashedClassName = key + '_' + base36Hash;
    objectToKeyHashMap.set(cssProperties, hashedClassName);
    Object.defineProperty(object, key, {
      get: () => {
        if (isTestingDevelopment) injectCSS(base36Hash, styleSheet);
        return Object.freeze(cssProperties);
      },
    });
  });

  return Object.freeze(object as ReturnType<T>);
}

const props = (
  ...objects: (false | Readonly<CSSProperties> | null | undefined)[]
): string => {
  const classNames = objects.filter(Boolean).map((obj) => {
    if (obj && typeof obj === 'object') {
      const keyHash = objectToKeyHashMap.get(obj);
      if (keyHash) return keyHash;
    }
    return '';
  });

  return [...new Set(classNames)].join(' ');
};

const rx = (cssProperties: Readonly<CSSProperties>, varSet: RxVariableSet) => ({
  className: props(cssProperties),
  style: Object.fromEntries(
    Object.entries(varSet).map(([key, value]) => [key, value]),
  ),
});

const px = <T extends readonly string[]>(...pseudos: T): Join<T> => {
  return pseudos.filter(Boolean).join('') as Join<T>;
};

function global(object: CSSHTML): void {
  const base36Hash = genBase36Hash(object, 8);
  const { styleSheet } = transpiler(object, undefined, '--global');
  if (typeof globalPromise_2 === 'undefined') initPromise_2();
  resolvePromise_2(styleSheet);

  if (isTestingDevelopment)
    isServer
      ? injectServerCSS(base36Hash, styleSheet)
      : injectClientGlobalCSS(styleSheet);
}

const keyframes = (object: CreateKeyframes): string => {
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

  const result = {} as ReturnVariableType<T>;

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
  const result = {} as ReturnVariableType<T>;

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
  private constructor() {}
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

  static defineConsts<const T extends CreateValues>(object: T): CreateValues {
    return defineConsts(object);
  }

  static defineVars<const T extends CreateValues>(
    object: T,
  ): ReturnVariableType<T> {
    return defineVars(object);
  }

  static defineTheme<const T extends CreateTheme>(
    object: T,
  ): ReturnVariableType<T> {
    return defineTheme(object);
  }

  static props(
    ...objects: (false | Readonly<CSSProperties> | null | undefined)[]
  ): string {
    return props(...objects);
  }

  static rx(
    cssProperties: Readonly<CSSProperties>,
    varSet: RxVariableSet,
  ): ReturnRx {
    return rx(cssProperties, varSet);
  }

  static px<T extends readonly string[]>(...pseudos: T): Join<T> {
    return px(...pseudos);
  }

  static media = media;
  static container = container;
  static color = color;
}

export { css, ps, px, rx };
export type { CreateStyle, CSSHTML, CSSProperties };
