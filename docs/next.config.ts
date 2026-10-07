import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';
import { withPlumeria } from '@plumeria/next-plugin';

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
];

const isolationHeaders = [
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },

  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
  },
];

const config: NextConfig = withPlumeria(
  {
    reactCompiler: true,
    reactStrictMode: true,

    async rewrites() {
      return [{ source: '/docs/:path*.md', destination: '/llms.mdx/docs/:path*' }];
    },

    async headers() {
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
        {
          source: '/playground',
          headers: isolationHeaders,
        },
        {
          source: '/playground/:path*',
          headers: isolationHeaders,
        },
      ];
    },
  },
  { withoutLogicalProperties: true },
);

export default withMDX(config);
