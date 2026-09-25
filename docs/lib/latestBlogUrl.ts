import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const blogDir = join(process.cwd(), 'content/blog');

const latest = readdirSync(blogDir)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => {
    const date = /^date:\s*['"]?([^'"\n]+)/m.exec(readFileSync(join(blogDir, file), 'utf8'))?.[1];
    return { slug: file.slice(0, -'.mdx'.length), time: date ? new Date(date).getTime() : 0 };
  })
  .sort((a, b) => b.time - a.time)[0];

export const latestBlogUrl = latest ? `/blog/${latest.slug}` : '/blog';
