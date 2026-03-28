import Link from 'next/link';
import type { Metadata } from 'next/types';
import { blog } from 'lib/source';
import { styles } from './styles';
import * as css from '@plumeria/core';
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
        <span>The latest updates and releases from the Plumeria at ZSS-in-JS.</span>
      </div>

      {posts
        .slice()
        .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
        .map((post) => (
          <Link href={`/blog/${post.slugs.join('/')}`} className={css.props(styles.card)} key={post.data.title}>
            <h2 className={css.props(styles.cardTitle)}>{post.data.title}</h2>
            <p className={css.props(styles.cardDesc)}>{post.data.description}</p>
            <p className={css.props(styles.cardDesc)}>Read more →</p>
            <p className={css.props(styles.cardDate)}>{post.data.date}</p>
          </Link>
        ))}
    </main>
  );
}

export default Page;
