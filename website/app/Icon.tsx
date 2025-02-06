import { css } from '@plumeria/core';

const styles = css.create({
  shadow: {
    position: 'relative',
    bottom: 8,
    left: 0,
    display: 'inline-block',
    filter: 'drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5))',
  },

  plumeria: {
    width: '16.5px',
    height: '16.5px',
    rotate: '-5deg',
  },
  petal: {
    position: 'absolute',
    top: '0.75px',
    left: '4.5px',
    width: '7.5px',
    height: '15px',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    background: 'linear-gradient(to bottom, #fff 50%, #ffeb99 100%)',
    transformOrigin: '50% 100%',
  },
  center: {
    position: 'absolute',
    top: '6.375px',
    left: '6.375px',
    width: '3.75px',
    height: '3.75px',
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
