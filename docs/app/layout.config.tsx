import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as css from '@plumeria/core';
import Image from 'next/image';

const styles = css.create({
  text: {
    position: 'relative',
    right: 4,
  },
  logo: {
    position: 'relative',
    right: 8,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    fontWeight: 600,
    color: 'var(--plume-accent)',
  },
});

export const baseOptions: BaseLayoutProps = {
  githubUrl: 'https://github.com/zss-in-js/plumeria',
  nav: {
    title: (
      <span className={css.use(styles.logo)}>
        <Image src="/LP_LG.png" alt="Plumeria logo" loading="lazy" height={40} width={40} />
        <span className={css.use(styles.text)}>Plumeria</span>
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
