import * as css from '@plumeria/core';
import { pseudos } from 'lib/pseudos';

const styles = css.create({
  colorName: {
    position: 'relative',
    top: 4,
    display: 'inline-block',
    width: 18,
    height: 18,
    cursor: 'pointer',
    border: 'solid 0.4px rgba(0,0,0,0.2)',
    transition: '0.2s',
    [pseudos.hover]: {
      scale: 1.75,
    },
  },
});

export const Color = ({ color }: { color: string }) => {
  return <span className={css.props(styles.colorName)} style={{ background: color }} />;
};
