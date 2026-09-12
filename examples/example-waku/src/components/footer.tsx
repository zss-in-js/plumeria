import * as css from '@plumeria/core';

const styles = css.create({
  footer: {
    padding: '1.5rem',
  },
  link: {
    textDecoration: 'underline',
  },
});

export const Footer = () => {
  return (
    <footer classStyle={styles.footer}>
      <div>
        visit{' '}
        <a
          href="https://waku.gg/"
          target="_blank"
          rel="noreferrer"
          classStyle={styles.link}
        >
          waku.gg
        </a>{' '}
        to learn more
      </div>
    </footer>
  );
};
