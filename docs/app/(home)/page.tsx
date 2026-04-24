import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Plumeria - A zero-cost abstraction for CSS.',
  subtitle: 'Plumeria is a zero-cost abstraction for CSS designed for building styled React components for the web.',
});

export default function Page() {
  return <HomeComponent />;
}
