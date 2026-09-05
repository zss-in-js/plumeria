import type {
  Expression,
  Identifier,
  ObjectExpression,
  Statement,
} from '@swc/core';
import {
  camelToKebabCase,
  applyCssValue,
  exceptionCamelCase,
} from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import type {
  CSSObject,
  StaticTable,
  KeyframesHashTable,
  ViewTransitionHashTable,
  CreateHashTable,
  CreateThemeHashTable,
  CreateThemeObjectTable,
  CreateStaticHashTable,
  CreateStaticObjectTable,
  VariantsHashTable,
} from './types';
import { objectExpressionToObject, t } from './parser';

export type NamedParam = { key: string; local: string };

export type StyleFunction = {
  params: string[];
  named?: NamedParam[];
  defaults?: Record<string, Expression>;
  body: ObjectExpression;
};

export type StyleFunctions = Record<string, StyleFunction>;

// A dynamic style function may name its parameters by destructuring them, in
// which case the call passes one object and the key it uses is not necessarily
// the name the body reads.
const namedParamsOf = (
  params: unknown[],
  defaults: Record<string, Expression>,
): NamedParam[] | undefined => {
  if (params.length !== 1) return undefined;
  const first = params[0] as { type?: string; pat?: { type?: string } };
  const pattern = (first?.pat ?? first) as {
    type?: string;
    properties?: any[];
  };
  if (pattern?.type !== 'ObjectPattern') return undefined;

  const named: NamedParam[] = [];
  for (const prop of pattern.properties ?? []) {
    if (prop.type === 'AssignmentPatternProperty' && t.isIdentifier(prop.key)) {
      named.push({ key: prop.key.value, local: prop.key.value });
      if (prop.value) defaults[prop.key.value] = prop.value as Expression;
    } else if (
      prop.type === 'KeyValuePatternProperty' &&
      t.isIdentifier(prop.key) &&
      t.isIdentifier(prop.value)
    ) {
      named.push({ key: prop.key.value, local: prop.value.value });
    } else if (
      prop.type === 'KeyValuePatternProperty' &&
      t.isIdentifier(prop.key) &&
      (prop.value as { type?: string })?.type === 'AssignmentPattern' &&
      t.isIdentifier((prop.value as { left: Expression }).left)
    ) {
      const pattern = prop.value as unknown as {
        left: Identifier;
        right: Expression;
      };
      named.push({ key: String(prop.key.value), local: pattern.left.value });
      defaults[pattern.left.value] = pattern.right;
    } else {
      return undefined;
    }
  }
  return named.length > 0 ? named : undefined;
};

export const styleFunctionsOf = (objExpr: ObjectExpression): StyleFunctions => {
  const styleFunctions: StyleFunctions = {};

  objExpr.properties.forEach((prop) => {
    if (prop.type !== 'KeyValueProperty' || prop.key.type !== 'Identifier')
      return;

    const func = prop.value;
    if (
      func.type !== 'ArrowFunctionExpression' &&
      func.type !== 'FunctionExpression'
    )
      return;

    const defaults: Record<string, Expression> = {};
    const params: string[] = func.params.map((p: any) => {
      const pattern =
        typeof p === 'object' && p !== null && 'pat' in p ? p.pat : p;
      if (t.isIdentifier(pattern)) return pattern.value;
      if (
        pattern?.type === 'AssignmentPattern' &&
        t.isIdentifier(pattern.left)
      ) {
        defaults[pattern.left.value] = pattern.right;
        return pattern.left.value;
      }
      return 'arg';
    });

    let actualBody: Expression | Statement | undefined = func.body;
    if (actualBody?.type === 'ParenthesisExpression')
      actualBody = actualBody.expression;
    if (actualBody?.type === 'BlockStatement') {
      const first = actualBody.stmts?.[0];
      if (first?.type === 'ReturnStatement') actualBody = first.argument;
      if (actualBody?.type === 'ParenthesisExpression')
        actualBody = actualBody.expression;
    }

    if (actualBody && actualBody.type === 'ObjectExpression') {
      styleFunctions[prop.key.value] = {
        params,
        named: namedParamsOf(func.params, defaults),
        defaults,
        body: actualBody as ObjectExpression,
      };
    }
  });
  return styleFunctions;
};

export const isUnitlessProp = (prop: string): boolean =>
  exceptionCamelCase.includes(prop) || prop.startsWith('--');

const collectVarProps = (
  style: CSSObject,
  cssVar: string,
  props: string[],
): void => {
  const reference = `var(${cssVar})`;
  for (const [prop, value] of Object.entries(style)) {
    if (typeof value === 'string' && value.includes(reference))
      props.push(prop);
    else if (value !== null && typeof value === 'object')
      collectVarProps(value as CSSObject, cssVar, props);
  }
};

const retargetVar = (
  style: CSSObject,
  cssVar: string,
  next: string,
  unitless: boolean,
): void => {
  const reference = `var(${cssVar})`;
  for (const [prop, value] of Object.entries(style)) {
    if (typeof value === 'string' && value.includes(reference)) {
      if (isUnitlessProp(prop) === unitless)
        (style as Record<string, unknown>)[prop] = value
          .split(reference)
          .join(`var(${next})`);
    } else if (value !== null && typeof value === 'object') {
      retargetVar(value as CSSObject, cssVar, next, unitless);
    }
  }
};

// The element sets a variable once, so a parameter that lands in declarations
// with different unit rules needs one variable per rule: `4` and `4px` cannot
// both be the value.
export const splitVarByUnit = (
  style: CSSObject,
  cssVar: string,
): Array<{ cssVar: string; prop: string }> => {
  const props: string[] = [];
  collectVarProps(style, cssVar, props);
  if (props.length === 0) return [];

  const lead = props[0];
  const split = props.find(
    (prop) => isUnitlessProp(prop) !== isUnitlessProp(lead),
  );
  if (!split) return [{ cssVar, prop: lead }];

  const splitVar = `${cssVar}-${camelToKebabCase(split).replace(/^-+/, '')}`;
  retargetVar(style, cssVar, splitVar, isUnitlessProp(split));
  return [
    { cssVar, prop: lead },
    { cssVar: splitVar, prop: split },
  ];
};

export const applyVarFallback = (
  style: CSSObject,
  cssVar: string,
  literal: string | number,
): void => {
  const reference = `var(${cssVar})`;
  for (const [prop, value] of Object.entries(style)) {
    if (typeof value === 'string' && value.includes(reference)) {
      (style as Record<string, unknown>)[prop] = value
        .split(reference)
        .join(
          `var(${cssVar}, ${applyCssValue(literal, camelToKebabCase(prop))})`,
        );
    } else if (value !== null && typeof value === 'object') {
      applyVarFallback(value as CSSObject, cssVar, literal);
    }
  }
};

export type DynamicStyleTables = {
  keyframesHashTable: KeyframesHashTable;
  viewTransitionHashTable: ViewTransitionHashTable;
  createThemeHashTable: CreateThemeHashTable;
  createThemeObjectTable: CreateThemeObjectTable;
  createHashTable: CreateHashTable;
  createStaticHashTable: CreateStaticHashTable;
  createStaticObjectTable: CreateStaticObjectTable;
  variantsHashTable: VariantsHashTable;
};

export type DynamicStyleResult = {
  style: CSSObject;
  varGroups: Map<string, Array<{ cssVar: string; prop: string }>>;
};

// The class a dynamic key resolves to is decided by which parameters reach the
// element as custom properties, never by the values behind them. Both the file
// that writes the call and the file that only knows the style through a prop
// have to arrive at the same rule, so the derivation lives here once.
export const resolveDynamicStyle = (
  func: StyleFunction,
  runtimeParams: string[],
  staticTable: StaticTable,
  tables: DynamicStyleTables,
): DynamicStyleResult | null => {
  const tempStaticTable: StaticTable = { ...staticTable };
  const resolveBody = () =>
    objectExpressionToObject(
      func.body,
      tempStaticTable,
      tables.keyframesHashTable,
      tables.viewTransitionHashTable,
      tables.createThemeHashTable,
      tables.createThemeObjectTable,
      tables.createHashTable,
      tables.createStaticHashTable,
      tables.createStaticObjectTable,
      tables.variantsHashTable,
    );

  const withDefault = Object.entries(func.defaults ?? {}).filter(
    ([param]) => tempStaticTable[param] === undefined,
  );

  const cssVars: Record<string, string> = {};
  const varParams = Array.from(
    new Set([...runtimeParams, ...withDefault.map(([param]) => param)]),
  );
  if (varParams.length > 0) {
    varParams.forEach((param) => (tempStaticTable[param] = param));

    const hash = genBase36Hash(resolveBody() ?? {}, 1, 8);

    varParams.forEach((param) => {
      const cssVar = `--${hash}-${param}`;
      tempStaticTable[param] = `var(${cssVar})`;
      cssVars[param] = cssVar;
    });
  }

  const style = resolveBody();
  if (!style) return null;

  const varGroups = new Map<string, Array<{ cssVar: string; prop: string }>>();
  varParams.forEach((param) => {
    const cssVar = cssVars[param];
    if (cssVar) varGroups.set(param, splitVarByUnit(style, cssVar));
  });

  withDefault.forEach(([param, expr]) => {
    const literal =
      expr.type === 'StringLiteral' || expr.type === 'NumericLiteral'
        ? expr.value
        : undefined;
    if (literal === undefined) return;
    (varGroups.get(param) ?? []).forEach(({ cssVar }) =>
      applyVarFallback(style, cssVar, literal),
    );
  });

  return { style, varGroups };
};
