import { css, rx } from '@plumeria/core';
import { ps } from 'lib/pseudos';

const styles = css.create({
  colorName: {
    position: 'relative',
    top: 4,
    display: 'inline-block',
    width: 18,
    height: 18,
    cursor: 'pointer',
    background: 'var(--color)',
    border: 'solid 0.4px rgba(0,0,0,0.2)',
    transition: '0.2s',
    [ps.hover]: {
      scale: 1.75,
    },
  },
});

export const Color = ({ color }: { color: string }) => {
  return <span {...rx(css.props(styles.colorName), { '--color': color })} />;
};
