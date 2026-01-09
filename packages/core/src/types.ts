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

type AndString = `&${string}`;
type AndSelector = {
  [key in AndString]: CommonProperties;
};

type ColonString = `:${string}`;
type ColonSelector = {
  [key in ColonString]: CommonProperties;
};

type Query = `@media ${string}` | `@container ${string}`;
type QuerySelector = {
  [K in Query]:
    | CommonProperties
    | ColonSelector
    | AndSelector
    | CSSVariableProperty;
};

type CSSProperties =
  | CommonProperties
  | AndSelector
  | ColonSelector
  | QuerySelector
  | CSSVariableProperty;

type CreateStyleType<T> = {
  readonly [K in keyof T]: T[K] extends CSSProperties ? CSSProperties : T[K];
};

type CreateStyle = {
  [key: string]: CSSProperties;
};

type Selector<Properties> = {
  readonly properties: Properties;
};

type ReturnType<T> = {
  [K in keyof T]: Readonly<{
    [P in keyof T[K]]: P extends
      | `@media ${string}`
      | `@container ${string}`
      | `:${string}`
      | `&${string}`
      ? Selector<keyof T[K][P]>
      : T[K][P];
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

type Variant = Record<string, Record<string, CSSProperties>>;

export {
  CSSProperties,
  CreateStyle,
  CreateStyleType,
  CreateStatic,
  CreateTheme,
  Keyframes,
  ViewTransition,
  ReturnType,
  ReturnVariableType,
  Variant,
};
