/**
 * @fileoverview Drive a Plumeria to CSS Modules migration over source files
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '@typescript-eslint/parser';
import { resolveSourcePath } from './resolve';
import {
  convertPlumeriaModule,
  extractPlumeriaAnimations,
  extractPlumeriaStatics,
  extractPlumeriaThemes,
} from './transforms/from-plumeria';
import type {
  PlumeriaComposition,
  PlumeriaFolding,
  PlumeriaReport,
} from './transforms/from-plumeria';
import type { ReleaseModule } from './transforms/release-styles';

export interface ReleasedStylesheet {
  source: string;
  target: string;
  css: string;
  reports: PlumeriaReport[];
}

export interface ReleasePlan {
  stylesheets: ReleasedStylesheet[];
  modules: Record<string, ReleaseModule>;
  themes: Record<string, string[]>;
  animations: Record<string, string[]>;
  statics: Record<string, string[]>;
  /** Resolved token values per defining file, so reads can be inlined. */
  values: Record<string, Record<string, unknown>>;
  /** No file was left behind, so every Plumeria type has become a class name. */
  complete: boolean;
  /** String constants each file can reach, for a style read with a named key. */
  constants: Record<string, Record<string, string>>;
  global?: { target: string; css: string };
}

// The generated block is fenced so a re-run replaces it. Appending would grow
// the file every time a report is cleared and the migration is run again.
const GLOBAL_OPEN =
  '/* Generated from css.createTheme, css.keyframes, and css.viewTransition by @plumeria/codemod */';
const GLOBAL_CLOSE = '/* End of @plumeria/codemod generated styles */';

const EXTENSION = /\.(?:[cm]?[jt]sx?)$/;
const IGNORED = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  '.next',
  '.git',
  'coverage',
]);

const findSources = (targets: string[]): string[] => {
  const found: string[] = [];
  const walk = (entry: string) => {
    const stats = fs.statSync(entry);
    if (stats.isFile()) {
      if (EXTENSION.test(entry)) found.push(path.resolve(entry));
      return;
    }
    for (const name of fs.readdirSync(entry)) {
      if (!IGNORED.has(name)) walk(path.join(entry, name));
    }
  };
  for (const target of targets) {
    try {
      walk(target);
    } catch {
      // Missing paths produce an empty plan, matching the forward migration.
    }
  }
  return found.sort();
};

const STYLE_PROP = 'classStyle';

const memberOf = (node: any): { object: string; key: string } | undefined => {
  if (node?.type !== 'MemberExpression' || node.object.type !== 'Identifier')
    return undefined;
  const key = node.computed
    ? node.property.type === 'Literal'
      ? String(node.property.value)
      : undefined
    : node.property.name;
  return key === undefined ? undefined : { object: node.object.name, key };
};

// What one array element can evaluate to. A condition widens the slot rather
// than disqualifying it: the order it implies still has to hold.
const slotOf = (node: any): { object: string; key: string }[] => {
  const member = memberOf(node);
  if (member) return [member];
  if (node?.type === 'LogicalExpression') return slotOf(node.right);
  if (node?.type === 'ConditionalExpression')
    return [...slotOf(node.consequent), ...slotOf(node.alternate)];
  return [];
};

const walk = (node: any, visit: (node: any) => void) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue;
    walk(node[key], visit);
  }
};

export const releasedPath = (source: string): string =>
  source.replace(/(?:\.styles)?\.[^.]+$/, '.module.css');

const GLOBAL_DIRECTORIES = [
  ['src', 'app'],
  ['app'],
  ['src', 'styles'],
  ['styles'],
];

const GLOBAL_NAMES = ['global.css', 'globals.css'];

const globalPath = (targets: string[]): string => {
  const first = path.resolve(targets[0]);
  const root =
    fs.existsSync(first) && fs.statSync(first).isDirectory()
      ? first
      : path.dirname(first);
  const existing = GLOBAL_DIRECTORIES.flatMap((directory) =>
    GLOBAL_NAMES.map((name) => path.join(root, ...directory, name)),
  ).find((candidate) => fs.existsSync(candidate));
  if (existing) return existing;
  return fs.existsSync(path.join(root, 'src'))
    ? path.join(root, 'src', 'styles', 'global.css')
    : path.join(root, 'styles', 'global.css');
};

export function planRelease(targets: string[]): ReleasePlan {
  const stylesheets: ReleasedStylesheet[] = [];
  const modules: Record<string, ReleaseModule> = {};
  const themes: Record<string, string[]> = {};
  const animations: Record<string, string[]> = {};
  const statics: Record<string, string[]> = {};
  const sources = findSources(targets);
  const sourceText = new Map(
    sources.map((source) => [source, fs.readFileSync(source, 'utf8')]),
  );
  const themeValues = new Map<string, Record<string, Record<string, string>>>();
  const animationValues = new Map<string, Record<string, string>>();
  const staticValues = new Map<
    string,
    Record<string, Record<string, unknown>>
  >();
  const reportsBySource = new Map<string, PlumeriaReport[]>();
  const themeKeys = new Map<string, string[]>();
  const themeCss = new Map<string, Record<string, string>>();
  const animationKeys = new Map<string, string[]>();
  const animationCss = new Map<string, Record<string, string>>();
  const staticKeys = new Map<string, string[]>();
  const dependencies = new Map<string, Set<string>>();

  const note = (source: string, reports: PlumeriaReport[]) => {
    if (reports.length === 0) return;
    reportsBySource.set(source, [
      ...(reportsBySource.get(source) ?? []),
      ...reports,
    ]);
  };

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaStatics(
        sourceText.get(source) as string,
      );
      if (Object.keys(extracted.bindings).length > 0)
        staticValues.set(source, extracted.bindings);
    } catch {
      // A later pass reports definitions that cannot be resolved.
    }
  }

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaThemes(sourceText.get(source) as string);
      if (Object.keys(extracted.bindings).length === 0) continue;
      themeValues.set(source, extracted.bindings);
    } catch {
      // The converter reports parse failures through the source rewrite pass.
    }
  }

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaAnimations(
        sourceText.get(source) as string,
        {
          ...(themeValues.get(source) ?? {}),
        },
      );
      if (Object.keys(extracted.bindings).length > 0)
        animationValues.set(source, extracted.bindings);
    } catch {
      // A later pass reports definitions that cannot be resolved.
    }
  }

  const importedValues = (
    source: string,
    availableBySource: Map<string, Record<string, any>>,
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    const ast = parse(sourceText.get(source) as string, {
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    }) as any;
    for (const node of ast.body) {
      if (
        node.type !== 'ImportDeclaration' ||
        typeof node.source.value !== 'string'
      )
        continue;
      const target = resolveSourcePath(node.source.value, source);
      if (!target) continue;
      const available = availableBySource.get(target);
      if (!available) continue;
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
          const imported = specifier.imported.name ?? specifier.imported.value;
          if (available[imported]) {
            result[specifier.local.name] = available[imported];
            dependencies.set(
              source,
              (dependencies.get(source) ?? new Set()).add(target),
            );
          }
        } else if (specifier.type === 'ImportNamespaceSpecifier') {
          result[specifier.local.name] = available;
          dependencies.set(
            source,
            (dependencies.get(source) ?? new Set()).add(target),
          );
        }
      }
    }
    return result;
  };

  const importedPlumeriaValues = (source: string): Record<string, unknown> => {
    const merged: Record<string, unknown> = {};
    for (const table of [staticValues, themeValues, animationValues]) {
      for (const [key, value] of Object.entries(
        importedValues(source, table),
      )) {
        const previous = merged[key];
        merged[key] =
          previous &&
          typeof previous === 'object' &&
          value &&
          typeof value === 'object'
            ? { ...previous, ...value }
            : value;
      }
    }
    return merged;
  };

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaThemes(sourceText.get(source) as string);
      note(source, extracted.reports);
      if (Object.keys(extracted.bindings).length === 0) continue;
      themeKeys.set(source, Object.keys(extracted.bindings));
      themeCss.set(source, extracted.cssByBinding);
    } catch {
      // The converter reports parse failures through the source rewrite pass.
    }
  }

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaStatics(
        sourceText.get(source) as string,
        importedPlumeriaValues(source),
      );
      note(source, extracted.reports);
      if (Object.keys(extracted.bindings).length === 0) continue;
      staticValues.set(source, extracted.bindings);
      staticKeys.set(source, Object.keys(extracted.bindings));
    } catch {
      // The converter reports parse failures through the source rewrite pass.
    }
  }

  for (const source of sources) {
    try {
      const extracted = extractPlumeriaAnimations(
        sourceText.get(source) as string,
        {
          ...importedPlumeriaValues(source),
          ...(themeValues.get(source) ?? {}),
        },
      );
      note(source, extracted.reports);
      if (Object.keys(extracted.bindings).length === 0) continue;
      animationValues.set(source, extracted.bindings);
      animationKeys.set(source, [
        ...extracted.keyframes,
        ...extracted.viewTransitions,
      ]);
      animationCss.set(source, extracted.cssByBinding);
    } catch {
      // The converter reports parse failures through the source rewrite pass.
    }
  }

  // Which local name in which file reads which `css.create` binding, so a
  // composition written in a consumer can be traced back to its module.
  const createBindings = new Map<string, Set<string>>();
  for (const source of sources) {
    try {
      const ast = parse(sourceText.get(source) as string, {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      }) as any;
      const declared = new Set<string>();
      for (const raw of ast.body) {
        const statement =
          raw.type === 'ExportNamedDeclaration' ? raw.declaration : raw;
        if (statement?.type !== 'VariableDeclaration') continue;
        for (const declaration of statement.declarations) {
          if (
            declaration.id.type === 'Identifier' &&
            declaration.init?.type === 'CallExpression' &&
            declaration.init.callee.type === 'MemberExpression' &&
            declaration.init.callee.property?.name === 'create'
          )
            declared.add(declaration.id.name);
        }
      }
      if (declared.size > 0) createBindings.set(source, declared);
    } catch {
      // Unparsed files simply contribute no compositions.
    }
  }

  // `const size = 'small'` reached through `styles[size]`. A name declared more
  // than once in a file is left alone rather than guessed at.
  const stringConstants = new Map<string, Map<string, string>>();
  const exportedConstants = new Map<string, Map<string, string>>();
  for (const source of sources) {
    let ast;
    try {
      ast = parse(sourceText.get(source) as string, {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      }) as any;
    } catch {
      continue;
    }
    const held = new Map<string, string>();
    const exported = new Map<string, string>();
    const duplicated = new Set<string>();
    const seen = new Set<any>();
    const read = (statement: any, isExport: boolean) => {
      // The walk reaches an exported declaration twice, once through the export
      // and once on its own, and reading it again would look like a redeclare.
      if (seen.has(statement)) return;
      seen.add(statement);
      if (
        statement?.type !== 'VariableDeclaration' ||
        statement.kind !== 'const'
      )
        return;
      for (const declaration of statement.declarations) {
        if (
          declaration.id.type !== 'Identifier' ||
          declaration.init?.type !== 'Literal' ||
          typeof declaration.init.value !== 'string'
        )
          continue;
        if (held.has(declaration.id.name)) duplicated.add(declaration.id.name);
        held.set(declaration.id.name, declaration.init.value);
        if (isExport) exported.set(declaration.id.name, declaration.init.value);
      }
    };
    walk(ast.body, (node: any) => {
      if (node.type === 'ExportNamedDeclaration') read(node.declaration, true);
      else read(node, false);
    });
    for (const name of duplicated) {
      held.delete(name);
      exported.delete(name);
    }
    if (held.size > 0) stringConstants.set(source, held);
    if (exported.size > 0) exportedConstants.set(source, exported);
  }

  const resolvedConstants = new Map<string, Map<string, string>>();
  const compositions = new Map<string, PlumeriaComposition[]>();
  const foldings = new Map<string, PlumeriaFolding[]>();
  const reached = new Map<string, Set<string>>();
  for (const source of sources) {
    let ast;
    try {
      ast = parse(sourceText.get(source) as string, {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        loc: true,
        range: true,
      }) as any;
    } catch {
      continue;
    }
    const constants = new Map(stringConstants.get(source) ?? []);
    for (const node of ast.body) {
      if (node.type !== 'ImportDeclaration') continue;
      const target = resolveSourcePath(String(node.source.value), source);
      const available = target ? exportedConstants.get(target) : undefined;
      if (!available) continue;
      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportSpecifier') continue;
        const imported = specifier.imported.name ?? specifier.imported.value;
        const value = available.get(imported);
        if (value !== undefined) constants.set(specifier.local.name, value);
      }
    }
    if (constants.size > 0) resolvedConstants.set(source, constants);

    const owners = new Map<string, { source: string; binding: string }>();
    for (const binding of createBindings.get(source) ?? [])
      owners.set(binding, { source, binding });
    for (const node of ast.body) {
      if (node.type !== 'ImportDeclaration') continue;
      const target = resolveSourcePath(String(node.source.value), source);
      const declared = target ? createBindings.get(target) : undefined;
      if (!target || !declared) continue;
      for (const specifier of node.specifiers) {
        if (specifier.type !== 'ImportSpecifier') continue;
        const imported = specifier.imported.name ?? specifier.imported.value;
        if (declared.has(imported))
          owners.set(specifier.local.name, {
            source: target,
            binding: imported,
          });
      }
    }
    // A key the call site computes has no class name to resolve to, so the
    // binding it reads cannot be exported without breaking that read.
    walk(ast.body, (node: any) => {
      if (
        node.type !== 'MemberExpression' ||
        !node.computed ||
        node.property.type === 'Literal' ||
        node.object.type !== 'Identifier'
      )
        return;
      const owner = owners.get(node.object.name);
      if (!owner) return;
      if (
        node.property.type === 'Identifier' &&
        constants.has(node.property.name)
      )
        return;
      note(owner.source, [
        {
          line: node.loc.start.line,
          column: node.loc.start.column + 1,
          kind: 'dynamic-style-access',
          hint: `\`${node.object.name}\` is read with a computed key, which has no class name until it runs.`,
        },
      ]);
    });

    walk(ast.body, (node: any) => {
      if (
        node.type !== 'JSXAttribute' ||
        node.name?.name !== STYLE_PROP ||
        node.value?.type !== 'JSXExpressionContainer'
      )
        return;
      const expression = node.value.expression;
      if (
        expression?.type !== 'ArrayExpression' ||
        expression.elements.length < 2
      )
        return;
      const slots = expression.elements.map(slotOf);
      if (slots.some((slot: any[]) => slot.length === 0)) return;
      const owners_ = slots.flat().map((part: any) => owners.get(part.object));
      if (owners_.some((candidate: any) => !candidate)) return;
      const owner = owners_[0]!.source;
      const named = slots.map((slot: { object: string; key: string }[]) =>
        slot.map((part) => ({
          binding: owners.get(part.object)!.binding,
          key: part.key,
        })),
      );
      const collapsible =
        expression.elements.every((element: any) => memberOf(element)) &&
        named.every((slot: unknown[]) => slot.length === 1);

      // Members split across modules land in separate stylesheets, where no
      // declaration order reaches both. Folded into one class in the first of
      // them, they are back under an order that does.
      if (owners_.some((candidate: any) => candidate!.source !== owner)) {
        if (!collapsible) return;
        const parts = slots.map((slot: any[], index: number) => {
          const held = owners.get(slot[0].object)!;
          return {
            binding: held.binding,
            key: slot[0].key,
            ...(held.source === owner ? {} : { source: held.source }),
            target: releasedPath(held.source),
            at: index,
          };
        });
        foldings.set(owner, [
          ...(foldings.get(owner) ?? []),
          {
            signature: parts
              .map((part: any) => `${part.target}#${part.key}`)
              .join('|'),
            parts: parts.map(({ binding, key, source }: any) => ({
              binding,
              key,
              ...(source ? { source } : {}),
            })),
          },
        ]);
        for (const part of parts)
          if (part.source)
            reached.set(
              owner,
              (reached.get(owner) ?? new Set()).add(part.source),
            );
        return;
      }
      compositions.set(owner, [
        ...(compositions.get(owner) ?? []),
        {
          parts: collapsible ? named.map((slot: any[]) => slot[0]) : [],
          slots: named,
          file: source,
          line: node.loc.start.line,
          column: node.loc.start.column + 1,
        },
      ]);
    });
  }

  const converted = new Map<string, ReturnType<typeof convertPlumeriaModule>>();
  for (const source of sources) {
    let module;
    try {
      module = convertPlumeriaModule(
        sourceText.get(source) as string,
        importedPlumeriaValues(source),
        compositions.get(source) ?? [],
        {
          target: releasedPath(source),
          foldings: foldings.get(source) ?? [],
          foreign: Object.fromEntries(
            [...(reached.get(source) ?? [])].map((other) => [
              other,
              {
                text: sourceText.get(other) as string,
                values: {
                  ...importedPlumeriaValues(other),
                  ...(staticValues.get(other) ?? {}),
                  ...(themeValues.get(other) ?? {}),
                  ...(animationValues.get(other) ?? {}),
                },
              },
            ]),
          ),
        },
      );
    } catch {
      continue;
    }
    if (!module) continue;
    const target = releasedPath(source);
    converted.set(source, module);
    note(source, module.reports);
    if (fs.existsSync(target)) {
      note(source, [
        {
          line: 0,
          column: 0,
          kind: 'target-exists',
          hint: `${path.basename(target)} already exists and was not overwritten.`,
        },
      ]);
    }
  }

  // A file the plan cannot release keeps its Plumeria call sites, so every file
  // it reads bindings from has to stay behind with it. Releasing the dependency
  // alone would migrate the definition out from under a consumer that still
  // needs it, and the result compiles as neither one thing nor the other.
  const blocked = new Set(reportsBySource.keys());
  for (let changed = true; changed; ) {
    changed = false;
    for (const source of blocked) {
      for (const dependency of dependencies.get(source) ?? []) {
        if (blocked.has(dependency)) continue;
        blocked.add(dependency);
        note(dependency, [
          {
            line: 0,
            column: 0,
            kind: 'blocked-dependency',
            hint: `${path.relative(path.dirname(dependency), source)} still needs these definitions.`,
          },
        ]);
        changed = true;
      }
    }
  }

  const definedKey = (source: string, binding: string): string =>
    `${source}\u0000${binding}`;

  const definedIn = (source: string): string[] => [
    ...(themeKeys.get(source) ?? []),
    ...(animationKeys.get(source) ?? []),
  ];

  const outerReferences = new Map<string, string[]>();
  const innerReferences = new Map<string, Map<string, string[]>>();

  for (const source of sources) {
    if (blocked.has(source)) continue;
    const owned = definedIn(source);
    let ast;
    try {
      ast = parse(sourceText.get(source) as string, {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      }) as any;
    } catch {
      continue;
    }

    const local = new Map<string, string>();
    const namespaces = new Map<string, string>();
    for (const binding of owned)
      local.set(binding, definedKey(source, binding));
    for (const node of ast.body) {
      if (
        node.type !== 'ImportDeclaration' ||
        typeof node.source.value !== 'string'
      )
        continue;
      const target = resolveSourcePath(node.source.value, source);
      const available = target ? definedIn(target) : [];
      if (!target || available.length === 0) continue;
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportNamespaceSpecifier') {
          namespaces.set(specifier.local.name, target);
          continue;
        }
        if (specifier.type !== 'ImportSpecifier') continue;
        const imported = specifier.imported.name ?? specifier.imported.value;
        if (available.includes(imported))
          local.set(specifier.local.name, definedKey(target, imported));
      }
    }
    if (local.size === 0 && namespaces.size === 0) continue;

    const named = new Set<any>();
    walk(ast, (node: any) => {
      if (node.type === 'MemberExpression' && !node.computed)
        named.add(node.property);
      else if (node.type === 'Property' && !node.computed) named.add(node.key);
      else if (node.type === 'ImportSpecifier') {
        named.add(node.local);
        named.add(node.imported);
      } else if (
        node.type === 'ImportDefaultSpecifier' ||
        node.type === 'ImportNamespaceSpecifier'
      )
        named.add(node.local);
    });

    const definitions = new Map<string, any>();
    for (const raw of ast.body) {
      const statement =
        raw.type === 'ExportNamedDeclaration' ? raw.declaration : raw;
      if (statement?.type !== 'VariableDeclaration') continue;
      for (const declaration of statement.declarations) {
        if (
          declaration.id.type !== 'Identifier' ||
          !owned.includes(declaration.id.name)
        )
          continue;
        named.add(declaration.id);
        definitions.set(declaration.id.name, declaration.init);
      }
    }

    const inside = new Set<any>();
    for (const init of definitions.values())
      walk(init, (node: any) => inside.add(node));

    const readsOf = (root: any, skip: (node: any) => boolean): string[] => {
      const found = new Set<string>();
      walk(root, (node: any) => {
        if (skip(node)) return;
        if (node.type === 'Identifier' && !named.has(node)) {
          const key = local.get(node.name);
          if (key) found.add(key);
          return;
        }
        if (
          node.type !== 'MemberExpression' ||
          node.computed ||
          node.object.type !== 'Identifier' ||
          node.property.type !== 'Identifier'
        )
          return;
        const target = namespaces.get(node.object.name);
        const available = target ? definedIn(target) : [];
        if (target && available.includes(node.property.name))
          found.add(definedKey(target, node.property.name));
      });
      return [...found];
    };

    outerReferences.set(
      source,
      readsOf(ast, (node) => inside.has(node)),
    );
    innerReferences.set(
      source,
      new Map(
        [...definitions].map(([binding, init]) => [
          binding,
          readsOf(init, () => false),
        ]),
      ),
    );
  }

  const reachable = new Set<string>();
  const pending: string[] = [];
  const reach = (key: string) => {
    if (reachable.has(key)) return;
    reachable.add(key);
    pending.push(key);
  };
  for (const keys of outerReferences.values())
    for (const key of keys) reach(key);
  while (pending.length > 0) {
    const [target, binding] = (pending.pop() as string).split('\u0000');
    for (const key of innerReferences.get(target)?.get(binding) ?? [])
      reach(key);
  }

  const releasedFrom = (source: string, binding: string): boolean =>
    reachable.has(definedKey(source, binding));

  // A CSS Module scopes an `animation-name` value the way it scopes a class, so
  // a keyframes written to the global stylesheet is renamed at the call site
  // and matches nothing. The rule rides in the module that reads it instead.
  const keyframesByName = new Map<string, string>();
  for (const [source, bindings] of animationValues) {
    for (const [binding, name] of Object.entries(bindings)) {
      if (!name.startsWith('kf-') || !releasedFrom(source, binding)) continue;
      const rule = animationCss.get(source)?.[binding]?.trim();
      if (rule) keyframesByName.set(name, rule);
    }
  }

  // A `::view-transition-*` rule sits in the global stylesheet, so a keyframes
  // it names has to be written there unscoped as well.
  const globalReads = new Set<string>();
  for (const [source, bindings] of animationValues) {
    for (const [binding, name] of Object.entries(bindings)) {
      if (!name.startsWith('vt-') || !releasedFrom(source, binding)) continue;
      for (const read of animationCss
        .get(source)
        ?.[binding]?.match(/\bkf-[a-z0-9]+\b/g) ?? [])
        globalReads.add(read);
    }
  }

  const carried = new Map<string, string[]>();
  const placed = new Set<string>();
  for (const [source, module] of converted) {
    if (blocked.has(source) || !module) continue;
    const read = [...new Set(module.css.match(/\bkf-[a-z0-9]+\b/g) ?? [])]
      .filter((name) => keyframesByName.has(name))
      .map((name) => {
        placed.add(name);
        return keyframesByName.get(name) as string;
      });
    if (read.length > 0) carried.set(source, read);
  }

  const globalRules: string[] = [];
  const values: Record<string, Record<string, unknown>> = {};
  for (const source of sources) {
    const reports = reportsBySource.get(source) ?? [];
    const module = converted.get(source);
    if (module) {
      const held = carried.get(source);
      stylesheets.push({
        source,
        target: releasedPath(source),
        css: held ? `${held.join('\n\n')}\n\n${module.css}` : module.css,
        reports,
      });
    } else if (reports.length > 0) {
      stylesheets.push({ source, target: '', css: '', reports });
    }
    if (blocked.has(source)) continue;
    const resolved = {
      ...(staticValues.get(source) ?? {}),
      ...Object.fromEntries(
        Object.entries(themeValues.get(source) ?? {}).filter(([binding]) =>
          releasedFrom(source, binding),
        ),
      ),
      ...Object.fromEntries(
        Object.entries(animationValues.get(source) ?? {}).filter(([binding]) =>
          releasedFrom(source, binding),
        ),
      ),
    };
    if (Object.keys(resolved).length > 0) values[source] = resolved;
    const releasedThemes = (themeKeys.get(source) ?? []).filter((binding) =>
      releasedFrom(source, binding),
    );
    if (releasedThemes.length > 0) {
      themes[source] = releasedThemes;
      for (const binding of releasedThemes) {
        const rule = themeCss.get(source)?.[binding]?.trim();
        if (rule) globalRules.push(rule);
      }
    }
    const releasedAnimations = (animationKeys.get(source) ?? []).filter(
      (binding) => releasedFrom(source, binding),
    );
    if (releasedAnimations.length > 0) {
      animations[source] = releasedAnimations;
      for (const binding of releasedAnimations) {
        const name = animationValues.get(source)?.[binding];
        if (name && placed.has(name) && !globalReads.has(name)) continue;
        const rule = animationCss.get(source)?.[binding]?.trim();
        if (rule) globalRules.push(rule);
      }
    }
    if (staticKeys.has(source))
      statics[source] = staticKeys.get(source) as string[];
    if (!module) continue;
    modules[source] = {
      source: `./${path.basename(releasedPath(source))}`,
      target: releasedPath(source),
      binding: module.binding,
      ...(module.definitionOnly ? { definitionOnly: true } : {}),
      ...(Object.keys(module.aliases).length > 0
        ? { aliases: module.aliases }
        : {}),
      ...(Object.keys(module.functions).length > 0
        ? { functions: module.functions }
        : {}),
      ...(Object.keys(module.merges).length > 0
        ? { merges: module.merges }
        : {}),
      ...(Object.keys(module.overrides).length > 0
        ? { overrides: module.overrides }
        : {}),
    };
  }

  return {
    stylesheets,
    modules,
    themes,
    animations,
    statics,
    values,
    complete: stylesheets.every((sheet) => sheet.reports.length === 0),
    constants: Object.fromEntries(
      [...resolvedConstants].map(([source, held]) => [
        source,
        Object.fromEntries(held),
      ]),
    ),
    global:
      globalRules.length > 0
        ? {
            target: globalPath(targets),
            css: `${GLOBAL_OPEN}\n${globalRules.join('\n\n')}\n${GLOBAL_CLOSE}\n`,
          }
        : undefined,
  };
}

export function writeRelease(plan: ReleasePlan): void {
  for (const sheet of plan.stylesheets) {
    if (sheet.reports.length > 0) continue;
    fs.writeFileSync(sheet.target, sheet.css, 'utf8');
  }
  if (plan.global) {
    fs.mkdirSync(path.dirname(plan.global.target), { recursive: true });
    const previous = fs.existsSync(plan.global.target)
      ? fs.readFileSync(plan.global.target, 'utf8')
      : '';
    const opening = previous.indexOf(GLOBAL_OPEN);
    const closing = previous.lastIndexOf(GLOBAL_CLOSE);
    if (opening !== -1 && closing > opening) {
      const kept = `${previous.slice(0, opening)}${previous.slice(
        closing + GLOBAL_CLOSE.length,
      )}`;
      fs.writeFileSync(
        plan.global.target,
        `${kept.replace(/\n+$/, '\n')}${plan.global.css}`,
        'utf8',
      );
      return;
    }
    const separator =
      previous.length > 0 && !previous.endsWith('\n') ? '\n\n' : '';
    fs.writeFileSync(
      plan.global.target,
      `${previous}${separator}${plan.global.css}`,
      'utf8',
    );
  }
}

export function formatReleaseReports(
  sheets: ReleasedStylesheet[],
  cwd: string,
): string[] {
  const lines: string[] = [];
  for (const sheet of sheets) {
    if (sheet.reports.length === 0) continue;
    lines.push(path.relative(cwd, sheet.source) || sheet.source);
    for (const report of sheet.reports) {
      lines.push(`  ${report.line}:${report.column}  ${report.kind}`);
      lines.push(`        ${report.hint}`);
    }
  }
  return lines;
}
