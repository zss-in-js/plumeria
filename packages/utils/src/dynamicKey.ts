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
} from './types';
import { objectExpressionToObject, t } from './parser';

export type NamedParam = { key: string; local: string };

export type StyleFunction = {
  params: string[];
  unsupportedParams?: boolean;
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
        unsupportedParams: func.params.some((p: any) => {
          const pattern = p?.pat ?? p;
          return (
            pattern?.type === 'ArrayPattern' ||
            pattern?.type === 'RestElement' ||
            (pattern?.type === 'ObjectPattern' &&
              !namedParamsOf(func.params, {}))
          );
        }),
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

const cssUnits = [
  // AbsoluteCSSUnit
  'px',
  'cm',
  'mm',
  'q',
  'in',
  'pc',
  'pt',
  // LocalFontRelativeCSSUnit
  'cap',
  'ch',
  'em',
  'ex',
  'ic',
  'lh',
  // RootFontRelativeCSSUnit
  'rcap',
  'rch',
  'rem',
  'rex',
  'ric',
  'rlh',
  // ViewportCSSUnit
  'vh',
  'vw',
  'vmin',
  'vmax',
  'vb',
  'vi',
  // RespectCSSUnit
  'svw',
  'svh',
  'svmin',
  'svmax',
  'svb',
  'svi',
  'lvw',
  'lvh',
  'lvmin',
  'lvmax',
  'lvb',
  'lvi',
  'dvw',
  'dvh',
  'dvmin',
  'dvmax',
  'dvb',
  'dvi',
  // ContainerCSSUnit
  'cqw',
  'cqh',
  'cqi',
  'cqb',
  'cqmin',
  'cqmax',
  // AngleCSSUnit
  'deg',
  'grad',
  'rad',
  'turn',
  // TimeCSSUnit
  's',
  'ms',
  // FrequencyCSSUnit
  'hz',
  'khz',
  // ResolutionCSSUnit
  'dpi',
  'dpcm',
  'dppx',
  'x',
  // FlexCSSUnit
  'fr',
];

const UNIT_TOKEN = /^(%|[a-z]+[a-z0-9-]*)/i;

const unitSet = new Set(cssUnits);

const writtenUnitAfter = (rest: string): string => {
  const token = UNIT_TOKEN.exec(rest)?.[0];
  if (token === undefined) return '';
  if (token === '%') return token;
  return unitSet.has(token.toLowerCase()) ? token : '';
};

type VarUnit = { unit: string; written: boolean };

type VarGroup = {
  cssVar: string;
  prop: string;
  unit: string;
  written: boolean;
};

const unitAt = (prop: string, rest: string): VarUnit => {
  const written = writtenUnitAfter(rest);
  if (written) return { unit: written, written: true };
  return { unit: isUnitlessProp(prop) ? '' : 'px', written: false };
};

const unitKey = (unit: VarUnit): string =>
  `${unit.written ? 'written' : 'default'}:${unit.unit}`;

const unitSlug = (unit: VarUnit): string =>
  unit.unit === '%' ? 'percent' : unit.unit || 'unitless';

const rewriteVarOccurrences = (
  style: CSSObject,
  cssVar: string,
  assign: (prop: string, unit: VarUnit) => string,
): void => {
  const reference = `var(${cssVar})`;
  for (const [prop, value] of Object.entries(style)) {
    if (typeof value === 'string' && value.includes(reference)) {
      let rewritten = '';
      let rest = value;
      let at = rest.indexOf(reference);
      while (at !== -1) {
        const after = rest.slice(at + reference.length);
        const unit = unitAt(prop, after);
        rewritten += `${rest.slice(0, at)}var(${assign(prop, unit)})`;
        rest = unit.written ? after.slice(unit.unit.length) : after;
        at = rest.indexOf(reference);
      }
      (style as Record<string, unknown>)[prop] = rewritten + rest;
    } else if (value !== null && typeof value === 'object') {
      rewriteVarOccurrences(value as CSSObject, cssVar, assign);
    }
  }
};

// The element sets a variable once, so a parameter that lands in declarations
// with different unit rules needs one variable per rule: `4` and `4px` cannot
// both be the value.
export const splitVarByUnit = (
  style: CSSObject,
  cssVar: string,
): VarGroup[] => {
  const groups = new Map<string, VarGroup>();
  const taken = new Set<string>();
  rewriteVarOccurrences(style, cssVar, (prop, unit) => {
    const key = unitKey(unit);
    const group = groups.get(key);
    if (group) return group.cssVar;

    let name = cssVar;
    if (groups.size > 0) {
      const base = `${cssVar}-${camelToKebabCase(prop).replace(/^-+/, '')}`;
      name = taken.has(base) ? `${base}-${unitSlug(unit)}` : base;
    }
    taken.add(name);
    groups.set(key, { cssVar: name, prop, ...unit });
    return name;
  });
  return Array.from(groups.values());
};

export const applyVarFallback = (
  style: CSSObject,
  cssVar: string,
  literal: string | number,
  unit: VarUnit,
): void => {
  const reference = `var(${cssVar})`;
  for (const [prop, value] of Object.entries(style)) {
    if (typeof value === 'string' && value.includes(reference)) {
      const fallback = unit.written
        ? `${literal}${unit.unit}`
        : applyCssValue(literal, camelToKebabCase(prop));
      (style as Record<string, unknown>)[prop] = value
        .split(reference)
        .join(`var(${cssVar}, ${fallback})`);
    } else if (value !== null && typeof value === 'object') {
      applyVarFallback(value as CSSObject, cssVar, literal, unit);
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
};

export type DynamicStyleResult = {
  style: CSSObject;
  varGroups: Map<
    string,
    Array<{ cssVar: string; prop: string; unit: string; written: boolean }>
  >;
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
  providedParams?: ReadonlySet<string>,
): DynamicStyleResult => {
  if (func.unsupportedParams)
    throw new Error(
      '[plumeria] Dynamic styles require named parameters or object destructuring; array and rest parameters are not supported.',
    );
  const tempStaticTable: StaticTable = Object.create(staticTable);
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
    );

  const withDefault = Object.entries(func.defaults ?? {}).filter(([param]) =>
    providedParams
      ? !providedParams.has(param)
      : tempStaticTable[param] === undefined,
  );

  const cssVars: Record<string, string> = {};
  const varParams = Array.from(
    new Set([...runtimeParams, ...withDefault.map(([param]) => param)]),
  );
  if (varParams.length > 0) {
    varParams.forEach((param) => (tempStaticTable[param] = param));

    const hash = genBase36Hash(resolveBody(), 1, 8);

    varParams.forEach((param) => {
      const cssVar = `--${hash}-${param}`;
      tempStaticTable[param] = `var(${cssVar})`;
      cssVars[param] = cssVar;
    });
  }

  const style = resolveBody();

  const varGroups = new Map<
    string,
    Array<{ cssVar: string; prop: string; unit: string; written: boolean }>
  >();
  varParams.forEach((param) => {
    const cssVar = cssVars[param];
    varGroups.set(param, splitVarByUnit(style, cssVar));
  });

  withDefault.forEach(([param, expr]) => {
    const resolved = objectExpressionToObject(
      {
        type: 'ObjectExpression',
        span: func.body.span,
        properties: [
          {
            type: 'KeyValueProperty',
            key: {
              type: 'Identifier',
              span: func.body.span,
              value: 'value',
              optional: false,
            },
            value: expr,
          },
        ],
      },
      staticTable,
      tables.keyframesHashTable,
      tables.viewTransitionHashTable,
      tables.createThemeHashTable,
      tables.createThemeObjectTable,
      tables.createHashTable,
      tables.createStaticHashTable,
      tables.createStaticObjectTable,
    );
    const literal = resolved.value;
    if (typeof literal !== 'string' && typeof literal !== 'number') return;
    varGroups
      .get(param)!
      .forEach(({ cssVar, unit, written }) =>
        applyVarFallback(style, cssVar, literal, { unit, written }),
      );
  });

  return { style, varGroups };
};
