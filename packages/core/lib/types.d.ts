import type { CSSTypes } from './csstypes';

type CSSVariableKey = `--${string}`;
type CSSVariableValue = `var(${CSSVariableKey})`;
type ThemeValue = {
  default: string;
  theme: string;
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

type AtRule =
  | `@media ${string}`
  | `@container ${string}`
  | `@supports ${string}`
  | `@layer ${string}`
  | `@scope ${string}`;

type AtRuleSelector = {
  [K in AtRule]:
    | CommonProperties
    | ColonSelector
    | ArraySelector
    | CSSVariableProperty;
};

type CSSProperties =
  | CommonProperties
  | ColonSelector
  | ArraySelector
  | AtRuleSelector
  | CSSVariableProperty;

type CreateStyleValue = CSSProperties | ((...args: any[]) => CSSProperties);

declare const ClassNameTag: unique symbol;

type AtomicClassNameFor<P extends string, V> = string & {
  readonly _ident: typeof ClassNameTag;
  readonly _key: P;
  readonly _value: V;
};

type AtString = `@${string}`;
type MapNamespace<T> = Readonly<{
  [key in keyof T]: T[key] extends Record<string, unknown>
    ? key extends ColonString | ArrayString | AtString
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
type Conditional = false | CSSProperties | null | undefined;
type StyleName = Conditional | StyleName[];

type CreateStatic = Record<string, string | number>;

type CreateTheme = {
  [key: string]: ThemeValue;
};

type DotString = `.${string}`;
type CreateThemeSelector = DotString | ArrayString | AtRule;
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

type Marker = Record<string, CSSProperties>;

type StripColon<T extends string> = T extends `:${infer R}` ? StripColon<R> : T;

type Extended<
  I extends string,
  P extends string,
> = `@container style(--${I}-${StripColon<P>}: 1)`;

export type {
  AtomicClassNameFor,
  StyleName,
  CSSProperties,
  CreateStyleValue,
  CreateReturnType,
  CreateTheme,
  CreateThemeSelector,
  CreateThemeReturnType,
  CreateStatic,
  Keyframes,
  ViewTransition,
  Marker,
  Extended,
};
