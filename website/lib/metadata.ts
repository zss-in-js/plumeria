import type { Metadata } from 'next/types';

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: process.env.PROD_URL ?? undefined,
      images: undefined,
      siteName: 'Plumeria',
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      creator: undefined,
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: undefined,
      ...override.twitter,
    },
  };
}

export const baseUrl =
  process.env.NODE_ENV === 'development' || !process.env.VERCEL_URL
    ? new URL('http://localhost:3000')
    : new URL(`https://${process.env.VERCEL_URL}`);
