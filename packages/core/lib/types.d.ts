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

type StyleKey = keyof CSSTypes;
type NestedKey = ColonString | ArrayString | AtRule;

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

type MapNamespace<T> = Readonly<{
  [key in keyof T]: T[key] extends Record<string, unknown>
    ? key extends NestedKey
      ? MapNamespace<T[key]>
      : AtomicClassNameFor<key & string, T[key]>
    : key extends string
      ? AtomicClassNameFor<key, T[key]>
      : never;
}>;

declare const DynamicTag: unique symbol;

type DynamicNamespace<T> = MapNamespace<T> & {
  readonly [DynamicTag]: true;
};

type CreateReturnType<T> = Readonly<{
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => DynamicNamespace<R>
    : MapNamespace<T[K]>;
}>;
type FlatNamespace<K extends StyleKey> = {
  readonly [P in StyleKey]?: P extends K
    ? AtomicClassNameFor<P & string, unknown>
    : never;
};

interface NestedNamespace<K extends StyleKey> {
  readonly [P: NestedKey]: AllowedNamespace<K> | undefined;
}

type AllowedNamespace<K extends StyleKey> = FlatNamespace<K> &
  NestedNamespace<K>;

type StyleList<T> = T | false | null | undefined | StyleList<T>[];

type StyleNamespace = AllowedNamespace<StyleKey>;
type Style = StyleList<StyleNamespace>;

type StyleProps<K extends StyleKey> = StyleList<AllowedNamespace<K>>;

type WithoutProperties<K extends StyleKey> = StyleProps<Exclude<StyleKey, K>>;

type StaticNamespace<K extends StyleKey> = AllowedNamespace<K> & {
  readonly [DynamicTag]?: never;
};

type StaticStyles<K extends StyleKey = StyleKey> = StyleList<
  StaticNamespace<K>
>;

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
  Style,
  StyleProps,
  StaticStyles,
  WithoutProperties,
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
