import { Link } from 'waku';
import * as css from '@plumeria/core';

const styles = css.create({
  headline: {
    fontSize: '2.25rem',
    fontWeight: 700,
    letterSpacing: '-0.025em',
  },
  link: {
    display: 'inline-block',
    marginTop: '1rem',
    textDecoration: 'underline',
  },
});

export default async function AboutPage() {
  const data = await getData();

  return (
    <div>
      <title>{data.title}</title>
      <h1 classStyle={styles.headline}>{data.headline}</h1>
      <p>{data.body}</p>
      <Link to="/" classStyle={styles.link}>
        Return home
      </Link>
    </div>
  );
}

const getData = async () => {
  const data = {
    title: 'About',
    headline: 'About Waku',
    body: 'The minimal React framework',
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
