'use cache';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import * as React from 'react';
import type { ReactNode } from 'react';
import { baseOptions } from 'app/layout.config';
import { source } from 'lib/source';

export default async function Layout({ children }: { children: ReactNode }) {
  const targets = ['Documentation', 'API', 'Integrations', 'Blog'];
  const docsOptions = {
    ...baseOptions,
    links: baseOptions.links?.map((link) => {
      if (
        link.type === 'custom' &&
        React.isValidElement(link.children) &&
        targets.includes((link.children.props as any)?.title)
      ) {
        return {
          ...link,
          on: 'nav' as const,
        };
      }
      return link;
    }),
  };

  return (
    <DocsLayout sidebar={{ collapsible: false }} tree={source.pageTree} {...docsOptions}>
      {children}
    </DocsLayout>
  );
}
