'use client';

import { useState } from 'react';
import * as css from '@plumeria/core';

const styles = css.create({
  box: (width: number, height: number, color: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width,
    height,
    color: 'white',
    backgroundColor: color,
    borderColor: 'black',
    borderStyle: 'solid',
    borderWidth: '2px',
    transition: 'all 0.3s ease',
  }),
});

export function MultiArgTest() {
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [color, setColor] = useState('blue');

  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Multi-Arg Dynamic Style Test</h3>
      <div
        data-testid="multi-arg-box"
        classStyle={styles.box(width, height, color)}
      >
        {width}x{height}
      </div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button
          data-testid="increase-width"
          onClick={() => setWidth((w) => w + 20)}
        >
          Increase Width
        </button>
        <button
          data-testid="increase-height"
          onClick={() => setHeight((h) => h + 20)}
        >
          Increase Height
        </button>
        <button
          data-testid="change-color"
          onClick={() => setColor((c) => (c === 'blue' ? 'purple' : 'blue'))}
        >
          Change Color
        </button>
      </div>
    </div>
  );
}
