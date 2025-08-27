import Link from 'next/link';
import type { Metadata } from 'next/types';
import { blog } from 'lib/source';
import { styles } from './styles';
import { css } from '@plumeria/core';
import { JSX } from 'react';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Blog',
  subtitle: 'Latest updates and news from our team.',
});

function Page(): JSX.Element {
  const posts = blog.getPages();

  return (
    <main className={css.props(styles.container)}>
      <div className={css.props(styles.header)}>
        <h1 className={css.props(styles.title)}>Blog</h1>
        <span>The latest updates and releases from the Plumeria team at ZSS-in-JS.</span>
      </div>

      {posts
        .reverse()
        .map((post) => (
          <Link href={`/blog/${post.slugs.join('/')}`} className={css.props(styles.card)} key={post.data.title}>
            <h2 className={css.props(styles.cardTitle)}>{post.data.title}</h2>
            <p className={css.props(styles.cardDesc)}>{post.data.description}</p>
            <p className={css.props(styles.cardDesc)}>Read more →</p>
            <p className={css.props(styles.cardDate)}>{post.data.date}</p>
          </Link>
        ))
        .sort()}
    </main>
  );
}

export default Page;
