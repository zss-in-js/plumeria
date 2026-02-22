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
export type StaticTable = Record<string, CSSValue>; // varName -> object
export type KeyframesHashTable = Record<string, string>; // varName -> hash
export type KeyframesObjectTable = Record<string, CSSObject>; // hashKey: { string: { string: string | number }, ... }
export type ViewTransitionHashTable = Record<string, string>; // varName -> hash
export type ViewTransitionObjectTable = Record<string, CSSObject>; // hashKey: { new: { string: string| number }, old: { string: string| number } }
export type CreateThemeObjectTable = Record<string, CSSObject>; // { string: { varName: { varName: value }, ... } }
export type CreateHashTable = Record<string, string>; // varName -> hash
export type CreateObjectTable = Record<string, CSSObject>; // hash -> { styleName: { prop: value }, ... }
export type VariantsHashTable = Record<string, string>; // varName -> hash
export type VariantsObjectTable = Record<string, CSSObject>; // hash -> Variant object
export type CreateAtomicMapTable = Record<
  string,
  Record<string, Record<string, string>>
>;
export type CreateStaticHashTable = Record<string, string>; // varName -> hash
export type CreateStaticObjectTable = Record<string, CSSObject>;
export type CreateThemeHashTable = Record<string, string>; // varName -> hash

export interface Tables {
  staticTable: StaticTable;
  keyframesHashTable: KeyframesHashTable;
  keyframesObjectTable: KeyframesObjectTable;
  viewTransitionHashTable: ViewTransitionHashTable;
  viewTransitionObjectTable: ViewTransitionObjectTable;
  createThemeHashTable: CreateThemeHashTable;
  createThemeObjectTable: CreateThemeObjectTable;
  createHashTable: CreateHashTable;
  createObjectTable: CreateObjectTable;
  createAtomicMapTable: CreateAtomicMapTable;
  createStaticHashTable: CreateStaticHashTable;
  createStaticObjectTable: CreateStaticObjectTable;
  variantsHashTable: VariantsHashTable;
  variantsObjectTable: VariantsObjectTable;
}

export interface FileStyles {
  baseStyles?: string;
  keyframeStyles?: string;
  viewTransitionStyles?: string;
  themeStyles?: string;
}
