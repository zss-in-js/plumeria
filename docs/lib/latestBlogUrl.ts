import { readdirSync, readFileSync } from 'node:fs';
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
  .map((file) => {
    const date = /^date:\s*['"]?([^'"\n]+)/m.exec(readFileSync(join(blogDir, file), 'utf8'))?.[1];
    return { slug: file.slice(0, -'.mdx'.length), time: date ? new Date(date).getTime() : 0 };
  })
  .sort((a, b) => b.time - a.time || compareVersion(versionOf(a.slug), versionOf(b.slug)))[0];

export const latestBlogUrl = latest ? `/blog/${latest.slug}` : '/blog';
