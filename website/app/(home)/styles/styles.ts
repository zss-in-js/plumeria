import { css } from '@plumeria/core';

export const styles = css.create({
  code_div: {
    position: 'absolute',
    top: 275,
    right: 0,
    left: 100,
    zIndex: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    [css.media.max('width: 804px')]: {
      position: 'static',
      top: 640,
      right: 'auto',
      left: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      margin: '40px auto',
      '& pre': {
        width: 'auto',
        maxWidth: '100%',
        transform: 'none',
      },
    },
    '& pre': {
      zIndex: 2,
      width: '355.33px',
      height: '242px',
      padding: '22px 44px',
      fontSize: '12px',
      borderRadius: '4px',
      transform: 'translateX(200px)',
    },
  },
});
