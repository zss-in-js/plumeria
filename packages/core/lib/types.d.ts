import type { Properties, Property } from 'csstype';

type CSSVariableKey = `--${string}`;
type CSSVariableValue = `var(${CSSVariableKey})`;
type CSSVariableProperty = { [key: CSSVariableKey]: string | number };

type ColorValue = Exclude<Property.Color, '-moz-initial'> | (string & {});
type CSSColorProperty = Exclude<ColorValue, SystemColorKeyword>;

type SystemColorKeyword =
  | 'ActiveBorder'
  | 'ActiveCaption'
  | 'AppWorkspace'
  | 'Background'
  | 'ButtonFace'
  | 'ButtonHighlight'
  | 'ButtonShadow'
  | 'ButtonText'
  | 'CaptionText'
  | 'GrayText'
  | 'Highlight'
  | 'HighlightText'
  | 'InactiveBorder'
  | 'InactiveCaption'
  | 'InactiveCaptionText'
  | 'InfoBackground'
  | 'InfoText'
  | 'Menu'
  | 'MenuText'
  | 'Scrollbar'
  | 'ThreeDDarkShadow'
  | 'ThreeDFace'
  | 'ThreeDHighlight'
  | 'ThreeDLightShadow'
  | 'ThreeDShadow'
  | 'Window'
  | 'WindowFrame'
  | 'WindowText';

type ExcludeMozInitial<T> = Exclude<T, '-moz-initial'>;

type CSSTypeProperties = Properties<number | (string & {})>;

type CustomProperties = {
  [K in keyof CSSTypeProperties]: ExcludeMozInitial<CSSTypeProperties[K]>;
};

type BaseCSSProperties = {
  [K in keyof CustomProperties]: CustomProperties[K] | CSSVariableValue;
};

interface CommonProperties extends BaseCSSProperties {
  accentColor?: CSSColorProperty;
  color?: CSSColorProperty;
  borderLeftColor?: CSSColorProperty;
  borderRightColor?: CSSColorProperty;
  borderTopColor?: CSSColorProperty;
  borderBottomColor?: CSSColorProperty;
  borderBlockColor?: CSSColorProperty;
  borderBlockStartColor?: CSSColorProperty;
  borderBlockEndColor?: CSSColorProperty;
  borderInlineColor?: CSSColorProperty;
  borderInlineStartColor?: CSSColorProperty;
  borderInlineEndColor?: CSSColorProperty;
  backgroundColor?: CSSColorProperty;
  outlineColor?: CSSColorProperty;
  textDecorationColor?: CSSColorProperty;
  caretColor?: CSSColorProperty;
  columnRuleColor?: CSSColorProperty;
}

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

type CreateStyleType<T> = {
  readonly [K in keyof T]: T[K] extends CSSProperties ? CSSProperties : T[K];
};

type CreateStyle = {
  [key: string]: CSSProperties;
};

type ReturnType<T> = {
  [K in keyof T]: Readonly<{
    [P in keyof T[K]]: T[K][P];
  }>;
};

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

type StripColon<T extends string> = T extends `:${infer R}`
  ? StripColon<R>
  : T;

type Extended<I extends string, P extends string> = `@container style(--${I}-${StripColon<P>}: 1)`;

export type {
  CSSProperties,
  CreateStyle,
  CreateStyleType,
  CreateStatic,
  CreateTheme,
  Keyframes,
  ViewTransition,
  ReturnType,
  ReturnVariableType,
  Variants,
  Marker,
  Extended,
};