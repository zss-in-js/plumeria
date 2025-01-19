import { css } from '@plumeria/core';

const styles = css.create({
  shadow: {
    filter: 'drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5))',
    position: 'relative',
    display: 'inline-block',
    left: 0,
    bottom: 6,
  },

  plumeria: {
    width: '16.5px',
    height: '16.5px',
    rotate: '-5deg',
  },
  petal: {
    width: '7.5px',
    height: '15px',
    background: 'linear-gradient(to bottom, #fff 50%, #ffeb99 100%)',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    position: 'absolute',
    top: '0.75px',
    left: '4.5px',
    transformOrigin: '50% 100%',
  },
  center: {
    width: '3.75px',
    height: '3.75px',
    backgroundColor: '#ffeb99',
    borderRadius: '50%',
    position: 'absolute',
    top: '6.375px',
    left: '6.375px',
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
