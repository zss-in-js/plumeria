import { codeToHtml } from 'shiki';
import { css } from '@plumeria/core';

const styles = css.create({
  code_div: {
    position: 'absolute',
    top: 640,
    left: '50%',
    zIndex: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    padding: '18px 40px',
    marginBottom: 200,
    fontSize: 12,
    background: '#F5F5F5',
    borderRadius: '8px',
    transform: 'translate(-50%)',
    [css.media.max('width: 804px')]: {
      position: 'relative',
      top: 20,
      right: 'auto',
      left: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      margin: '40px auto',
      transform: 'translate(0%)',
    },
  },
});

const demoCode = `'use client';

import { css, rx } from '@plumeria/core';
import { TimeCount } from './timeHooks';

const styles = css.create({
  headings: {
    WebkitTextFillColor: 'transparent',
    background: 'var(--bg)',
    WebkitBackgroundClip: 'text',
  },
});

export const Component = () => {
  const time = TimeCount();
  
  const generateGradualHsl = (offset = 0) => {
    const hue = (time + offset) % 360;
    return \`hsl(\${hue.toFixed(2)}deg, 80%, 50%)\`;
  };

  const color1 = generateGradualHsl(0);
  const color2 = generateGradualHsl(50);
  const color3 = generateGradualHsl(100);
  const dynamicStyle = {
    '--bg': \`linear-gradient(45deg,
    \${color1} 0%,
    \${color2} 40%,
    \${color3} 80%)\`,
  };

  return (
    <div {...rx(styles.headings, dynamicStyle)}>
      @plumeria/
    </div>
  );
};
`;

export const CodeBlock = async () => {
  const tsx = await codeToHtml(demoCode, {
    lang: 'javascript',
    themes: {
      light: 'everforest-light',
      dark: 'poimandres',
    },
    defaultColor: false,
  });
  return (
    <figure className={styles.code_div}>
      <pre dangerouslySetInnerHTML={{ __html: tsx }} />
    </figure>
  );
};
