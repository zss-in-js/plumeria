import { ConditionalTest } from 'component/ConditionalTest';
import { VariableTest } from 'component/VariableTest';
import { VariantTest } from 'component/VariantTest';
import Link from 'next/link';
import css from '@plumeria/core';

const styles = css.create({
  page: {
    color: 'orange',
  },
});

export default function Home() {
  return (
    <main>
      <h1>@plumeria/core E2E Test</h1>
      <h2 className={css.props(styles.page)}>server component</h2>
      <Link href="/server">Server Page</Link>
      <ConditionalTest />
      <VariableTest />
      <VariantTest />
    </main>
  );
}
