import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { blog, source } from 'lib/source';
import { ogpImagePath } from 'lib/generateSEOData';

export const dynamic = 'force-static';

const card = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/OGP_CARD.png')).toString('base64')}`;

const cards = new Map<string, { title: string; date?: string }>([
  [ogpImagePath('/'), { title: 'Plumeria - Zero-cost abstraction layer' }],
  [ogpImagePath('/privacy'), { title: 'Privacy Policy' }],
  [ogpImagePath('/playground'), { title: 'Playground' }],
  ...source.getPages().map((page) => [ogpImagePath(page.url), { title: page.data.title }] as const),
  ...blog.getPages().map((page) => [ogpImagePath(page.url), { title: page.data.title, date: page.data.date }] as const),
]);

export async function GET(_req: Request, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const entry = cards.get(`/ogp/${params.slug.join('/')}`);
  if (!entry) notFound();
  const title = entry.title.slice(0, 100);
  const date = entry.date?.slice(0, 50).replaceAll('-', '/');

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        fontFamily: 'Geist Mono',
        fontSize: 60,
        fontWeight: 700,
        color: '#fff',
        backgroundImage: `url(${card})`,
        backgroundSize: '1200px 630px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '200px',
          fontSize: '30px',
          textAlign: 'center',
        }}
      >
        {title}
        <div
          style={{
            position: 'absolute',
            right: '40px',
            bottom: '20px',
            display: 'flex',
            fontSize: '24px',
            color: 'rgb(188 188 188)',
          }}
        >
          {date}
        </div>
      </div>
    </div>,
  );
}

export function generateStaticParams() {
  return [...cards.keys()].map((path) => ({ slug: path.split('/').slice(2) }));
}
