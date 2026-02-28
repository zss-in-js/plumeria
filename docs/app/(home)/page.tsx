import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Plumeria - Atomic CSS types designed to disappear.',
  subtitle:
    'An atomic CSS types designed to disappear. Plumeria compiles at build time, generating only the styles you use for optimal performance and size.',
});

export default function Page() {
  return <HomeComponent />;
}
