import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import { Metadata } from 'next';
import './styles/global.ts';
import { metadataImage } from '@/lib/metadata';

export const metadata: Metadata = metadataImage.withImage([], {
  title: 'Plumeria - Zero-runtime CSS in JS library',
});

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
