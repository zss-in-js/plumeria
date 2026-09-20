import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import 'katex/dist/katex.css';
import type { CSSProperties, ReactNode } from 'react';
import { baseOptions } from 'app/layout.config';
import { blog } from 'lib/source';
import { DocsSidebarBanner } from 'component/DocsSidebarBanner';
import { DocsSidebarTrigger } from 'component/DocsSidebarTrigger';
import { SiteHeader } from 'component/SiteHeader';

const containerProps = {
  style: {
    '--fd-layout-width': '100%',
    '--fd-header-height': '56px',
  } as CSSProperties,
};

const mainStyle: CSSProperties = {
  gridArea: 'main',
  minWidth: 0,
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={blog.pageTree}
      sidebar={{ collapsible: false, banner: DocsSidebarBanner }}
      containerProps={containerProps}
      {...baseOptions}
      links={[]}
      searchToggle={{ enabled: false }}
      nav={{
        ...baseOptions.nav,
        mode: 'top',
        component: (
          <SiteHeader
            title={baseOptions.nav?.title}
            links={baseOptions.links ?? []}
            sidebarTrigger={DocsSidebarTrigger}
          />
        ),
      }}
    >
      <div style={mainStyle}>{children}</div>
    </DocsLayout>
  );
}
