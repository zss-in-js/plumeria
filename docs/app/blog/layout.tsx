import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import 'katex/dist/katex.css';
import type { CSSProperties, ReactNode } from 'react';
import { baseOptions } from 'app/layout.config';
import { blog } from 'lib/source';

const mainStyle: CSSProperties = {
  gridArea: 'main',
  minWidth: 0,
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={blog.pageTree} {...baseOptions}>
      <div style={mainStyle}>{children}</div>
    </DocsLayout>
  );
}
