import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as css from '@plumeria/core';

import { svg } from 'component/svg';
import { socialLinks } from 'lib/socialLinks';
import { latestBlogUrl } from 'lib/source';
import { theme } from 'lib/theme';

const styles = css.create({
  image: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 450,
    letterSpacing: '-0.015em',
    color: theme.textMainHeaderLine,
  },
});

export const baseOptions: BaseLayoutProps = {
  nav: {
    transparentMode: 'top',
    title: (
      <span classStyle={styles.image}>
        <svg.PlumeriaLogo size={20} />
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
