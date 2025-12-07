import { docs, meta, blogDocs, blogMeta } from '.source/server';
import { loader } from 'fumadocs-core/source';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';

export const source = loader({
  baseUrl: '/docs',
  source: toFumadocsSource(docs, meta),
});

export const blog = loader({
  baseUrl: '/blog',
  source: toFumadocsSource(blogDocs, blogMeta),
});
