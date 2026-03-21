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
});

export const baseOptions: BaseLayoutProps = {
  nav: {
    transparentMode: 'top',
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
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'Blog',
      url: '/blog',
    },
    {
      text: 'Playground',
      url: '/playground',
    },
    {
      type: 'icon',
      label: 'Bluesky',
      text: 'Bluesky',
      icon: svg.Bluesky({ width: 21, height: 21 }),
      url: 'https://bsky.app/profile/zss-in-js.bsky.social',
    },
    {
      type: 'icon',
      label: 'GitHub',
      text: 'GitHub',
      icon: svg.Github({ width: 21, height: 21 }),
      url: 'https://github.com/zss-in-js/plumeria',
    },
    {
      type: 'icon',
      label: 'Discord',
      text: 'Discord',
      icon: svg.Discord({ width: 21, height: 21 }),
      url: 'https://discord.gg/pKEBp4wYd8',
    },
  ],
};
