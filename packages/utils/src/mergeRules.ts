import type { AtRule, Container, Plugin } from 'postcss';
import { impliesCondition, isAtRule } from 'zss-engine';

const conditionOf = (node: AtRule): string => `@${node.name} ${node.params}`;

/**
 * A condition that matches a subset of another is the more specific of the two,
 * the same way a longhand is more specific than the shorthand covering it.
 * Specificity cannot carry that, because whether one condition implies another
 * is undecidable in general, so the pair is ordered instead: the narrower one
 * last, where it wins everywhere both of them reach.
 *
 * Conditions this cannot compare keep the order they arrived in, unless a pair
 * it can compare leaves no arrangement that also holds them still.
 */
function sortByImplication(nodes: AtRule[]): AtRule[] {
  const blockedBy = nodes.map((node, i) =>
    nodes.filter(
      (other, j) =>
        i !== j && impliesCondition(conditionOf(node), conditionOf(other)),
    ),
  );

  const emitted = new Set<AtRule>();
  const sorted: AtRule[] = [];

  while (sorted.length < nodes.length) {
    const next = nodes.findIndex(
      (node, i) =>
        !emitted.has(node) && blockedBy[i].every((other) => emitted.has(other)),
    );
    if (next === -1) return nodes;

    emitted.add(nodes[next]);
    sorted.push(nodes[next]);
  }

  return sorted;
}

function mergeContainer(container: Container): void {
  if (!container.nodes) return;

  const rules = new Map<string, Container>();
  const atRules = new Map<string, Container>();

  for (const node of [...container.nodes]) {
    if (node.type === 'rule') {
      const previous = rules.get(node.selector);
      if (previous) {
        previous.append(...node.nodes);
        node.remove();
      } else {
        rules.set(node.selector, node);
      }
      continue;
    }

    if (node.type !== 'atrule' || !node.nodes) continue;

    const key = `${node.name}\0${node.params}`;
    const previous = atRules.get(key);
    if (previous) {
      previous.append(...node.nodes);
      node.remove();
    } else {
      atRules.set(key, node);
    }
  }

  for (const node of [...rules.values(), ...atRules.values()]) {
    mergeContainer(node);
  }

  const conditionals = [...container.nodes].filter(
    (node): node is AtRule =>
      node.type === 'atrule' && isAtRule(`@${node.name}`),
  );

  for (const node of sortByImplication(conditionals)) {
    container.append(node);
  }
}

export const mergeRules = (): Plugin => ({
  postcssPlugin: 'plumeria-merge-rules',
  OnceExit(root) {
    mergeContainer(root);
  },
});
