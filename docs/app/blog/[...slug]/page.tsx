import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blog } from 'lib/source';
import { JSX } from 'react';
import { DocsBody } from 'fumadocs-ui/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { styles } from './styles';
import { css } from '@plumeria/core';

export function generateStaticParams(): Array<{ slug: Array<string> }> {
  return blog.getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export default async function Page(props: { params: Promise<{ slug?: Array<string> }> }): Promise<JSX.Element> {
  const params = await props.params;
  const page = blog.getPage(params.slug);
  if (!page) notFound();
  const MDX = page.data.body;

  return (
    <article className={styles.$article}>
      <div className={styles.$backLinkWrapper}>
        <Link href="/blog" className={css.props(styles.backLink)}>
          ← Back to blog
        </Link>
      </div>

      {page.data.title && <h1 className={styles.$title}>{page.data.title}</h1>}
      <p className={styles.$date}>{page.data.date}</p>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </article>
  );
}
