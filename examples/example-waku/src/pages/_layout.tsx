import '../styles.css';

import type { ReactNode } from 'react';
import * as css from '@plumeria/core';
import { Footer } from '../components/footer';
import { Header } from '../components/header';

const styles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100svh',
  },
  main: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: '1.5rem',
  },
  page: {
    minWidth: '16rem',
  },
});

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const data = await getData();

  return (
    <div classStyle={styles.root}>
      <meta name="description" content={data.description} />
      <link rel="icon" type="image/png" href={data.icon} />
      <Header />
      <main classStyle={styles.main}>
        <div classStyle={styles.page}>{children}</div>
      </main>
      <Footer />
    </div>
  );
}

const getData = async () => {
  const data = {
    description: 'An internet website!',
    icon: '/images/favicon.png',
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
