'use client';

import { css, rx } from '@plumeria/core';
import { TimeCount } from './timeHooks';

const styles = css.create({
  headings: {
    position: 'relative',
    left: -4,
    zIndex: 0,
    display: 'inline',
    marginBottom: '12px',
    fontSize: 56,
    fontWeight: 600,
    WebkitTextFillColor: 'transparent',
    textAlign: 'left',
    background: 'var(--bg)',
    backgroundClip: 'text',
    [css.media.maxWidth(804)]: {
      top: 20,
      right: 18,
      marginTop: '54px',
      fontSize: '46px',
    },
  },
});

export const Plumeria = () => {
  const time = TimeCount();
  const generateGradualHsl = (offset = 0) => {
    const hue = (time + offset) % 360;
    return `hsl(${hue.toFixed(100)}deg, 65%, 65%)`;
  };

  const color1 = generateGradualHsl(0);
  const color2 = generateGradualHsl(50);
  const color3 = generateGradualHsl(100);
  const dynamicStyle = {
    '--bg': `
    linear-gradient(45deg,
    ${color1} 0%,
    ${color2} 50%,
    ${color3} 100%)
    `,
  };

  return <div {...rx(styles.headings, dynamicStyle)}>Plumeria</div>;
};
