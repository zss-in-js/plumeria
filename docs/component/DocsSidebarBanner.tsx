'use client';

import type { ComponentProps } from 'react';
import * as css from '@plumeria/core';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { DocsSidebarTrigger } from 'component/DocsSidebarTrigger';
import { navStyles } from 'component/navStyles';
import { breakpoints } from 'lib/mediaQuery';
import { socialLinks } from 'lib/socialLinks';

const styles = css.create({
  banner: {
    height: 56,
    paddingInline: 16,
    marginTop: 8,
    [breakpoints.lgUp]: {
      display: 'none',
    },
  },
  toggle: {
    marginRight: 6,
  },
});

export const DocsSidebarBanner = (props: ComponentProps<'div'>) => (
  // eslint-disable-next-line @plumeria/no-mixed-styling-props
  <div className={props.className} classStyle={[navStyles.iconRow, styles.banner]}>
    {socialLinks.map((item, idx) => (
      <a
        key={idx}
        href={item.type === 'icon' ? item.url : ''}
        aria-label={item.type === 'icon' ? item.label : undefined}
        target="_blank"
        rel="noreferrer"
        classStyle={navStyles.iconButton}
      >
        {item.type === 'icon' ? item.icon : null}
      </a>
    ))}
    <div classStyle={navStyles.spacer} />
    <ThemeSwitch classStyle={[navStyles.themeToggle, styles.toggle]} />
    <DocsSidebarTrigger />
  </div>
);
