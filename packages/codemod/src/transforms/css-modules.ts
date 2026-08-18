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
  reports: Report[];
}

type Value = string | number;

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
  ancestor?: { key: string; pseudo: string };
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
    const parts: { className?: string; pseudos: string[] }[] = [
      { pseudos: [] },
    ];
    let combinator: string | null = null;
    let bad: { kind: string; hint: string } | null = null;

    for (const node of nodes) {
      if (node.type === 'class') {
        const current = parts[parts.length - 1];
        if (current.className) {
          bad = {
            kind: 'unsupported-selector',
            hint: 'Two classes on one element are written as an array at the call site.',
          };
          break;
        }
        current.className = node.value;
      } else if (node.type === 'pseudo') {
        if (node.value === ':global') {
          bad = {
            kind: 'global',
            hint: "A global class is written as a selector key: `':is(.name *)'`.",
          };
          break;
        }
        parts[parts.length - 1].pseudos.push(String(node));
      } else if (node.type === 'combinator') {
        const value = node.value.trim();
        if (value === '+' || value === '~') {
          bad = {
            kind: 'sibling-combinator',
            hint: `A marker carries no order. Write the relation as a selector key: ${DOC}`,
          };
          break;
        }
        if (parts.length > 1) {
          bad = {
            kind: 'unsupported-selector',
            hint: 'Only one level of nesting is converted.',
          };
          break;
        }
        combinator = value === '>' ? '>' : ' ';
        parts.push({ pseudos: [] });
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
    if (parts.some((p) => !p.className)) return;

    const [first, second] = parts;
    if (!second) {
      result = {
        target: {
          key: toKey(first.className!),
          pseudo: first.pseudos.join(''),
        },
      };
      return;
    }
    result = {
      target: {
        key: toKey(second.className!),
        pseudo: second.pseudos.join(''),
        ancestor: {
          key: toKey(first.className!),
          pseudo: first.pseudos.join('') || ':defined',
        },
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
    lines.push(
      `${indent}${key}: ${typeof value === 'number' ? value : `'${value}'`},`,
    );
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
  const composes: Record<string, string[]> = {};
  const reports: Report[] = [];
  const markerPseudos = new Map<string, Set<string>>();

  const keyOf = (name: string): StyleNode => {
    if (!keys.has(name)) keys.set(name, emptyNode());
    return keys.get(name)!;
  };

  const report = (node: Rule | Declaration, kind: string, hint: string) => {
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
        const taken = Object.entries(names).find(
          ([other, k]) => k === key && other !== bare,
        );
        if (taken) {
          report(
            rule,
            'key-collision',
            `\`${bare}\` and \`${taken[0]}\` both become \`${key}\`.`,
          );
        }
        names[bare] = key;
      }

      let node = keyOf(target.key);

      if (target.ancestor) {
        const { key: id, pseudo } = target.ancestor;
        const seen = markerPseudos.get(id) ?? new Set<string>();
        if (!seen.has(pseudo)) {
          seen.add(pseudo);
          markerPseudos.set(id, seen);
          keyOf(id).markers.push(`css.marker('${id}', '${pseudo}')`);
        }
        node = nest(node, `css.extended('${id}', '${pseudo}')`);
      }

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
              'A class composed from another file is not resolved.',
            );
            return;
          }
          composes[target.key] = (composes[target.key] ?? []).concat(
            name.split(/\s+/).map(toKey),
          );
          return;
        }
        node.decls.push([toProperty(child.prop), toValue(child.value)]);
      });
    }
  });

  const body = [...keys.entries()]
    .map(([key, node]) => `  ${key}: {\n${serialise(node, '    ')}\n  },`)
    .join('\n');

  const code = `import * as css from '@plumeria/core';

export const styles = css.create({
${body}
});
`;

  return { code, names, composes, reports };
}
