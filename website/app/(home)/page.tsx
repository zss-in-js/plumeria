import { HomeComponent } from '@/component/HomeComponent';
import { Metadata } from 'next';
import { CodeBlock } from '@/component/CodeBlock';

export const metadata: Metadata = {
  title: 'Plumeria - Zero-runtime CSS in JS library',
};

export default function Page() {
  return (
    <div>
      <HomeComponent />
      <CodeBlock />
    </div>
  );
}
