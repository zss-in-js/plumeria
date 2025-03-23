import { RootProvider } from 'fumadocs-ui/provider';
import 'fumadocs-ui/style.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import type { ReactNode } from 'react';
import { ServerCSS } from '@plumeria/next';
import { VercelAnalytics } from './VercelAnalytics';
import { Metadata } from 'next';

export const metadata: Metadata = {
  icons:
    'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%%22 y=%2250%%22 style=%22dominant-baseline:central;text-anchor:middle;font-size:90px;%22>🪡</text></svg>',
};

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
        <VercelAnalytics />
      </body>
    </html>
  );
}
