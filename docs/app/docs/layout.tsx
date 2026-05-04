'use cache';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from 'app/layout.config';
import { source } from 'lib/source';

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout sidebar={{ collapsible: false }} tree={source.pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}
