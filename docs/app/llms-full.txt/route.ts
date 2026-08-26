import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { source } from 'lib/source';

export const revalidate = false;
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const url = (p: string): string => new URL(p, process.env.PROD_URL).toString();

  const pages = await Promise.all(
    source.getPages().map(async (page) => {
      const file = path.join(process.cwd(), 'content/docs', page.path);
      const raw = await readFile(file, 'utf8');
      const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim();

      return [`# ${page.data.title}`, '', `Source: ${url(page.url)}`, '', body].join('\n');
    }),
  );

  return new Response(pages.join('\n\n---\n\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
