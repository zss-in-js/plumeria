import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';
import { withPlumeria } from '@plumeria/next-plugin/turbopack';

const withMDX = createMDX();

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },

  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },

  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },

  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },

  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },

  {
    key: 'Cache-Control',
    value: 'public, max-age=2592000, s-maxage=31536000, stale-while-revalidate=86400',
  },
];

const config: NextConfig = withPlumeria({
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
});

export default withMDX(config);
