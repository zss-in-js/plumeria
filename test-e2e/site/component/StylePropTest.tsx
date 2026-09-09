import * as css from '@plumeria/core';

const styles = css.create({
  base: {
    padding: '8px',
    color: 'white',
    backgroundColor: 'royalblue',
  },
  emphasis: {
    color: 'gold',
  },
  pinned: {
    position: 'absolute',
  },
  sized: (width: number) => ({
    width,
  }),
});

type BadgeProps = {
  classStyle?: css.StaticStyles<'color' | 'backgroundColor' | 'padding'>;
};

function Badge({ classStyle }: BadgeProps) {
  return (
    <span data-testid="static-badge" classStyle={[styles.base, classStyle]}>
      Badge
    </span>
  );
}

type PanelProps = {
  classStyle?: css.WithoutProperties<'position'>;
};

function Panel({ classStyle }: PanelProps) {
  return (
    <div data-testid="restricted-panel" classStyle={[styles.base, classStyle]}>
      Panel
    </div>
  );
}

type ChipProps = {
  classStyle?: css.StaticStyles;
};

function Chip({ classStyle }: ChipProps) {
  return (
    <span data-testid="static-chip" classStyle={[styles.base, classStyle]}>
      Chip
    </span>
  );
}

export function StylePropTest() {
  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Restricted Style Prop Test</h3>
      <Badge classStyle={styles.emphasis} />
      <Panel classStyle={styles.emphasis} />
      {/* @ts-expect-error a dynamic style carries a function key */}
      <Badge classStyle={styles.sized(120)} />
      {/* @ts-expect-error position is excluded from this component */}
      <Panel classStyle={styles.pinned} />
      <Chip classStyle={styles.pinned} />
      {/* @ts-expect-error a function key is rejected without a type argument */}
      <Chip classStyle={styles.sized(120)} />
    </div>
  );
}
