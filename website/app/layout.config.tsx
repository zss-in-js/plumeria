import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { css } from '@plumeria/core';
import Image from 'next/image';

const styles = css.create({
  logo: {
    display: 'flex',
    flexDirection: 'row',
    gap: 14,
    fontWeight: 700,
  },
  zss: {
    borderRadius: '8px',
  },
  slash: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgb(170 170 170 / 0.3)',
    rotate: '0deg',
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
    title: (
      <span className={styles.logo}>
        <Image src="/zss.png" alt="Plumeria logo" height={24} width={24} className={styles.zss} />
        <span className={styles.slash}>/</span> ✾ Plumeria
      </span>
    ),
    transparentMode: 'always',
  },

  links: [
    {
      text: <span>Documentation</span>,
      url: '/docs',
    },
  ],
};
