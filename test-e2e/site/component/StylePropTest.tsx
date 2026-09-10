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
  styleArray?: css.StaticStyles<'color' | 'backgroundColor' | 'padding'>;
};

function Badge({ styleArray }: BadgeProps) {
  return (
    <span data-testid="static-badge" classStyle={[styles.base, styleArray]}>
      Badge
    </span>
  );
}

type PanelProps = {
  styleArray?: css.WithoutProperties<'position'>;
};

function Panel({ styleArray }: PanelProps) {
  return (
    <div data-testid="restricted-panel" classStyle={[styles.base, styleArray]}>
      Panel
    </div>
  );
}

type ChipProps = {
  styleArray?: css.StaticStyles;
};

function Chip({ styleArray }: ChipProps) {
  return (
    <span data-testid="static-chip" classStyle={[styles.base, styleArray]}>
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
      <Badge styleArray={styles.emphasis} />
      <Panel styleArray={styles.emphasis} />
      {/* @ts-expect-error a dynamic style carries a function key */}
      <Badge styleArray={styles.sized(120)} />
      {/* @ts-expect-error position is excluded from this component */}
      <Panel styleArray={styles.pinned} />
      <Chip styleArray={styles.pinned} />
      {/* @ts-expect-error a function key is rejected without a type argument */}
      <Chip styleArray={styles.sized(120)} />
    </div>
  );
}
