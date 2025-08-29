import { css } from '@plumeria/core';

const styles = css.create({
  color: {
    fontWeight: '500',
    color: 'rgb(34 34 34)',
  },
});

export const Sample = () => {
  return (
    <div className={css.props(styles.color)}>Astro React PLUMERIA Sample.</div>
  );
};
