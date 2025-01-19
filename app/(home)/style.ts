import { css } from '@plumeria/core';

css.global({
  '.dark body': {
    background: `   
      linear-gradient(to right, 
        rgba(255, 255, 255, 0.04) 0.5px, 
        transparent 1px
      ),
      linear-gradient(to bottom, 
        rgba(255, 255, 255, 0.04) 0.5px, 
        transparent 1px
      )`,

    backgroundSize: '121px 40px',
  },
  body: {
    background: `
      linear-gradient(to right, 
        rgba(0, 0, 0, 0.05) 0.5px, 
        transparent 1px
      ),
      linear-gradient(to bottom, 
        rgba(0, 0, 0, 0.05) 0.5px, 
        transparent 1px
      )`,

    backgroundSize: '121px 40px',
  },
});
