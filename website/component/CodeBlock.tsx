/* eslint-disable no-useless-escape */
import { codeToHtml } from 'shiki';
import { css } from '@plumeria/core';

const styles = css.create({
  code_div: {
    position: 'relative',
    top: 20,
    zIndex: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '500px',
    height: 'fit-content',
    padding: '18px 20px',

    fontSize: 12,
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
      marginLeft: 'auto',
      overflow: 'scroll',
      '& pre': {
        position: 'relative',
        left: 14,
      },
    },
  },
});

const demoCode = `// Plumeria.tsx
import { css, rx } from \'@plumeria/core\';
import { generateGradualHsl } from \'./generateGradualHsl\';

const styles = css.create({
  headings: {
    WebkitTextFillColor: 'transparent',
    background: 'var(--bg)',
    backgroundClip: 'text',
  },
});

export const Component = () => {
  const color1 = generateGradualHsl(0);
  const color2 = generateGradualHsl(50);
  const color3 = generateGradualHsl(100);
  const dynamicStyle = {
    '--bg': \`linear-gradient(45deg,
    \${color1} 0%,
    \${color2} 50%,
    \${color3} 100%)\`,
  };

  return (
    <div {...rx(styles.headings, dynamicStyle)}>
      💐 Plumeria
    </div>
  );
};
`;

export const CodeBlock = async () => {
  const tsx = await codeToHtml(demoCode, {
    lang: 'javascript',
    themes: {
      light: 'snazzy-light',
      dark: 'laserwave',
    },
    defaultColor: false,
  });
  return (
    <figure className={styles.code_div}>
      <pre dangerouslySetInnerHTML={{ __html: tsx }} />
    </figure>
  );
};
