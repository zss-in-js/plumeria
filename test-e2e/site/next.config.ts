import type { NextConfig } from 'next';
import { withPlumeria } from '@plumeria/next-plugin';

const nextConfig: NextConfig = withPlumeria({
  turbopack: {},
});

export default nextConfig;
