import { source } from 'lib/source';

export const revalidate = false;
export const dynamic = 'force-static';

export function GET(): Response {
  const url = (path: string): string => new URL(path, process.env.PROD_URL).toString();

  const lines = [
    '# Plumeria',
    '',
    '> A CSS-in-JS library that compiles away. `css.create` is resolved at build time into atomic class names and a stylesheet, leaving no import, no runtime and no styling map in the JavaScript output.',
    '',
    `The whole documentation as one file: ${url('/llms-full.txt')}`,
    '',
    '## Docs',
    '',
  ];

  for (const page of source.getPages()) {
    const description = page.data.description ? `: ${page.data.description}` : '';
    lines.push(`- [${page.data.title}](${url(page.url)})${description}`);
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
