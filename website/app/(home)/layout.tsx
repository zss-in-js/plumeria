import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import './global.ts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plumeria - Zero-runtime CSS in JS library',
};

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
