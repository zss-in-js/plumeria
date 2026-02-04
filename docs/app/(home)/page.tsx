import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Plumeria - Type-driven styling framework for maintainable UI.',
  subtitle:
    'A type-driven styling framework for maintainable UI. Plumeria compiles at build time, generating only the styles you use for optimal performance and size.',
});

export default function Page() {
  return <HomeComponent />;
}
