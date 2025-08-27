import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';

export const metadata: Metadata = generateSEOData({ title: '', subtitle: 'Zero-runtime CSS in JS library' });

export default function Page() {
  return <HomeComponent />;
}
