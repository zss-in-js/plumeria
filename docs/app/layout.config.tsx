import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import * as css from '@plumeria/core';

import { socialLinks } from 'lib/socialLinks';
import { latestBlogUrl } from 'lib/latestBlogUrl';

const styles = css.create({
  image: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: '-0.015em',
  },
  mark: {
    display: 'flex',
    marginTop: -2,
  },
});

export const baseOptions: BaseLayoutProps = {
  nav: {
    transparentMode: 'top',
    title: (
      <span classStyle={styles.image}>
        <span classStyle={styles.mark}>
          <Image src="/logo.svg" alt="logo" width={20} height={20} preload />
        </span>
        Plumeria
      </span>
    ),
  },

  links: [
    {
      text: 'Docs',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'API',
      url: '/docs/api-reference',
      active: 'nested-url',
    },
    {
      text: 'Blog',
      url: latestBlogUrl,
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
