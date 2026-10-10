import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from 'app/layout.config';

const links = baseOptions.links?.map((link) =>
  link.type === 'icon'
    ? {
        text: (
          <>
            {link.label}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              style={{ width: 12, height: 12 }}
            >
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </>
        ),
        url: link.url,
        external: true,
      }
    : link,
);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions} links={links}>
      {children}
    </HomeLayout>
  );
}
