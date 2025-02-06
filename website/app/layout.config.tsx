import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Icon } from './Icon';
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
    background: 'linear-gradient(90deg, #58c6ff 0%, #076ad9 40%, #ff3bef 80%)',
    WebkitBackgroundClip: 'text',
  },
});

export const baseOptions: BaseLayoutProps = {
  nav: {
    // can be JSX too!
    title: (
      <>
        <Icon />
        <span className={cx(styles.position, styles.purple)}>Plumeria</span>
      </>
    ),
    transparentMode: 'top',
  },
  links: [
    {
      text: <span className={styles.position}>Documentation</span>,
      url: '/docs',
    },
  ],
};
