import { Link } from 'waku';
import * as css from '@plumeria/core';
import { Counter } from '../components/counter';

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

export default async function HomePage() {
  const data = await getData();

  return (
    <div>
      <title>{data.title}</title>
      <h1 classStyle={styles.headline}>{data.headline}</h1>
      <p>{data.body}</p>
      <Counter />
      <Link to="/about" classStyle={styles.link}>
        About page
      </Link>
    </div>
  );
}

const getData = async () => {
  const data = {
    title: 'Waku',
    headline: 'Waku',
    body: 'Hello world!',
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
