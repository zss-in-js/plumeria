import Link from 'next/link';
import { JSX } from 'react';
import { css } from '@plumeria/core';

const styles = css.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
});

const NotFound = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <h1>ClientSide Error status code 404 Request page is not found:</h1>
      <Link href="/">
        <u>Return to Top page</u>
      </Link>
    </div>
  );
};

export default NotFound;
