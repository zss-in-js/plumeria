import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as css from '@plumeria/core';
import Image from 'next/image';
import { gradientShift } from 'component/animation';

const styles = css.create({
  logo: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    fontWeight: 600,
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.03em',
    background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    backgroundClip: 'text',
    backgroundSize: '400% 400%',
    border: '1px solid transparent',
    filter: 'drop-shadow(0 0 2em rgba(168, 85, 247, 0.2))',
    animationName: gradientShift,
    animationDuration: '15s',
    animationTimingFunction: 'ease',
    animationIterationCount: 'infinite',
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
        <Image
          src="/zss.png"
          alt="Plumeria logo"
          loading="lazy"
          height={24}
          width={24}
          className={css.props(styles.zss)}
        />
        Plumeria
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
