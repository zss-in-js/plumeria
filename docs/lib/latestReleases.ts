import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = join(process.cwd(), 'content/blog');

// Reads only the frontmatter so that importing this never pulls the MDX bodies
// -- and every client component they reference -- into the layout's bundle.
const readDate = (file: string) => {
  const frontmatter = readFileSync(join(BLOG_DIR, file), 'utf8').split('---')[1] ?? '';
  const match = frontmatter.match(/^date:\s*['"]?([^'"\n]+)['"]?\s*$/m);
  return match ? match[1].trim() : null;
};

export const latestReleases = (limit: number) =>
  readdirSync(BLOG_DIR)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const match = slug.match(/^plumeria-([\d-]+)/);
      return {
        slug,
        version: match ? match[1].replace(/-/g, '.') : null,
        date: readDate(file),
      };
    })
    .filter((x) => x.version !== null && x.date !== null)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
    .slice(0, limit)
    .map(({ slug, version }) => ({
      text: `Plumeria v${version}`,
      url: `/blog/${slug}`,
    }));
