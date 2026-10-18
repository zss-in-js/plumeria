import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const blogDir = join(process.cwd(), 'content/blog');

const versionOf = (slug: string) => /^plumeria-([\d-]+)/.exec(slug)?.[1].split('-').map(Number) ?? [];

const compareVersion = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (b[i] ?? 0) - (a[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const latest = readdirSync(blogDir)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => file.slice(0, -'.mdx'.length))
  .filter((slug) => versionOf(slug).length > 0)
  .sort((a, b) => compareVersion(versionOf(a), versionOf(b)))[0];

export const latestBlogUrl = latest ? `/blog/${latest}` : '/blog';
