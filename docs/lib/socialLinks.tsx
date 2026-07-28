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
  {
    type: 'icon',
    label: 'Bluesky',
    text: 'Bluesky',
    icon: svg.Bluesky({ width: 20, height: 20 }),
    url: 'https://bsky.app/profile/zss-in-js.bsky.social',
  },
  {
    type: 'icon',
    label: 'Discord',
    text: 'Discord',
    icon: svg.Discord({ width: 20, height: 20 }),
    url: 'https://discord.gg/pKEBp4wYd8',
  },
];
