import { defineDocs, defineConfig, frontmatterSchema } from 'fumadocs-mdx/config';
import lastModified from 'fumadocs-mdx/plugins/last-modified';
import { z } from 'zod';

export const { docs, meta } = defineDocs({
  dir: 'content/docs',
});

export const { docs: blogDocs, meta: blogMeta } = defineDocs({
  dir: 'content/blog',
  docs: {
    schema: frontmatterSchema.extend({
      date: z.string(),
    }),
  },
});

export default defineConfig({
  plugins: [lastModified()],
  mdxOptions: async () => {
    return {
      rehypeCodeOptions: {
        inline: 'tailing-curly-colon',
        themes: {
          light: 'snazzy-light',
          dark: 'laserwave',
        },
      },
    };
  },
});
