import { docs, meta, blogDocs, blogMeta } from '.source/server';
import { loader } from 'fumadocs-core/source';
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
});
