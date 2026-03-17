import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as style from '@plumeria/core';
import Image from 'next/image';

const styles = style.create({
  flower: {
    position: 'relative',
    bottom: 2,
    left: 8,
  },
  logo: {
    position: 'relative',
    right: 8,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 600,
  },
});

export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/zss-in-js/plumeria',
  nav: {
    title: (
      <span className={style.use(styles.logo)}>
        <Image
          className={style.use(styles.flower)}
          src="/LP_LG.png"
          alt="Plumeria logo"
          loading="lazy"
          height={40}
          width={40}
        />
        Plumeria
      </span>
    ),
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
