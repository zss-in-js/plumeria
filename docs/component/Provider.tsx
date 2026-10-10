'use client';

import * as css from '@plumeria/core';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { RootProvider } from 'fumadocs-ui/provider/next';

const styles = css.create({
  hotKey: {
    display: 'inline-flex',
    gap: 3,
    alignItems: 'center',
    height: '100%',
    verticalAlign: 'top',
  },
  key: {
    fontSize: '0.8em',
    lineHeight: 1,
    transform: 'translateY(-0.5px)',
  },
});

const hotKey = [
  {
    key: (event: KeyboardEvent) => (event.metaKey || event.ctrlKey) && event.key === 'k',
    display: (
      <span classStyle={styles.hotKey}>
        <span>⌘</span>
        <span classStyle={styles.key}>K</span>
      </span>
    ),
  },
];

export const Provider = ({ children }: { children: ReactNode }) => {
  const preload = usePathname() !== '/';

  return <RootProvider search={{ hotKey, preload }}>{children}</RootProvider>;
};
