import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Plumeria } from 'component/Plumeria';
import { styles } from './styles';
/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/zss-in-js/plumeria',
  nav: {
    title: (
      <span className={styles.top_logo}>
        <Plumeria />
      </span>
    ),
  },
  links: [
    {
      text: <span className={styles.top_link}>Documentation</span>,
      url: '/docs',
    },
  ],
};
