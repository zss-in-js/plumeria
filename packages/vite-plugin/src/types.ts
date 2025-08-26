// Basic primitives (types handled by the implementation)
type CSSPrimitive = string | number | boolean | null;

// Special strings used when parsing/resolving fails (list of those used in the implementation)
type ParseErrorString =
  | `[unresolved]`
  | `[unresolved identifier]`
  | `[unsupported value type]`
  | `[unresolved: ${string}]`
  | `[unresolved member expression]`;

// Nestable CSS value types for recursive structures
export type CSSValue = CSSPrimitive | CSSObject | ParseErrorString;
export type CSSObject = {
  [key: string]: CSSValue;
};

// Table types for various CSS constructs
export type ConstTable = Record<string, CSSObject | string>; // varName -> object
export type VariableTable = Record<string, CSSObject>; // varName -> object
export type ThemeTable = Record<string, CSSObject>; // varName -> object
export type KeyframesHashTable = Record<string, string>; // varName -> hash
export type KeyframesObjectTable = Record<string, CSSObject>; // hashKey: { string: { string: string | number }, ... }
export type DefineVarsObjectTable = Record<string, CSSObject>; // { string: { varName: value }, ... }
export type DefineThemeObjectTable = Record<string, CSSObject>; // { string: { varName: { varName: value }, ... } }
