import * as style from '@plumeria/core';

const styles = style.create({
  table: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 200,
    listStyleType: 'none',
    border: '1px solid #c4c4c466',
    borderRadius: 12,
    ...style.marker('ul', ':hover'),
  },
  list: {
    transition: 'all 0.5s',
    [style.extended('ul', ':hover')]: {
      color: 'orange',
      scale: 1.2,
      ':hover': {
        scale: 1.8,
      },
    },
  },
});
const MarkerExtended = () => {
  return (
    <div>
      <ul className={style.use(styles.table)}>
        <li className={style.use(styles.list)}>Happy new year!</li>
      </ul>
    </div>
  );
};

export default MarkerExtended;
