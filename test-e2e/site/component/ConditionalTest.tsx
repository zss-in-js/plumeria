'use client';

import { useState } from 'react';
import style from '@plumeria/core';

const styles = style.create({
  base: {
    padding: '10px',
    border: '1px solid black',
  },
  active: {
    color: 'white',
    backgroundColor: 'green',
  },
  inactive: {
    color: 'black',
    backgroundColor: 'red',
  },
  large: {
    fontSize: '24px',
  },
});

export function ConditionalTest() {
  const [isActive, setIsActive] = useState(false);
  const [isLarge, setIsLarge] = useState(false);

  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Conditional Styles Test</h3>
      <div
        data-testid="conditional-div"
        className={style.use(
          styles.base,
          isActive ? styles.active : styles.inactive,
          isLarge && styles.large,
        )}
      >
        I change styles based on state
      </div>
      <button
        data-testid="toggle-active"
        onClick={() => setIsActive(!isActive)}
      >
        Toggle Active
      </button>
      <button data-testid="toggle-large" onClick={() => setIsLarge(!isLarge)}>
        Toggle Large
      </button>
    </div>
  );
}
