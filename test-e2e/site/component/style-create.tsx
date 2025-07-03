'use client';

import { css } from '@plumeria/core';

const styles = css.create({
  e2e: {
    color: 'pink',
    [css.media.maxWidth(1024)]: {
      color: 'aqua',
    },
  },
});

export function E2ETest() {
  return (
    <div className={styles.$e2e} data-testid="e2e-test-div">
      Component-attach-class and Responsive-design test
    </div>
  );
}
