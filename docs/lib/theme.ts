import * as css from '@plumeria/core';

export const theme = css.createTheme('.dark', {
  plumeAccent: {
    default: '#63a6bb',
    theme: '#5dcac8',
  },
  cardBg: {
    default: 'rgba(255, 255, 255, 0.5)',
    theme: 'rgba(24, 24, 27, 0.5)',
  },
  dropdownBg: {
    default: '#ffffff',
    theme: '#18181b',
  },
  cardBorder: {
    default: 'rgba(100, 100, 100, 0.4)',
    theme: 'rgba(255, 255, 255, 0.12)',
  },
  cardHoverBorder: {
    default: 'rgba(255, 255, 255, 0.9)',
    theme: 'rgba(255, 255, 255, 0.3)',
  },
  cardCutGlass: {
    default: 'inset 0 0 1.5px 1px rgba(200, 200, 200, 0.2)',
    theme: 'inset 0 0 1.5px 1px rgba(255, 255, 255, 0.05)',
  },
  cardShadow: {
    default: '0 8px 32px 0 rgba(0, 0, 0, 1), 0 2px 8px 0 rgba(0, 0, 0, 1)',
    theme: '0 8px 32px 0 rgba(0, 0, 0, 0.3), 0 2px 8px 0 rgba(0, 0, 0, 0.2)',
  },
  cardBoxShadow: {
    default:
      '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.02), inset 0 0 1.5px 1px rgba(200, 200, 200, 0.4)',
    theme:
      '0 8px 32px 0 rgba(0, 0, 0, 0.3), 0 2px 8px 0 rgba(0, 0, 0, 0.2), inset 0 0 1.5px 1px rgba(255, 255, 255, 0.05)',
  },
  iconColor: {
    default: '#71717a',
    theme: '#e4e4e7',
  },
  iconBg: {
    default: 'rgba(242, 242, 242, 1)',
    theme: 'rgba(255, 255, 255, 0.05)',
  },
  textPrimary: {
    default: '#0b0b0b',
    theme: '#f4f4f5',
  },
  textSecondary: {
    default: '#69676cff',
    theme: '#a09ea4ff',
  },
  textMuted: {
    default: '#71717a',
    theme: '#71717a',
  },
  textMainHeaderLine: {
    default: '#3c3c43',
    theme: '#dfdfd6',
  },
});
