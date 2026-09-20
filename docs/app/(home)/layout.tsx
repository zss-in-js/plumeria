import type { ReactNode } from 'react';
import { SiteHeader } from 'component/SiteHeader';
import { baseOptions } from 'app/layout.config';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader title={baseOptions.nav?.title} links={baseOptions.links ?? []} showSearch={false} />
      {children}
    </>
  );
}
