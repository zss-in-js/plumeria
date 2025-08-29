import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { css } from '@plumeria/core';
import Image from 'next/image';

const styles = css.create({
  logo: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    fontWeight: 700,
  },
  zss: {
    borderRadius: '8px',
    scale: 0.88,
  },
});

export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/zss-in-js/plumeria',
  nav: {
    title: (
      <span className={css.props(styles.logo)}>
        <Image src="/zss.png" alt="Plumeria logo" height={24} width={24} className={css.props(styles.zss)} />
        PLUMERIA
      </span>
    ),
    transparentMode: 'top',
  },

  links: [
    {
      text: <span>Documentation</span>,
      url: '/docs',
    },
    {
      text: <span>Blog</span>,
      url: '/blog',
    },
  ],
};
