import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blog } from 'lib/source';
import { JSX } from 'react';
import { DocsBody } from 'fumadocs-ui/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import '@plumeria/core';
import { styles } from './styles';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export function generateStaticParams(): Array<{ slug: Array<string> }> {
  return blog.getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export async function generateMetadata(props: { params: Promise<{ slug?: Array<string> }> }): Promise<Metadata> {
  const params = await props.params;
  const page = blog.getPage(params.slug);
  return generateSEOData({
    title: page?.data.title as string,
    subtitle: page?.data.description,
    date: page?.data.date,
  });
}

export default async function Page(props: { params: Promise<{ slug?: Array<string> }> }): Promise<JSX.Element> {
  const params = await props.params;
  const page = blog.getPage(params.slug);
  if (!page) notFound();
  const MDX = page.data.body;

  return (
    <article styleName={styles.article}>
      <div styleName={styles.backLinkWrapper}>
        <Link href="/blog" styleName={styles.backLink}>
          ← Back to blog
        </Link>
      </div>

      {page.data.title && <h1 styleName={styles.title}>{page.data.title}</h1>}
      <p styleName={styles.date}>{page.data.date}</p>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </article>
  );
}
