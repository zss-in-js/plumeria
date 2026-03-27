import Link from 'next/link';
import type { Metadata } from 'next/types';
import { blog } from 'lib/source';
import { styles } from './styles';
import '@plumeria/core';
import { JSX } from 'react';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Blog',
  subtitle: 'Latest updates and news from our team.',
});

function Page(): JSX.Element {
  const posts = blog.getPages();

  return (
    <main styleName={styles.container}>
      <div styleName={styles.header}>
        <h1 styleName={styles.title}>Blog</h1>
        <span>The latest updates and releases from the Plumeria at ZSS-in-JS.</span>
      </div>

      {posts
        .reverse()
        .map((post) => (
          <Link href={`/blog/${post.slugs.join('/')}`} styleName={styles.card} key={post.data.title}>
            <h2 styleName={styles.cardTitle}>{post.data.title}</h2>
            <p styleName={styles.cardDesc}>{post.data.description}</p>
            <p styleName={styles.cardDesc}>Read more →</p>
            <p styleName={styles.cardDate}>{post.data.date}</p>
          </Link>
        ))
        .sort()}
    </main>
  );
}

export default Page;
