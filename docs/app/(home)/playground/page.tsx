import type { Metadata } from 'next';
import { Playground } from './playground';

export const metadata: Metadata = {
  title: 'Playground',
  description:
    'Write Plumeria styles in the browser with full type information and every @plumeria/eslint-plugin rule.',
};

export default function Page() {
  return <Playground />;
}
