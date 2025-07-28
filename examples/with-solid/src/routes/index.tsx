import { Title } from '@solidjs/meta';
import Counter from '~/components/Counter';
import { css } from '@plumeria/core';

const styles = css.create({
  highlighted: {
    fontSize: 120,
    color: '#ff0077',
  },
});

export default function Home() {
  return (
    <main>
      <Title>Hello World</Title>
      <h1 class={css.props(styles.highlighted)}>Hello world!</h1>
      <Counter />
      <p>
        Visit{' '}
        <a href="https://start.solidjs.com" target="_blank">
          start.solidjs.com
        </a>{' '}
        to learn how to build SolidStart apps.
      </p>
    </main>
  );
}
