import 'fumadocs-ui/style.css';
import './global.css';
import { Analytics } from '@vercel/analytics/next';
import { Inter } from 'next/font/google';
import { Provider } from 'component/Provider';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--inter',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
});

export const dynamicParams = false;
export const dynamic = 'force-static';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" sizes="any" />
      </head>
      <body>
        <Provider>{children}</Provider>
        <Analytics mode="production" />
      </body>
    </html>
  );
}
