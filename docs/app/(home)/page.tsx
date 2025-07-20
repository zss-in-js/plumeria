import { HomeComponent } from 'component/HomeComponent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plumeria - Zero-runtime CSS in JS library',
};

export default function Page() {
  return <HomeComponent />;
}
