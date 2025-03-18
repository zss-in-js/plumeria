import { RootProvider } from 'fumadocs-ui/provider';
import 'fumadocs-ui/style.css';
import './(home)/styles/global';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import type { ReactNode } from 'react';
import { ServerCSS } from '@plumeria/next';
import { Analytics } from '@vercel/analytics/next';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.className} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <ServerCSS />
      </head>
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <RootProvider>{children}</RootProvider>
        <Analytics mode="production" />
      </body>
    </html>
  );
}
