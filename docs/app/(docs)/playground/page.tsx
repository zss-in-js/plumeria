import type { Metadata } from 'next';
import generateSEOData from 'lib/generateSEOData';
import { Playground } from './playground';

export const metadata: Metadata = generateSEOData({
  title: 'Playground',
  subtitle: 'Write Plumeria styles in the browser with full type information and every @plumeria/eslint-plugin rule.',
  path: '/playground',
});

export default function Page() {
  return <Playground />;
}
