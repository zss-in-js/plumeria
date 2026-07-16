import { RootProvider } from 'fumadocs-ui/provider/next';
import 'fumadocs-ui/style.css';
import './global.css';
import { Analytics } from '@vercel/analytics/next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Inspector } from '@plumeria/inspector';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--inter',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
});

export const dynamicParams = false;
export const dynamic = 'force-static';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favi.ico" sizes="any" />
      </head>
      <body>
        {process.env.NODE_ENV === 'development' && <Inspector />}
        <RootProvider>{children}</RootProvider>
        <Analytics mode="production" />
      </body>
    </html>
  );
}
