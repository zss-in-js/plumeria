import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { svg } from 'component/svg';

/**
 * Shared so the sidebar banner can render them without taking props -- `layout.config`
 * reads the filesystem, so a client component cannot import it.
 */
export const socialLinks: LinkItemType[] = [
  {
    type: 'icon',
    label: 'GitHub',
    text: 'GitHub',
    icon: svg.Github({ width: 20, height: 20 }),
    url: 'https://github.com/zss-in-js/plumeria',
  },
];
