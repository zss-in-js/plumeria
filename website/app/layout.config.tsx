import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { css } from '@plumeria/core';

const styles = css.create({
  logo: {
    fontWeight: 400,
  },
});

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
    title: <span className={styles.logo}>💐 Plumeria</span>,
  },
  links: [
    {
      text: <span>Documentation</span>,
      url: '/docs',
    },
  ],
};
