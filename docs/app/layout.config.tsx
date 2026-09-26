import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import * as css from '@plumeria/core';

import { socialLinks } from 'lib/socialLinks';
import { latestBlogUrl } from 'lib/latestBlogUrl';
import { theme } from 'lib/theme';

const styles = css.create({
  image: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    fontSize: 14,
    fontWeight: 500,
    color: theme.textPrimary,
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
          <Image src="/logo.svg" alt="" width={22} height={22} preload />
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
