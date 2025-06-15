import Link from 'next/link';
import type { Metadata } from 'next/types';
import { blog } from 'lib/source';
import { styles } from './styles';
import { JSX } from 'react';

export function generateMetadata(): Metadata {
  return {
    title: 'Blog',
    description: 'Latest updates and news from our team.',
  };
}

function Page(): JSX.Element {
  const posts = blog.getPages();

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Blog</h1>
        <span>The latest updates and releases from the Plumeria team at ZSS-in-JS.</span>
      </div>

      {posts
        .reverse()
        .map((post) => (
          <Link href={`/blog/${post.slugs.join('/')}`} className={styles.card} key={post.data.title}>
            <h2 className={styles.cardTitle}>{post.data.title}</h2>
            <p className={styles.cardDesc}>{post.data.description}</p>
            <p className={styles.cardDesc}>Read more →</p>
            <p className={styles.cardDate}>{post.data.date}</p>
          </Link>
        ))
        .sort()}
    </main>
  );
}

export default Page;
