import { component$, useSignal } from '@builder.io/qwik';

import qwikLogo from './assets/qwik.svg';
import viteLogo from '/vite.svg';
import './app.css';
import * as css from '@plumeria/core';

const styles = css.create({
  highlighted: (value: number) => ({
    fontSize: value,
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(90deg, #58c6ff 0%, #416389 50%, #ff3bef 100%)',
    backgroundClip: 'text',
  }),
});

export const App = component$(() => {
  const count = useSignal(51.2);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} class="logo" alt="Vite logo" />
        </a>
        <a href="https://qwik.dev" target="_blank">
          <img src={qwikLogo} class="logo qwik" alt="Qwik logo" />
        </a>
      </div>
      <h1 styleName={styles.highlighted(count.value)}>Vite + Qwik</h1>
      <div class="card">
        <button onClick$={() => count.value++}>count is {count.value}</button>
      </div>
      <p class="read-the-docs">
        Click on the Vite and Qwik logos to learn more
      </p>
    </>
  );
});
