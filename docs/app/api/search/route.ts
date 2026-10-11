import { searchSource } from 'lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import type { Node } from 'fumadocs-core/page-tree';
import { basename, extname } from 'node:path';

export const dynamic = 'force-static';

const breadcrumbs = new Map<string, string[]>();

const collectBreadcrumbs = (nodes: Node[], parents: string[]) => {
  let section = parents;
  for (const node of nodes) {
    if (node.type === 'separator') section = typeof node.name === 'string' ? [...parents, node.name] : parents;
    if (node.type === 'page') breadcrumbs.set(node.url, section);
    if (node.type === 'folder') {
      if (node.index) breadcrumbs.set(node.index.url, section);
      collectBreadcrumbs(node.children, typeof node.name === 'string' ? [...section, node.name] : section);
    }
  }
};

collectBreadcrumbs(searchSource.pageTree.children, []);

const tokenize = (raw: string) => [
  ...new Set(
    raw
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .flatMap((word) => [word, ...word.split(/(?<=\p{Ll})(?=\p{Lu})/u)])
      .map((word) => word.toLowerCase()),
  ),
];

export const { staticGET: GET } = createFromSource(searchSource, {
  tokenizer: { language: 'english', normalizationCache: new Map(), tokenize },
  buildIndex: (page) => ({
    id: page.url,
    title: page.data.title ?? basename(page.path, extname(page.path)),
    breadcrumbs: breadcrumbs.get(page.url) ?? [],
    url: page.url,
    structuredData: { headings: page.data.structuredData.headings, contents: [] },
  }),
});
