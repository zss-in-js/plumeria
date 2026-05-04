import { ConditionalTest } from 'component/ConditionalTest';
import { MultiArgTest } from 'component/MultiArgTest';
import { VariableTest } from 'component/VariableTest';
import { VariantTest } from 'component/VariantTest';
import Link from 'next/link';
import * as css from '@plumeria/core';

const styles = css.create({
  page: {
    color: 'orange',
  },
});

export default function Home() {
  return (
    <main>
      <h1>@plumeria/core E2E Test</h1>
      <h2 styleName={styles.page}>server component</h2>
      <Link href="/server">Server Page</Link>
      <ConditionalTest />
      <MultiArgTest />
      <VariableTest />
      <VariantTest />
    </main>
  );
}
