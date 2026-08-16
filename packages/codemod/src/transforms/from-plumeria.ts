/**
 * @fileoverview Turn a static css.create call into a CSS Module
 */

import { parse } from '@typescript-eslint/parser';
import {
  applyCssValue,
  camelToKebabCase,
  genBase36Hash,
  isAtRule,
} from 'zss-engine';

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
  functions: Record<string, { params: string[]; variables: string[] }>;
  reports: PlumeriaReport[];
}

export interface ThemeExtraction {
  bindings: Record<string, Record<string, string>>;
  globalCss: string;
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

const evaluate = (node: any, values: Map<string, unknown>): unknown => {
  if (!node) return undefined;
  if (node.type === 'Literal') return node.value as StaticValue;
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

export const __private = { propertyKey, memberPath, evaluate };

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
): PlumeriaModule | null {
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
  const creates: { binding: string; object: any }[] = [];

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
          creates.push({ binding: declaration.id.name, object });
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
  if (creates.length > 1) {
    report(
      creates[1].object,
      'multiple-create',
      'Move each `css.create` call to its own module before exporting to CSS Modules.',
    );
  }

  const { binding, object } = creates[0];
  const rules: string[] = [];
  const keys: string[] = [];
  const functions: Record<string, { params: string[]; variables: string[] }> =
    {};

  const emit = (
    style: any,
    selector: string,
    wrappers: string[] = [],
    scope: Map<string, unknown> = values,
  ) => {
    if (style?.type !== 'ObjectExpression') {
      report(style, 'dynamic-style', 'Only static style objects are exported.');
      return;
    }

    const declarations: string[] = [];
    const nested: { key: string; value: any }[] = [];
    for (const property of style.properties) {
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
      declarations.push(
        `  ${cssProperty}: ${applyCssValue(value, cssProperty)};`,
      );
    }

    if (declarations.length > 0) {
      let rule = `${selector} {\n${declarations.join('\n')}\n}`;
      for (const wrapper of [...wrappers].reverse()) {
        rule = `${wrapper} {\n${rule
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n')}\n}`;
      }
      rules.push(rule);
    }

    for (const child of nested) {
      if (child.key.startsWith('@')) {
        emit(child.value, selector, [...wrappers, child.key], scope);
      } else {
        emit(child.value, `${selector}${child.key}`, wrappers, scope);
      }
    }
  };

  for (const property of object.properties) {
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
          `--${camelToKebabCase(binding)}-${camelToKebabCase(key)}-${camelToKebabCase(parameter)}`,
      );
      const scope = new Map(values);
      params.forEach((parameter, index) => {
        scope.set(parameter, `var(${variables[index]})`);
      });
      functions[key] = { params, variables };
      keys.push(key);
      emit(body, `.${key}`, [], scope);
      continue;
    }
    keys.push(key);
    emit(property.value, `.${key}`);
  }

  return {
    binding,
    css: rules.length > 0 ? `${rules.join('\n\n')}\n` : '',
    globalCss: `${themes.globalCss}${animations.globalCss}`,
    keys,
    functions,
    reports,
  };
}
