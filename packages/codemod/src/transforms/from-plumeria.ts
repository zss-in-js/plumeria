/**
 * @fileoverview Turn a static css.create call into a CSS Module
 */

import { parse } from '@typescript-eslint/parser';
import {
  applyCssValue,
  camelToKebabCase,
  DIRECT_LONGHANDS,
  exceptionCamelCase,
  genBase36Hash,
  impliesCondition,
  isAtRule,
} from 'zss-engine';

// The properties Plumeria leaves a bare number on; every other one gets `px`.
const UNITLESS = new Set(
  (exceptionCamelCase as string[]).map((property) =>
    camelToKebabCase(property),
  ),
);

export interface PlumeriaReport {
  line: number;
  column: number;
  kind: string;
  hint: string;
}

export interface PlumeriaModule {
  binding: string;
  css: string;
  globalCss: string;
  keys: string[];
  functions: Record<
    string,
    { params: string[]; variables: string[]; lengths: boolean[] }
  >;
  aliases: Record<string, Record<string, string>>;
  merges: Record<string, string>;
  /** Per call-site shape, the class each slot needs to win where it should. */
  overrides: Record<string, Record<number, string>>;
  definitionOnly: boolean;
  reports: PlumeriaReport[];
}

/** One `classStyle={[...]}` call site, resolved to keys of a single module. */
export interface PlumeriaComposition {
  /** Every element resolves to a plain style, so the call site can collapse. */
  parts: { binding: string; key: string }[];
  /** What each element can evaluate to, in array order. */
  slots: { binding: string; key: string }[][];
  file: string;
  line: number;
  column: number;
}

/** A composition whose members live in more than one module. Folding it into a
 * single class in one of them puts the pair back under one declaration order,
 * which is the only thing a stylesheet can rank them by. */
export interface PlumeriaFolding {
  signature: string;
  parts: {
    binding: string;
    key: string;
    /** The module holding it, when that is not the one being converted. */
    source?: string;
  }[];
}

/** A module the host has to read to fold a composition into one class. */
export interface PlumeriaForeign {
  text: string;
  values: Record<string, unknown>;
}

/** Compositions are keyed by the class names they compose, so a consumer can
 * look one up from the same members it already resolved. */
/** Keyed by where each class lands, so two modules holding the same name stay
 * apart. */
export const compositionSignature = (
  parts: { target: string; className: string }[],
): string => parts.map((part) => `${part.target}#${part.className}`).join('|');

const own = (target: string, classNames: string[]): string =>
  compositionSignature(classNames.map((className) => ({ target, className })));

export interface ThemeExtraction {
  bindings: Record<string, Record<string, string>>;
  globalCss: string;
  reports: PlumeriaReport[];
}

export interface StaticExtraction {
  bindings: Record<string, Record<string, unknown>>;
  reports: PlumeriaReport[];
}

export interface AnimationExtraction {
  bindings: Record<string, string>;
  keyframes: string[];
  viewTransitions: string[];
  globalCss: string;
  reports: PlumeriaReport[];
}

type StaticValue = string | number | boolean | null;

// Plumeria ranks a longhand above the shorthand that covers it by giving its
// atom more specificity, so which of the two wins never depends on order. A
// stylesheet has no such rank, and the export has to put it back.
const DIRECT_SHORTHANDS: Record<string, string[]> = {};
for (const [shorthand, longhands] of Object.entries(DIRECT_LONGHANDS)) {
  for (const longhand of longhands as string[]) {
    if (!DIRECT_SHORTHANDS[longhand]) DIRECT_SHORTHANDS[longhand] = [];
    DIRECT_SHORTHANDS[longhand].push(shorthand);
  }
}

const depths = new Map<string, number>();
const depthOf = (property: string): number => {
  const cached = depths.get(property);
  if (cached !== undefined) return cached;
  depths.set(property, 0);
  let depth = 0;
  for (const shorthand of DIRECT_SHORTHANDS[property] || [])
    depth = Math.max(depth, depthOf(shorthand) + 1);
  depths.set(property, depth);
  return depth;
};

const coverages = new Map<string, Set<string>>();
const coverageOf = (property: string): Set<string> => {
  const cached = coverages.get(property);
  if (cached) return cached;
  const longhands = (DIRECT_LONGHANDS as Record<string, string[]>)[property];
  const coverage = longhands
    ? new Set(longhands.flatMap((longhand) => [...coverageOf(longhand)]))
    : new Set([property]);
  coverages.set(property, coverage);
  return coverage;
};

const covers = (outer: string, inner: string): boolean => {
  if (outer === inner) return false;
  const wide = coverageOf(outer);
  const narrow = coverageOf(inner);
  return wide.size > narrow.size && [...narrow].every((leaf) => wide.has(leaf));
};

const overlaps = (first: string, second: string): boolean => {
  const left = coverageOf(first);
  return [...coverageOf(second)].some((leaf) => left.has(leaf));
};

// Within one rule the same rank applies: the shorthand is written first so the
// longhand that narrows it still wins.
// A condition that matches a subset of another is the narrower of the two and
// has to come last, where it wins everywhere both of them reach. Specificity
// cannot carry that, so the rules are ordered instead.
// Within one class the same rank applies between its rules: a declaration
// Plumeria ranks higher has to be written later, which is how a base longhand
// keeps its win over a shorthand set under an at-rule.
const byRank = <
  T extends {
    suffix?: string;
    held?: { property: string; rank: number }[];
  },
>(
  written: T[],
): T[] => {
  const outranked = (later: T, earlier: T) =>
    (later.held ?? []).some((mine) =>
      (earlier.held ?? []).some(
        (theirs) =>
          later.suffix === earlier.suffix &&
          overlaps(mine.property, theirs.property) &&
          mine.rank > theirs.rank,
      ),
    );
  const ordered: T[] = [];
  const pending = [...written];
  while (pending.length > 0) {
    const index = pending.findIndex(
      (candidate, position) =>
        !pending.some(
          (other, held) => held !== position && outranked(candidate, other),
        ),
    );
    ordered.push(...pending.splice(index === -1 ? 0 : index, 1));
  }
  return ordered;
};

const byImplication = (
  written: {
    text: string;
    condition?: string;
    suffix?: string;
    held?: { property: string; rank: number }[];
  }[],
): string[] => {
  const ordered: typeof written = [];
  const pending = [...written];
  while (pending.length > 0) {
    const index = pending.findIndex(
      (candidate, position) =>
        !pending.some(
          (other, held) =>
            held !== position &&
            candidate.condition !== undefined &&
            other.condition !== undefined &&
            candidate.condition !== other.condition &&
            impliesCondition(candidate.condition, other.condition),
        ),
    );
    ordered.push(...pending.splice(index === -1 ? 0 : index, 1));
  }
  return ordered.map((entry) => entry.text);
};

const byContainment = (
  declared: { property: string; text: string }[],
): string[] => {
  const ordered: { property: string; text: string }[] = [];
  const pending = [...declared];
  while (pending.length > 0) {
    const index = pending.findIndex(
      (candidate, position) =>
        !pending.some(
          (other, held) =>
            held !== position && covers(other.property, candidate.property),
        ),
    );
    ordered.push(...pending.splice(index === -1 ? 0 : index, 1));
  }
  return ordered.map((entry) => entry.text);
};

const toIdent = (value: string): string => value.replace(/[^A-Za-z0-9-]/g, '');

const capitalize = (value: string): string =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

// `card` + `base` reads as `styles.cardBase`, not `styles['card-base']`.
const camelJoin = (names: string[]): string =>
  names
    .map((name, index) => {
      const camel = name
        .split('-')
        .map((part, position) => (position === 0 ? part : capitalize(part)))
        .join('');
      return index === 0 ? camel : capitalize(camel);
    })
    .join('');

const markerVariable = (id: string, pseudo: string): string => {
  const hash = genBase36Hash({ [id]: pseudo }, 1, 8);
  return `--${hash}-${toIdent(id)}-${toIdent(pseudo.split('(')[0])}`;
};

const propertyKey = (node: any): string | undefined => {
  if (!node) return undefined;
  if (node.type === 'Identifier') return node.name;
  return node.type === 'Literal' ? String(node.value) : undefined;
};

const memberPath = (node: any): string[] | undefined => {
  if (node?.type === 'Identifier') return [node.name];
  if (node?.type !== 'MemberExpression') return undefined;
  const parent = memberPath(node.object);
  const key = node.computed
    ? propertyKey(node.property)
    : node.property?.type === 'Identifier'
      ? node.property.name
      : undefined;
  return parent && key !== undefined ? [...parent, key] : undefined;
};

const lookup = (path: string[], values: Map<string, unknown>): unknown => {
  let value = values.get(path[0]);
  for (const key of path.slice(1)) {
    if (!value || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
};

const markerArguments = (
  node: any,
  method: string,
  values: Map<string, unknown>,
): { id: string; pseudo: string } | undefined => {
  if (node?.type !== 'CallExpression') return undefined;
  const path = memberPath(node.callee);
  if (path?.length !== 2 || path[1] !== method) return undefined;
  const id = evaluate(node.arguments[0], values);
  const pseudo = evaluate(node.arguments[1], values);
  return typeof id === 'string' && typeof pseudo === 'string'
    ? { id, pseudo }
    : undefined;
};

const evaluate = (node: any, values: Map<string, unknown>): unknown => {
  if (!node) return undefined;
  if (node.type === 'CallExpression') {
    const extended = markerArguments(node, 'extended', values);
    return extended
      ? `@container style(${markerVariable(extended.id, extended.pseudo)}: 1)`
      : undefined;
  }
  if (node.type === 'Literal') return node.value as StaticValue;
  if (node.type === 'UnaryExpression') {
    if (node.operator !== '-' && node.operator !== '+') return undefined;
    const operand = evaluate(node.argument, values);
    if (typeof operand !== 'number') return undefined;
    return node.operator === '-' ? -operand : operand;
  }
  if (node.type === 'Identifier') return values.get(node.name);
  if (node.type === 'MemberExpression') {
    const path = memberPath(node);
    return path ? lookup(path, values) : undefined;
  }
  if (node.type === 'TemplateLiteral') {
    let result = '';
    for (let index = 0; index < node.quasis.length; index++) {
      result += node.quasis[index].value.cooked;
      if (index < node.expressions.length) {
        const value = evaluate(node.expressions[index], values);
        if (value === undefined || typeof value === 'object') return undefined;
        result += String(value);
      }
    }
    return result;
  }
  if (node.type === 'ObjectExpression') {
    const result: Record<string, unknown> = {};
    for (const property of node.properties) {
      if (property.type !== 'Property' || property.kind !== 'init')
        return undefined;
      const key = property.computed
        ? evaluate(property.key, values)
        : propertyKey(property.key);
      if (typeof key !== 'string') return undefined;
      const value = evaluate(property.value, values);
      if (value === undefined) return undefined;
      result[key] = value;
    }
    return result;
  }
  return undefined;
};

const bindsElsewhere = (ast: any, name: string, declared: any): boolean => {
  const skipped = new Set(['loc', 'range', 'parent']);
  const visit = (node: any, parent: any): boolean => {
    if (!node || typeof node !== 'object' || node === declared) return false;
    if (Array.isArray(node)) return node.some((child) => visit(child, parent));
    if (typeof node.type !== 'string') return false;
    if (node.type === 'Identifier' && node.name === name) {
      if (parent?.type === 'ExportSpecifier') return false;
      if (parent?.type === 'MemberExpression' && parent.property === node)
        return !!parent.computed;
      if (parent?.type === 'Property' && parent.key === node)
        return !!parent.computed;
      return true;
    }
    return Object.keys(node).some(
      (key) => !skipped.has(key) && visit(node[key], node),
    );
  };
  return visit(ast, undefined);
};

export const __private = { propertyKey, memberPath, evaluate, bindsElsewhere };

const isCall = (node: any, method: string): boolean => {
  if (node?.type !== 'CallExpression') return false;
  const path = memberPath(node.callee);
  return path?.length === 2 && path[1] === method;
};

const declarationOf = (statement: any): any =>
  statement.type === 'ExportNamedDeclaration'
    ? statement.declaration
    : statement;

const readThemes = (ast: any): ThemeExtraction => {
  const values = new Map<string, Record<string, string>>();
  const reports: PlumeriaReport[] = [];
  const globalRules: string[] = [];
  const report = (node: any, kind: string, hint: string) => {
    reports.push({
      line: node.loc.start.line,
      column: node.loc.start.column + 1,
      kind,
      hint,
    });
  };

  for (const raw of ast.body) {
    const statement = declarationOf(raw);
    if (statement?.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations) {
      if (
        declaration.id.type !== 'Identifier' ||
        !isCall(declaration.init, 'createTheme')
      )
        continue;
      const selector = evaluate(declaration.init.arguments[0], new Map());
      const theme = evaluate(declaration.init.arguments[1], new Map());
      if (typeof selector !== 'string' || !theme || typeof theme !== 'object') {
        report(
          declaration.init,
          'dynamic-create-theme',
          '`createTheme` needs a static selector and static token values.',
        );
        continue;
      }
      const rootDeclarations: string[] = [];
      const themeDeclarations: string[] = [];
      const references: Record<string, string> = {};
      let valid = true;
      for (const [key, rawPair] of Object.entries(theme)) {
        if (!rawPair || typeof rawPair !== 'object') {
          valid = false;
          break;
        }
        const pair = rawPair as Record<string, unknown>;
        if (
          (typeof pair.default !== 'string' &&
            typeof pair.default !== 'number') ||
          (typeof pair.theme !== 'string' && typeof pair.theme !== 'number')
        ) {
          valid = false;
          break;
        }
        const hash = genBase36Hash({ [key]: pair }, 1, 8);
        const variable = `--${hash}-${camelToKebabCase(key)}`;
        rootDeclarations.push(`  ${variable}: ${String(pair.default)};`);
        themeDeclarations.push(`  ${variable}: ${String(pair.theme)};`);
        references[key] = `var(${variable})`;
      }
      if (!valid) {
        report(
          declaration.init,
          'dynamic-create-theme',
          'Every theme token needs static `default` and `theme` values.',
        );
        continue;
      }
      values.set(declaration.id.name, references);
      globalRules.push(`:where(:root) {\n${rootDeclarations.join('\n')}\n}`);
      const target =
        selector.startsWith('@') ||
        selector.startsWith('.') ||
        selector.startsWith('#') ||
        selector.startsWith(':') ||
        selector.startsWith('[')
          ? selector
          : `.${selector}`;
      if (isAtRule(target)) {
        globalRules.push(
          `${target} {\n  :where(:root) {\n${themeDeclarations
            .map((line) => `  ${line}`)
            .join('\n')}\n  }\n}`,
        );
      } else {
        globalRules.push(`${target} {\n${themeDeclarations.join('\n')}\n}`);
      }
    }
  }

  return {
    bindings: Object.fromEntries(values),
    globalCss: globalRules.length > 0 ? `${globalRules.join('\n\n')}\n` : '',
    reports,
  };
};

export function extractPlumeriaThemes(source: string): ThemeExtraction {
  const ast = parse(source, {
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    loc: true,
    range: true,
  }) as any;
  return readThemes(ast);
}

const emitGlobalObject = (
  selector: string,
  object: Record<string, unknown>,
): string => {
  const declarations: string[] = [];
  const children: string[] = [];
  for (const [key, value] of Object.entries(object)) {
    if (value && typeof value === 'object') {
      children.push(
        emitGlobalObject(key, value as Record<string, unknown>)
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n'),
      );
    } else if (typeof value === 'string' || typeof value === 'number') {
      const property = camelToKebabCase(key);
      declarations.push(`  ${property}: ${applyCssValue(value, property)};`);
    }
  }
  const content = [...declarations, ...children].join('\n');
  return `${selector} {\n${content}\n}`;
};

export function extractPlumeriaStatics(
  source: string,
  externalValues: Record<string, unknown> = {},
): StaticExtraction {
  const ast = parse(source, {
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    loc: true,
    range: true,
  }) as any;
  const values = new Map<string, unknown>(Object.entries(externalValues));
  const bindings: Record<string, Record<string, unknown>> = {};
  const reports: PlumeriaReport[] = [];

  for (const raw of ast.body) {
    const statement = declarationOf(raw);
    if (statement?.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations) {
      if (
        declaration.id.type !== 'Identifier' ||
        !isCall(declaration.init, 'createStatic')
      )
        continue;
      const value = evaluate(declaration.init.arguments[0], values);
      if (value && typeof value === 'object') {
        values.set(declaration.id.name, value);
        bindings[declaration.id.name] = value as Record<string, unknown>;
      } else {
        reports.push({
          line: declaration.init.loc.start.line,
          column: declaration.init.loc.start.column + 1,
          kind: 'dynamic-create-static',
          hint: '`createStatic` must contain values that can be written into CSS.',
        });
      }
    }
  }

  return { bindings, reports };
}

export function extractPlumeriaAnimations(
  source: string,
  externalValues: Record<string, unknown> = {},
): AnimationExtraction {
  const ast = parse(source, {
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    loc: true,
    range: true,
  }) as any;
  const values = new Map<string, unknown>(Object.entries(externalValues));
  const bindings: Record<string, string> = {};
  const reports: PlumeriaReport[] = [];
  const rules: string[] = [];
  const keyframes: string[] = [];
  const viewTransitions: string[] = [];
  const report = (node: any, kind: string, hint: string) => {
    reports.push({
      line: node.loc.start.line,
      column: node.loc.start.column + 1,
      kind,
      hint,
    });
  };
  const declarations = ast.body.flatMap((raw: any) => {
    const statement = declarationOf(raw);
    return statement?.type === 'VariableDeclaration'
      ? statement.declarations
      : [];
  });

  for (const declaration of declarations) {
    if (
      declaration.id.type !== 'Identifier' ||
      !isCall(declaration.init, 'keyframes')
    )
      continue;
    const object = evaluate(declaration.init.arguments[0], values);
    if (!object || typeof object !== 'object') {
      report(
        declaration.init,
        'dynamic-keyframes',
        '`keyframes` needs a statically resolvable object.',
      );
      continue;
    }
    const hash = genBase36Hash(object, 1, 8);
    const name = `kf-${hash}`;
    values.set(declaration.id.name, name);
    bindings[declaration.id.name] = name;
    keyframes.push(declaration.id.name);
    rules.push(
      emitGlobalObject(`@keyframes ${name}`, object as Record<string, unknown>),
    );
  }

  for (const declaration of declarations) {
    if (
      declaration.id.type !== 'Identifier' ||
      !isCall(declaration.init, 'viewTransition')
    )
      continue;
    const object = evaluate(declaration.init.arguments[0], values);
    if (!object || typeof object !== 'object') {
      report(
        declaration.init,
        'dynamic-view-transition',
        '`viewTransition` needs a statically resolvable object.',
      );
      continue;
    }
    const hash = genBase36Hash(object, 1, 8);
    const name = `vt-${hash}`;
    values.set(declaration.id.name, name);
    bindings[declaration.id.name] = name;
    viewTransitions.push(declaration.id.name);
    for (const part of ['group', 'imagePair', 'old', 'new']) {
      const style = (object as Record<string, unknown>)[part];
      if (style && typeof style === 'object') {
        const pseudoPart = part === 'imagePair' ? 'image-pair' : part;
        rules.push(
          emitGlobalObject(
            `::view-transition-${pseudoPart}(${name})`,
            style as Record<string, unknown>,
          ),
        );
      }
    }
  }

  return {
    bindings,
    keyframes,
    viewTransitions,
    globalCss: rules.length > 0 ? `${rules.join('\n\n')}\n` : '',
    reports,
  };
}

export function convertPlumeriaModule(
  source: string,
  externalValues: Record<string, unknown> = {},
  compositions: PlumeriaComposition[] = [],
  options: {
    /** Where this module's stylesheet lands, which names its classes. */
    target?: string;
    /** Compositions reaching into another module, folded in here. */
    foldings?: PlumeriaFolding[];
    /** The modules those foldings read, keyed by their source path. */
    foreign?: Record<string, PlumeriaForeign>;
  } = {},
): PlumeriaModule | null {
  const target = options.target ?? '';
  const ast = parse(source, {
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    loc: true,
    range: true,
  }) as any;
  const themes = readThemes(ast);
  const animations = extractPlumeriaAnimations(source, {
    ...externalValues,
    ...themes.bindings,
  });
  const values = new Map<string, unknown>([
    ...Object.entries(externalValues),
    ...Object.entries(themes.bindings),
    ...Object.entries(animations.bindings),
  ]);
  const reports: PlumeriaReport[] = [...themes.reports, ...animations.reports];
  const creates: { binding: string; object: any; declaration: any }[] = [];

  const report = (node: any, kind: string, hint: string) => {
    reports.push({
      line: node.loc.start.line,
      column: node.loc.start.column + 1,
      kind,
      hint,
    });
  };

  for (const raw of ast.body) {
    const statement = declarationOf(raw);
    if (statement?.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations) {
      if (declaration.id.type !== 'Identifier') continue;
      if (isCall(declaration.init, 'createStatic')) {
        const value = evaluate(declaration.init.arguments[0], values);
        if (value && typeof value === 'object') {
          values.set(declaration.id.name, value);
        } else {
          report(
            declaration.init,
            'dynamic-create-static',
            '`createStatic` must contain values that can be written into CSS.',
          );
        }
      }
      if (isCall(declaration.init, 'create')) {
        const object = declaration.init.arguments[0];
        if (object?.type === 'ObjectExpression') {
          creates.push({ binding: declaration.id.name, object, declaration });
        } else {
          report(
            declaration.init,
            'dynamic-create',
            '`css.create` must receive an object literal.',
          );
        }
      }
    }
  }

  if (creates.length === 0) return null;

  const { binding } = creates[0];
  type Written = {
    text: string;
    condition?: string;
    suffix?: string;
    held?: { property: string; rank: number }[];
  };
  const groups: { name: string; rules: Written[] }[] = [];
  let rules: Written[] = [];
  const openGroup = (name: string) => {
    rules = [];
    groups.push({ name, rules });
  };
  const keys: string[] = [];
  const aliases: Record<string, Record<string, string>> = {};
  const merges: Record<string, string> = {};
  const members = new Map<string, { className: string; value: any }>();
  // What a class writes, where it writes it, and how far Plumeria ranks it. A
  // declaration under an at-rule carries one more `:not(#\#)` than the same
  // property would at the base, which is why the two have to be compared and
  // not filed apart.
  type Held = {
    bucket: string;
    suffix: string;
    property: string;
    rank: number;
  };
  const footprints = new Map<string, Held[]>();
  const track = (className: string) => {
    const held: Held[] = [];
    footprints.set(className, held);
    return { root: `.${className}`, held };
  };
  // Two classes disagree over a property only inside the same bucket. A
  // containment is settled by rank whatever the call site says; a crossing is
  // settled by the order the call site composes them in.
  // Two declarations meet on the same element only under the same selector
  // suffix. Where they do, the higher rank wins outright and the stylesheet has
  // to put it later; an equal rank is left for the call site to order.
  const relate = (
    first: string,
    second: string,
  ): { ranked?: [string, string]; crossing: boolean } => {
    const left = footprints.get(first);
    const right = footprints.get(second);
    if (!left || !right) return { crossing: true };
    let ranked: [string, string] | undefined;
    let crossing = false;
    for (const mine of left) {
      for (const theirs of right) {
        if (mine.suffix !== theirs.suffix) continue;
        if (!overlaps(mine.property, theirs.property)) continue;
        if (mine.rank > theirs.rank) ranked ??= [second, first];
        else if (theirs.rank > mine.rank) ranked ??= [first, second];
        else crossing = true;
      }
    }
    return { ranked, crossing };
  };

  const crosses = (first: string, second: string): boolean =>
    relate(first, second).crossing;
  const taken = new Set<string>();
  const functions: Record<
    string,
    { params: string[]; variables: string[]; lengths: boolean[] }
  > = {};
  // Which properties each parameter reaches, so the call site can add the unit
  // Plumeria would have added to a bare number.
  const variableUses = new Map<string, Set<string>>();

  const classNameFor = (owner: string, key: string): string => {
    if (!taken.has(key)) return key;
    const namespaced = `${owner}-${key}`;
    let candidate = namespaced;
    let suffix = 2;
    while (taken.has(candidate)) candidate = `${namespaced}-${suffix++}`;
    return candidate;
  };

  // Where a declaration lands, not just which property it names: Plumeria gives
  // an at-rule atom a higher specificity than a base one, so two classes only
  // disagree when they write the same property into the same bucket.
  const bucketOf = (wrappers: string[], suffix: string): string =>
    `${wrappers.join('\u0000')}\u0001${suffix}`;

  // The class part of a selector, so a restricted emit measures the same
  // buckets the footprint recorded even though its class name differs.
  const selectorRoot = (selector: string): number => {
    const match = /^\.[A-Za-z0-9_-]+(?::not\(#\\#\))?/.exec(selector);
    return match ? match[0].length : 0;
  };

  const emit = (
    style: any,
    selector: string,
    wrappers: string[] = [],
    scope: Map<string, unknown> = values,
    phase: 'both' | 'declarations' | 'nested' = 'both',
    footprint?: {
      root: string;
      held: {
        bucket: string;
        suffix: string;
        property: string;
        rank: number;
      }[];
    },
    restrict?: Map<string, Set<string>>,
  ) => {
    if (style?.type !== 'ObjectExpression') {
      report(style, 'dynamic-style', 'Only static style objects are exported.');
      return;
    }

    const restrictRoot = restrict ? selectorRoot(selector) : 0;
    const declared: { property: string; text: string }[] = [];
    const nested: { key: string; value: any }[] = [];
    const markers: { pseudo: string; variable: string }[] = [];
    for (const property of style.properties) {
      if (property.type === 'SpreadElement') {
        const marker = markerArguments(property.argument, 'marker', scope);
        if (marker) {
          markers.push({
            pseudo: marker.pseudo,
            variable: markerVariable(marker.id, marker.pseudo),
          });
          continue;
        }
      }
      if (property.type !== 'Property' || property.kind !== 'init') {
        report(
          property,
          'spread-style',
          'Spread styles must be expanded before exporting to CSS Modules.',
        );
        continue;
      }
      const rawKey = property.computed
        ? evaluate(property.key, scope)
        : propertyKey(property.key);
      if (typeof rawKey !== 'string') {
        report(
          property.key,
          'dynamic-key',
          'Selector and property keys must be statically known.',
        );
        continue;
      }
      if (
        rawKey.startsWith(':') ||
        rawKey.startsWith('[') ||
        rawKey.startsWith('@')
      ) {
        nested.push({ key: rawKey, value: property.value });
        continue;
      }
      const value = evaluate(property.value, scope);
      if (typeof value !== 'string' && typeof value !== 'number') {
        report(
          property.value,
          'dynamic-value',
          `The value of \`${rawKey}\` cannot be represented statically.`,
        );
        continue;
      }
      const cssProperty = camelToKebabCase(rawKey);
      if (
        restrict &&
        !restrict
          .get(bucketOf(wrappers, selector.slice(restrictRoot)))
          ?.has(cssProperty)
      )
        continue;
      if (typeof value === 'string')
        for (const [, variable] of value.matchAll(/var\((--[\w-]+)\)/g))
          variableUses.set(
            variable,
            (variableUses.get(variable) ?? new Set()).add(cssProperty),
          );
      if (footprint) {
        const suffix = selector.slice(footprint.root.length);
        footprint.held.push({
          bucket: bucketOf(wrappers, suffix),
          suffix,
          property: cssProperty,
          rank: depthOf(cssProperty) + (wrappers.length > 0 ? 1 : 0),
        });
      }
      declared.push({
        property: cssProperty,
        text: `  ${cssProperty}: ${applyCssValue(value, cssProperty)};`,
      });
    }

    const pushRule = (
      target: string,
      lines: string[],
      held: { property: string; rank: number }[] = [],
    ) => {
      if (lines.length === 0) return;
      let rule = `${target} {\n${lines.join('\n')}\n}`;
      for (const wrapper of [...wrappers].reverse()) {
        rule = `${wrapper} {\n${rule
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n')}\n}`;
      }
      rules.push({
        text: rule,
        condition: wrappers.length === 1 ? wrappers[0] : undefined,
        suffix: target.slice(target.indexOf('.') + 1).replace(/^[\w-]+/, ''),
        held,
      });
    };

    if (phase !== 'nested')
      pushRule(
        selector,
        byContainment(declared),
        declared.map((entry) => ({
          property: entry.property,
          rank: depthOf(entry.property) + (wrappers.length > 0 ? 1 : 0),
        })),
      );
    if (phase === 'declarations') return;

    for (const marker of markers) {
      pushRule(`${selector}${marker.pseudo}`, [`  ${marker.variable}: 1;`]);
    }

    for (const child of nested) {
      if (child.key.startsWith('@')) {
        emit(
          child.value,
          selector,
          [...wrappers, child.key],
          scope,
          'both',
          footprint,
          restrict,
        );
      } else {
        emit(
          child.value,
          `${selector}${child.key}`,
          wrappers,
          scope,
          'both',
          footprint,
          restrict,
        );
      }
    }
  };

  for (const create of creates) {
    const owner = create.binding;
    const alias: Record<string, string> = {};

    for (const property of create.object.properties) {
      if (property.type !== 'Property' || property.kind !== 'init') {
        report(
          property,
          'spread-create',
          'Top-level spreads cannot name a CSS Module class.',
        );
        continue;
      }
      const key = property.computed
        ? evaluate(property.key, values)
        : propertyKey(property.key);
      if (typeof key !== 'string') {
        report(
          property.key,
          'dynamic-style-key',
          'Style names must be statically known.',
        );
        continue;
      }
      const className = classNameFor(owner, key);
      taken.add(className);
      if (owner !== binding) alias[key] = className;
      members.set(`${owner}.${key}`, { className, value: property.value });

      if (
        property.value.type === 'ArrowFunctionExpression' ||
        property.value.type === 'FunctionExpression'
      ) {
        const params: string[] = [];
        let valid = true;
        for (const parameter of property.value.params) {
          if (parameter.type !== 'Identifier') {
            valid = false;
            break;
          }
          params.push(parameter.name);
        }
        let body = property.value.body;
        if (body.type === 'BlockStatement') {
          const returned = body.body.find(
            (statement: any) => statement.type === 'ReturnStatement',
          );
          body = returned?.argument;
        }
        if (!valid || body?.type !== 'ObjectExpression') {
          report(
            property.value,
            'function-style',
            'Function style keys need identifier parameters and an object return value.',
          );
          continue;
        }
        const variables = params.map(
          (parameter) =>
            `--${camelToKebabCase(owner)}-${camelToKebabCase(key)}-${camelToKebabCase(parameter)}`,
        );
        const scope = new Map(values);
        params.forEach((parameter, index) => {
          scope.set(parameter, `var(${variables[index]})`);
        });
        keys.push(className);
        openGroup(className);
        emit(body, `.${className}`, [], scope, 'both', track(className));
        functions[className] = {
          params,
          variables,
          lengths: variables.map((variable) => {
            const used = variableUses.get(variable);
            return (
              used !== undefined &&
              used.size > 0 &&
              [...used].every(
                (property) =>
                  !UNITLESS.has(property) && !property.startsWith('--'),
              )
            );
          }),
        };
        continue;
      }
      keys.push(className);
      openGroup(className);
      emit(
        property.value,
        `.${className}`,
        [],
        values,
        'both',
        track(className),
      );
    }

    if (owner !== binding) aliases[owner] = alias;
  }

  const resolved = compositions.map((composition) => ({
    composition,
    parts: composition.parts.flatMap((part) => {
      const member = members.get(`${part.binding}.${part.key}`);
      return member && !functions[member.className] ? [member] : [];
    }),
    slots: composition.slots.map((slot) =>
      slot.flatMap((part) => {
        const member = members.get(`${part.binding}.${part.key}`);
        return member ? [member.className] : [];
      }),
    ),
  }));
  const collapsible = new Set(
    resolved.filter(
      (entry) =>
        entry.composition.parts.length > 1 &&
        entry.parts.length === entry.composition.parts.length,
    ),
  );

  // A call site wins by array order, a stylesheet by declaration order. Where
  // the two merely disagree the rules can be resorted; only a cycle — two call
  // sites composing the same pair in opposite orders — has no declaration order
  // that satisfies both.
  const position = new Map(groups.map((group, index) => [group.name, index]));
  const inlined = new Set<(typeof resolved)[number]>();

  const sort = () => {
    const edges = new Map<string, Set<string>>();
    const blame = new Map<string, PlumeriaComposition>();
    const link = (before: string, after: string) =>
      edges.set(before, (edges.get(before) ?? new Set()).add(after));
    for (const entry of resolved) {
      if (inlined.has(entry)) continue;
      for (let first = 0; first < entry.slots.length; first++) {
        for (let second = first + 1; second < entry.slots.length; second++) {
          for (const before of entry.slots[first]) {
            for (const after of entry.slots[second]) {
              if (before === after) continue;
              const { ranked, crossing } = relate(before, after);
              // Rank has already decided this pair, so the call site order says
              // nothing about it — following it would invert the winner.
              if (ranked) link(ranked[0], ranked[1]);
              if (!crossing) continue;
              link(before, after);
              blame.set(`${before}|${after}`, entry.composition);
            }
          }
        }
      }
    }
    const incoming = new Map(groups.map((group) => [group.name, 0]));
    for (const [, targets] of edges)
      for (const target of targets)
        if (incoming.has(target))
          incoming.set(target, (incoming.get(target) as number) + 1);
    const ready = groups
      .filter((group) => incoming.get(group.name) === 0)
      .map((group) => group.name);
    const ordered: string[] = [];
    while (ready.length > 0) {
      ready.sort(
        (a, b) => (position.get(a) as number) - (position.get(b) as number),
      );
      const name = ready.shift() as string;
      ordered.push(name);
      for (const target of edges.get(name) ?? []) {
        if (!incoming.has(target)) continue;
        const remaining = (incoming.get(target) as number) - 1;
        incoming.set(target, remaining);
        if (remaining === 0) ready.push(target);
      }
    }
    const stuck = new Set(
      groups
        .map((group) => group.name)
        .filter((name) => !ordered.includes(name)),
    );
    return { ordered, stuck, edges, blame };
  };

  // Inlining a composition drops the order it demanded, so a cycle can be
  // broken by copying the declarations into the merged class instead.
  let sorted = sort();
  while (sorted.stuck.size > 0) {
    const offender = [...collapsible].find(
      (entry) =>
        !inlined.has(entry) &&
        entry.parts.filter((part) => sorted.stuck.has(part.className)).length >
          1,
    );
    if (!offender) break;
    inlined.add(offender);
    sorted = sort();
  }
  const order = new Map(
    [...sorted.ordered, ...sorted.stuck].map((name, index) => [name, index]),
  );
  const overrides: Record<string, Record<number, string>> = {};
  const pending: {
    signature: string;
    slot: number;
    winner: string;
    losers: string[];
  }[] = [];
  for (const entry of resolved) {
    if (inlined.has(entry)) continue;
    if (entry.slots.some((slot) => slot.length !== 1)) continue;
    const names = entry.slots.map((slot) => slot[0]);
    const signature = own(target, names);
    if (overrides[signature]) continue;
    const perSlot: Record<number, string> = {};
    for (let slot = 1; slot < names.length; slot++) {
      // Only a crossing can be left unsatisfied: rank answers a containment,
      // and an override carrying it would undo that answer.
      const losers = names
        .slice(0, slot)
        .filter(
          (earlier) =>
            earlier !== names[slot] &&
            crosses(earlier, names[slot]) &&
            (order.get(earlier) as number) > (order.get(names[slot]) as number),
        );
      if (losers.length === 0) continue;
      pending.push({ signature, slot, winner: names[slot], losers });
      perSlot[slot] = '';
    }
    if (Object.keys(perSlot).length > 0) overrides[signature] = perSlot;
  }

  // The call site is generated code, so the pair that cannot agree globally is
  // settled locally: a class carrying only the disputed declarations, boosted
  // past both and applied under the same condition as the style that must win.
  for (const request of pending) {
    const winner = members.get(
      [...members.keys()].find(
        (key) => members.get(key)?.className === request.winner,
      ) as string,
    );
    if (!winner) continue;
    const disputed = new Map<string, Set<string>>();
    const mine = footprints.get(request.winner);
    for (const loser of request.losers) {
      const theirs = footprints.get(loser);
      if (!mine || !theirs) continue;
      for (const entry of mine) {
        // Only an equal rank is the call site's to settle; carrying anything
        // Plumeria ranked would undo that answer.
        const crossed = theirs.some(
          (candidate) =>
            candidate.suffix === entry.suffix &&
            candidate.rank === entry.rank &&
            overlaps(entry.property, candidate.property),
        );
        if (!crossed) continue;
        const held = disputed.get(entry.bucket) ?? new Set<string>();
        held.add(entry.property);
        disputed.set(entry.bucket, held);
      }
    }
    if (disputed.size === 0) continue;
    const name = classNameFor(
      binding,
      camelJoin([request.winner, `over-${request.losers.join('-')}`]),
    );
    taken.add(name);
    openGroup(name);
    emit(
      winner.value,
      `.${name}:not(#\\#)`,
      [],
      values,
      'both',
      undefined,
      disputed,
    );
    keys.push(name);
    overrides[request.signature][request.slot] = name;
  }

  // Whatever the sort and the overrides between them could not settle is
  // reported rather than emitted wrong.
  for (const entry of resolved) {
    if (inlined.has(entry)) continue;
    const signature =
      entry.slots.every((slot) => slot.length === 1) &&
      own(
        target,
        entry.slots.map((slot) => slot[0]),
      );
    let unresolved: [string, string] | undefined;
    for (let first = 0; first < entry.slots.length && !unresolved; first++) {
      for (let second = first + 1; second < entry.slots.length; second++) {
        if (signature && overrides[signature]?.[second]) continue;
        for (const before of entry.slots[first]) {
          for (const after of entry.slots[second]) {
            if (before === after) continue;
            // A containment is answered by rank, so the call site order has no
            // claim on it and nothing here can be unsatisfied.
            const { ranked, crossing } = relate(before, after);
            if (ranked || !crossing) continue;
            if ((order.get(before) as number) < (order.get(after) as number))
              continue;
            unresolved = [before, after];
          }
        }
      }
    }
    if (!unresolved) continue;
    reports.push({
      line: entry.composition.line,
      column: entry.composition.column,
      kind: 'composition-order',
      hint: `\`${unresolved[1]}\` has to win over \`${unresolved[0]}\` here and lose elsewhere, and this call site cannot carry an override.`,
    });
  }

  for (const entry of collapsible) {
    const signature = own(
      target,
      entry.parts.map((part) => part.className),
    );
    if (merges[signature]) continue;
    const merged = classNameFor(
      binding,
      camelJoin(entry.parts.map((part) => part.className)),
    );
    taken.add(merged);
    openGroup(merged);
    if (inlined.has(entry)) {
      // Declarations first, at-rule blocks after: an at-rule atom outranks a
      // base atom in Plumeria, and only this order reproduces that in plain CSS.
      for (const part of entry.parts)
        emit(part.value, `.${merged}`, [], values, 'declarations');
      for (const part of entry.parts)
        emit(part.value, `.${merged}`, [], values, 'nested');
    } else {
      // `composes` carries no cascade of its own; the declaration order above
      // is what decides, and it now agrees with the call site.
      rules.push({
        text: `.${merged} {\n  composes: ${entry.parts
          .map((part) => part.className)
          .join(' ')};\n}`,
      });
    }
    keys.push(merged);
    merges[signature] = merged;
  }

  // A composition reaching into another module cannot be settled by ordering
  // one stylesheet, so both members are written into a single class here. Back
  // under one declaration order, the rank and the array order both apply again.
  const parsed = new Map<string, any>();
  const styleOf = (part: {
    binding: string;
    key: string;
    source?: string;
  }): { value: any; scope: Map<string, unknown> } | undefined => {
    if (!part.source) {
      const held = members.get(`${part.binding}.${part.key}`);
      return held ? { value: held.value, scope: values } : undefined;
    }
    const held = options.foreign?.[part.source];
    if (!held) return undefined;
    let tree = parsed.get(part.source);
    if (!tree) {
      try {
        tree = parse(held.text, {
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
          loc: true,
          range: true,
        }) as any;
      } catch {
        return undefined;
      }
      parsed.set(part.source, tree);
    }
    for (const raw of tree.body) {
      const statement = declarationOf(raw);
      if (statement?.type !== 'VariableDeclaration') continue;
      for (const declaration of statement.declarations) {
        if (
          declaration.id.name !== part.binding ||
          !isCall(declaration.init, 'create')
        )
          continue;
        for (const property of declaration.init.arguments[0]?.properties ??
          []) {
          if (property.type !== 'Property') continue;
          const name = property.computed
            ? undefined
            : propertyKey(property.key);
          if (name === part.key)
            return {
              value: property.value,
              scope: new Map(Object.entries(held.values)),
            };
        }
      }
    }
    return undefined;
  };

  for (const folding of options.foldings ?? []) {
    if (merges[folding.signature]) continue;
    const parts = folding.parts.map(styleOf);
    if (parts.some((part) => !part)) continue;
    const merged = classNameFor(
      binding,
      camelJoin(folding.parts.map((part) => part.key)),
    );
    taken.add(merged);
    openGroup(merged);
    for (const part of parts)
      emit(part!.value, `.${merged}`, [], part!.scope, 'declarations');
    for (const part of parts)
      emit(part!.value, `.${merged}`, [], part!.scope, 'nested');
    keys.push(merged);
    merges[folding.signature] = merged;
  }

  const emitted = [
    ...sorted.ordered,
    ...[...sorted.stuck],
    ...groups.slice(position.size).map((group) => group.name),
  ];
  const seen = new Set<string>();
  const css = emitted.flatMap((name) => {
    if (seen.has(name)) return [];
    seen.add(name);
    const group = groups.find((held) => held.name === name);
    return group ? byImplication(byRank(group.rules)) : [];
  });

  return {
    binding,
    css: css.length > 0 ? `${css.join('\n\n')}\n` : '',
    globalCss: `${themes.globalCss}${animations.globalCss}`,
    keys,
    functions,
    aliases,
    merges,
    overrides,
    definitionOnly: creates.every(
      (create) => !bindsElsewhere(ast, create.binding, create.declaration.id),
    ),
    reports,
  };
}
