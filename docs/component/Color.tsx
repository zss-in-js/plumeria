import { css, rx } from '@plumeria/core';

const styles = css.create({
  colorName: {
    display: 'inline-block',
    width: 12,
    height: 12,
    background: 'var(--color)',
    border: 'solid 0.4px black',
  },
});

export const Color = ({ color }: { color: string }) => {
  return <span {...rx(styles.colorName, { '--color': color })} />;
};
