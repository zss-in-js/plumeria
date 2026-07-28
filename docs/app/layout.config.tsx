import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import * as css from '@plumeria/core';

import { PlumeriaLogo } from 'component/svg';
import { NavDropdown } from 'component/NavDropdown';
import { latestReleases } from 'lib/latestReleases';
import { socialLinks } from 'lib/socialLinks';
import { theme } from 'lib/theme';

const latestReleasePosts = latestReleases(3);

const styles = css.create({
  image: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: theme.textMainHeaderLine,
  },
});

export const baseOptions: BaseLayoutProps = {
  nav: {
    transparentMode: 'top',
    title: (
      <span styleName={styles.image}>
        <PlumeriaLogo size={20} />
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
            { text: 'Why Plumeria?', url: '/docs/why-plumeria' },
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
    ...socialLinks,
  ],
};
