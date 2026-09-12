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

type AtKeyword = '@media' | '@container' | '@supports' | '@layer' | '@scope';
type AtRule = `${AtKeyword} ${string}` | `${AtKeyword}(${string}`;

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
declare const ClassStyleTag: unique symbol;

type AtomicClassNameFor<P extends string, V> = string & {
  readonly _ident: typeof ClassNameTag;
  readonly _key: P;
  readonly _value: V;
};

type AtomicClassStyleFor<P extends string, V> = AtomicClassNameFor<P, V> & {
  readonly _classStyle: typeof ClassStyleTag;
};

type AtomicStyle<T> = Readonly<{
  [key in keyof T]: key extends string
    ? T[key] extends AtomicClassNameFor<string, infer V>
      ? AtomicClassNameFor<key, V>
      : T[key] extends Record<string, unknown>
        ? key extends NestedKey
          ? AtomicStyle<T[key]>
          : AtomicClassNameFor<key, T[key]>
        : AtomicClassNameFor<key, T[key]>
    : T[key];
}>;

type ClassStyled<T> = Readonly<{
  readonly [key in keyof T]: T[key] extends AtomicClassNameFor<infer P, infer V>
    ? AtomicClassStyleFor<P, V>
    : ClassStyled<T[key]>;
}>;

type AtomicClassStyle<T> = ClassStyled<AtomicStyle<T>>;

type StyleMap<T> = [T] extends [unknown]
  ? Readonly<{
      readonly [key in keyof T]: T[key] extends Record<string, unknown>
        ? key extends NestedKey
          ? StyleMap<T[key]>
          : AtomicClassNameFor<key & string, T[key]>
        : key extends string
          ? AtomicClassNameFor<key, T[key]>
          : never;
    }>
  : never;

type CreateReturnType<T> = Readonly<{
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => ClassStyled<StyleMap<R>>
    : StyleMap<T[K]>;
}>;
type FlatNamespace<K extends StyleKey, M = unknown> = {
  readonly [P in StyleKey]?: P extends K
    ? AtomicClassNameFor<P & string, unknown> & M
    : never;
};

interface NestedNamespace<K extends StyleKey, M> {
  readonly [P: NestedKey]: AllowedNamespace<K, M> | undefined;
}

type AllowedNamespace<K extends StyleKey, M = unknown> = FlatNamespace<K, M> &
  NestedNamespace<K, M>;

type StyleList<T> = T | false | null | undefined | StyleList<T>[];

type StyleNamespace = AllowedNamespace<StyleKey>;
type Style = StyleList<StyleNamespace>;

type StyleProps<K extends StyleKey> = StyleList<AllowedNamespace<K>>;

type WithoutProperties<K extends StyleKey> = StyleProps<Exclude<StyleKey, K>>;

type StaticNamespace<K extends StyleKey> = AllowedNamespace<
  K,
  { readonly _classStyle?: never }
>;

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

type StripColon<T extends string> = T extends `:${infer R}` ? StripColon<R> : T;

type Extended<
  I extends string,
  P extends string,
> = `@container style(--${I}-${StripColon<P>}: 1)`;

type Marker = Readonly<Record<ColonString, CSSVariableProperty>>;

export type {
  AtomicClassNameFor,
  AtomicClassStyleFor,
  AtomicStyle,
  AtomicClassStyle,
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
