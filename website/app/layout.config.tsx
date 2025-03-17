import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { css, cx } from '@plumeria/core';
/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

const styles = css.create({
  position: {
    position: 'relative',
    left: 6,
  },
  purple: {
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(67.5deg, #58c6ff 0%, #076ad9 40%, #ff3bef 80%)',
    WebkitBackgroundClip: 'text',
  },
});

export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/zss-in-js/plumeria',
  nav: {
    title: (
      <>
        <span className={cx(styles.position, styles.purple)}>@plumeria</span>
      </>
    ),

    transparentMode: 'always',
  },
  links: [
    {
      text: <span className={styles.position}>Documentation</span>,
      url: '/docs',
    },
  ],
};
