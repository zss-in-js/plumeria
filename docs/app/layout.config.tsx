import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as css from '@plumeria/core';
import Image from 'next/image';
import { breakpoints } from 'lib/mediaQuery';

const styles = css.create({
  text: {
    position: 'relative',
    right: 4,
  },
  logo: {
    position: 'relative',
    right: 12,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    fontWeight: 600,
    color: 'var(--plume-accent)',
  },
  plumeria: {
    touchAction: 'none',
    [breakpoints.md]: {
      right: 12,
    },
  },
});

export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/zss-in-js/plumeria',
  nav: {
    title: (
      <span className={css.props(styles.logo)}>
        <Image
          src="/LP_LG.png"
          alt="Plumeria logo"
          loading="lazy"
          height={48}
          width={48}
          className={css.props(styles.plumeria)}
        />
        <span className={css.props(styles.text)}>Plumeria</span>
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
    {
      text: <span>Playground</span>,
      url: '/playground',
    },
  ],
};
