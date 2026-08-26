import { source } from 'lib/source';

export const revalidate = false;
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const url = (p: string): string => new URL(p, process.env.PROD_URL).toString();

  const pages = await Promise.all(
    source.getPages().map(async (page) => {
      const processed = await page.data.getText('processed');
      return `# ${page.data.title}\n\nSource: ${url(page.url)}\n\n${processed}`;
    }),
  );

  return new Response(pages.join('\n\n---\n\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
