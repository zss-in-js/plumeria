import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Plumeria - A type-only CSS extract.',
  subtitle:
    'A type-only CSS extract. Plumeria compiles at build time, generating only the styles you use for optimal performance and size.',
});

export default function Page() {
  return <HomeComponent />;
}
