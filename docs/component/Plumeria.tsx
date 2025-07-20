import { css, rx } from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';

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
    WebkitBackgroundClip: 'text',
    [breakpoints.md]: {
      top: 20,
      right: 18,
      marginTop: '20px',
      marginBottom: 30,
      fontSize: '46px',
    }
},
});

export const Plumeria = () => {
    // const time = TimeCount()
  const generateGradualHsl = (offset = 0) => {
    const hue = (111 + offset) % 360;
    return `hsl(${hue.toFixed(100)}deg, 50%, 65%)`;
  };

  const color1 = generateGradualHsl(0);
  const color2 = generateGradualHsl(50);
  const color3 = generateGradualHsl(100);
  const dynamicStyle = {
    '--bg': `
    linear-gradient(45deg,
    ${color1} -120%,
    ${color2} 50%,
    ${color3} 120%)
    `,
  };

  return (
    <>
        <div {...rx(css.props(styles.headings), dynamicStyle)}>Plumeria</div>
    </>
    )
};
