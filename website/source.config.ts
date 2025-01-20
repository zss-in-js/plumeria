import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const { docs, meta } = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  lastModifiedTime: "git",
  mdxOptions: async () => {
    return {
      rehypeCodeOptions: {
        inline: "tailing-curly-colon",
        themes: {
          light: "catppuccin-latte",
          dark: "andromeeda",
        },
      },
    };
  },
});
