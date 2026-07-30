'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import * as css from '@plumeria/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LinkItemType, NavOptions } from 'fumadocs-ui/layouts/shared';
import { FullSearchTrigger, SearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { SidebarIcon } from 'component/DocsSidebarTrigger';
import { navStyles } from 'component/navStyles';
import { breakpoints } from 'lib/mediaQuery';
import { theme } from 'lib/theme';

const styles = css.create({
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    gridRow: 'header',
    gridColumn: '1 / -1',
    borderBottom: '1px solid var(--color-fd-border)',
    backdropFilter: 'blur(12px)',
    contain: 'inline-size',
  },
  body: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    maxWidth: 1440,
    height: 56,
    paddingInline: 16,
    marginInline: 'auto',
  },
  title: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  searchSlot: {
    display: 'none',
    [breakpoints.lgUp]: {
      display: 'block',
      width: '100%',
      maxWidth: 140,
      marginLeft: 12,
    },
  },
  searchButton: {
    width: '100%',
    borderRadius: 10,
  },
  actions: {
    display: 'flex',
    flex: 1,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  wide: {
    display: 'none',
    [breakpoints.lgUp]: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
    },
  },
  compact: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    [breakpoints.lgUp]: {
      display: 'none',
    },
  },
  scrim: {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    pointerEvents: 'none',
    backdropFilter: 'blur(2px)',
    transition: 'opacity 0.25s ease',
    opacity: 0,
    [breakpoints.lgUp]: {
      display: 'none',
    },
  },
  scrimOpen: {
    pointerEvents: 'auto',
    opacity: 1,
  },
  // Portalled to <body>: the header's backdrop-filter would otherwise become the containing
  // block and pin the drawer inside the bar. Same footprint as the docs layout's drawer so
  // the two read as one component.
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 61,
    display: 'flex',
    flexDirection: 'column',
    width: 'min(380px, 85vw)',
    background: 'var(--color-fd-background)',
    borderLeft: '1px solid var(--color-fd-border)',
    boxShadow: theme.cardBoxShadow,
    transform: 'translateX(100%)',
    transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
    [breakpoints.lgUp]: {
      display: 'none',
    },
  },
  drawerOpen: {
    transform: 'translateX(0)',
  },
  // Same 56px band and 16px inset as the bar, so the icons and the toggle keep their place
  // when the drawer opens over it.
  drawerTop: {
    height: 56,
    paddingInline: 16,
    marginTop: 8,
  },
  toggle: {
    marginRight: 6,
  },
  drawerBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '0 8px 24px',
    overflowY: 'auto',
  },
});

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

interface SiteHeaderProps {
  title: NavOptions['title'];
  links: LinkItemType[];
  sidebarTrigger?: React.ReactNode;
}

export const SiteHeader = ({ title, links, sidebarTrigger }: SiteHeaderProps) => {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menus = links.filter((link) => link.type === 'custom');
  const icons = links.filter((link) => link.type === 'icon');

  const renderMenus = () => menus.map((item, idx) => <React.Fragment key={idx}>{item.children}</React.Fragment>);

  const renderIcons = () =>
    icons.map((item, idx) => (
      <a
        key={idx}
        href={item.url}
        aria-label={item.label}
        target="_blank"
        rel="noreferrer"
        classStyle={navStyles.iconButton}
      >
        {item.icon}
      </a>
    ));

  const drawer = (
    <>
      <div classStyle={[styles.scrim, open && styles.scrimOpen]} onClick={() => setOpen(false)} aria-hidden />
      <aside
        id="site-menu"
        aria-label="Menu"
        aria-hidden={!open}
        classStyle={[styles.drawer, open && styles.drawerOpen]}
      >
        <div classStyle={[navStyles.iconRow, styles.drawerTop]}>
          {renderIcons()}
          <div classStyle={navStyles.spacer} />
          <ThemeSwitch classStyle={[navStyles.themeToggle, styles.toggle]} />
          <button
            type="button"
            aria-label="Close menu"
            classStyle={navStyles.iconButton}
            onClick={() => setOpen(false)}
          >
            <SidebarIcon />
          </button>
        </div>
        <div classStyle={styles.drawerBody}>{renderMenus()}</div>
      </aside>
    </>
  );

  return (
    <header id="nd-nav" classStyle={styles.header}>
      <div data-header-body="" classStyle={styles.body}>
        {typeof title === 'function' ? (
          React.createElement(title, { href: '/', className: css.use(styles.title) })
        ) : (
          <Link href="/" classStyle={styles.title} onNavigate={() => window.scrollTo(0, 0)}>
            {title}
          </Link>
        )}
        <div classStyle={styles.searchSlot}>
          <FullSearchTrigger hideIfDisabled className={css.use(styles.searchButton)} />
        </div>
        <div classStyle={styles.actions}>
          <nav classStyle={styles.wide}>{renderMenus()}</nav>
          <div classStyle={styles.wide}>{renderIcons()}</div>
          <div classStyle={styles.wide}>
            <ThemeSwitch classStyle={navStyles.themeToggle} />
          </div>
          <div classStyle={styles.compact}>
            <SearchTrigger hideIfDisabled />
            {sidebarTrigger ?? (
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="site-menu"
                classStyle={navStyles.iconButton}
                onClick={() => setOpen(true)}
              >
                <MenuIcon />
              </button>
            )}
          </div>
        </div>
      </div>
      {!sidebarTrigger && mounted && createPortal(drawer, document.body)}
    </header>
  );
};
