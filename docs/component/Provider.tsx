'use client';

import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';

const hotKey = [
  { key: (event: KeyboardEvent) => event.metaKey || event.ctrlKey, display: '⌘' },
  { key: 'k', display: 'K' },
];

export const Provider = ({ children }: { children: ReactNode }) => (
  <RootProvider search={{ hotKey }}>{children}</RootProvider>
);
