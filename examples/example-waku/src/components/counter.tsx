'use client';

import { useState } from 'react';
import * as css from '@plumeria/core';

const styles = css.create({
  section: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    marginTop: '1rem',
    borderColor: '#60a5fa',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: '2px',
  },
  label: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  value: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.2,
  },
  button: {
    padding: '0.125rem 0.5rem',
    fontSize: '0.875rem',
    color: '#fff',
    background: '#000',
    borderRadius: '2px',
  },
});

export const Counter = () => {
  const [count, setCount] = useState(0);

  const handleIncrement = () => setCount((c) => c + 1);

  return (
    <section classStyle={styles.section}>
      <div>
        <span classStyle={styles.label}>Count</span>
        <strong classStyle={styles.value}>{count}</strong>
      </div>
      <button onClick={handleIncrement} classStyle={styles.button}>
        Increment
      </button>
    </section>
  );
};
