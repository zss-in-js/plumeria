import { notFound } from 'next/navigation';
import { source } from 'lib/source';

export const revalidate = false;
export const dynamic = 'force-static';

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug?: string[] }> },
): Promise<Response> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const url = new URL(page.url, process.env.PROD_URL).toString();
  const processed = await page.data.getText('processed');

  return new Response(`# ${page.data.title}\n\nSource: ${url}\n\n${processed}`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
