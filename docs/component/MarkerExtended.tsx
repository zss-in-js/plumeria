import * as css from '@plumeria/core';

const styles = css.create({
  table: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 200,
    listStyleType: 'none',
    border: '1px solid #c4c4c466',
    borderRadius: 12,
    ...css.marker('ul', ':hover'),
  },
  list: {
    transition: 'all 0.5s',
    [css.extended('ul', ':hover')]: {
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
      <ul className={css.props(styles.table)}>
        <li className={css.props(styles.list)}>Happy new year!</li>
      </ul>
    </div>
  );
};

export default MarkerExtended;
