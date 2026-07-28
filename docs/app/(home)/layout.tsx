import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';
import { baseOptions } from 'app/layout.config';
import { SiteHeader } from 'component/SiteHeader';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      {...baseOptions}
      links={[]}
      nav={{
        ...baseOptions.nav,
        // No page tree here, so SiteHeader opens its own drawer below `lgup`.
        component: <SiteHeader title={baseOptions.nav?.title} links={baseOptions.links ?? []} />,
      }}
    >
      {children}
    </HomeLayout>
  );
}
