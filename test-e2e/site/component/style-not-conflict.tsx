'use client';

import { css } from '@plumeria/core';

const styles = css.create({
  test_conflict: {
    fontSize: 14,
    color: 'pink',
  },
});

export function Conflict() {
  return (
    <span
      className={css.props(styles.test_conflict)}
      data-testid="e2e-test-span"
    >
      Not conflict test
    </span>
  );
}
