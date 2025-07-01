import { css } from '@plumeria/core';

export const styles = css.create({
  color: {
    fontSize: 20,
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(90deg, #58c6ff 0%, #076ad9 50%, #ff3bef 100%)',
    backgroundClip: 'text',
  },
});

export const Component = () => {
  return <p className={styles.$color}>Astro + React + Plumeria</p>;
};
