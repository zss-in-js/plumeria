'use client';

import React from 'react';
import * as css from '@plumeria/core';
import { shared } from './shared.styles.ts';

const styles = css.create({
  button: {
    color: 'rgb(255, 59, 239)',
  },
  wide: {
    '@media (width >= 300px)': {
      letterSpacing: '3px',
    },
  },
});

export function ClientCounter() {
  const [count, setCount] = React.useState(0);

  return (
    <button
      data-testid="rsc-client-counter"
      classStyle={[shared.panel, styles.button, styles.wide]}
      onClick={() => setCount((count) => count + 1)}
    >
      Client Counter: {count}
    </button>
  );
}
