import Link from 'next/link';
import type { Metadata } from 'next/types';
import { blog } from 'lib/source';
import { styles } from './styles';
import '@plumeria/core';
import { JSX } from 'react';
import generateSEOData from 'lib/generateSEOData';
import { formatDate } from 'lib/formatDate';

export const metadata: Metadata = generateSEOData({
  title: 'Blog',
  subtitle: 'Latest updates and news from our team.',
});

export default function Page(): JSX.Element {
  const posts = blog.getPages();

  return (
    <main classStyle={styles.container}>
      <div classStyle={styles.header}>
        <h1 classStyle={styles.title}>Blog</h1>
        <span>The latest updates and releases from the Plumeria at ZSS-in-JS.</span>
      </div>

      {posts
        .slice()
        .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
        .map((post) => (
          <Link href={`/blog/${post.slugs.join('/')}`} classStyle={styles.card} key={post.data.title}>
            <h2 classStyle={styles.cardTitle}>{post.data.title}</h2>
            <p classStyle={styles.cardDesc}>{post.data.description}</p>
            <p classStyle={styles.cardDesc}>Read more →</p>
            <p classStyle={styles.cardDate}>{formatDate(post.data.date)}</p>
          </Link>
        ))}
    </main>
  );
}
