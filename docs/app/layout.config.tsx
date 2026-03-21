import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as style from '@plumeria/core';
import Image from 'next/image';
import { svg } from 'component/svg';

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
    fontSize: 15,
    fontWeight: 600,
  },
  github: {
    '@media (min-width: 768px)': {
      position: 'relative',
      right: 10,
    },
  },
  discord: {
    '@media (min-width: 768px)': {
      position: 'relative',
      right: 20,
    },
  },
});

export const baseOptions: BaseLayoutProps = {
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
    {
      text: <span>{svg.Bluesky({ width: 21, height: 21 })}</span>,
      url: 'https://bsky.app/profile/zss-in-js.bsky.social',
    },
    {
      text: <span className={style.use(styles.github)}>{svg.Github({ width: 21, height: 21 })}</span>,
      url: 'https://github.com/zss-in-js/plumeria',
    },
    {
      text: <span className={style.use(styles.discord)}>{svg.Discord({ width: 21, height: 21 })}</span>,
      url: 'https://discord.gg/pKEBp4wYd8',
    },
  ],
};
