import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blog } from 'lib/source';
import { JSX } from 'react';
import { DocsBody } from 'fumadocs-ui/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { styles } from './styles';
import { css } from '@plumeria/core';
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
    <article className={css.props(styles.article)}>
      <div className={css.props(styles.backLinkWrapper)}>
        <Link href="/blog" className={css.props(styles.backLink)}>
          ← Back to blog
        </Link>
      </div>

      {page.data.title && <h1 className={css.props(styles.title)}>{page.data.title}</h1>}
      <p className={css.props(styles.date)}>{page.data.date}</p>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </article>
  );
}
