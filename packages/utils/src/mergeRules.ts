import type { Container, Plugin } from 'postcss';
import { isAtRule } from 'zss-engine';

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

  for (const node of [...container.nodes]) {
    if (node.type === 'atrule' && isAtRule(`@${node.name}`)) {
      container.append(node);
    }
  }
}

export const mergeRules = (): Plugin => ({
  postcssPlugin: 'plumeria-merge-rules',
  OnceExit(root) {
    mergeContainer(root);
  },
});
