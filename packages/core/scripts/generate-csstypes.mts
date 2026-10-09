import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import prettier from 'prettier';

const require = createRequire(import.meta.url);
const csstree = require('css-tree') as {
  definitionSyntax: { parse: (syntax: string) => SyntaxNode };
};
const properties = require('mdn-data/css/properties.json') as Record<
  string,
  { syntax: string; status: string }
>;
const syntaxes = require('mdn-data/css/syntaxes.json') as Record<
  string,
  { syntax: string }
>;
const webref = require('@webref/css/css.json') as {
  properties: { name: string; syntax?: string }[];
  types: { name: string; syntax?: string }[];
};
const bcd = require('@mdn/browser-compat-data') as {
  css: {
    properties: Record<
      string,
      { __compat?: { support: Record<string, Support | Support[]> } }
    >;
  };
};

type Support = {
  version_added?: string | boolean | null;
  version_removed?: string;
  flags?: unknown[];
  prefix?: string;
  alternative_name?: string;
  partial_implementation?: boolean;
} | null;

const ships = (entry: Support) =>
  !!entry &&
  typeof entry.version_added === 'string' &&
  entry.version_added !== 'preview' &&
  !entry.version_removed &&
  !entry.flags &&
  !entry.prefix &&
  !entry.alternative_name &&
  !entry.partial_implementation;

const webrefProperties = new Map(
  webref.properties.map((property) => [property.name, property.syntax]),
);
const webrefTypes = new Map(
  webref.types
    .filter((type) => type.syntax)
    .map((type) => [type.name, { syntax: type.syntax! }]),
);

const propertySyntaxes: Record<string, string> = Object.fromEntries(
  Object.entries(properties).map(([name, data]) => [name, data.syntax]),
);
for (const [name, feature] of Object.entries(bcd.css.properties)) {
  if (
    name.startsWith('-') ||
    name === 'custom-property' ||
    name in propertySyntaxes
  ) {
    continue;
  }
  if (
    !['chrome', 'firefox', 'safari'].some((browser) =>
      [feature.__compat?.support[browser] ?? null].flat().some(ships),
    )
  ) {
    continue;
  }
  propertySyntaxes[name] = webrefProperties.get(name) ?? '<any-value>';
}

const output = path.join(import.meta.dirname, '..', 'lib', 'csstypes.d.ts');

type SyntaxNode = {
  type: string;
  name?: string;
  combinator?: string;
  terms?: SyntaxNode[];
  term?: SyntaxNode;
  min?: number;
  max?: number;
  comma?: boolean;
};

type Values = {
  values: Set<string>;
  open: boolean;
  numeric: boolean;
  optional: boolean;
};

const prefixed: Record<string, string> = {
  '-webkit-tap-highlight-color':
    properties['-webkit-tap-highlight-color'].syntax,
  '-webkit-mask-image': properties['-webkit-mask-image'].syntax,
  '-webkit-text-fill-color': properties['-webkit-text-fill-color'].syntax,
  '-webkit-text-stroke-width': properties['-webkit-text-stroke-width'].syntax,
  '-webkit-text-stroke-color': properties['-webkit-text-stroke-color'].syntax,
  '-webkit-line-clamp': properties['-webkit-line-clamp'].syntax,
  '-ms-overflow-style': properties['-ms-overflow-style'].syntax,
  '-webkit-font-smoothing': 'auto | none | antialiased | subpixel-antialiased',
  '-webkit-background-clip': 'border-box | padding-box | content-box | text',
  '-webkit-box-orient': 'horizontal | vertical | inline-axis | block-axis',
};

const numericTypes = new Set([
  'number',
  'integer',
  'length',
  'length-percentage',
]);
const MIN_ALIAS_KEYWORDS = 3;
const MIN_ALIAS_USERS = 2;

const aliasName = (name: string) =>
  name
    .replace(/\(\)$/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const open = (numeric = false, optional = false): Values => ({
  values: new Set(),
  open: true,
  numeric,
  optional,
});

const parsed = new Map<string, SyntaxNode>();
const parse = (syntax: string) => {
  let node = parsed.get(syntax);
  if (!node) {
    node = csstree.definitionSyntax.parse(syntax);
    parsed.set(syntax, node);
  }
  return node;
};

const usage = new Map<string, Set<string>>();
const keywordCount = new Map<string, number>();
const aliased = new Set<string>();
const aliases = new Map<string, Values>();
let owner = '';

const expandType = (name: string, visiting: Set<string>): Values => {
  if (numericTypes.has(name)) return open(true);
  const definition = syntaxes[name] ?? webrefTypes.get(name);
  if (!definition || visiting.has(name)) return open();
  if (!usage.has(name)) usage.set(name, new Set());
  usage.get(name)!.add(owner);
  if (aliased.has(name)) {
    if (!aliases.has(name)) {
      visiting.add(name);
      aliases.set(name, expand(parse(definition.syntax), visiting, true));
      visiting.delete(name);
    }
    const alias = aliases.get(name)!;
    return {
      values: new Set([`@${name}`]),
      open: alias.open,
      numeric: alias.numeric,
      optional: alias.optional,
    };
  }
  visiting.add(name);
  const expanded = expand(parse(definition.syntax), visiting);
  visiting.delete(name);
  keywordCount.set(
    name,
    [...expanded.values].filter((value) => value && !value.startsWith('@'))
      .length,
  );
  return expanded;
};

const expand = (
  node: SyntaxNode,
  visiting: Set<string>,
  inAlias = false,
): Values => {
  switch (node.type) {
    case 'Keyword':
      return {
        values: new Set([node.name!]),
        open: false,
        numeric: false,
        optional: false,
      };
    case 'Type':
      return expandType(node.name!, visiting);
    case 'Property': {
      const key = `'${node.name}'`;
      const definition = propertySyntaxes[node.name!];
      if (!definition || visiting.has(key)) return open();
      visiting.add(key);
      const expanded = expand(parse(definition), visiting, inAlias);
      visiting.delete(key);
      return expanded;
    }
    case 'Multiplier': {
      const inner = expand(node.term!, visiting, inAlias);
      const single = node.max === 1 && !node.comma;
      return {
        values: node.min! <= 1 ? inner.values : new Set(),
        open: inner.open || !single,
        numeric: inner.numeric && node.min! <= 1,
        optional: node.min === 0 || inner.optional,
      };
    }
    case 'Group': {
      if (node.terms!.some((term) => term.type === 'Function')) return open();
      const terms = node.terms!.map((term) => expand(term, visiting, inAlias));
      if (terms.length === 1) return terms[0];
      if (node.combinator === '|' || node.combinator === '||') {
        return {
          values: new Set(terms.flatMap((term) => [...term.values])),
          open: node.combinator === '||' || terms.some((term) => term.open),
          numeric: terms.some((term) => term.numeric),
          optional:
            node.combinator === '|' && terms.some((term) => term.optional),
        };
      }
      if (node.combinator === ' ' && terms.every((term) => !term.open)) {
        const combined = sequence(terms);
        if (combined) {
          return {
            values: combined,
            open: false,
            numeric: false,
            optional: terms.every((term) => term.optional),
          };
        }
      }
      const alone = (index: number) =>
        terms.every((other, at) => at === index || other.optional);
      return {
        values: new Set(
          terms.flatMap((term, index) =>
            alone(index) ? [...term.values] : [],
          ),
        ),
        open: true,
        numeric: terms.some((term, index) => term.numeric && alone(index)),
        optional: terms.every((term) => term.optional),
      };
    }
    default:
      return open();
  }
};

const MAX_SEQUENCE = 64;
const MAX_LITERALS = 8;

const size = (atom: string): number => {
  if (atom.startsWith('@')) {
    return [...aliases.get(atom.slice(1))!.values].reduce(
      (total, value) => total + size(value),
      0,
    );
  }
  if (atom.startsWith('#')) {
    return (JSON.parse(atom.slice(1)) as string[][]).reduce(
      (total, part) =>
        total * part.reduce((sum, value) => sum + size(value), 0),
      1,
    );
  }
  return 1;
};

const sequence = (terms: Values[]): Set<string> | null => {
  const optional = terms.filter((term) => term.optional).length;
  if (optional > 3) return null;
  const result = new Set<string>();
  for (let mask = 0; mask < 1 << terms.length; mask++) {
    const present = terms.filter((_, index) => mask & (1 << index));
    if (terms.some((term, index) => !(mask & (1 << index)) && !term.optional)) {
      continue;
    }
    const parts = present.map((term) => [...term.values]);
    if (parts.some((part) => part.length === 0)) return null;
    if (parts.length === 0) continue;
    if (parts.length === 1) {
      for (const value of parts[0]) result.add(value);
      continue;
    }
    const total = parts.reduce(
      (product, part) =>
        product * part.reduce((sum, value) => sum + size(value), 0),
      1,
    );
    if (total > MAX_SEQUENCE) return null;
    const plain = parts.every((part) =>
      part.every((value) => !value.startsWith('@') && !value.startsWith('#')),
    );
    if (plain && total <= MAX_LITERALS) {
      let words = [''];
      for (const part of parts) {
        words = words.flatMap((head) =>
          part.map((value) => (head ? `${head} ${value}` : value)),
        );
      }
      for (const word of words) result.add(word);
    } else {
      result.add(`#${JSON.stringify(parts)}`);
    }
  }
  return result;
};

const camelCase = (name: string) =>
  name
    .replace(/^-ms-/, 'ms-')
    .replace(/^-webkit-/, 'Webkit-')
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

const literal = (value: string) => `'${value}'`;

const target = (name: string): string => {
  const [only, ...rest] = aliases.get(name)!.values;
  return !rest.length && only.startsWith('@') ? target(only.slice(1)) : name;
};

const atom = (value: string): string => {
  if (value.startsWith('@')) return aliasName(target(value.slice(1)));
  if (value.startsWith('#')) {
    const parts = JSON.parse(value.slice(1)) as string[][];
    return `\`${parts
      .map((part) =>
        part.length === 1 &&
        !part[0].startsWith('@') &&
        !part[0].startsWith('#')
          ? part[0]
          : `\${${part.map(atom).join(' | ')}}`,
      )
      .join(' ')}\``;
  }
  return literal(value);
};

const union = (expanded: Values, fallback = true) => {
  const parts = [
    ...new Set([...expanded.values].filter((value) => value !== '').map(atom)),
  ];
  if (fallback && expanded.numeric) parts.push('number');
  if (fallback && (expanded.open || parts.length === 0))
    parts.push('StableString');
  return parts.join(' | ');
};

const sources = Object.entries(propertySyntaxes)
  .filter(([name]) => !name.startsWith('-') && name !== 'all')
  .concat(Object.entries(prefixed));

for (const [name, syntax] of sources) {
  owner = name;
  expand(parse(syntax), new Set());
}
for (const [name, users] of usage) {
  if (
    (keywordCount.get(name) ?? 0) >= MIN_ALIAS_KEYWORDS &&
    users.size >= MIN_ALIAS_USERS
  ) {
    aliased.add(name);
  }
}

const entries = sources
  .map(([name, syntax]) => {
    owner = name;
    return [camelCase(name), union(expand(parse(syntax), new Set()))] as const;
  })
  .sort(([a], [b]) => a.localeCompare(b));

const words = (name: string) =>
  name.split(/(?=[A-Z])/).map((word) => word.toLowerCase());

const sideWords = new Set([
  'top',
  'right',
  'bottom',
  'left',
  'block',
  'inline',
  'start',
  'end',
  'x',
  'y',
  'webkit',
]);

const familyWords = new Set(['color', 'opacity']);

const contains = (outer: string[], inner: string[]) => {
  if (inner.length === 1 && familyWords.has(inner[0])) {
    return outer.at(-1) === inner[0];
  }
  if (outer[0] !== inner[0] && outer.at(-1) !== inner.at(-1)) return false;
  let index = 0;
  for (const word of outer) {
    if (word === inner[index]) index++;
    else if (!sideWords.has(word)) return false;
  }
  return index === inner.length;
};

const types = new Map(entries);
const shared = new Map<string, string>();
for (const [name, type] of entries) {
  const own = words(name);
  const candidates = entries
    .filter(
      ([other, otherType]) =>
        other !== name &&
        otherType === type &&
        words(other).length < own.length &&
        contains(own, words(other)),
    )
    .map(([other]) => other)
    .sort((a, b) => words(a).length - words(b).length || a.localeCompare(b));
  if (candidates[0]) shared.set(name, candidates[0]);
}

const typeLines = entries.map(
  ([name]) => `type ${name} = ${shared.get(name) ?? types.get(name)};`,
);

const aliasLines = [...aliases.entries()]
  .filter(([name]) => target(name) === name)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(
    ([name, values]) => `type ${aliasName(name)} = ${union(values, false)};`,
  );

const source = [
  `type all = 'initial' | 'inherit' | 'unset';`,
  'type StableString = string & {};',
  '',
  ...aliasLines,
  '',
  ...typeLines,
  '',
  'export type CSSTypes = Readonly<{',
  ...entries.map(([name]) => `${name}?: all | ${name};`),
  '}>;',
  '',
].join('\n');

const options = await prettier.resolveConfig(output);
fs.writeFileSync(
  output,
  await prettier.format(source, { ...options, filepath: output }),
);

console.log(
  `${entries.length} properties and ${aliasLines.length} aliases written to ${output}`,
);
