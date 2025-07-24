import { RootProvider } from 'fumadocs-ui/provider';
import 'fumadocs-ui/style.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import type { ReactNode } from 'react';
import { ServerCSS } from '@plumeria/next';
import { css } from '@plumeria/core';

export const dynamicParams = false;
export const dynamic = 'force-static';

const styles = css.create({
  body: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.className} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <ServerCSS />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={css.props(styles.body)}>
        <RootProvider>{children}</RootProvider>
        <Analytics mode="production" />
      </body>
    </html>
  );
}
