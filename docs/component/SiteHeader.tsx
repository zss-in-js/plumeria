'use client';

import * as React from 'react';
import * as css from '@plumeria/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LinkItemType, NavOptions } from 'fumadocs-ui/layouts/shared';
import { FullSearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { navStyles } from 'component/navStyles';
import { SidebarIcon } from 'component/DocsSidebarTrigger';
import { breakpoints } from 'lib/mediaQuery';
import { theme } from 'lib/theme';

const styles = css.create({
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    gridRow: 'header',
    gridColumn: '1 / -1',
    borderBottomColor: 'var(--color-fd-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    backdropFilter: 'blur(12px)',
    contain: 'inline-size',
  },
  body: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    width: '100%',
    height: 'var(--plumeria-header-size)',
    paddingRight: 12,
    paddingLeft: 24,
    '@media (min-width: 768px)': {
      paddingRight: 24,
      paddingLeft: 'var(--plumeria-edge)',
    },
  },
  title: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'none',
    [breakpoints.lgUp]: {
      display: 'flex',
      gap: 2,
      alignItems: 'center',
    },
  },
  navLink: {
    display: 'inline-flex',
    alignItems: 'center',
    height: 'var(--plumeria-control-size)',
    paddingInline: 10,
    fontSize: 14,
    fontWeight: 400,
    color: theme.textNav,
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'color 0.15s ease, background-color 0.15s ease',
    ':hover': {
      color: theme.textPrimary,
      background: theme.iconBg,
      transition: 'none',
    },
  },
  navLinkActive: {
    position: 'relative',
    '::after': {
      position: 'absolute',
      right: 10,
      bottom: 'calc((var(--plumeria-control-size) - var(--plumeria-header-size)) / 2 - 1px)',
      left: 10,
      height: 2,
      content: '""',
      background: 'var(--plumeria-accent)',
    },
  },
  searchSlot: {
    flex: '1 1 140px',
    minWidth: 0,
    [breakpoints.lgUp]: {
      flex: '0 1 auto',
      width: '100%',
      maxWidth: 200,
    },
  },
  searchButton: {
    width: '100%',
    height: 'var(--plumeria-control-size)',
    paddingBlock: 0,
    fontSize: 0,
    borderRadius: 0,
    [breakpoints.lgUp]: {
      fontSize: 14,
    },
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
  inline: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  trigger: {
    marginLeft: -16,
    '@media (min-width: 768px)': {
      marginLeft: -8,
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
  menu: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 200,
    padding: 6,
    background: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: 12,
    boxShadow: theme.cardBoxShadow,
    [breakpoints.lgUp]: {
      display: 'none',
    },
  },
  menuItem: {
    display: 'block',
    padding: '8px 12px',
    fontSize: 14,
    fontWeight: 500,
    color: theme.textSecondary,
    textDecoration: 'none',
    borderRadius: 8,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    ':hover': {
      color: theme.textPrimary,
      background: theme.iconBg,
    },
  },
  menuItemActive: {
    color: theme.textPrimary,
  },
});

interface SiteHeaderProps {
  showSearch?: boolean;
  title: NavOptions['title'];
  links: LinkItemType[];
  sidebarTrigger?: React.ComponentType;
}

export const SiteHeader = ({ title, links, sidebarTrigger: SidebarTrigger, showSearch = true }: SiteHeaderProps) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const navLinks = links.filter(
    (link): link is Extract<LinkItemType, { url: string }> => 'url' in link && !('icon' in link),
  );
  const menus = links.filter((link) => link.type === 'custom');
  const icons = links.filter((link) => link.type === 'icon');

  const section = (url: string) => (url.startsWith('/blog/') ? '/blog' : url);

  const isLinkActive = (url: string) => {
    if (url === '/') return pathname === '/';
    return (
      pathname.startsWith(section(url)) &&
      !navLinks.some((link) => link.url.length > url.length && pathname.startsWith(section(link.url)))
    );
  };

  const renderNavLinks = () =>
    navLinks.map((item, idx) => {
      const active = isLinkActive(item.url);
      return (
        <Link
          key={idx}
          href={item.url}
          aria-current={active ? 'page' : undefined}
          classStyle={[styles.navLink, active && styles.navLinkActive]}
        >
          {item.text}
        </Link>
      );
    });

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

  return (
    <header id="nd-nav" classStyle={styles.header}>
      <div data-header-body="" classStyle={styles.body}>
        {SidebarTrigger ? (
          <div classStyle={[styles.compact, styles.trigger]}>
            <SidebarTrigger />
          </div>
        ) : (
          <div ref={menuRef} classStyle={[styles.compact, styles.trigger]}>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="nd-home-menu"
              classStyle={navStyles.iconButton}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <SidebarIcon />
            </button>
            {menuOpen && (
              <nav id="nd-home-menu" classStyle={styles.menu}>
                {navLinks.map((item, idx) => {
                  const active = isLinkActive(item.url);
                  return (
                    <Link
                      key={idx}
                      href={item.url}
                      aria-current={active ? 'page' : undefined}
                      classStyle={[styles.menuItem, active && styles.menuItemActive]}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.text}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}
        {typeof title === 'function' ? (
          React.createElement(title, { href: '/', className: css.use(styles.title) })
        ) : (
          <Link href="/" classStyle={styles.title} onNavigate={() => window.scrollTo(0, 0)}>
            {title}
          </Link>
        )}
        <div classStyle={styles.actions}>
          <nav classStyle={styles.navLinks}>{renderNavLinks()}</nav>
          <div classStyle={styles.inline}>{renderIcons()}</div>
          {showSearch && (
            <div classStyle={styles.searchSlot}>
              <FullSearchTrigger hideIfDisabled className={css.use(styles.searchButton)} />
            </div>
          )}
          <nav classStyle={styles.wide}>{renderMenus()}</nav>
          <div classStyle={styles.inline}>
            <ThemeSwitch classStyle={navStyles.themeToggle} />
          </div>
        </div>
      </div>
    </header>
  );
};
