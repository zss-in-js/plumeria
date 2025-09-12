'use client';

import { css } from '@plumeria/core';
import { breakpoints } from './define';

const styles = css.create({
  e2e: {
    color: 'pink',
    [breakpoints.lg]: {
      color: 'aqua',
    },
  },
});

export function E2ETest() {
  return (
    <div className={css.props(styles.e2e)} data-testid="e2e-test-div">
      Component-attach-class and Responsive-design test
    </div>
  );
}
