import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Plumeria - A zero-cost abstraction for CSS.',
  subtitle: 'Compiles at build time to generate only the styles you use.',
});

export default function Page() {
  return <HomeComponent />;
}
