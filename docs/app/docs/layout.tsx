import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import 'katex/dist/katex.css';
import type { CSSProperties, ReactNode } from 'react';
import { baseOptions } from 'app/layout.config';
import { source } from 'lib/source';
import { DocsSidebarBanner } from 'component/DocsSidebarBanner';
import { DocsSidebarTrigger } from 'component/DocsSidebarTrigger';
import { SiteHeader } from 'component/SiteHeader';

// Grid width follows shiki's --vp-layout-max-width; the header height is what every sticky
// offset below the bar (sidebar, toc) is measured from, so it has to match SiteHeader.
const containerProps = {
  style: {
    '--fd-layout-width': '1440px',
    '--fd-header-height': '56px',
  } as CSSProperties,
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      // Passing the banner as a component replaces the sidebar header, dropping the close
      // button row fumadocs puts above it.
      sidebar={{ collapsible: false, banner: DocsSidebarBanner }}
      containerProps={containerProps}
      {...baseOptions}
      // The drawer shows the page tree under an icon row of its own, so fumadocs gets no
      // links to render: the dropdowns and the search both live in the top bar.
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
      {children}
    </DocsLayout>
  );
}
