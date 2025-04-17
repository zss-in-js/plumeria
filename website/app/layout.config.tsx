import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { css } from '@plumeria/core';
import { Plumeria } from 'component/Plumeria';
/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

const styles = css.create({
  top_link: {
    position: 'relative',
    left: 100,
  },
  top_logo: {
    position: 'absolute',
    left: -80,
    scale: 0.28,
    [css.media.max('width: 804px')]: {
      top: -10,
      left: -50,
      scale: 0.34,
    },
  },
});

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
