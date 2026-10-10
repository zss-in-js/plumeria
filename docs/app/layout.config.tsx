import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import * as css from '@plumeria/core';

import { socialLinks } from 'lib/socialLinks';
import { theme } from 'lib/theme';

const styles = css.create({
  image: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: theme.wordmark,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  mark: {
    display: 'flex',
  },
});

export const logo = (
  <span classStyle={styles.image}>
    <span classStyle={styles.mark}>
      <Image src="/logo.svg" alt="" width={24} height={24} preload />
    </span>
    Plumeria
  </span>
);

export const baseOptions: BaseLayoutProps = {
  nav: {
    transparentMode: 'top',
    title: logo,
  },

  links: [
    {
      text: 'Docs',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'Playground',
      url: '/playground',
      active: 'nested-url',
    },
    ...socialLinks,
  ],
};
