/**
 * @fileoverview Turn a CSS Modules stylesheet into a css.create call
 */

import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import type { Rule, Declaration, AtRule, Container } from 'postcss';

export interface Report {
  line: number;
  column: number;
  kind: string;
  source: string;
  hint: string;
}

export interface Converted {
  code: string;
  names: Record<string, string>;
  composes: Record<string, string[]>;
  /** Keys that read custom properties nothing declares — a function style. */
  functions: Record<string, string[]>;
  /** Bare tags a rule reached through a class, for the consumer to carry. */
  tags: Tags[];
  /**
   * Where each key's last rule sat in the stylesheet. A class list carries no
   * order in CSS — the stylesheet does — so the merge has to be given it.
   */
  order: Record<string, number>;
  /**
   * Class names a rule was refused for. The generated module says nothing
   * about these, so a consumer reading one has to stay where it is.
   */
  unconvertible: string[];
  reports: Report[];
}

/** `.card h2` — the key the consumer attaches to every `h2` under `card`. */
export interface Tags {
  key: string;
  tag: string;
  under: string;
  /** `.a > h2` reaches one level; `.a h2` reaches any. */
  direct: boolean;
  /** Where the rule sat in the stylesheet, so the merge can keep that order. */
  order: number;
}

/** A parameter reference, written without quotes. */
interface Raw {
  raw: string;
}

type Value = string | number | Raw;

interface StyleNode {
  decls: [string, Value][];
  nested: [string, StyleNode][];
  markers: string[];
}

const DOC = 'https://plumeria.dev/docs/api-reference/javascript/marker';

const emptyNode = (): StyleNode => ({ decls: [], nested: [], markers: [] });

const camel = (name: string): string =>
  name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export const toProperty = (name: string): string => {
  if (name.startsWith('--')) return name;
  if (name.startsWith('-')) {
    const camelised = camel(name.slice(1));
    return camelised.charAt(0).toUpperCase() + camelised.slice(1);
  }
  return camel(name);
};

export const toKey = (className: string): string => camel(className);

const PX = /^-?(\d+\.?\d*|\.\d+)px$/;
const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;

export const toValue = (raw: string): Value => {
  const value = raw.trim();
  if (PX.test(value)) return Number(value.slice(0, -2));
  if (NUMBER.test(value)) return Number(value);
  return value;
};

const last = (names: string[]): string => names[names.length - 1];

const nest = (node: StyleNode, key: string): StyleNode => {
  const found = node.nested.find(([k]) => k === key);
  if (found) return found[1];
  const child = emptyNode();
  node.nested.push([key, child]);
  return child;
};

// `:not(#\#)` carries no match, only weight — the forward pass adds it so a
// rule outranks the classes it has to beat. Reading it back as a selector key
// would turn the boost into a nested rule that matches nothing.
const isSpecificityBoost = (node: { type: string; toString(): string }) =>
  node.type === 'pseudo' && /^:not\(#[\\_].*\)$/.test(node.toString());

const atRuleKeys = (rule: Rule): string[] => {
  const keys: string[] = [];
  let parent: Container | undefined = rule.parent as Container | undefined;
  while (parent && parent.type === 'atrule') {
    const at = parent as AtRule;
    keys.unshift(`@${at.name} ${at.params}`.trim());
    parent = parent.parent as Container | undefined;
  }
  return keys;
};

interface Target {
  key: string;
  pseudo: string;
  tag?: string;
  direct?: boolean;
  ancestors?: { key: string; pseudo: string }[];
}

const readSelector = (
  selector: string,
): { target: Target } | { kind: string; hint: string } => {
  let result: { target: Target } | { kind: string; hint: string } = {
    kind: 'unsupported-selector',
    hint: 'Only a local class, or one local class under another, is converted.',
  };

  selectorParser((root) => {
    const nodes = root.first.nodes.filter(
      (n) => n.type !== 'string' && !isSpecificityBoost(n),
    );
    const parts: {
      classNames: string[];
      pseudos: string[];
      global?: string;
      after?: string;
      tag?: string;
    }[] = [{ classNames: [], pseudos: [] }];
    let combinator: string | null = null;
    let bad: { kind: string; hint: string } | null = null;

    for (const node of nodes) {
      if (node.type === 'class') {
        // `.card.featured` names one element twice. The call site writes both
        // as an array, so the declarations ride on the class written last.
        parts[parts.length - 1].classNames.push(node.value);
      } else if (node.type === 'pseudo') {
        if (node.value === ':global') {
          const inner = String(node)
            .slice(':global'.length)
            .replace(/^\(|\)$/g, '');
          if (!inner) {
            bad = {
              kind: 'global',
              hint: "A global class is written as a selector key: `':is(.name *)'`.",
            };
            break;
          }
          parts[parts.length - 1].global = inner;
          continue;
        }
        parts[parts.length - 1].pseudos.push(String(node));
      } else if (node.type === 'tag') {
        parts[parts.length - 1].tag = node.value;
      } else if (node.type === 'attribute') {
        const attr = node as unknown as {
          quoteMark: string | null;
          value?: string;
        };
        if (attr.value != null && attr.quoteMark === "'") attr.quoteMark = '"';
        parts[parts.length - 1].pseudos.push(`:is(${String(node).trim()})`);
      } else if (node.type === 'combinator') {
        const value = node.value.trim();
        combinator = value === '>' ? '>' : value === ' ' ? ' ' : value;
        parts.push({ classNames: [], pseudos: [], after: combinator });
      } else {
        bad = {
          kind: 'unsupported-selector',
          hint: 'Only a local class, or one local class under another, is converted.',
        };
        break;
      }
    }

    if (bad) {
      result = bad;
      return;
    }
    // A `:global(.x)` ancestor names a class Plumeria never hashes, so it
    // survives as a selector key on the target instead of becoming a marker.
    const globals = parts.filter((p) => p.global && !p.classNames.length);
    if (globals.length) {
      const rest = parts.filter((p) => !(p.global && !p.classNames.length));
      if (rest.length !== 1 || !rest[0].classNames.length) return;
      const ancestors = globals.map((p) => `${p.global} `).join('');
      result = {
        target: {
          key: toKey(last(rest[0].classNames)),
          pseudo: `:is(${ancestors}*)${rest[0].pseudos.join('')}`,
        },
      };
      return;
    }

    // A style query reaches descendants, never siblings, so no marker states
    // this relation. An ordinal only agrees with it where every sibling in the
    // parent carries the class, which the stylesheet cannot see.
    if (parts.some((p) => p.after === '+' || p.after === '~')) {
      result = {
        kind: 'sibling-combinator',
        hint: `A container query reaches descendants, never siblings, so no marker states this. Whether an ordinal such as \`:not(:first-child)\` is equivalent depends on the markup — write the relation as a selector key: ${DOC}`,
      };
      return;
    }

    const tagged = parts[parts.length - 1];
    if (
      parts.length > 1 &&
      tagged.tag &&
      !tagged.classNames.length &&
      parts.slice(0, -1).every((p) => p.classNames.length)
    ) {
      const above = parts.slice(0, -1);
      // `.a h2` and `.a > h2` reach different elements, so they cannot share a
      // key: one of the two relations would decide for both.
      const relation = tagged.after === '>' ? 'child-' : '';
      result = {
        target: {
          key: toKey(
            `${last(above[above.length - 1].classNames)}-${relation}${tagged.tag}`,
          ),
          pseudo: tagged.pseudos.join(''),
          tag: tagged.tag,
          direct: tagged.after === '>',
          ancestors: above.map((part) => ({
            key: toKey(last(part.classNames)),
            pseudo: part.pseudos.join('') || ':defined',
          })),
        },
      };
      return;
    }

    if (parts.some((p) => !p.classNames.length)) return;

    const target = parts[parts.length - 1];
    const above = parts.slice(0, -1);
    result = {
      target: {
        key: toKey(last(target.classNames)),
        pseudo: target.pseudos.join(''),
        ...(above.length
          ? {
              ancestors: above.map((part) => ({
                key: toKey(last(part.classNames)),
                pseudo: part.pseudos.join('') || ':defined',
              })),
            }
          : {}),
      },
    };
    void combinator;
  }).processSync(selector);

  return result;
};

const serialise = (node: StyleNode, indent: string): string => {
  const lines: string[] = [];
  for (const marker of node.markers) lines.push(`${indent}...${marker},`);
  for (const [prop, value] of node.decls) {
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prop) ? prop : `'${prop}'`;
    if (typeof value === 'object' && value.raw === prop) {
      lines.push(`${indent}${prop},`);
      continue;
    }
    const written =
      typeof value === 'number'
        ? value
        : typeof value === 'object'
          ? value.raw
          : `'${value}'`;
    lines.push(`${indent}${key}: ${written},`);
  }
  for (const [key, child] of node.nested) {
    const written = key.startsWith('css.extended(') ? `[${key}]` : `'${key}'`;
    lines.push(`${indent}${written}: {`);
    lines.push(serialise(child, indent + '  '));
    lines.push(`${indent}},`);
  }
  return lines.join('\n');
};

export function convertStylesheet(css: string): Converted {
  const root = postcss.parse(css);
  const keys = new Map<string, StyleNode>();
  const names: Record<string, string> = {};
  const candidates: Record<string, string> = {};
  const composes: Record<string, string[]> = {};
  const reports: Report[] = [];
  const markerPseudos = new Map<string, Set<string>>();
  const tags: Tags[] = [];
  const unconvertible = new Set<string>();
  const order: Record<string, number> = {};
  let seen = 0;
  // One rule per key, in the order the stylesheet wrote them, so a class split
  // across the sheet can be told apart from one written once.
  const written: { key: string; place: number; props: Set<string> }[] = [];

  const keyOf = (name: string): StyleNode => {
    if (!keys.has(name)) keys.set(name, emptyNode());
    return keys.get(name)!;
  };

  const report = (node: Rule | Declaration, kind: string, hint: string) => {
    const rule =
      node.type === 'rule' ? node : (node.parent as Rule | undefined);
    for (const found of rule?.selector?.match(/\.([A-Za-z0-9_-]+)/g) ?? [])
      unconvertible.add(found.slice(1));
    const start = node.source?.start;
    reports.push({
      line: start?.line ?? 0,
      column: start?.column ?? 0,
      kind,
      source: node.type === 'rule' ? node.selector : String(node),
      hint,
    });
  };

  root.walkRules((rule) => {
    for (const selector of rule.selectors) {
      const read = readSelector(selector);
      if (!('target' in read)) {
        report(rule, read.kind, read.hint);
        continue;
      }
      const { target } = read;

      for (const className of selector.match(/\.([A-Za-z0-9_-]+)/g) ?? []) {
        const bare = className.slice(1);
        const key = toKey(bare);
        const taken = Object.entries(candidates).find(
          ([other, k]) => k === key && other !== bare,
        );
        if (taken) {
          report(
            rule,
            'key-collision',
            `\`${bare}\` and \`${taken[0]}\` both become \`${key}\`.`,
          );
        }
        candidates[bare] = key;
      }

      let node = keyOf(target.key);

      if (target.tag && target.ancestors) {
        const under = target.ancestors[target.ancestors.length - 1].key;
        if (
          !tags.some(
            (t) =>
              t.key === target.key &&
              t.tag === target.tag &&
              t.direct === (target.direct === true),
          )
        )
          tags.push({
            key: target.key,
            tag: target.tag,
            under,
            direct: target.direct === true,
            order: tags.length,
          });
      }

      if (target.ancestors) {
        // Each marker below the outermost one is itself gated by the marker
        // above it, so `.a .b .c` only fires `b` inside an `a`.
        let gate: string | null = null;
        for (const { key: id, pseudo } of target.ancestors) {
          const signature = `${gate ?? ''}>${pseudo}`;
          const seen = markerPseudos.get(id) ?? new Set<string>();
          if (!seen.has(signature)) {
            seen.add(signature);
            markerPseudos.set(id, seen);
            const holder = gate ? nest(keyOf(id), gate) : keyOf(id);
            holder.markers.push(`css.marker('${id}', '${pseudo}')`);
          }
          gate = `css.extended('${id}', '${pseudo}')`;
        }
        node = nest(node, gate!);
      }

      // The last rule is the one that answers for the merged key, so a class
      // written again later moves with it.
      const place = seen++;
      order[target.key] = place;
      const props = new Set<string>();
      const where = `${atRuleKeys(rule).join('|')}::${target.pseudo}`;
      written.push({ key: target.key, place, props });

      for (const key of atRuleKeys(rule)) node = nest(node, key);
      if (target.pseudo) node = nest(node, target.pseudo);

      rule.each((child) => {
        if (child.type !== 'decl') return;
        if (child.prop === 'composes') {
          const [name, from] = child.value.split(/\s+from\s+/);
          if (from) {
            report(
              child,
              'composes-external',
              'A class composed from another file is not resolved. Convert that stylesheet too, then pass both at the call site as an array.',
            );
            return;
          }
          composes[target.key] = (composes[target.key] ?? []).concat(
            name.split(/\s+/).map(toKey),
          );
          return;
        }
        // A merged class arrives as consecutive rules for one selector, so the
        // later declaration wins rather than being written a second time.
        const property = toProperty(child.prop);
        props.add(`${where}::${property}`);
        const held = node.decls.findIndex(([name]) => name === property);
        if (held !== -1) node.decls.splice(held, 1);
        node.decls.push([property, toValue(child.value)]);
      });
    }
  });

  // A `var()` nothing in the sheet declares came from a function style key,
  // where the argument arrives through the inline `style` prop.
  const declared = new Set<string>();
  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--')) declared.add(decl.prop);
  });

  const functions: Record<string, string[]> = {};
  const VARIABLE = /^var\((--[A-Za-z0-9_-]+)\)$/;
  // A generated hash leads every theme, marker, and animation variable. Those
  // are declared in the global stylesheet, so their absence here means nothing.
  const HASHED = /^x[0-9a-z]{7}$/;
  const kebab = (name: string): string =>
    name.replace(/([A-Z])/g, '-$1').toLowerCase();
  const parameterise = (node: StyleNode, key: string, variables: string[]) => {
    const owned = new RegExp(`^--[A-Za-z0-9_-]+-${kebab(key)}-([a-z0-9-]+)$`);
    node.decls = node.decls.map(([prop, value]) => {
      const match =
        typeof value === 'string' ? VARIABLE.exec(value.trim()) : null;
      const variable = match?.[1];
      if (!variable || declared.has(variable)) return [prop, value];
      const parameter = owned.exec(variable)?.[1];
      if (!parameter || HASHED.test(variable.slice(2).split('-')[0]))
        return [prop, value];
      if (!variables.includes(variable)) variables.push(variable);
      return [prop, { raw: toKey(parameter) }];
    });
    for (const [, child] of node.nested) parameterise(child, key, variables);
  };
  for (const [key, node] of keys) {
    const variables: string[] = [];
    parameterise(node, key, variables);
    if (variables.length > 0) functions[key] = variables;
  }

  const body = [...keys.entries()]
    .map(([key, node]) => {
      const variables = functions[key];
      if (!variables) return `  ${key}: {\n${serialise(node, '    ')}\n  },`;
      const params = variables
        .map(
          (variable) =>
            `${toKey(variable.split('-').pop() as string)}: string | number`,
        )
        .join(', ');
      return `  ${key}: (${params}) => ({\n${serialise(node, '    ')}\n  }),`;
    })
    .join('\n');

  const code = `import * as css from '@plumeria/core';

export const styles = css.create({
${body}
});
`;

  // A class written on both sides of another one cannot be answered by a single
  // place in the array: the merge would give every one of its declarations the
  // later position, including the ones the other class outranks.
  for (const entry of written) {
    const earlier = written.filter(
      (other) => other.key === entry.key && other.place < entry.place,
    );
    if (earlier.length === 0) continue;
    for (const between of written) {
      if (between.key === entry.key) continue;
      if (between.place > entry.place) continue;
      // Only what this key wrote before the other one can be outranked by it.
      const above = new Set(
        earlier
          .filter((other) => other.place < between.place)
          .flatMap((other) => [...other.props]),
      );
      const shared = [...between.props].filter((prop) => above.has(prop));
      if (shared.length === 0) continue;
      reports.push({
        line: 0,
        column: 0,
        kind: 'split-order',
        source: '',
        hint: `\`${entry.key}\` is written on both sides of \`${between.key}\` and they share a property, so one place in the array cannot say which wins. Write the class once.`,
      });
      // `unconvertible` is read against what a consumer writes, which is the
      // class name rather than the key it became.
      for (const [bare, key] of Object.entries(candidates))
        if (key === entry.key || key === between.key) unconvertible.add(bare);
    }
  }

  // A synthetic tag key is not a class name, so it never met the collision
  // check the class names run through. `.card-h2` and `.card h2` both reach
  // `cardH2`, and merging them would put one rule on the other's element.
  for (const pair of tags) {
    const taken = Object.entries(candidates).find(
      ([, key]) => key === pair.key,
    );
    if (!taken) continue;
    reports.push({
      line: 0,
      column: 0,
      kind: 'key-collision',
      source: '',
      hint: `\`${taken[0]}\` and the rule reaching \`${pair.tag}\` both become \`${pair.key}\`.`,
    });
    unconvertible.add(taken[0]);
  }

  // `.card.active` alone writes `active` and nothing for `card`, so a consumer
  // reading `card` has no key to be pointed at and the sheet has to be held.
  for (const [bare, key] of Object.entries(candidates))
    if (keys.has(key)) names[bare] = key;

  return {
    code,
    names,
    order,
    composes,
    functions,
    tags,
    unconvertible: [...unconvertible],
    reports,
  };
}
