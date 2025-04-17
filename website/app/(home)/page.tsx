import { HomeComponent } from '@/component/HomeComponent';
import { Metadata } from 'next';
import { CodeBlock } from '@/component/CodeBlock';
import { css } from '@plumeria/core';

export const metadata: Metadata = {
  title: 'Plumeria - Zero-runtime CSS in JS library',
};

const styles = css.create({
  container: {
    position: 'relative',
    zIndex: 0,
  },
});
export default function Page() {
  return (
    <div className={styles.container}>
      <HomeComponent />
      <CodeBlock />
    </div>
  );
}
