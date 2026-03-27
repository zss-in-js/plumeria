'use client';

import { useState } from 'react';
import * as css from '@plumeria/core';

const styles = css.create({
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
        styleName={[
          styles.base,
          isActive ? styles.active : styles.inactive,
          isLarge && styles.large,
        ]}
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
