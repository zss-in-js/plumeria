import { createSignal } from 'solid-js';
import solidLogo from './assets/solid.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { css } from '@plumeria/core';

const styles = css.create({
  color: {
    color: 'palevioletred',
  },
});

function App() {
  const [count, setCount] = createSignal(0);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} class="logo" alt="Vite logo" />
        </a>
        <a href="https://solidjs.com" target="_blank">
          <img src={solidLogo} class="logo solid" alt="Solid logo" />
        </a>
      </div>
      <h1 class={css.props(styles.color)}>Vite + Solid</h1>
      <div class="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count()}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p class="read-the-docs">
        Click on the Vite and Solid logos to learn more
      </p>
    </>
  );
}

export default App;
