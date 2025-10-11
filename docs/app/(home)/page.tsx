import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({
  title: 'Plumeria - Atomic CSS in JS library',
  subtitle:
    'The atomic on-demand CSS-in-JS. Plumeria compiles at build time, generating only the styles you use for optimal performance and size.',
});

export default function Page() {
  return <HomeComponent />;
}
