import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as css from '@plumeria/core';
import Image from 'next/image';
import { svg } from 'component/svg';

const styles = css.create({
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
      <span styleName={styles.logo}>
        <Image styleName={styles.flower} src="/LP_LG.png" alt="Plumeria logo" loading="lazy" height={40} width={40} />
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
  ],
};
