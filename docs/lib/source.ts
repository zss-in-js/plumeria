import { docs, meta, blogDocs, blogMeta } from '@/.source';
import { createMDXSource } from 'fumadocs-mdx';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docs, meta),
});

export const blog = loader({
  baseUrl: '/blog',
  source: createMDXSource(blogDocs, blogMeta),
});
