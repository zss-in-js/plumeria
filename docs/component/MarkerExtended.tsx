import * as css from '@plumeria/core';

const animation = css.keyframes({
  '0%': {
    scale: 1.2,
  },
  '50%': {
    scale: 1.3,
  },
  '100%': {
    scale: 1.2,
  },
});

const styles = css.create({
  grand: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 250,
    padding: 20,
    border: '2px dashed #c4c4c466',
    borderRadius: 12,
    transition: 'all 0.3s',
    ...css.marker('grand', ':hover'),
  },
  parent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    minHeight: 120,
    padding: 10,
    backgroundColor: '#f5f5f7',
    border: '2px solid #c4c4c444',
    borderRadius: 8,
    transition: 'all 0.3s',
    ...css.marker('parent', ':hover'),
  },
  child: {
    padding: '8px 16px',
    fontWeight: 'bold',
    color: '#86868b',
    background: '#e8e8ed',
    borderRadius: 6,
    transition: 'all 0.3s',
    [css.extended('grand', ':hover')]: {
      color: '#0066cc',
      background: '#e1f0ff',
    },
    [css.extended('parent', ':hover')]: {
      color: '#ffffff',
      background: '#ff9500',
      scale: 1.2,
      ':hover': {
        background: 'skyblue',
        animationName: animation,
        animationDuration: '1.2s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      },
    },
  },
  discription: {
    fontSize: '14px',
    color: '#86868b',
  },
});

const MarkerExtended = () => {
  return (
    <div styleName={styles.grand}>
      <span styleName={styles.discription}>Grand Container (Hover me)</span>
      <div styleName={styles.parent}>
        <span styleName={styles.discription}>Parent Container (Hover me too)</span>
        <div styleName={styles.child}>Child Element</div>
      </div>
    </div>
  );
};

export default MarkerExtended;
