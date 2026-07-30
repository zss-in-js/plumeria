import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { ReactNode } from 'react';
import { baseOptions } from 'app/layout.config';
import { source } from 'lib/source';
import { DocsSidebarBanner } from 'component/DocsSidebarBanner';
import { DocsSidebarTrigger } from 'component/DocsSidebarTrigger';
import { SiteHeader } from 'component/SiteHeader';
import { plainContainerProps, plainMainStyle } from 'lib/plainLayout';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      sidebar={{ collapsible: false, banner: DocsSidebarBanner }}
      containerProps={plainContainerProps}
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
      <div style={plainMainStyle}>{children}</div>
    </DocsLayout>
  );
}
