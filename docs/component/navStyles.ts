import * as css from '@plumeria/core';
import { theme } from 'lib/theme';

export const navStyles = css.create({
  iconRow: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    color: theme.iconColor,
    cursor: 'pointer',
    background: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: 8,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    ':hover': {
      color: theme.textPrimary,
      background: theme.iconBg,
    },
  },
  themeToggle: {
    scale: 0.9,
  },
  spacer: {
    flex: 1,
  },
});
