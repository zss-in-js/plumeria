import { HomeComponent } from '@/component/HomeComponent';
import { Metadata } from 'next';
import { CodeBlock } from '@/component/CodeBlock';
import { css } from '@plumeria/core';

export const metadata: Metadata = {
  title: 'Plumeria - Zero-runtime CSS in JS library',
};

const styles = css.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 0,
    display: 'flex',
    flexDirection: 'row',
    gap: 120,
    transform: 'translate(-50%, -50%)',
    [css.media.max('width: 804px')]: {
      position: 'relative',
      top: 'auto',
      left: 'auto',
      flexDirection: 'column',
      rowGap: 0,
      alignItems: 'center',
      justifyContent: 'center',
      height: 'auto',
      transform: 'translate(0%, 0%)',
    },
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
