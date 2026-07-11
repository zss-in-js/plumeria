import * as css from '@plumeria/core';

export const theme = css.createTheme('.dark', {
  plumeAccent: {
    default: '#63a6bb',
    theme: '#5dcac8',
  },
  cardBg: {
    default: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(235, 235, 235, 0.6) 100%)',
    theme: 'linear-gradient(135deg, rgba(24, 24, 27, 1) 0%, rgba(24, 24, 27, 0.1) 100%)',
  },
  dropdownBg: {
    default: '#ffffff',
    theme: '#18181b',
  },
  cardBorder: {
    default: 'rgba(100, 100, 100, 0.2)',
    theme: 'rgba(255, 255, 255, 0.12)',
  },
  cardHoverBorder: {
    default: 'rgba(255, 255, 255, 0.9)',
    theme: 'rgba(255, 255, 255, 0.3)',
  },
  cardCutGlass: {
    default:
      'inset 0 1.5px 1.5px 0 rgba(200, 200, 200, 0.1), inset 1.5px 0 1.5px 0 rgba(200, 200, 200, 0.2), inset -1.5px -1.5px 1.5px 0 rgba(200, 200, 200, 0.8)',
    theme:
      'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 1.5px 0 1.5px 0 rgba(255, 255, 255, 0.05), inset -1px -1px 1.5px 0 rgba(0, 0, 0, 0.3)',
  },
  cardShadow: {
    default: '0 8px 32px 0 rgba(0, 0, 0, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.03)',
    theme: '0 8px 32px 0 rgba(0, 0, 0, 0.3), 0 2px 8px 0 rgba(0, 0, 0, 0.2)',
  },
  cardBoxShadow: {
    default:
      '0 8px 32px 0 rgba(0, 0, 0, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.03), inset 0 1.5px 1.5px 0 rgba(200, 200, 200, 0.1), inset 1.5px 0 1.5px 0 rgba(200, 200, 200, 0.2), inset -1.5px -1.5px 1.5px 0 rgba(200, 200, 200, 0.8)',
    theme:
      '0 8px 32px 0 rgba(0, 0, 0, 0.3), 0 2px 8px 0 rgba(0, 0, 0, 0.2), inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 1.5px 0 1.5px 0 rgba(255, 255, 255, 0.05), inset -1px -1px 1.5px 0 rgba(0, 0, 0, 0.3)',
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
