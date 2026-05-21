'use cache';

import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Plumeria - Zero-cost abstraction layer',
  subtitle: 'Plumeria is a zero-cost abstraction layer for styling React components.',
});

export default async function Page() {
  return <HomeComponent />;
}
