'use client';

import { css } from '@plumeria/core';
import { utility } from './vars';

const styles = css.create({
  test_conflict: {
    fontSize: 14,
    lineHeight: utility.mini,
    color: 'pink',
  },
});

export function Conflict() {
  return (
    <span className={styles.test_conflict} data-testid="e2e-test-span">
      Not conflict test
    </span>
  );
}
