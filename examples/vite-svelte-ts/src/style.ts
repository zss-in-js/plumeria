import * as css from '@plumeria/core';

const styles = css.create({
  color: {
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(90deg, #58c6ff 0%, #3e5875 50%, #ff3bef 100%)',
    backgroundClip: 'text',
  },
});

export const svelteClass = css.props(styles.color);
