import { docs, meta, blogDocs, blogMeta } from '.source/server';
import { loader } from 'fumadocs-core/source';
import type { Node, Root } from 'fumadocs-core/page-tree';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';

export const source = loader({
  baseUrl: '/docs',
  source: toFumadocsSource(docs, meta),
});

// ai.md is written for AI assistants, so keep it out of the site search index.
export const searchSource = loader({
  baseUrl: '/docs',
  source: toFumadocsSource(
    docs.filter((doc) => doc.info.path !== 'ai.md'),
    meta,
  ),
});

export const blog = loader({
  baseUrl: '/blog',
  source: toFumadocsSource(blogDocs, blogMeta),
  pageTree: {
    transformers: [
      {
        root(tree: Root) {
          tree.children.sort(compareBlogNodes);
          return tree;
        },
      },
    ],
  },
});

const specialBlogSlugs = ['how-to-leave-plumeria', 'eating-up-the-libraries'];

function getBlogSlug(node: Node): string {
  if (node.type !== 'page') return '';
  return node.url.split('/').filter(Boolean).at(-1) ?? '';
}

function getBlogVersion(slug: string): number[] | undefined {
  const match = /^plumeria-(\d+)(?:[-.](\d+))?(?:[-.](\d+))?$/.exec(slug);
  if (!match) return undefined;

  return [match[1], match[2], match[3]].map((part) => Number(part ?? 0));
}

function compareBlogNodes(a: Node, b: Node): number {
  const aSlug = getBlogSlug(a);
  const bSlug = getBlogSlug(b);
  const aSpecialIndex = specialBlogSlugs.indexOf(aSlug);
  const bSpecialIndex = specialBlogSlugs.indexOf(bSlug);

  if (aSpecialIndex !== -1 || bSpecialIndex !== -1) {
    if (aSpecialIndex === -1) return 1;
    if (bSpecialIndex === -1) return -1;
    return aSpecialIndex - bSpecialIndex;
  }

  const aVersion = getBlogVersion(aSlug);
  const bVersion = getBlogVersion(bSlug);

  if (aVersion && bVersion) {
    for (let index = 0; index < aVersion.length; index += 1) {
      if (aVersion[index] !== bVersion[index]) return bVersion[index] - aVersion[index];
    }
  }

  return aSlug.localeCompare(bSlug);
}
