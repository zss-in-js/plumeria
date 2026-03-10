import css from '@plumeria/core';
import { breakpoints } from './breakpoints';

const LOCAL_COLOR = 'purple';
const SPACING = {
  small: '4px',
  medium: '8px',
};

const styles = css.create({
  container: {
    padding: SPACING.medium,
    color: LOCAL_COLOR,
    [breakpoints.lg]: {
      margin: SPACING.small,
    },
  },
});

export function VariableTest() {
  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Variable Resolution Test</h3>
      <div data-testid="variable-div" className={css.use(styles.container)}>
        My styles are resolved from local and imported variables
      </div>
    </div>
  );
}
