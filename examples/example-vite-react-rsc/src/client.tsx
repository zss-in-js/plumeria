'use client';

import React from 'react';
import * as css from '@plumeria/core';

const styles = css.create({
  button: {
    color: '#ff3bef',
    borderColor: '#ff3bef',
  },
});

export function ClientCounter() {
  const [count, setCount] = React.useState(0);

  return (
    <button
      classStyle={styles.button}
      onClick={() => setCount((count) => count + 1)}
    >
      Client Counter: {count}
    </button>
  );
}
