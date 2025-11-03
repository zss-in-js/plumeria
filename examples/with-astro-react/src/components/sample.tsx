import { css } from '@plumeria/core';

const styles = css.create({
  color: {
    fontWeight: '500',
    color: 'rgb(112, 200, 222)',
  },
});

export const Sample = () => {
  return (
    <div className={css.props(styles.color)}>Astro React PLUMERIA Sample.</div>
  );
};
