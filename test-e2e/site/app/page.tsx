import { E2ETest } from 'component/style-create';
import { Conflict } from 'component/style-not-conflict';
import Link from 'next/link';
import { css } from '@plumeria/core';

const styles = css.create({
  page: {
    color: 'orange',
  },
});

css.global({
  h1: {
    color: 'cyan',
  },
});

export default function Home() {
  return (
    <main>
      <h1>Typed CSS X E2E Test</h1>
      <h2 className={styles.page}>page.tsx in elter</h2>
      <Link href="/server">Server Page</Link>
      <E2ETest />
      <Conflict />
    </main>
  );
}
