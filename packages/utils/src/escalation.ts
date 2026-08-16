import type { CSSProperties, Specificity } from 'zss-engine';
import {
  isAtRule,
  camelToKebabCase,
  DIRECT_LONGHANDS,
  getPseudoElement,
  getSpecificity,
} from 'zss-engine';

export interface StyleSource {
  order: number;
  style: CSSProperties;
}

interface Atom {
  key: string;
  seat: string;
  group: string;
  target: string;
  property: string;
  base: Specificity;
}

const SHORTHANDS_OF: Record<string, string[]> = {};
for (const [shorthand, longhands] of Object.entries(DIRECT_LONGHANDS)) {
  for (const longhand of longhands as string[]) {
    (SHORTHANDS_OF[longhand] ??= []).push(shorthand);
  }
}

const depthCache = new Map<string, number>();

const propertyDepth = (property: string): number => {
  const cached = depthCache.get(property);
  if (cached !== undefined) return cached;

  depthCache.set(property, 0);
  let depth = 0;
  for (const shorthand of SHORTHANDS_OF[property] ?? []) {
    depth = Math.max(depth, propertyDepth(shorthand) + 1);
  }
  depthCache.set(property, depth);
  return depth;
};

const covers = (shorthand: string, longhand: string): boolean => {
  const seen = new Set<string>();
  const queue = [...(DIRECT_LONGHANDS[shorthand] ?? [])];
  while (queue.length) {
    const current = queue.shift() as string;
    if (current === longhand) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    queue.push(...(DIRECT_LONGHANDS[current] ?? []));
  }
  return false;
};

const conflicts = (a: string, b: string): boolean =>
  a === b || covers(a, b) || covers(b, a);

const compare = (a: Specificity, b: Specificity): number =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const weighted = (base: Specificity, weight: number): Specificity => [
  base[0] + weight,
  base[1],
  base[2],
];

export function getStateWeights(
  sources: StyleSource[],
): Record<string, number> {
  const atoms: Atom[] = [];
  const byKey = new Map<string, Atom>();
  const lastOrder = new Map<string, number>();

  const collect = (
    selector: string,
    style: CSSProperties,
    atRule: string,
    order: number,
  ) => {
    const specificity = getSpecificity(selector);
    const pseudoElement = getPseudoElement(selector);

    Object.entries(style).forEach(([prop, value]) => {
      if (typeof value !== 'string' && typeof value !== 'number') return;

      const property = camelToKebabCase(prop);
      const conditionDepth = prop.startsWith('--') ? 0 : 1 + (atRule ? 1 : 0);
      const target = `${atRule}|${pseudoElement}`;
      const group = `${target}|${specificity.join(',')}|${property}`;
      const seat = `${group}|${selector}`;
      const key = atRule
        ? `${atRule}:${selector}:${prop}`
        : `${selector}:${prop}`;

      lastOrder.set(seat, Math.max(lastOrder.get(seat) ?? -1, order));

      if (byKey.has(key)) return;

      const atom: Atom = {
        key,
        seat,
        group,
        target,
        property,
        base: [
          conditionDepth + propertyDepth(property) + specificity[0],
          1 + specificity[1],
          specificity[2],
        ],
      };
      atoms.push(atom);
      byKey.set(key, atom);
    });
  };

  sources.forEach(({ order, style }) => {
    Object.entries(style).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') return;

      if (isAtRule(key)) {
        Object.entries(value as CSSProperties).forEach(([inner, nested]) => {
          if (nested && typeof nested === 'object') {
            collect(inner, nested as CSSProperties, key, order);
          }
        });
        return;
      }

      collect(key, value as CSSProperties, '', order);
    });
  });

  const weights: Record<string, number> = {};

  const groups = new Map<string, Atom[]>();
  atoms.forEach((atom) => {
    const members = groups.get(atom.group);
    if (members) members.push(atom);
    else groups.set(atom.group, [atom]);
  });

  groups.forEach((members) => {
    if (members.length < 2) return;

    const seatOrders = members.map(
      (member) => lastOrder.get(member.seat) as number,
    );
    const ranks = [...new Set(seatOrders)].sort((a, b) => a - b);
    if (ranks.length < 2) return;

    members.forEach((member, position) => {
      const rank = ranks.indexOf(seatOrders[position]);
      if (rank > 0) weights[member.key] = rank;
    });
  });

  if (Object.keys(weights).length === 0) return weights;

  for (let pass = 0; pass < atoms.length; pass++) {
    let repaired = false;

    atoms.forEach((above) => {
      atoms.forEach((below) => {
        if (above === below) return;
        if (above.target !== below.target) return;
        if (!conflicts(above.property, below.property)) return;
        if (compare(above.base, below.base) <= 0) return;

        const aboveWeight = weights[above.key] ?? 0;
        const post = weighted(above.base, aboveWeight);
        const rival = weighted(below.base, weights[below.key] ?? 0);
        if (compare(post, rival) > 0) return;

        const outranksOnRest =
          compare([0, post[1], post[2]], [0, rival[1], rival[2]]) > 0;
        weights[above.key] =
          aboveWeight + (rival[0] - post[0]) + (outranksOnRest ? 0 : 1);
        repaired = true;
      });
    });

    if (!repaired) break;
  }

  return weights;
}
