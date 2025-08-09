import { css } from '@plumeria/core';
import { utils } from 'component/vars';

const styles = css.create({
  test_conflict: {
    fontSize: 140,
    lineHeight: utils.mini,
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
