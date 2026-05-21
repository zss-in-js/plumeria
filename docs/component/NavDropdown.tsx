'use client';

import * as React from 'react';
import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';
import Link from 'next/link';

const styles = css.create({
  container: {
    position: 'relative',
    display: 'inline-block',
    [breakpoints.md]: {
      display: 'block',
      width: '100%',
    },
  },
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'color 0.15s ease, background-color 0.15s ease',
    [breakpoints.md]: {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      padding: '12px 16px',
      fontSize: '16px',
      color: 'var(--text-primary)',
      borderRadius: '8px',
      ':hover': {
        backgroundColor: 'var(--icon-bg)',
      },
    },
    ':hover': {
      color: 'var(--text-primary)',
      backgroundColor: 'var(--icon-bg)',
    },
  },
  triggerHovered: {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--icon-bg)',
  },
  chevron: {
    display: 'inline-flex',
    marginLeft: '4px',
    transition: 'transform 0.25s ease',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '180px',
    padding: '6px',
    pointerEvents: 'none',
    background: 'var(--dropdown-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '12px',
    boxShadow: 'var(--card-box-shadow)',
    transform: 'translateY(4px)',
    transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: 0,
    [breakpoints.md]: {
      position: 'static',
      display: 'none',
      width: '100%',
      minWidth: 'unset',
      padding: '4px 0 8px 12px',
      pointerEvents: 'auto',
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      transform: 'none',
      transition: 'none',
      opacity: 1,
    },
  },
  menuVisible: {
    pointerEvents: 'auto',
    transform: 'translateY(0)',
    opacity: 1,
    [breakpoints.md]: {
      display: 'flex',
    },
  },
  item: {
    display: 'block',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    [breakpoints.md]: {
      padding: '8px 16px',
      fontSize: '14px',
    },
    ':hover': {
      color: 'var(--text-primary)',
      backgroundColor: 'var(--icon-bg)',
    },
  },
  header: {
    padding: '6px 12px 2px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '0.05em',
    pointerEvents: 'none',
    [breakpoints.md]: {
      padding: '8px 16px 2px 16px',
      fontSize: '12px',
    },
  },
  divider: {
    height: '1px',
    margin: '6px 4px',
    backgroundColor: 'var(--card-border)',
    [breakpoints.md]: {
      margin: '6px 16px',
    },
  },
});

const ChevronDown = ({ styleName }: { styleName: any }) => (
  <span styleName={styleName}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.8 }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </span>
);

interface DropdownItem {
  text?: string;
  url?: string;
  type?: 'item' | 'header' | 'divider';
}

interface NavDropdownProps {
  title: string;
  url: string;
  items: DropdownItem[];
}

export const NavDropdown = ({ title, url, items }: NavDropdownProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isOpenMobile, setIsOpenMobile] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) {
        setIsOpenMobile(false);
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setIsOpenMobile((prev) => !prev);
    }
  };

  const isMenuVisible = isMobile ? isOpenMobile : isHovered;

  return (
    <div styleName={styles.container} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Link href={url} styleName={[styles.trigger, isHovered && styles.triggerHovered]} onClick={handleTriggerClick}>
        {title}
        <ChevronDown styleName={[styles.chevron, isMenuVisible && styles.chevronOpen]} />
      </Link>
      <div styleName={[styles.menu, isMenuVisible && styles.menuVisible]}>
        {items.map((item, idx) => {
          if (item.type === 'header') {
            return (
              <span key={idx} styleName={styles.header}>
                {item.text}
              </span>
            );
          }
          if (item.type === 'divider') {
            return <div key={idx} styleName={styles.divider} />;
          }
          return (
            <Link key={idx} href={item.url || ''} styleName={styles.item}>
              {item.text}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
