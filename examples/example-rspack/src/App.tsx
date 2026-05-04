import { useState } from 'react';
import * as css from '@plumeria/core';

const styles = css.create({
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#646cff',
    transition: 'all 0.3s ease',
  },
  card: {
    padding: '2em',
    marginTop: '1em',
    border: '1px solid #ccc',
    borderRadius: '8px',
  },
});

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', padding: '2em' }}>
      <h1 styleName={styles.title}>Plumeria + Rspack</h1>
      <div styleName={styles.card}>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR.
        </p>
      </div>
    </div>
  );
}

export default App;
