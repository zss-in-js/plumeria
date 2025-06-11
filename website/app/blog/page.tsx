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

      {posts.map((post) => (
        <Link href={`/blog/${post.slugs.join('/')}`} className={styles.card} key={post.data.title}>
          <h2 className={styles.cardTitle}>{post.data.title}</h2>
          <p className={styles.cardDesc}>{post.data.description}</p>
          <p className={styles.cardDesc}>Read more →</p>
          {post.data.lastModified && <p className={styles.cardDate}>{post.data.lastModified as unknown as string}</p>}
        </Link>
      ))}
    </main>
  );
}

export default Page;
