import { searchSource } from 'lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { basename, extname } from 'node:path';

export const { GET } = createFromSource(searchSource, {
  buildIndex: (page) => ({
    id: page.url,
    title: page.data.title ?? basename(page.path, extname(page.path)),
    breadcrumbs: [],
    url: page.url,
    structuredData: { headings: [], contents: [] },
  }),
});
