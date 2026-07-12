import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as css from '@plumeria/core';
import Image from 'next/image';
import { svg } from 'component/svg';
import { NavDropdown } from 'component/NavDropdown';
import { blog } from 'lib/source';
import { theme } from 'lib/theme';

const latestReleasePosts = blog
  .getPages()
  .map((post) => {
    const slug = post.slugs[0];
    const match = slug.match(/^plumeria-([\d-]+)/);
    return {
      post,
      version: match ? match[1].replace(/-/g, '.') : null,
    };
  })
  .filter((x) => x.version !== null)
  .sort((a, b) => new Date(b.post.data.date).getTime() - new Date(a.post.data.date).getTime())
  .slice(0, 3)
  .map(({ post, version }) => ({
    text: `Plumeria v${version}`,
    url: `/blog/${post.slugs.join('/')}`,
  }));

const styles = css.create({
  flower: {
    position: 'relative',
    bottom: 2,
    left: 8,
  },
  image: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: theme.textMainHeaderLine,
    filter: 'hue-rotate(342deg) saturate(0.5) contrast(0.95)',
  },
});

export const baseOptions: BaseLayoutProps = {
  nav: {
    transparentMode: 'top',
    title: (
      <span styleName={styles.image}>
        <Image styleName={styles.flower} src="/LP_LG.png" alt="Plumeria logo" loading="lazy" height={40} width={40} />
        Plumeria
      </span>
    ),
  },

  links: [
    {
      type: 'custom',
      children: (
        <NavDropdown
          title={'Documentation'}
          url={'/docs'}
          items={[
            { type: 'header', text: 'Principles' },
            { text: 'Category theory', url: '/docs/category' },
            { text: 'AI.md', url: '/docs/ai' },
            { type: 'divider' },
            { type: 'header', text: 'Getting Started' },
            { text: 'Installation', url: '/docs/getting-started/installation' },
            { text: 'Selector rules', url: '/docs/getting-started/selector-rules' },
            { text: 'Editor integration', url: '/docs/getting-started/editor-integration' },
          ]}
        />
      ),
      on: 'all',
    },
    {
      type: 'custom',
      children: (
        <NavDropdown
          title={'API'}
          url={'/docs/api-reference'}
          items={[
            { type: 'header', text: 'JavaScript API' },
            { text: 'create', url: '/docs/api-reference/javascript/create' },
            { text: 'variants', url: '/docs/api-reference/javascript/variants' },
            { text: 'createTheme', url: '/docs/api-reference/javascript/createTheme' },
            { text: 'createStatic', url: '/docs/api-reference/javascript/createStatic' },
            { text: 'keyframes', url: '/docs/api-reference/javascript/keyframes' },
            { text: 'viewTransition', url: '/docs/api-reference/javascript/viewTransition' },
            { text: 'marker & extended', url: '/docs/api-reference/javascript/marker' },
            { text: 'styleName & use()', url: '/docs/api-reference/javascript/use' },
            { type: 'divider' },
            { type: 'header', text: 'Components' },
            { text: 'headlessui', url: '/docs/api-reference/components/headlessui' },
            { text: 'inspector', url: '/docs/api-reference/components/inspector' },
            { type: 'divider' },
            { type: 'header', text: 'Plugins' },
            { text: 'eslint-plugin', url: '/docs/api-reference/plugins/eslint-plugin' },
            { text: 'next-plugin', url: '/docs/api-reference/plugins/next-plugin' },
            { text: 'postcss-plugin', url: '/docs/api-reference/plugins/postcss-plugin' },
            { text: 'unplugin', url: '/docs/api-reference/plugins/unplugin' },
          ]}
        />
      ),
      on: 'all',
    },
    {
      type: 'custom',
      children: (
        <NavDropdown
          title={'Integrations'}
          url={'/docs/integration'}
          items={[
            { text: 'Bun', url: '/docs/integration/bun' },
            { text: 'esbuild', url: '/docs/integration/esbuild' },
            { text: 'Farm', url: '/docs/integration/farm' },
            { text: 'Next.js', url: '/docs/integration/next' },
            { text: 'Rollup', url: '/docs/integration/rollup' },
            { text: 'Rolldown', url: '/docs/integration/rolldown' },
            { text: 'Rspack', url: '/docs/integration/rspack' },
            { text: 'Vite', url: '/docs/integration/vite' },
            { text: 'Webpack', url: '/docs/integration/webpack' },
          ]}
        />
      ),
      on: 'all',
    },
    {
      type: 'custom',
      children: (
        <NavDropdown
          title={'Blog'}
          url={'/blog'}
          items={[...latestReleasePosts, { text: 'Eating up the libraries', url: '/blog/eating-up-the-libraries' }]}
        />
      ),
      on: 'all',
    },
    {
      type: 'icon',
      label: 'GitHub',
      text: 'GitHub',
      icon: svg.Github({ width: '24px', height: '24px' }),
      url: 'https://github.com/zss-in-js/plumeria',
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
      label: 'Discord',
      text: 'Discord',
      icon: svg.Discord({ width: 21, height: 21 }),
      url: 'https://discord.gg/pKEBp4wYd8',
    },
  ],
};
