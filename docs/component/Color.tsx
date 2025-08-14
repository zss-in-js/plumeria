import { css, rx } from '@plumeria/core';
import { ps } from 'lib/pseudos';

const styles = css.create({
  colorName: {
    display: 'inline-block',
    width: 12,
    height: 12,
    background: 'var(--color)',
    border: 'solid 0.4px black',
    [ps.hover]: {
      scale: 1.5,
    },
  },
});

export const Color = ({ color }: { color: string }) => {
  return <span {...rx(css.props(styles.colorName), { '--color': color })} />;
};
