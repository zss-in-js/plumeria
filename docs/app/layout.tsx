'use cache';

import { RootProvider } from 'fumadocs-ui/provider/next';
import 'fumadocs-ui/style.css';
import './global.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import type { ReactNode } from 'react';

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.className} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favi.ico" sizes="any" />
      </head>
      <body>
        <RootProvider>{children}</RootProvider>
        <Analytics mode="production" />
      </body>
    </html>
  );
}
