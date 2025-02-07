import { css } from '@plumeria/core';

const styles = css.create({
  shadow: {
    position: 'relative',
    bottom: 6.4,
    left: 0,
    display: 'inline-block',
    filter: 'drop-shadow(0.8px 0.8px 0.8px rgba(0, 0, 0, 0.5))',
  },

  plumeria: {
    width: '13.2px',
    height: '13.2px',
  },
  petal: {
    position: 'absolute',
    top: '0.6px',
    left: '3.6px',
    width: '6px',
    height: '12px',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    background: 'linear-gradient(to bottom, #fff 50%, #ffeb99 100%)',
    transformOrigin: '50% 100%',
  },
  center: {
    position: 'absolute',
    top: '5.1px',
    left: '5.1px',
    width: '3px',
    height: '3px',
    backgroundColor: '#ffeb99',
    borderRadius: '50%',
  },
});

export const Icon = () => {
  return (
    <div className={styles.shadow}>
      <div className={styles.plumeria}>
        <div className={styles.center} />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={styles.petal}
            style={{
              transform: `rotate(${72 * i}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
