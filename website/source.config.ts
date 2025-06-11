import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const { docs, meta } = defineDocs({
  dir: 'content/docs',
});

export const { docs: blogDocs, meta: blogMeta } = defineDocs({
  dir: 'content/blog',
});

export default defineConfig({
  lastModifiedTime: 'git',
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
