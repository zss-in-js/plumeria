import type { CSSTypes } from './csstypes';

type CSSVariableKey = `--${string}`;
type CSSVariableValue = `var(${CSSVariableKey})`;
type ThemeValue = {
  default: string | number;
  theme: string | number;
};
type CSSVariableProperty = {
  [key: CSSVariableKey]: string | number | ThemeValue;
};

type CommonProperties = {
  [K in keyof CSSTypes]: CSSTypes[K] | CSSVariableValue | ThemeValue;
};

type ArrayString = `[${string}`;
type ArraySelector = {
  [key in ArrayString]: CommonProperties | CSSVariableProperty;
};

type ColonString = `:${string}`;
type ColonSelector = {
  [key in ColonString]: CommonProperties | CSSVariableProperty;
};

type Query = `@media ${string}` | `@container ${string}`;
type QuerySelector = {
  [K in Query]:
    | CommonProperties
    | ColonSelector
    | ArraySelector
    | CSSVariableProperty;
};

type CSSProperties =
  | CommonProperties
  | ArraySelector
  | ColonSelector
  | QuerySelector
  | CSSVariableProperty;

type CreateStyleValue = CSSProperties | ((...args: any[]) => CSSProperties);

const ClassNameTag: unique symbol;

type AtomicClassNameFor<out P extends string, out V> = string & {
  readonly _ident: typeof ClassNameTag;
  readonly _key: P;
  readonly _value: V;
};

type MapNamespace<T> = Readonly<{
  [key in keyof T]: T[key] extends Record<string, unknown>
    ? key extends `:${string}` | `@${string}` | `[${string}`
      ? MapNamespace<T[key]>
      : AtomicClassNameFor<key & string, T[key]>
    : key extends string
      ? AtomicClassNameFor<key, T[key]>
      : never;
}>;

type CreateReturnType<T> = Readonly<{
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => MapNamespace<R>
    : MapNamespace<T[K]>;
}>;

type StyleName = CSSProperties | (false | CSSProperties | null | undefined)[];

type CreateStatic = Record<string, string | number>;

type CreateTheme = {
  [key: string]: ThemeValue;
};
type CreateThemeReturnType<T> = {
  readonly [K in keyof T]: Readonly<T[K]>;
};

type KeyframesInSelector = 'from' | 'to' | `${number}%`;
type Keyframes = {
  [K in KeyframesInSelector]?: CSSProperties;
};

type ViewTransition = {
  group?: CSSProperties;
  imagePair?: CSSProperties;
  new?: CSSProperties;
  old?: CSSProperties;
};

type Variants = Record<string, Record<string, CSSProperties>>;

type Marker = Record<string, CSSProperties>;

type StripColon<T extends string> = T extends `:${infer R}` ? StripColon<R> : T;

type Extended<
  I extends string,
  P extends string,
> = `@container style(--${I}-${StripColon<P>}: 1)`;

export type {
  CSSProperties,
  StyleName,
  CreateStyleValue,
  CreateReturnType,
  CreateTheme,
  CreateThemeReturnType,
  CreateStatic,
  Variants,
  Keyframes,
  ViewTransition,
  Marker,
  Extended,
  AtomicClassNameFor,
};
