import type { CSSTypes } from './csstypes';

type CSSVariableKey = `--${string}`;
type CSSVariableValue = `var(${CSSVariableKey})`;
type CSSVariableProperty = { [key: CSSVariableKey]: string | number };

type CommonProperties = {
  [K in keyof CSSTypes]: CSSTypes[K] | CSSVariableValue;
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

type CreateStyleValue = CSSProperties | ((...args: never) => CSSProperties);

type CreateReturnType<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Readonly<{ [P in keyof R]: R[P] }>
    : Readonly<{ [P in keyof T[K]]: T[K][P] }>;
};

type StyleName = CSSProperties | (false | CSSProperties | null | undefined)[];

type CreateStatic = Record<string, string | number>;

type CreateTheme = Record<string, Record<string, string | number>>;
type ReturnVariableType<T> = { [K in keyof T]: CSSVariableValue };

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
  CreateStatic,
  CreateTheme,
  Keyframes,
  ViewTransition,
  ReturnVariableType,
  Variants,
  Marker,
  Extended,
};
