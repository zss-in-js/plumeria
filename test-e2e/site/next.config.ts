import type { NextConfig } from 'next';
import { withPlumeria } from '@plumeria/next-plugin';

const nextConfig: NextConfig = withPlumeria({
  /* config options here */
});

export default nextConfig;
